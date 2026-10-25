"""Voice agent feature module."""
import json
import structlog
from typing import List, Dict, Any, Optional
from enum import Enum

from app.config import get_settings
from app.core.model_router import get_router, LLMMessage
from app.schemas import (
    VoiceCommandRequest,
    VoiceCommandResponse,
    VoiceCommandType,
    VoiceProviderConfig,
    VoiceProviderConfigRequest,
    VoiceProviderConfigResponse,
    VoiceProvider,
    DraftResponse,
    FactExtractionResponse,
    RedlineOperation,
    RedlineOperationType,
    FindingSeverity,
)

logger = structlog.get_logger(__name__)


VOICE_COMMAND_PROMPT = """You are a legal document voice assistant. Process natural language voice commands about legal documents.

SUPPORTED COMMANDS:
1. SUMMARIZE - "Summarize the draft", "Give me a summary"
2. EXPLAIN_CLAUSE - "Explain section 3", "What does the indemnification clause mean?"
3. REVISE_PARAGRAPH - "Rewrite paragraph 2 to be more formal", "Change the termination clause"
4. FIND_CONTRADICTIONS - "Find contradictions", "Are there any inconsistencies?"
5. SUGGEST_EDIT - "Add a confidentiality clause", "Suggest improvements"
6. FIND_MISSING_INFO - "What information is missing?", "What placeholders need filling?"

RULES:
1. NEVER make edits directly - always propose edits for user confirmation
2. Require explicit confirmation for DESTRUCTIVE operations (DELETE, REPLACE of large sections)
3. Require confirmation for BULK edits (multiple operations)
3. Validate target text exists before proposing edits
4. Never fabricate legal advice - frame as suggestions
5. Reference specific sections/paragraphs by title or order

OUTPUT FORMAT: Return ONLY valid JSON:
{
  "command_type": "summarize|explain_clause|revise_paragraph|find_contradictions|suggest_edit|find_missing_info",
  "response_text": "Natural language response to user",
  "action_required": false,
  "proposed_changes": [
    {
      "operation_id": "voice_redline_1",
      "operation_type": "replace",
      "target_location": "Section 3, Paragraph 2",
      "original_text": "The party shall...",
      "proposed_text": "The party must...",
      "explanation": "Replace 'shall' with 'must' for clarity per style guide",
      "risk_level": "low",
      "related_finding_ids": [],
      "evidence_ids": [],
      "depends_on": []
    }
  ],
  "target_location": "Section 3",
  "explanation": "Explanation of what was done",
  "requires_confirmation": true
}"""


class VoiceCommandError(Exception):
    """Voice command specific errors."""
    pass


# Global voice provider state
_voice_stt_client = None
_voice_tts_client = None
_voice_config = None


def get_voice_config() -> Dict[str, Any]:
    """Get current voice configuration."""
    settings = get_settings()
    return {
        "stt_provider": settings.voice.stt_provider,
        "stt_model": settings.voice.stt_model,
        "stt_base_url": settings.voice.stt_base_url,
        "tts_provider": settings.voice.tts_provider,
        "tts_model": settings.voice.tts_model,
        "tts_voice": settings.voice.tts_voice,
    }


def is_voice_configured() -> Dict[str, bool]:
    """Check if voice providers are configured."""
    settings = get_settings()
    return {
        "stt_configured": bool(settings.voice.stt_api_key or settings.voice.stt_provider == "local"),
        "tts_configured": bool(settings.voice.tts_api_key or settings.voice.tts_provider == "local"),
    }


async def process_voice_command(request: VoiceCommandRequest) -> VoiceCommandResponse:
    """
    Process a voice command about a legal document.
    
    Args:
        request: VoiceCommandRequest with transcribed command and context
        
    Returns:
        VoiceCommandResponse with response and any proposed changes
    """
    router = get_router()
    adapter = router.primary
    
    if not adapter:
        raise ValueError("No LLM adapter configured. Please set LLM_API_KEY and LLM_MODEL.")
    
    # Check if voice is configured
    voice_status = is_voice_configured()
    if not voice_status["stt_configured"] and not voice_status["tts_configured"]:
        logger.warning("voice_not_configured")
    
    # Build context
    context_parts = ["VOICE COMMAND CONTEXT:\n"]
    
    if request.draft:
        draft = request.draft
        context_parts.append(f"Current Draft: {draft.title} ({draft.document_type.value})")
        context_parts.append(f"Status: {draft.review_status}")
        if draft.placeholders:
            context_parts.append(f"Placeholders: {', '.join(draft.placeholders)}")
        context_parts.append("Sections:")
        for section in draft.sections:
            context_parts.append(f"  - {section.title} (Order: {section.order})")
        context_parts.append("")
    
    if request.facts:
        facts = request.facts
        context_parts.append("Key Facts:")
        for fact in facts.user_provided_facts[:5]:
            context_parts.append(f"  - {fact.fact}")
        if facts.missing_information:
            context_parts.append(f"Missing: {', '.join(facts.missing_information[:3])}")
        context_parts.append("")
    
    if request.document_ids:
        context_parts.append(f"Available Documents: {', '.join(request.document_ids)}")
        context_parts.append("")
    
    context_parts.append(f"USER COMMAND: {request.command_text}\n")
    context_parts.append("\nProcess this voice command and respond with the JSON structure specified.")
    
    system_prompt = VOICE_COMMAND_PROMPT
    user_prompt = "\n".join(context_parts)
    
    messages = [
        LLMMessage(role="system", content=system_prompt),
        LLMMessage(role="user", content=user_prompt),
    ]
    
    try:
        logger.info("voice_command_received", command=request.command_text[:100])
        
        response = await adapter.chat(messages, temperature=0.3, max_tokens=4096)
        parsed = _parse_voice_response(response.content)
        
        # Validate proposed changes if any
        proposed_changes = parsed.get("proposed_changes")
        if proposed_changes:
            validated_changes = _validate_voice_changes(proposed_changes, request.draft)
            parsed["proposed_changes"] = validated_changes
            
            # Check if confirmation required
            requires_confirmation = _check_confirmation_required(validated_changes)
            parsed["requires_confirmation"] = requires_confirmation
            parsed["action_required"] = True
        
        logger.info("voice_command_processed", 
                   command_type=parsed.get("command_type"),
                   has_changes=bool(parsed.get("proposed_changes")))
        
        return VoiceCommandResponse(**parsed)
        
    except json.JSONDecodeError as e:
        logger.error("voice_command_json_error", error=str(e))
        # Return a fallback response
        return VoiceCommandResponse(
            command_type=VoiceCommandType.SUGGEST_EDIT,
            response_text="I had trouble processing that command. Could you please rephrase it?",
            action_required=False,
            explanation="JSON parsing error in voice command processing",
        )
    except Exception as e:
        logger.error("voice_command_error", error_type=type(e).__name__, error=str(e))
        raise ValueError(f"Voice command processing failed: {str(e)}")


def _parse_voice_response(content: str) -> dict:
    """Parse and clean LLM response for voice command."""
    content = content.strip()
    start = content.find("{")
    end = content.rfind("}") + 1
    
    if start == -1 or end == 0:
        raise json.JSONDecodeError("No JSON object found in response", content, 0)
    
    json_str = content[start:end]
    return json.loads(json_str)


def _validate_voice_changes(changes: List[dict], draft: Optional[DraftResponse]) -> List[RedlineOperation]:
    """Validate voice-proposed changes against the draft."""
    validated = []
    draft_text = ""
    if draft:
        draft_text = "\n\n".join(f"{s.title}\n{s.content}" for s in draft.sections)
    
    for change in changes:
        try:
            op = RedlineOperation.model_validate(change)
            
            # Validate original text exists in draft (for REPLACE/DELETE)
            if op.operation_type in (RedlineOperationType.REPLACE, RedlineOperationType.DELETE):
                if op.original_text and op.original_text not in draft_text:
                    logger.warning("voice_change_validation_failed", 
                                 operation_id=op.operation_id,
                                 reason="original_text not found in draft")
                    continue  # Skip invalid changes
            
            validated.append(op)
        except Exception as e:
            logger.warning("voice_change_validation_error", error=str(e))
            continue
    
    return validated


def _check_confirmation_required(changes: List[RedlineOperation]) -> bool:
    """Check if changes require explicit user confirmation."""
    # Require confirmation for:
    # - Any DELETE operation
    # - REPLACE operations on large text (>500 chars)
    # - Multiple operations (bulk edits)
    # - HIGH or CRITICAL risk level
    
    if len(changes) > 1:
        return True
    
    for change in changes:
        if change.operation_type == RedlineOperationType.DELETE:
            return True
        if change.operation_type == RedlineOperationType.REPLACE and len(change.original_text) > 500:
            return True
        if change.risk_level in (FindingSeverity.HIGH, FindingSeverity.CRITICAL):
            return True
    
    return False


async def configure_voice_providers(request: VoiceProviderConfigRequest) -> VoiceProviderConfigResponse:
    """
    Configure voice provider settings.
    
    Args:
        request: VoiceProviderConfigRequest with provider configuration
        
    Returns:
        VoiceProviderConfigResponse with configuration status
    """
    global _voice_config, _voice_stt_client, _voice_tts_client
    
    config = request.config
    _voice_config = config
    
    # Reset clients to force reinitialization with new config
    _voice_stt_client = None
    _voice_tts_client = None
    
    # Check what's configured
    stt_configured = bool(config.stt_api_key or config.stt_provider == "local")
    tts_configured = bool(config.tts_api_key or config.tts_provider == "local")
    
    # Try to initialize clients if keys provided
    if config.stt_provider == "openai" and config.stt_api_key:
        try:
            from openai import AsyncOpenAI
            _voice_stt_client = AsyncOpenAI(
                api_key=config.stt_api_key,
                base_url=config.stt_base_url,
            )
        except ImportError:
            logger.warning("openai_not_installed_for_stt")
    
    if config.tts_provider == "openai" and config.tts_api_key:
        try:
            from openai import AsyncOpenAI
            _voice_tts_client = AsyncOpenAI(
                api_key=config.tts_api_key,
                base_url=config.tts_base_url,
            )
        except ImportError:
            logger.warning("openai_not_installed_for_tts")
    
    # Build response message
    parts = []
    if stt_configured:
        parts.append(f"STT: {config.stt_provider.value} ({config.stt_model})")
    else:
        parts.append("STT: not configured")
    
    if tts_configured:
        parts.append(f"TTS: {config.tts_provider.value} ({config.tts_model}, voice: {config.tts_voice})")
    else:
        parts.append("TTS: not configured")
    
    message = "Voice providers configured: " + "; ".join(parts)
    
    if not stt_configured and not tts_configured:
        message += ". No voice providers fully configured. Set API keys for remote providers or use local providers."
    
    return VoiceProviderConfigResponse(
        stt_configured=stt_configured,
        tts_configured=tts_configured,
        stt_provider=config.stt_provider if stt_configured else None,
        tts_provider=config.tts_provider if tts_configured else None,
        message=message,
    )


async def transcribe_audio(audio_data: bytes, content_type: str = "audio/wav") -> str:
    """
    Transcribe audio to text using configured STT provider.
    
    Args:
        audio_data: Raw audio bytes
        content_type: MIME type of audio
        
    Returns:
        Transcribed text
    """
    global _voice_stt_client, _voice_config
    
    if _voice_config is None:
        raise VoiceCommandError("Voice not configured. Call configure_voice_providers first.")
    
    if _voice_config.stt_provider == "local":
        # Local Whisper (requires whisper package)
        try:
            import whisper
            import tempfile
            
            # Load model (cache it)
            if not hasattr(transcribe_audio, '_whisper_model'):
                transcribe_audio._whisper_model = whisper.load_model("base")
            
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp.write(audio_data)
                tmp_path = tmp.name
            
            try:
                result = transcribe_audio._whisper_model.transcribe(tmp_path)
                return result["text"].strip()
            finally:
                import os
                os.unlink(tmp_path)
                
        except ImportError:
            raise VoiceCommandError("Local STT requires 'openai-whisper' package. Install with: pip install openai-whisper")
    
    elif _voice_config.stt_provider == "openai":
        if _voice_stt_client is None:
            from openai import AsyncOpenAI
            _voice_stt_client = AsyncOpenAI(
                api_key=_voice_config.stt_api_key,
                base_url=_voice_config.stt_base_url,
            )
        
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(audio_data)
            tmp_path = tmp.name
        
        try:
            with open(tmp_path, "rb") as audio_file:
                transcript = await _voice_stt_client.audio.transcriptions.create(
                    model=_voice_config.stt_model,
                    file=audio_file,
                )
            return transcript.text.strip()
        finally:
            import os
            os.unlink(tmp_path)
    
    else:
        raise VoiceCommandError(f"Unsupported STT provider: {_voice_config.stt_provider}")


async def synthesize_speech(text: str) -> bytes:
    """
    Synthesize speech from text using configured TTS provider.
    
    Args:
        text: Text to synthesize
        
    Returns:
        Audio bytes (WAV format)
    """
    global _voice_tts_client, _voice_config
    
    if _voice_config is None:
        raise VoiceCommandError("Voice not configured. Call configure_voice_providers first.")
    
    if _voice_config.tts_provider == "openai":
        if _voice_tts_client is None:
            from openai import AsyncOpenAI
            _voice_tts_client = AsyncOpenAI(
                api_key=_voice_config.tts_api_key,
                base_url=_voice_config.tts_base_url,
            )
        
        response = await _voice_tts_client.audio.speech.create(
            model=_voice_config.tts_model,
            voice=_voice_config.tts_voice,
            input=text,
            response_format="wav",
        )
        return response.content
    
    elif _voice_config.tts_provider == "local":
        # Local TTS not implemented - would require pyttsx3 or similar
        raise VoiceCommandError("Local TTS not yet implemented. Use OpenAI TTS or implement local provider.")
    
    else:
        raise VoiceCommandError(f"Unsupported TTS provider: {_voice_config.tts_provider}")