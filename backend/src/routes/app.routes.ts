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
  getLibraryData,
  getVerificationReport,
  verifyDocumentWithAi,
  getResearchThreads,
  askResearchQuestion,
  getStudentAssets,
  submitCourtroomTurn,
  submitExam,
  getTranslationData,
  createTranslationJob,
  askCitizenQuestion,
  getCitizenGlossary,
  handleVoiceCommand,
  confirmVoiceAction
} from '../controllers/api.controller';

const router = Router();

// 1. Dashboard & Notifications
router.get('/dashboard/stats', getDashboardStats);
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

// 2. Templates
router.get('/templates', getTemplates);
router.get('/templates/:id', getTemplateById);

// 3. Drafts & Generation
router.get('/drafts', getDrafts);
router.get('/drafts/:id', getDraftById);
router.post('/drafts', saveDraft);
router.post('/drafts/precheck', preCheckDraft);
router.post('/ai/drafts/precheck', preCheckDraft);
router.post('/drafts/generate', generateDraft);
router.post('/ai/drafts/generate', generateDraft);
router.get('/drafts/:id/versions', getDraftVersions);

// 4. Export
router.post('/ai/export', exportDocument);
router.post('/export', exportDocument);

// 5. Case Tracker
router.get('/tracker/cases', getCases);
router.get('/cases', getCases);
router.get('/tracker/cases/:cnr', getCaseByCnr);
router.get('/cases/:id', getCaseByCnr);
router.get('/cases/:id/timeline', getCaseTimeline);
router.post('/cases/:id/events', addCaseEvent);

// 6. Clients & Matters
router.get('/clients', getClients);
router.get('/clients/:id', getClientById);
router.post('/clients/:id/notes', addClientNote);
router.post('/clients/:id/communications', addClientCommunication);

// 7. Bare Acts & Library
router.get('/bare-acts', getBareActs);
router.get('/library', getLibraryData);

// 8. Verification & Review
router.get('/verify/sample', getVerificationReport);
router.post('/verify', verifyDocumentWithAi);
router.post('/ai/documents/verify', verifyDocumentWithAi);

// 9. Research
router.get('/research/threads', getResearchThreads);
router.post('/research/chat', askResearchQuestion);
router.post('/ai/research/chat', askResearchQuestion);

// 10. Student Center
router.get('/student/assets', getStudentAssets);
router.post('/student/courtroom/sessions/:id/turns', submitCourtroomTurn);
router.post('/student/tests/:id/submit', submitExam);

// 11. Translation
router.get('/translation/data', getTranslationData);
router.post('/translation/jobs', createTranslationJob);

// 12. Citizen Helpline
router.post('/citizen/ask', askCitizenQuestion);
router.get('/citizen/glossary', getCitizenGlossary);

// 13. Voice Gateway
router.post('/ai/voice/command', handleVoiceCommand);
router.post('/ai/voice/confirm', confirmVoiceAction);

export default router;
