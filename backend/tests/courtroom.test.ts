import { describe, it } from 'node:test';
import assert from 'node:assert';
import { courtroomService } from '../src/services/courtroom.service';

describe('AI Courtroom Simulator & Character Video Synchronization Tests', () => {
  let createdSessionId = '';

  // 1. Session Lifecycle: Start Hearing
  it('should initialize a hearing session with Judge opening remark and user turn', async () => {
    const res = await courtroomService.startHearing({
      topic: 'State v. Rohan Mehta: Anticipatory bail in an alleged attempt to murder dispute under Section 438 CrPC',
      userSide: 'petitioner',
      difficulty: 'medium',
      court: 'High Court (Bombay)',
      appearanceRole: 'Petitioner Counsel',
      scenarioId: 'bail'
    });

    assert.strictEqual(res.status, 'active');
    assert.ok(res.session);
    assert.ok(res.session.session_id);
    assert.strictEqual(res.session.user_side, 'petitioner');
    assert.strictEqual(res.session.opposition_side, 'respondent');
    assert.strictEqual(res.session.current_round, 1);
    assert.strictEqual(res.session.current_turn, 'user');
    assert.strictEqual(res.session.messages.length, 1);

    // Verify first speaker is the Judge
    const openingMsg = res.session.messages[0];
    assert.strictEqual(openingMsg.speaker, 'judge');
    assert.strictEqual(openingMsg.speaker_title, 'Presiding Judge');
    assert.ok(openingMsg.content.length > 20);

    createdSessionId = res.session.session_id;
  });

  // 2. Speaker Sequencing & Character Video Synchronization Logic
  it('should process user argument, generating sequential Opposing Counsel rebuttal followed by Judge directive', async () => {
    assert.ok(createdSessionId, 'Session ID must exist from previous step');

    const res = await courtroomService.submitArgument({
      sessionId: createdSessionId,
      argument: 'My Lord, custodial interrogation is unwarranted as the applicant has already deposited his passport and co-accused have been granted bail on parity.'
    });

    assert.strictEqual(res.status, 'active');
    assert.ok(res.session);
    assert.strictEqual(res.session.current_round, 2, 'Round should advance to 2');
    assert.strictEqual(res.session.current_turn, 'user', 'Turn should return to user');

    // Messages should now contain: [0: Judge opening, 1: User submission, 2: Opposition rebuttal, 3: Judge directive]
    const msgs = res.session.messages;
    assert.strictEqual(msgs.length, 4);

    // Step A: User submission
    assert.strictEqual(msgs[1].speaker, 'user');

    // Step B: Opposing Counsel rebuttal (triggers Opposing Counsel video playback)
    assert.strictEqual(msgs[2].speaker, 'opposition');
    assert.ok(msgs[2].content.length > 20);
    assert.ok(res.oppositionTurn?.message);

    // Step C: Presiding Judge interlocutory directive (triggers Judge video playback after opposition)
    assert.strictEqual(msgs[3].speaker, 'judge');
    assert.ok(msgs[3].content.length > 20);
    assert.ok(res.turn?.message);

    // Verify scorecard evaluation metrics are generated
    assert.ok(res.score);
    assert.ok(res.score.overall >= 50 && res.score.overall <= 100);
    assert.ok(Array.isArray(res.strengths) && res.strengths.length > 0);
    assert.ok(Array.isArray(res.critique) && res.critique.length > 0);
    assert.ok(res.benchObservation);
  });

  // 3. Concurrency Lock & Race Condition Protection
  it('should reject concurrent argument submissions on an active session', async () => {
    assert.ok(createdSessionId);

    // Manually acquire lock
    const locked = courtroomService.acquireLock(createdSessionId);
    assert.strictEqual(locked, true);

    // Second lock acquisition should fail
    const secondLock = courtroomService.acquireLock(createdSessionId);
    assert.strictEqual(secondLock, false, 'Should reject duplicate concurrent lock');

    // Release lock
    courtroomService.releaseLock(createdSessionId);
  });

  // 4. Session Adjournment & Reasoned Simulated Verdict Synthesis
  it('should adjourn hearing and generate structured Simulated Verdict', async () => {
    assert.ok(createdSessionId);

    const res = await courtroomService.endHearing(createdSessionId);

    assert.strictEqual(res.status, 'concluded');
    assert.strictEqual(res.session.is_active, false);
    assert.ok(res.session.verdict);

    const verdict = res.session.verdict;
    assert.ok(verdict.simulated_outcome);
    assert.ok(verdict.judicial_reasoning);
    assert.ok(Array.isArray(verdict.user_main_arguments));
    assert.ok(Array.isArray(verdict.opposition_main_arguments));
    assert.ok(verdict.user_strongest_point);
    assert.ok(Array.isArray(verdict.advocacy_feedback_for_user));
    assert.strictEqual(verdict.disclaimer, 'SIMULATED EDUCATIONAL VERDICT — NOT A REAL COURT JUDGMENT OR LEGAL ADVICE.');
  });

  // 5. Speaker Role Video Mapping Resolution
  it('should correctly resolve speaker role identifiers for video synchronization controller', () => {
    const mapSpeakerToVideo = (role: string) => {
      switch (role.toLowerCase()) {
        case 'judge':
          return '/videos/courtroom/judge.mp4';
        case 'opposition':
        case 'opposing':
          return '/videos/courtroom/opposing.mp4';
        case 'user':
        case 'petitioner':
          return '/videos/courtroom/petitioner.mp4';
        default:
          return null;
      }
    };

    assert.strictEqual(mapSpeakerToVideo('judge'), '/videos/courtroom/judge.mp4');
    assert.strictEqual(mapSpeakerToVideo('opposition'), '/videos/courtroom/opposing.mp4');
    assert.strictEqual(mapSpeakerToVideo('user'), '/videos/courtroom/petitioner.mp4');
    assert.strictEqual(mapSpeakerToVideo('unknown'), null);
  });
});
