import { Router } from 'express';
import {
  getDashboardStats,
  getNotifications,
  markNotificationRead,
  getTemplates,
  getTemplateById,
  getDrafts,
  getDraftById,
  saveDraft,
  preCheckDraft,
  generateDraft,
  getDraftVersions,
  exportDocument,
  getCases,
  getCaseByCnr,
  getCaseTimeline,
  addCaseEvent,
  getClients,
  getClientById,
  addClientNote,
  addClientCommunication,
  getBareActs,
  getBareActById,
  searchBareActs,
  explainBareAct,
  askNexoraAi,
  getLibraryData,
  getVerificationReport,
  verifyDocumentWithAi,
  getResearchThreads,
  askResearchQuestion,
  getStudentAssets,
  startCourtroomSession,
  submitCourtroomArgument,
  endCourtroomSession,
  getCourtroomSession,
  submitCourtroomTurn,
  submitExam,
  generateMootMemorial,
  getTranslationData,
  createTranslationJob,
  askCitizenQuestion,
  getCitizenGlossary,
  handleVoiceCommand,
  confirmVoiceAction,
  uploadDocument,
  listDocuments,
  deleteDocument,
  parseDocumentFile,
  extractReferenceStyle,
  getReferenceStyles,
  getTtsPreferences,
  updateTtsPreferences,
  synthesizeTts
} from '../controllers/api.controller';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth.middleware';

const router = Router();

// -------------------------------------------------------------------
// Public Knowledge & Catalog Routes (Unauthenticated)
// -------------------------------------------------------------------
router.get('/bare-acts', getBareActs);
router.get('/bare-acts/search', searchBareActs);
router.post('/bare-acts/explain', explainBareAct);
router.get('/bare-acts/:id', getBareActById);
router.get('/library', getLibraryData);
router.get('/library/:tab', getLibraryData);
router.get('/citizen/glossary', getCitizenGlossary);
router.get('/templates', getTemplates);
router.get('/templates/:id', getTemplateById);
router.get('/verify/sample', getVerificationReport);

// NEXORA AI Assistant Routes
router.post('/ai/nexora/chat', optionalAuthenticateToken, askNexoraAi);
router.post('/nexora/chat', optionalAuthenticateToken, askNexoraAi);

// -------------------------------------------------------------------
// Protected Application Routes (Strictly Authenticated)
// -------------------------------------------------------------------

// 1. Dashboard & Notifications
router.get('/dashboard/stats', authenticateToken, getDashboardStats);
router.get('/notifications', authenticateToken, getNotifications);
router.patch('/notifications/:id/read', authenticateToken, markNotificationRead);

// 2. Drafts & AI Generation (Scoped to user)
router.get('/drafts', authenticateToken, getDrafts);
router.get('/drafts/:id', authenticateToken, getDraftById);
router.post('/drafts', optionalAuthenticateToken, saveDraft);
router.post('/drafts/precheck', optionalAuthenticateToken, preCheckDraft);
router.post('/ai/drafts/precheck', optionalAuthenticateToken, preCheckDraft);
router.post('/drafts/generate', optionalAuthenticateToken, generateDraft);
router.post('/ai/drafts/generate', optionalAuthenticateToken, generateDraft);
router.get('/drafts/:id/versions', optionalAuthenticateToken, getDraftVersions);

// 3. Export (Owner verified)
router.post('/ai/export', authenticateToken, exportDocument);
router.post('/export', authenticateToken, exportDocument);

// 4. Case Tracker (Scoped to user)
router.get('/tracker/cases', authenticateToken, getCases);
router.get('/cases', authenticateToken, getCases);
router.get('/tracker/cases/:cnr', authenticateToken, getCaseByCnr);
router.get('/cases/:id', authenticateToken, getCaseByCnr);
router.get('/cases/:id/timeline', authenticateToken, getCaseTimeline);
router.post('/cases/:id/events', authenticateToken, addCaseEvent);

// 5. Clients & Matters (Scoped to user)
router.get('/clients', authenticateToken, getClients);
router.get('/clients/:id', authenticateToken, getClientById);
router.post('/clients/:id/notes', authenticateToken, addClientNote);
router.post('/clients/:id/communications', authenticateToken, addClientCommunication);

// 6. Verification & Review
router.post('/verify', optionalAuthenticateToken, verifyDocumentWithAi);
router.post('/ai/documents/verify', optionalAuthenticateToken, verifyDocumentWithAi);

// 7. Research (Scoped to user)
router.get('/research/threads', optionalAuthenticateToken, getResearchThreads);
router.post('/research/chat', optionalAuthenticateToken, askResearchQuestion);
router.post('/ai/research/chat', optionalAuthenticateToken, askResearchQuestion);

// 8. Student Center & Live Courtroom Engine
router.get('/student/assets', optionalAuthenticateToken, getStudentAssets);
router.post('/student/courtroom/start', optionalAuthenticateToken, startCourtroomSession);
router.post('/student/courtroom/argument', optionalAuthenticateToken, submitCourtroomArgument);
router.post('/student/courtroom/end', optionalAuthenticateToken, endCourtroomSession);
router.post('/student/courtroom/:id/end', optionalAuthenticateToken, endCourtroomSession);
router.get('/student/courtroom/:id', optionalAuthenticateToken, getCourtroomSession);
router.post('/student/courtroom/sessions/:id/turns', optionalAuthenticateToken, submitCourtroomTurn);

// Direct courtroom.ai API compatibility aliases
router.post('/hearing/start', optionalAuthenticateToken, startCourtroomSession);
router.post('/hearing/argument', optionalAuthenticateToken, submitCourtroomArgument);
router.post('/hearing/:id/end', optionalAuthenticateToken, endCourtroomSession);
router.get('/hearing/:id', optionalAuthenticateToken, getCourtroomSession);

router.post('/student/tests/:id/submit', optionalAuthenticateToken, submitExam);
router.post('/student/moot/generate', optionalAuthenticateToken, generateMootMemorial);
router.post('/ai/moot/workflow', optionalAuthenticateToken, generateMootMemorial);

// 9. Translation
router.get('/translation/data', optionalAuthenticateToken, getTranslationData);
router.post('/translation/jobs', optionalAuthenticateToken, createTranslationJob);

// 10. Citizen Helpline
router.post('/citizen/ask', authenticateToken, askCitizenQuestion);

// 11. Voice Gateway
router.post('/ai/voice/command', authenticateToken, handleVoiceCommand);
router.post('/ai/voice/confirm', authenticateToken, confirmVoiceAction);

// 12. Document Uploads & Storage (Strictly Authenticated)
router.post('/documents/upload', authenticateToken, uploadDocument);
router.get('/documents', authenticateToken, listDocuments);
router.delete('/documents/:id', authenticateToken, deleteDocument);
router.post('/documents/parse-file', optionalAuthenticateToken, parseDocumentFile);
router.post('/documents/reference-style', optionalAuthenticateToken, extractReferenceStyle);
router.get('/documents/reference-style', optionalAuthenticateToken, getReferenceStyles);

// 13. Universal Read Aloud & TTS Preferences
router.get('/user/preferences/tts', optionalAuthenticateToken, getTtsPreferences);
router.put('/user/preferences/tts', authenticateToken, updateTtsPreferences);
router.post('/ai/tts/synthesize', optionalAuthenticateToken, synthesizeTts);

export default router;
