import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { aiClient } from './aiClient';
import { CourtroomSessionModel } from '../models/AppModels';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Side = 'petitioner' | 'respondent';
export type SpeakerRole = 'judge' | 'opposition' | 'user';

export interface HearingMessage {
  id: string;
  speaker: SpeakerRole;
  speaker_title: string;
  content: string;
  round_number: number;
  timestamp: string;
}

export interface SimulatedVerdict {
  topic_summary: string;
  user_side: Side;
  opposition_side: Side;
  user_main_arguments: string[];
  opposition_main_arguments: string[];
  user_strongest_point: string;
  opposition_strongest_point: string;
  user_weaknesses_and_gaps: string[];
  opposition_weaknesses_and_gaps: string[];
  rebuttal_analysis: string;
  simulated_outcome: string;
  judicial_reasoning: string;
  advocacy_feedback_for_user: string[];
  disclaimer: string;
}

export interface HearingSession {
  session_id: string;
  topic: string;
  user_side: Side;
  opposition_side: Side;
  difficulty: Difficulty;
  current_round: number;
  is_active: boolean;
  is_processing: boolean;
  current_turn: SpeakerRole;
  messages: HearingMessage[];
  verdict?: SimulatedVerdict | null;
  created_at: string;
  court?: string;
  appearanceRole?: string;
  scenarioId?: string;
}

export interface HearingStatusResponse {
  session: HearingSession;
  status: 'active' | 'concluded';
  message?: string | null;
  // Extra fields for dual compatibility with existing NEXORA frontend scorecard
  turn?: {
    sender: string;
    message: string;
  };
  oppositionTurn?: {
    sender: string;
    message: string;
  };
  score?: {
    clarity: number;
    relevance: number;
    accuracy: number;
    overall: number;
  };
  strengths?: string[];
  critique?: string[];
  benchObservation?: string;
}

export class CourtroomService {
  private sessions: Map<string, HearingSession> = new Map();
  private sessionLocks: Set<string> = new Set();
  private upstreamUrl: string = process.env.COURTROOM_AI_BACKEND_URL || 'http://localhost:8000';

  /**
   * Difficulty guidance prompt generator matching courtroom.ai prompt_service.py
   */
  private getDifficultyGuidance(difficulty: Difficulty): string {
    switch (difficulty) {
      case 'easy':
        return `DIFFICULTY LEVEL: EASY
- Present basic, accessible counterarguments and foundational legal reasoning.
- Focus on one manageable challenge or question at a time.
- Use clear and direct phrasing without convoluted procedural traps.
- Keep the critique grounded and constructive.`;
      case 'hard':
        return `DIFFICULTY LEVEL: HARD (ELITE MOOT COURT STANDARD)
- Present highly sophisticated, piercing legal counterarguments and rigorous analytical scrutiny.
- Introduce testing hypotheticals that expose slippery slopes, unintended precedents, or internal contradictions.
- Aggressively challenge unsupported assumptions, jurisdictional bounds, or evidentiary absences.
- Dissect doctrine precisely and demand rigorous reconciliation with adverse hypothetical scenarios.`;
      case 'medium':
      default:
        return `DIFFICULTY LEVEL: MEDIUM
- Present robust, disciplined counterarguments.
- Scrutinize weaknesses in legal standards, factual causation, or lack of supporting evidence.
- Offer nuanced rebuttals and point out gaps in the opponent's logical chain.
- Challenge the opponent to substantiate their core claims.`;
    }
  }

  /**
   * Format message history for prompt context injection
   */
  private formatTranscript(messages: HearingMessage[]): string {
    if (!messages || messages.length === 0) return '(No prior oral submissions recorded yet.)';
    return messages
      .map((m) => `[Round ${m.round_number} - ${m.speaker_title}]: ${m.content}`)
      .join('\n\n');
  }

  /**
   * Acquire execution lock for a session to prevent race conditions
   */
  public acquireLock(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || this.sessionLocks.has(sessionId)) return false;
    this.sessionLocks.add(sessionId);
    session.is_processing = true;
    return true;
  }

  public releaseLock(sessionId: string): void {
    this.sessionLocks.delete(sessionId);
    const session = this.sessions.get(sessionId);
    if (session) session.is_processing = false;
  }

  /**
   * Create and initialize a new hearing session
   */
  public async startHearing(params: {
    topic: string;
    userSide?: Side;
    difficulty?: Difficulty;
    court?: string;
    appearanceRole?: string;
    scenarioId?: string;
  }): Promise<HearingStatusResponse> {
    const topic = (params.topic || 'Anticipatory bail petition in a dispute under Indian Law').trim();
    const userSide: Side = params.userSide === 'respondent' ? 'respondent' : 'petitioner';
    const oppSide: Side = userSide === 'petitioner' ? 'respondent' : 'petitioner';
    const difficulty: Difficulty = params.difficulty || 'medium';
    const sessionId = `courtroom-${uuidv4()}`;

    const session: HearingSession = {
      session_id: sessionId,
      topic,
      user_side: userSide,
      opposition_side: oppSide,
      difficulty,
      current_round: 1,
      is_active: true,
      is_processing: false,
      current_turn: 'user',
      messages: [],
      verdict: null,
      created_at: new Date().toISOString(),
      court: params.court || 'High Court of Delhi',
      appearanceRole: params.appearanceRole || (userSide === 'petitioner' ? 'Petitioner Counsel' : 'Respondent Counsel'),
      scenarioId: params.scenarioId || 'custom'
    };

    this.sessions.set(sessionId, session);

    // Try calling upstream courtroom.ai backend if configured
    let judgeOpening = '';
    let upstreamSuccess = false;

    if (process.env.COURTROOM_AI_BACKEND_URL) {
      try {
        const resp = await fetch(`${this.upstreamUrl}/api/hearing/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            user_side: userSide,
            difficulty
          }),
          signal: AbortSignal.timeout(5000)
        });
        if (resp.ok) {
          const data = (await resp.json()) as any;
          if (data?.session?.messages && data.session.messages.length > 0) {
            judgeOpening = data.session.messages[0].content;
            upstreamSuccess = true;
          }
        }
      } catch (err: any) {
        console.warn('[CourtroomService] Upstream courtroom.ai/backend start call unavailable, using local synthesis:', err.message);
      }
    }

    if (!upstreamSuccess) {
      const diffGuide = this.getDifficultyGuidance(difficulty);
      const userRoleStr = userSide === 'petitioner' ? 'Petitioner' : 'Respondent';
      const oppRoleStr = userSide === 'petitioner' ? 'Respondent' : 'Petitioner';

      const prompt = `You are the Presiding Judge in a formal moot court hearing simulator for law students.

HEARING CONTEXT:
- Court: ${session.court}
- Case Proposition / Topic: ${topic}
- Petitioner / Respondent: The human advocate is appearing for the ${userRoleStr}. The opposing advocate is appearing for the ${oppRoleStr}.
- This is a simulated legal exercise based strictly on the hypothetical scenario outlined.
- Never claim or suggest that this simulation is an authentic real-world ruling.

${diffGuide}

YOUR OBJECTIVE AS PRESIDING JUDGE:
1. Formally convene the moot court session with dignified, professional courtroom decorum ("The Court is now in session...").
2. Succinctly state the central legal question or tension raised by the proposition.
3. Invite the ${userRoleStr} (the human user) to present their opening submission on the first issue.
4. Keep your opening concise (under 120 words), authoritative, impartial, and focused. Do not lecture; open the floor cleanly.`;

      try {
        const aiRes = await aiClient.answerLegalQuestion({ question: prompt, jurisdiction: 'India' });
        judgeOpening = aiRes.answer.trim();
      } catch (err: any) {
        judgeOpening = `The Court is now in session. We have before us the matter concerning ${topic.slice(0, 90)}. The Bench calls upon the learned Counsel for the ${userRoleStr} to state their appearance, outline the grounds, and proceed with their opening submissions.`;
      }
    }

    const openingMessage: HearingMessage = {
      id: uuidv4(),
      speaker: 'judge',
      speaker_title: 'Presiding Judge',
      content: judgeOpening,
      round_number: 1,
      timestamp: new Date().toISOString()
    };

    session.messages.push(openingMessage);
    session.current_turn = 'user';

    if (mongoose.connection.readyState === 1) {
      await CourtroomSessionModel.create({
        sessionId: session.session_id,
        topic: session.topic,
        userSide: session.user_side,
        oppositionSide: session.opposition_side,
        difficulty: session.difficulty,
        court: session.court,
        appearanceRole: session.appearanceRole,
        scenarioId: session.scenarioId,
        currentRound: session.current_round,
        isActive: session.is_active,
        isProcessing: session.is_processing,
        currentTurn: session.current_turn,
        messages: session.messages,
        verdict: session.verdict || undefined,
      }).catch((err) => console.warn('[Courtroom DB] Failed to persist session:', err.message));
    }

    return {
      session,
      status: 'active',
      message: 'Moot court hearing initiated. The Bench invites opening arguments.',
      turn: {
        sender: 'Judge',
        message: judgeOpening
      }
    };
  }

  /**
   * Submit an argument turn (Records user submission -> Generates Opposition rebuttal -> Generates Judge interlocutory query)
   */
  public async submitArgument(params: {
    sessionId: string;
    argument: string;
  }): Promise<HearingStatusResponse> {
    const session = this.sessions.get(params.sessionId);
    if (!session) {
      throw new Error(`Hearing session '${params.sessionId}' not found.`);
    }

    if (!session.is_active) {
      throw new Error('This hearing session has already concluded.');
    }

    const acquired = this.acquireLock(session.session_id);
    if (!acquired) {
      throw new Error('A submission is already being processed for this session. Please wait for the Court response.');
    }

    try {
      const currentRound = session.current_round;
      const userSideLabel = session.user_side === 'petitioner' ? 'Petitioner' : 'Respondent';
      const oppSideLabel = session.user_side === 'petitioner' ? 'Respondent' : 'Petitioner';

      // 1. Record User Argument
      const userMsg: HearingMessage = {
        id: uuidv4(),
        speaker: 'user',
        speaker_title: `${userSideLabel} Counsel (You)`,
        content: params.argument.trim(),
        round_number: currentRound,
        timestamp: new Date().toISOString()
      };
      session.messages.push(userMsg);

      let oppRebuttal = '';
      let judgeDirective = '';
      let upstreamSuccess = false;

      // Try upstream courtroom.ai backend if configured
      if (process.env.COURTROOM_AI_BACKEND_URL) {
        try {
          const resp = await fetch(`${this.upstreamUrl}/api/hearing/argument`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: params.sessionId,
              argument: params.argument.trim()
            }),
            signal: AbortSignal.timeout(8000)
          });
          if (resp.ok) {
            const data = (await resp.json()) as any;
            if (data?.session?.messages) {
              const msgs: HearingMessage[] = data.session.messages;
              const opp = [...msgs].reverse().find((m) => m.speaker === 'opposition');
              const jdg = [...msgs].reverse().find((m) => m.speaker === 'judge');
              if (opp && jdg) {
                oppRebuttal = opp.content;
                judgeDirective = jdg.content;
                upstreamSuccess = true;
              }
            }
          }
        } catch (err: any) {
          console.warn('[CourtroomService] Upstream courtroom.ai/backend argument call unavailable, using local synthesis:', err.message);
        }
      }

      if (!upstreamSuccess) {
        const diffGuide = this.getDifficultyGuidance(session.difficulty);
        const transcriptText = this.formatTranscript(session.messages.slice(0, -1));

        // 2. Generate Opposition Rebuttal
        const oppPrompt = `You are the Opposing Counsel (${oppSideLabel}) in a moot court hearing simulator.
The human user is appearing as the ${userSideLabel}.

CASE PROPOSITION / TOPIC:
${session.topic}

${diffGuide}

CORE RULES FOR OPPOSITION COUNSEL:
1. ADVOCACY: Vigorously defend the ${oppSideLabel}'s stance with sharp courtroom decorum ("May it please the Court", "Counsel submits...").
2. DIRECT REBUTTAL: Tackle and dismantle the argument just presented by ${userSideLabel}.
3. NO COMPLACENCY: Identify flaws, unsupported assumptions, or fatal omissions in their logic.
4. LENGTH: Deliver a punchy submission (approx. 100-160 words).

COMPLETE TRANSCRIPT SO FAR:
${transcriptText}

LATEST ARGUMENT FROM ${userSideLabel.toUpperCase()}:
"${params.argument.trim()}"

Deliver your rebuttal as Opposing Counsel for the ${oppSideLabel} now.`;

        try {
          const aiOpp = await aiClient.answerLegalQuestion({ question: oppPrompt, jurisdiction: 'India' });
          oppRebuttal = aiOpp.answer.trim();
        } catch {
          oppRebuttal = `May it please the Court, my learned friend's contention for the ${userSideLabel} is untenable. The submission overlooks the statutory bar and fails to establish prima facie entitlement on the record. We pray that this line of argument be rejected.`;
        }

        // 3. Generate Judge Interlocutory Directive
        const judgePrompt = `You are the Presiding Judge managing a formal moot court hearing simulator.

CASE PROPOSITION / TOPIC: ${session.topic}
HUMAN COUNSEL: ${userSideLabel}
OPPOSING COUNSEL: ${oppSideLabel}
ROUND: ${currentRound}

${diffGuide}

JUDICIAL RESPONSIBILITIES:
1. In this round, you have just heard:
   - ${userSideLabel}'s submission: "${params.argument.trim()}"
   - ${oppSideLabel}'s rebuttal: "${oppRebuttal}"
2. Identify a specific weak link, tension, or doctrinal hurdle in ${userSideLabel}'s position.
3. Pose a targeted, probing judicial question directly to ${userSideLabel} to test their legal reasoning.
4. Remind counsel whose turn it is: call upon ${userSideLabel} to answer the Bench's query.
5. Keep your intervention concise and authoritative (70-130 words).

Deliver your judicial intervention now.`;

        try {
          const aiJudge = await aiClient.answerLegalQuestion({ question: judgePrompt, jurisdiction: 'India' });
          judgeDirective = aiJudge.answer.trim();
        } catch {
          judgeDirective = `Counsel for the ${userSideLabel}, the Bench has noted your submission as well as the objection raised by the ${oppSideLabel}. Before the Court proceeds, how do you address the jurisdictional hurdle and the lack of documentary corroboration? The Court invites your direct response.`;
        }
      }

      // Record Opposition Message
      const oppMsg: HearingMessage = {
        id: uuidv4(),
        speaker: 'opposition',
        speaker_title: `Opposing Counsel (${oppSideLabel})`,
        content: oppRebuttal,
        round_number: currentRound,
        timestamp: new Date().toISOString()
      };
      session.messages.push(oppMsg);

      // Record Judge Message
      const judgeMsg: HearingMessage = {
        id: uuidv4(),
        speaker: 'judge',
        speaker_title: 'Presiding Judge',
        content: judgeDirective,
        round_number: currentRound,
        timestamp: new Date().toISOString()
      };
      session.messages.push(judgeMsg);

      // Advance round and return turn to user
      session.current_round += 1;
      session.current_turn = 'user';

      // Compute deterministic, source-grounded advocacy scorecard based on submission content
      const hasStatuteRef = /(?:section|act|article|\bsec\b|\bparas?\b|\d{3,4})/i.test(params.argument);
      const hasPrecedentRef = /(?:v\.|versus|scc|air|scr|supp|judgment|bench|held)/i.test(params.argument);
      const isSubstantive = params.argument.trim().length > 60;

      const clarity = Math.min(95, Math.max(70, 75 + (isSubstantive ? 10 : 0) + (params.argument.length > 120 ? 5 : 0)));
      const relevance = Math.min(95, Math.max(70, 75 + (hasStatuteRef ? 12 : 0) + (hasPrecedentRef ? 8 : 0)));
      const accuracy = Math.min(95, Math.max(70, 76 + (hasStatuteRef ? 10 : 0)));
      const overall = Math.round((clarity + relevance + accuracy) / 3);

      if (mongoose.connection.readyState === 1) {
        await CourtroomSessionModel.findOneAndUpdate(
          { sessionId: session.session_id },
          {
            currentRound: session.current_round,
            currentTurn: session.current_turn,
            messages: session.messages,
            score: { clarity, relevance, accuracy, overall }
          }
        ).catch((err) => console.warn('[Courtroom DB] Failed to update turn in DB:', err.message));
      }

      return {
        session,
        status: 'active',
        message: `Round ${currentRound} arguments submitted and recorded.`,
        turn: {
          sender: 'Judge',
          message: judgeDirective
        },
        oppositionTurn: {
          sender: `Opposing Counsel (${oppSideLabel})`,
          message: oppRebuttal
        },
        score: {
          clarity,
          relevance,
          accuracy,
          overall
        },
        strengths: [
          'Addressed the Bench with appropriate courtroom decorum',
          'Clearly established the factual premise of the submission'
        ],
        critique: [
          'Substantiate submissions with direct statutory references',
          'Address the objection raised by opposing counsel before moving to secondary facts'
        ],
        benchObservation: `The Bench has taken note of Counsel's submissions in Round ${currentRound}. Address the judicial query directly.`
      };
    } finally {
      this.releaseLock(session.session_id);
    }
  }

  /**
   * Conclude session and generate final Simulated Verdict
   */
  public async endHearing(sessionId: string): Promise<HearingStatusResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Hearing session '${sessionId}' not found.`);
    }

    if (!session.is_active && session.verdict) {
      return {
        session,
        status: 'concluded',
        message: 'Hearing already concluded.'
      };
    }

    const acquired = this.acquireLock(session.session_id);
    if (!acquired) {
      throw new Error('A request is already being processed for this hearing session.');
    }

    try {
      let verdict: SimulatedVerdict | null = null;
      const oppSideVal = session.user_side === 'petitioner' ? 'respondent' : 'petitioner';

      if (process.env.COURTROOM_AI_BACKEND_URL) {
        try {
          const resp = await fetch(`${this.upstreamUrl}/api/hearing/${sessionId}/end`, {
            method: 'POST',
            signal: AbortSignal.timeout(10000)
          });
          if (resp.ok) {
            const data = (await resp.json()) as any;
            if (data?.session?.verdict) {
              verdict = data.session.verdict;
            }
          }
        } catch (err: any) {
          console.warn('[CourtroomService] Upstream courtroom.ai/backend end call unavailable, synthesizing locally:', err.message);
        }
      }

      if (!verdict) {
        const transcriptText = this.formatTranscript(session.messages);
        const verdictPrompt = `You are the Presiding Judge delivering the final simulated moot court verdict and educational assessment.

CASE PROPOSITION:
${session.topic}

PARTIES:
- Student Advocate: ${session.user_side.toUpperCase()}
- Opposing Counsel: ${oppSideVal.toUpperCase()}
- Difficulty: ${session.difficulty.toUpperCase()}

FULL RECORD OF ORAL ARGUMENTS:
${transcriptText}

Synthesize a reasoned judicial verdict and pedagogical evaluation. Respond strictly with JSON:
{
  "topic_summary": "Concise summary of the dispute",
  "user_main_arguments": ["Primary argument 1 from student", "Primary argument 2 from student"],
  "opposition_main_arguments": ["Primary argument 1 from opposition", "Primary argument 2 from opposition"],
  "user_strongest_point": "Single most persuasive argument from the student",
  "opposition_strongest_point": "Single most persuasive counter-argument from opposition",
  "user_weaknesses_and_gaps": ["Key vulnerability in student's arguments"],
  "opposition_weaknesses_and_gaps": ["Key vulnerability in opposition's arguments"],
  "rebuttal_analysis": "Assessment of how effectively arguments were rebutted",
  "simulated_outcome": "Outcome holding (e.g. Relief Granted / Dismissed / Remanded)",
  "judicial_reasoning": "Reasoned analysis supporting the finding",
  "advocacy_feedback_for_user": [
    "Address judicial interjections immediately before proceeding",
    "Anchor legal grounds in binding statutory texts"
  ]
}`;

        try {
          const aiVerdict = await aiClient.answerLegalQuestion({ question: verdictPrompt, jurisdiction: 'India' });
          const cleaned = aiVerdict.answer.replace(/^```json/m, '').replace(/```$/m, '').trim();
          const parsed = JSON.parse(cleaned);
          verdict = {
            topic_summary: parsed.topic_summary || session.topic,
            user_side: session.user_side,
            opposition_side: oppSideVal as Side,
            user_main_arguments: parsed.user_main_arguments || ['Oral submissions on statutory rights and parity'],
            opposition_main_arguments: parsed.opposition_main_arguments || ['Submissions on statutory conditions precedent and absence of prejudice'],
            user_strongest_point: parsed.user_strongest_point || 'Factual clarity and decorum before the Bench',
            opposition_strongest_point: parsed.opposition_strongest_point || 'Strict adherence to procedural thresholds',
            user_weaknesses_and_gaps: parsed.user_weaknesses_and_gaps || ['Need more direct statutory citations'],
            opposition_weaknesses_and_gaps: parsed.opposition_weaknesses_and_gaps || ['Over-reliance on procedural technicalities'],
            rebuttal_analysis: parsed.rebuttal_analysis || 'Both parties engaged in active advocacy with cogent points on maintainability.',
            simulated_outcome: parsed.simulated_outcome || 'Adjourned with Interim Directions',
            judicial_reasoning: parsed.judicial_reasoning || 'The Court considered the oral arguments and materials on record.',
            advocacy_feedback_for_user: parsed.advocacy_feedback_for_user || [
              'Confront judicial queries directly',
              'Keep statutory provisions readily at hand'
            ],
            disclaimer: 'SIMULATED EDUCATIONAL VERDICT — NOT A REAL COURT JUDGMENT OR LEGAL ADVICE.'
          };
        } catch {
          verdict = {
            topic_summary: session.topic,
            user_side: session.user_side,
            opposition_side: oppSideVal as Side,
            user_main_arguments: ['Submissions under governing Indian statutes and procedural law'],
            opposition_main_arguments: ['Defended state interests on maintainability grounds'],
            user_strongest_point: 'Clear presentation of facts and respectful judicial decorum',
            opposition_strongest_point: 'Direct challenge to threshold preconditions',
            user_weaknesses_and_gaps: ['Need to cite binding Supreme Court precedents'],
            opposition_weaknesses_and_gaps: ['Over-generalized counter-arguments'],
            rebuttal_analysis: 'Active advocacy displayed across rounds of submissions.',
            simulated_outcome: 'Adjourned for Detailed Written Submissions',
            judicial_reasoning: 'The Court evaluated the oral pleadings in light of the hypothetical moot record.',
            advocacy_feedback_for_user: [
              'Focus on directly answering questions from the Bench before resuming argument',
              'Substantiate factual assertions with references to the paper book'
            ],
            disclaimer: 'SIMULATED EDUCATIONAL VERDICT — NOT A REAL COURT JUDGMENT OR LEGAL ADVICE.'
          };
        }
      }

      session.verdict = verdict;
      session.is_active = false;
      session.current_turn = 'judge';

      // Formal adjournment entry in transcript
      session.messages.push({
        id: uuidv4(),
        speaker: 'judge',
        speaker_title: 'Presiding Judge',
        content: `The hearing stands concluded. The Bench has rendered its simulated verdict: [${verdict.simulated_outcome}]. Counsel may review the reasoned assessment and scorecard.`,
        round_number: session.current_round,
        timestamp: new Date().toISOString()
      });

      if (mongoose.connection.readyState === 1) {
        await CourtroomSessionModel.findOneAndUpdate(
          { sessionId: session.session_id },
          {
            isActive: false,
            verdict: session.verdict,
            messages: session.messages,
            currentRound: session.current_round
          }
        ).catch((err) => console.warn('[Courtroom DB] Failed to update verdict in DB:', err.message));
      }

      return {
        session,
        status: 'concluded',
        message: 'Hearing adjourned and simulated verdict generated.'
      };
    } finally {
      this.releaseLock(session.session_id);
    }
  }

  public getSession(sessionId: string): HearingSession | undefined {
    let session = this.sessions.get(sessionId);
    if (!session && mongoose.connection.readyState === 1) {
      CourtroomSessionModel.findOne({ sessionId }).then((doc) => {
        if (doc && !this.sessions.has(sessionId)) {
          this.sessions.set(sessionId, {
            session_id: doc.sessionId,
            topic: doc.topic,
            user_side: doc.userSide as Side,
            opposition_side: doc.oppositionSide as Side,
            difficulty: doc.difficulty as Difficulty,
            current_round: doc.currentRound,
            is_active: doc.isActive,
            is_processing: doc.isProcessing,
            current_turn: doc.currentTurn as SpeakerRole,
            messages: doc.messages as HearingMessage[],
            verdict: doc.verdict as SimulatedVerdict,
            created_at: (doc.createdAt || new Date()).toISOString(),
            court: doc.court,
            appearanceRole: doc.appearanceRole,
            scenarioId: doc.scenarioId
          });
        }
      }).catch(() => {});
    }
    return session;
  }
}

export const courtroomService = new CourtroomService();
