export interface Reference {
  title: string;
  artist: string;
  type: string;
  description: string;
}

export interface ConceptConnection {
  conceptId: string;
  rationale: string;
}

export interface Concept {
  id: string;
  researchNotebookId?: string;
  name: string;
  description: string;
  status: "seed" | "growing" | "mature";
  tags?: string[];
  associations: string[];
  questions: string[];
  references: Reference[];
  connections: ConceptConnection[];
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string; // Base64 or URL
  caption?: string;
}

export interface JournalEntry {
  id: string;
  researchNotebookId?: string;
  title: string;
  content: string;
  tags: string[];
  associatedConcepts: string[];
  attachments?: Attachment[];
  createdAt: string;
}

export interface Pattern {
  title: string;
  description: string;
  evidence: string[];
}

export interface Insight {
  id: string;
  researchNotebookId?: string;
  createdAt: string;
  title?: string;
  patterns: Pattern[];
  associations: string[];
  questions: string[];
  suggestedReferences?: Reference[];
}

export interface ExportItem {
  id: string;
  userId: string;
  researchNotebookId?: string;
  type: "pdf" | "memorial" | "report" | "summary";
  language: "en" | "pt";
  createdAt: string;
  status: "pending" | "success" | "failed";
  content?: string; // Textual / Markdown output from Gemini or compiled PDF summary
  title?: string;
  version: number;
  metadata?: {
    journalCount: number;
    conceptCount: number;
    insightCount: number;
  };
}

export interface ResearchNotebook {
  id: string;
  userId: string;
  title: string;
  subtitle?: string;
  description?: string;
  coverImage?: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
  language: "en" | "pt";
  tags?: string[];
  favorite?: boolean;
  isDemo?: boolean;
}

export interface Portfolio {
  id: string;
  userId: string;
  researchNotebookId: string;
  title: string;
  subtitle?: string;
  artistStatement: string;
  template: "minimal" | "grid" | "editorial";
  selectedEntries: string[]; // list of JournalEntry ids
  selectedConcepts: string[]; // list of Concept ids
  curatedEntries?: JournalEntry[];
  curatedConcepts?: Concept[];
  createdAt: string;
  updatedAt: string;
  isPublic?: boolean;
}

export type ActiveTab = "home" | "journal" | "lab" | "map" | "timeline" | "insights" | "admin" | "profile" | "settings" | "getting-started" | "export" | "portfolio";

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: string;
  lastLoginAt?: string;
  name?: string;
  bio?: string;
  artisticArea?: string;
  website?: string;
  instagram?: string;
  preferredLanguage?: "en" | "pt";
  addressMode?: "masculine" | "feminine" | "neutral" | "custom";
  customAddress?: string;
  preferredPronouns?: "he" | "she" | "they" | "none" | "custom";
  customPronouns?: string;
  privacyConsentAccepted?: boolean;
  analyticsConsentAccepted?: boolean;
  consentAcceptedAt?: string;
  productUpdatesConsent?: boolean;
  productUpdatesConsentAt?: string;
  creativeEcosystemConsent?: boolean;
  creativeEcosystemConsentAt?: string;
  partnersConsent?: boolean;
  partnersConsentAt?: string;
  anonymousResearchConsent?: boolean;
  anonymousResearchConsentAt?: string;
  consentHistory?: {
    privacyConsentAccepted: boolean;
    analyticsConsentAccepted: boolean;
    productUpdatesConsent?: boolean;
    creativeEcosystemConsent?: boolean;
    partnersConsent?: boolean;
    anonymousResearchConsent?: boolean;
    timestamp: string;
    version: string;
  }[];
}

export interface BetaFeedback {
  id: string;
  userId: string;
  userEmail: string;
  category: "bug" | "suggestion" | "question" | "idea" | "other";
  title: string;
  description: string;
  attachment?: string; // Optional Screenshot URL or Base64
  emailReplyConsent: boolean;
  browser: string;
  os: string;
  language: "en" | "pt";
  appVersion: string;
  notebookId: string | null;
  module: string | null;
  status: "new" | "review" | "resolved" | "archived";
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}


