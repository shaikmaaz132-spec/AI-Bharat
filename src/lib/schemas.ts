import { z } from 'zod';

// ==========================================
// 1. Chat & Vector Retrieval Schemas
// ==========================================

export const CitationSchema = z.object({
  schemeId: z.string(),
  slug: z.string(),
  title: z.string(),
  titleVernacular: z.string().optional(),
  financialBenefit: z.string(),
  officialUrl: z.string().url(),
  relevanceScore: z.number().optional(),
});

export type Citation = z.infer<typeof CitationSchema>;

export const ChatRequestSchema = z.object({
  message: z.string().default(''),
  audioBase64: z.string().optional(),
  audioMimeType: z.string().optional().default('audio/webm'),
  language: z.string().default('hi'),
  conversationId: z.string().uuid().optional(),
  sessionId: z.string().default('anon-citizen'),
  audioEnabled: z.boolean().default(true),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  response: z.string(),
  audioBase64: z.string().optional(),
  language: z.string(),
  citations: z.array(CitationSchema),
  grounded: z.boolean(),
  isRedirect: z.boolean(),
  conversationId: z.string().optional(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// ==========================================
// 2. Eligibility Evaluation Schemas
// ==========================================

export const EligibilityEvaluateRequestSchema = z.object({
  sessionId: z.string().default('anon-citizen'),
  age: z.number().int().min(0).max(120),
  gender: z.enum(['male', 'female', 'other']),
  state: z.string().min(2),
  district: z.string().optional().default(''),
  occupation: z.string().default('farmer'),
  annualIncome: z.number().min(0).default(0),
  landHoldingAcres: z.number().min(0).default(0),
  socialCategory: z.enum(['general', 'obc', 'sc', 'st', 'ews']).default('general'),
  housingType: z.enum(['homeless', 'kutcha', 'semi_pucca', 'pucca']).default('pucca'),
  documentsHeld: z.array(z.string()).default([]),
});

export type EligibilityEvaluateRequest = z.infer<typeof EligibilityEvaluateRequestSchema>;

export const EligibleSchemeItemSchema = z.object({
  schemeId: z.string(),
  slug: z.string(),
  title: z.string(),
  titleVernacular: z.string(),
  description: z.string(),
  category: z.string(),
  financialBenefit: z.string(),
  financialBenefitAmount: z.number(),
  matchConfidence: z.number(),
  reasons: z.array(z.string()),
  missingCriteria: z.array(z.string()).optional(),
  requiredDocuments: z.array(z.string()),
  applicationProcess: z.string(),
  officialUrl: z.string(),
});

export type EligibleSchemeItem = z.infer<typeof EligibleSchemeItemSchema>;

export const EligibilityEvaluateResponseSchema = z.object({
  eligible: z.array(EligibleSchemeItemSchema),
  partiallyEligible: z.array(EligibleSchemeItemSchema),
  ineligible: z.array(EligibleSchemeItemSchema),
  totalAnnualFinancialBenefit: z.number(),
  evaluatedAt: z.string(),
});

export type EligibilityEvaluateResponse = z.infer<typeof EligibilityEvaluateResponseSchema>;

// ==========================================
// 3. Multimodal Vision Document Analysis
// ==========================================

export const DocumentAnalyzeRequestSchema = z.object({
  imageBase64: z.string().min(10, 'Valid base64 image data is required'),
  mimeType: z.string().default('image/jpeg'),
  sessionId: z.string().default('anon-citizen'),
  documentHint: z.enum(['ration_card', 'land_passbook', 'aadhaar', 'income_certificate', 'auto']).default('auto'),
});

export type DocumentAnalyzeRequest = z.infer<typeof DocumentAnalyzeRequestSchema>;

export const DocumentExtractionSchema = z.object({
  documentType: z.enum(['ration_card', 'land_passbook', 'aadhaar', 'income_certificate', 'other']),
  holderName: z.string(),
  fatherOrSpouseName: z.string().nullable().optional(),
  category: z.string().default('General'), // e.g. BPL, AAY, Small Farmer, SC, ST
  landSizeAcres: z.number().nullable().optional(),
  annualIncome: z.number().nullable().optional(),
  maskedAadhaar: z.string().nullable().optional(), // Must be XXXX-XXXX-1234
  idNumber: z.string().nullable().optional(),
  issueState: z.string().nullable().optional(),
  confidenceScore: z.number().min(0).max(1),
  warnings: z.array(z.string()).default([]),
  rawExtractedData: z.record(z.any()).optional(),
});

export type DocumentExtraction = z.infer<typeof DocumentExtractionSchema>;

// ==========================================
// 4. Grievance & RTI Drafter Schemas
// ==========================================

export const GrievanceDraftRequestSchema = z.object({
  sessionId: z.string().default('anon-citizen'),
  petitionType: z.enum(['grievance', 'rti']),
  citizenName: z.string().min(2, 'Name is required'),
  phone: z.string().optional().default(''),
  address: z.string().min(5, 'Address is required for formal petitions'),
  department: z.string().min(2, 'Department is required'),
  targetAuthority: z.string().min(2, 'Target Authority / Designation is required'),
  subject: z.string().min(5, 'Subject is required'),
  complaintNarration: z.string().min(10, 'Detailed complaint narration is required'),
  incidentDate: z.string().optional(),
  citizenLanguage: z.string().default('hi'),
});

export type GrievanceDraftRequest = z.infer<typeof GrievanceDraftRequestSchema>;

export const GrievanceDraftResponseSchema = z.object({
  grievanceId: z.string(),
  petitionType: z.enum(['grievance', 'rti']),
  department: z.string(),
  targetAuthority: z.string(),
  subject: z.string(),
  statutoryReference: z.string(),
  englishDraft: z.string(),
  vernacularDraft: z.string(),
  citizenLanguage: z.string(),
  dateFormatted: z.string(),
});

export type GrievanceDraftResponse = z.infer<typeof GrievanceDraftResponseSchema>;
