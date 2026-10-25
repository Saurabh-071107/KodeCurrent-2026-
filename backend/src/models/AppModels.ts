import { Schema, model, Document } from 'mongoose';

// 1. Template
export interface ITemplate extends Document {
  id: string;
  title: string;
  role: string;
  category: string;
  skillName: string;
  skillDesc: string;
  formFields: Array<{
    id: string;
    label: string;
    placeholder: string;
    required?: boolean;
    defaultValue?: string;
  }>;
  heading: string;
  subject: string;
  toPlaceholder: string;
  bodyClauses: string[];
  ultimatum: string;
  signOffTitle: string;
}

const templateSchema = new Schema<ITemplate>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  role: { type: String, required: true },
  category: { type: String, required: true },
  skillName: { type: String, required: true },
  skillDesc: { type: String, required: true },
  formFields: [{ type: Schema.Types.Mixed }],
  heading: { type: String, required: true },
  subject: { type: String, required: true },
  toPlaceholder: { type: String, required: true },
  bodyClauses: [{ type: String }],
  ultimatum: { type: String },
  signOffTitle: { type: String },
}, { timestamps: true });

export const Template = model<ITemplate>('Template', templateSchema);

// 2. Draft
export interface IDraft extends Document {
  id: string;
  userId?: string;
  title: string;
  category: string;
  role: string;
  lastEdited: string;
  wordsCount: number;
  preview: string;
  templateId: string;
  heading: string;
  subject: string;
  bodyClauses: string[];
  ultimatum: string;
  signOffTitle: string;
  facts?: Record<string, any>;
  version?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const draftSchema = new Schema<IDraft>({
  id: { type: String, required: true, unique: true },
  userId: { type: String },
  title: { type: String, required: true },
  category: { type: String, required: true },
  role: { type: String, required: true },
  lastEdited: { type: String, default: 'Just now' },
  wordsCount: { type: Number, default: 0 },
  preview: { type: String, default: '' },
  templateId: { type: String, required: true },
  heading: { type: String, required: true },
  subject: { type: String, required: true },
  bodyClauses: [{ type: String }],
  ultimatum: { type: String },
  signOffTitle: { type: String },
  facts: { type: Schema.Types.Mixed, default: {} },
  version: { type: Number, default: 1 }
}, { timestamps: true });

export const Draft = model<IDraft>('Draft', draftSchema);

// 3. Case Item
export interface ICaseItem extends Document {
  id: string;
  userId?: string;
  cnr: string;
  title: string;
  court: string;
  caseType: string;
  filingNumber: string;
  filingDate: string;
  petitioner: string;
  respondent: string;
  statusBadge: {
    label: string;
    date: string;
    type: string;
  };
  isActive: boolean;
  isStarred: boolean;
  isFollowed: boolean;
  clientName?: string;
  subject: string;
  acts: string[];
  currentStatusText: string;
  currentStatusDesc: string;
  plainLanguageSummary: string;
  briefFacts: string;
  nextHearing: {
    date: string;
    dayTime: string;
    bench: string;
    courtRoom: string;
    itemNo: string;
  };
  timeline: Array<{
    date: string;
    title: string;
    desc: string;
    badge?: string;
    hasOrderButton?: boolean;
    orderId?: string;
  }>;
  documents: Array<{
    id: string;
    title: string;
    date: string;
    size: string;
    type: string;
  }>;
  partiesList: Array<{
    name: string;
    role: string;
    advocate: string;
  }>;
}

const caseSchema = new Schema<ICaseItem>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, index: true },
  cnr: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  court: { type: String, required: true },
  caseType: { type: String, required: true },
  filingNumber: { type: String },
  filingDate: { type: String },
  petitioner: { type: String },
  respondent: { type: String },
  statusBadge: { type: Schema.Types.Mixed },
  isActive: { type: Boolean, default: true },
  isStarred: { type: Boolean, default: false },
  isFollowed: { type: Boolean, default: false },
  clientName: { type: String },
  subject: { type: String },
  acts: [{ type: String }],
  currentStatusText: { type: String },
  currentStatusDesc: { type: String },
  plainLanguageSummary: { type: String },
  briefFacts: { type: String },
  nextHearing: { type: Schema.Types.Mixed },
  timeline: [{ type: Schema.Types.Mixed }],
  documents: [{ type: Schema.Types.Mixed }],
  partiesList: [{ type: Schema.Types.Mixed }],
}, { timestamps: true });

export const CaseModel = model<ICaseItem>('Case', caseSchema);

// 4. Client
export interface IClient extends Document {
  id: string;
  userId?: string;
  name: string;
  type: string; // 'Individual' | 'Corporate'
  initials: string;
  phone: string;
  email: string;
  address: string;
  clientSince: string;
  preferredLanguage: string;
  notes: string;
  lastActivity: string;
  matters: Array<any>;
  documents: Array<any>;
  hearings: Array<any>;
  notesList: Array<any>;
  communications: Array<any>;
}

const clientSchema = new Schema<IClient>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, index: true },
  name: { type: String, required: true },
  type: { type: String, default: 'Individual' },
  initials: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  clientSince: { type: String },
  preferredLanguage: { type: String, default: 'English / Hindi' },
  notes: { type: String },
  lastActivity: { type: String, default: 'Recent' },
  matters: [{ type: Schema.Types.Mixed }],
  documents: [{ type: Schema.Types.Mixed }],
  hearings: [{ type: Schema.Types.Mixed }],
  notesList: [{ type: Schema.Types.Mixed }],
  communications: [{ type: Schema.Types.Mixed }],
}, { timestamps: true });

export const Client = model<IClient>('Client', clientSchema);

// 5. Bare Act
export interface IBareAct extends Document {
  id: string;
  name: string;
  category: string;
  year: number;
  totalSections: string;
  enactedDate: string;
  summary: string;
  keySections: Array<{
    number: string;
    title: string;
    plainExplanation: string;
    ingredients: string[];
    precedent: string;
    newActEquivalent?: string;
  }>;
}

const bareActSchema = new Schema<IBareAct>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  year: { type: Number, required: true },
  totalSections: { type: String, required: true },
  enactedDate: { type: String },
  summary: { type: String },
  keySections: [{ type: Schema.Types.Mixed }],
}, { timestamps: true });

export const BareAct = model<IBareAct>('BareAct', bareActSchema);

// 6. Generic Library & Student Assets Store
export interface IAppSetting extends Document {
  key: string;
  data: any;
}

const appSettingSchema = new Schema<IAppSetting>({
  key: { type: String, required: true, unique: true },
  data: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

export const AppSetting = model<IAppSetting>('AppSetting', appSettingSchema);

// 7. RefreshSession
export interface IRefreshSession extends Document {
  userId: string;
  tokenHash: string;
  deviceInfo?: string;
  ipAddress?: string;
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  replacedByTokenHash?: string;
}

const refreshSessionSchema = new Schema<IRefreshSession>({
  userId: { type: String, required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  deviceInfo: { type: String },
  ipAddress: { type: String },
  expiresAt: { type: Date, required: true },
  isRevoked: { type: Boolean, default: false },
  revokedAt: { type: Date },
  replacedByTokenHash: { type: String },
}, { timestamps: true });

export const RefreshSession = model<IRefreshSession>('RefreshSession', refreshSessionSchema);

// 8. DocumentRecord
export interface IDocumentRecord extends Document {
  id: string;
  ownerId: string;
  firmId?: string;
  filename: string;
  fileType: string;
  fileSize: number;
  storageKey: string;
  checksum?: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed' | 'deleted';
  metadata?: Record<string, any>;
}

const documentRecordSchema = new Schema<IDocumentRecord>({
  id: { type: String, required: true, unique: true },
  ownerId: { type: String, required: true, index: true },
  firmId: { type: String, index: true },
  filename: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  storageKey: { type: String, required: true },
  checksum: { type: String },
  status: { type: String, default: 'uploaded' },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export const DocumentRecord = model<IDocumentRecord>('DocumentRecord', documentRecordSchema);

// 9. AuditLog
export interface IAuditLog extends Document {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  userId: { type: String, index: true },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: { type: String },
  ip: { type: String },
  userAgent: { type: String },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);

// 10. ResearchThread
export interface IResearchMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: any[];
  statutes?: any[];
}

export interface IResearchThread extends Document {
  id: string;
  userId?: string;
  title: string;
  time: string;
  group: 'Today' | 'Yesterday' | 'This Week';
  messages: IResearchMessage[];
  createdAt?: Date;
  updatedAt?: Date;
}

const researchThreadSchema = new Schema<IResearchThread>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, index: true },
  title: { type: String, required: true },
  time: { type: String, default: 'Just now' },
  group: { type: String, default: 'Today' },
  messages: [{ type: Schema.Types.Mixed, default: [] }],
}, { timestamps: true });

export const ResearchThread = model<IResearchThread>('ResearchThread', researchThreadSchema);

// 11. ReferenceStyleProfile (Requirement 4 & Single Source of Truth)
export interface IReferenceStyleProfile extends Document {
  id: string;
  userId?: string;
  name: string;
  tone: string;
  structurePattern: string;
  numberingFormat: string;
  terminologyGlossary: Array<{ term: string; usage: string } | string>;
  formattingConventions: Record<string, any>;
  clausePatterns: Array<{ clauseType: string; observedStructure: string }>;
  adaptedSummary?: string;
  sampleSnippet?: string;
  sourceFilename?: string;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const referenceStyleSchema = new Schema<IReferenceStyleProfile>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, index: true },
  name: { type: String, required: true },
  tone: { type: String, default: 'Formal Legal' },
  structurePattern: { type: String, default: 'Standard Legal' },
  numberingFormat: { type: String, default: 'Sequential (1, 2, 3)' },
  terminologyGlossary: [{ type: Schema.Types.Mixed, default: [] }],
  formattingConventions: { type: Schema.Types.Mixed, default: {} },
  clausePatterns: [{ type: Schema.Types.Mixed, default: [] }],
  adaptedSummary: { type: String },
  sampleSnippet: { type: String },
  sourceFilename: { type: String },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

export const ReferenceStyleProfile = model<IReferenceStyleProfile>('ReferenceStyleProfile', referenceStyleSchema);

// 12. CitationVerificationRecord (Requirement 6 & Persistent Verification Results)
export interface ICitationVerificationRecord extends Document {
  id: string;
  userId?: string;
  documentId?: string;
  documentTitle?: string;
  rawText?: string;
  score: number;
  totalCitations: number;
  verifiedCount: number;
  issueCount: number;
  citations: Array<any>;
  summary: Record<string, any>;
  legacyFlags?: Array<any>;
  verifiedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const citationVerificationSchema = new Schema<ICitationVerificationRecord>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, index: true },
  documentId: { type: String, index: true },
  documentTitle: { type: String },
  rawText: { type: String },
  score: { type: Number, default: 100 },
  totalCitations: { type: Number, default: 0 },
  verifiedCount: { type: Number, default: 0 },
  issueCount: { type: Number, default: 0 },
  citations: [{ type: Schema.Types.Mixed, default: [] }],
  summary: { type: Schema.Types.Mixed, default: {} },
  legacyFlags: [{ type: Schema.Types.Mixed, default: [] }],
  verifiedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const CitationVerificationRecord = model<ICitationVerificationRecord>('CitationVerificationRecord', citationVerificationSchema);

// 13. VoiceCommandLog (Requirement 7 & Voice Workflow Auditability)
export interface IVoiceCommandLog extends Document {
  id: string;
  userId?: string;
  transcript: string;
  interpretedAction: string;
  target?: string;
  requiresConfirm: boolean;
  confirmToken?: string;
  status: 'interpreted' | 'confirmed' | 'rejected' | 'failed';
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

const voiceCommandLogSchema = new Schema<IVoiceCommandLog>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, index: true },
  transcript: { type: String, required: true },
  interpretedAction: { type: String, required: true },
  target: { type: String },
  requiresConfirm: { type: Boolean, default: false },
  confirmToken: { type: String, index: true },
  status: { type: String, default: 'interpreted' },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export const VoiceCommandLog = model<IVoiceCommandLog>('VoiceCommandLog', voiceCommandLogSchema);

// 14. CourtroomSessionModel (Eliminates In-Memory Map, Durable State)
export interface ICourtroomSession extends Document {
  sessionId: string;
  userId?: string;
  topic: string;
  userSide: 'petitioner' | 'respondent';
  oppositionSide: 'petitioner' | 'respondent';
  difficulty: 'easy' | 'medium' | 'hard';
  court?: string;
  appearanceRole?: string;
  scenarioId?: string;
  currentRound: number;
  isActive: boolean;
  isProcessing: boolean;
  currentTurn: string;
  messages: Array<any>;
  verdict?: Record<string, any>;
  score?: Record<string, any>;
  evaluation?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

const courtroomSessionSchema = new Schema<ICourtroomSession>({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, index: true },
  topic: { type: String, required: true },
  userSide: { type: String, required: true },
  oppositionSide: { type: String, required: true },
  difficulty: { type: String, default: 'medium' },
  court: { type: String },
  appearanceRole: { type: String },
  scenarioId: { type: String },
  currentRound: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  isProcessing: { type: Boolean, default: false },
  currentTurn: { type: String, default: 'user' },
  messages: [{ type: Schema.Types.Mixed, default: [] }],
  verdict: { type: Schema.Types.Mixed },
  score: { type: Schema.Types.Mixed },
  evaluation: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const CourtroomSessionModel = model<ICourtroomSession>('CourtroomSession', courtroomSessionSchema);

// 15. LegalLibraryItem (Persistent Legal Reference Library)
export interface ILegalLibraryItem extends Document {
  id: string;
  itemType: 'dictionaryTerm' | 'legalForm' | 'judgment' | 'citizenGlossary' | 'studentAsset';
  category?: string;
  titleOrTerm: string;
  data: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

const legalLibraryItemSchema = new Schema<ILegalLibraryItem>({
  id: { type: String, required: true, unique: true },
  itemType: { type: String, required: true, index: true },
  category: { type: String, index: true },
  titleOrTerm: { type: String, required: true },
  data: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

export const LegalLibraryItem = model<ILegalLibraryItem>('LegalLibraryItem', legalLibraryItemSchema);

// 16. NotificationModel (User-Scoped Notification State)
export interface INotification extends Document {
  id: string;
  userId?: string;
  title: string;
  message: string;
  read: boolean;
  time: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const notificationSchema = new Schema<INotification>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  time: { type: String, default: 'Today' },
}, { timestamps: true });

export const NotificationModel = model<INotification>('Notification', notificationSchema);

