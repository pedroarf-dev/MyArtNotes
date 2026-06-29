import {
  collection,
  doc,
  addDoc,
  getDoc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocFromServer
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { JournalEntry, Concept, Insight, UserProfile, ExportItem, ResearchNotebook, Portfolio, BetaFeedback } from "../types";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('[DB] Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const testConnectionAndLog = async (userId: string): Promise<boolean> => {
  console.log("[DB] initializing Firestore connection");
  console.log(`[DB] checking user collection access for user: ${userId}`);
  
  try {
    const userRef = doc(db, "users", userId);
    // Try to get with getDocFromServer to verify real network connection
    const snap = await getDocFromServer(userRef);
    console.log(`[DB] first read attempt result: success (exists: ${snap.exists()})`);
    console.log("[DB] connection status resolved: online");
    return true;
  } catch (error: any) {
    console.warn(`[DB] first read attempt result: failed with error: ${error.message || error}`);
    
    // Check if it's a hard offline error
    if (error instanceof Error && (
      error.message.includes("client is offline") || 
      error.message.includes("unreachable") || 
      error.message.includes("network-request-failed") ||
      error.message.includes("Failed to get document because the client is offline")
    )) {
      console.log("[DB] connection status resolved: offline");
      return false;
    }
    
    // If it's a permission issue or a slow loading, but still connected
    console.log("[DB] connection status resolved: online (with warnings/permissions)");
    return true;
  }
};

// Sync user document in Firestore on login/onboarding
export const syncUserDoc = async (
  uid: string,
  email: string | null,
  displayName: string | null,
  photoURL: string | null
): Promise<void> => {
  console.log(`[DEBUG] Attempting to sync user doc for uid: ${uid}`);
  const userRef = doc(db, "users", uid);
  try {
    const userSnap = await getDoc(userRef);
    const nowIso = new Date().toISOString();

    // Bootstrapped Admin check for pedroarf@gmail.com
    if (email && email.toLowerCase() === "pedroarf@gmail.com") {
      try {
        const adminRef = doc(db, "admin_users", "pedroarf@gmail.com");
        const adminSnap = await getDoc(adminRef);
        if (!adminSnap.exists()) {
          console.log(`[DEBUG] Bootstrapping admin role for pedroarf@gmail.com`);
          await setDoc(adminRef, {
            email: "pedroarf@gmail.com",
            role: "super_admin",
            createdAt: nowIso
          });
          console.log(`[DEBUG] Successfully bootstrapped pedroarf@gmail.com as super_admin`);
        }
      } catch (adminErr) {
        console.warn("[DEBUG] Non-blocking failure bootstrapping admin:", adminErr);
      }
    }

    if (!userSnap.exists()) {
      console.log(`[DEBUG] No existing user doc found. Creating new document for uid: ${uid}`);
      await setDoc(userRef, {
        uid,
        email: email || "",
        displayName: displayName || "",
        photoURL: photoURL || "",
        createdAt: nowIso,
        lastLoginAt: nowIso
      });
      console.log(`[DEBUG] Firestore user document created successfully for uid: ${uid}`);
      
      // Log sign up event
      await logAnalyticsEvent(uid, "user_signed_up", { email: email || "" });
    } else {
      console.log(`[DEBUG] Existing user doc found for uid: ${uid}. Updating lastLoginAt.`);
      await updateDoc(userRef, {
        lastLoginAt: nowIso,
        email: email || userSnap.data().email || "",
        displayName: displayName || userSnap.data().displayName || "",
        photoURL: photoURL || userSnap.data().photoURL || ""
      });
      console.log(`[DEBUG] Firestore user document lastLoginAt updated successfully for uid: ${uid}`);
    }
  } catch (err) {
    console.error(`[DEBUG] Error syncing user document in Firestore for uid: ${uid}`, err);
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
  }
};

// Helper to convert Firestore dates or add user_id
export const getJournalEntries = async (userId: string, notebookId?: string): Promise<JournalEntry[]> => {
  const path = "journal";
  try {
    let q;
    if (notebookId) {
      q = query(
        collection(db, path),
        where("userId", "==", userId),
        where("researchNotebookId", "==", notebookId)
      );
    } else {
      q = query(
        collection(db, path),
        where("userId", "==", userId)
      );
    }
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any)
    })) as JournalEntry[];
    return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
};

export const addJournalEntry = async (
  userId: string,
  notebookId: string,
  entry: Omit<JournalEntry, "id" | "createdAt">
): Promise<JournalEntry> => {
  const path = "journal";
  const docData = {
    ...entry,
    userId,
    researchNotebookId: notebookId,
    createdAt: new Date().toISOString()
  };
  try {
    const docRef = await addDoc(collection(db, path), docData);
    return {
      id: docRef.id,
      ...docData
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
};

export const deleteJournalEntry = async (entryId: string): Promise<void> => {
  const path = `journal/${entryId}`;
  const ref = doc(db, "journal", entryId);
  try {
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

export const getConcepts = async (userId: string, notebookId?: string): Promise<Concept[]> => {
  const path = "concepts";
  try {
    let q;
    if (notebookId) {
      q = query(
        collection(db, path),
        where("userId", "==", userId),
        where("researchNotebookId", "==", notebookId)
      );
    } else {
      q = query(
        collection(db, path),
        where("userId", "==", userId)
      );
    }
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any)
    })) as Concept[];
    return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
};

export const addConcept = async (
  userId: string,
  notebookId: string,
  concept: Omit<Concept, "id" | "createdAt" | "associations" | "questions" | "references" | "connections">
): Promise<Concept> => {
  const path = "concepts";
  const docData = {
    ...concept,
    userId,
    researchNotebookId: notebookId,
    associations: [],
    questions: [],
    references: [],
    connections: [],
    createdAt: new Date().toISOString()
  };
  try {
    const docRef = await addDoc(collection(db, path), docData);
    return {
      id: docRef.id,
      ...docData
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
};

export const updateConcept = async (
  conceptId: string,
  updatedFields: Partial<Concept>
): Promise<void> => {
  const path = `concepts/${conceptId}`;
  const ref = doc(db, "concepts", conceptId);
  try {
    await updateDoc(ref, updatedFields);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
};

export const deleteConcept = async (conceptId: string): Promise<void> => {
  const path = `concepts/${conceptId}`;
  const ref = doc(db, "concepts", conceptId);
  try {
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

export const getInsights = async (userId: string, notebookId?: string): Promise<Insight[]> => {
  const path = "insights";
  try {
    let q;
    if (notebookId) {
      q = query(
        collection(db, path),
        where("userId", "==", userId),
        where("researchNotebookId", "==", notebookId)
      );
    } else {
      q = query(
        collection(db, path),
        where("userId", "==", userId)
      );
    }
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any)
    })) as Insight[];
    return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
};

export const addInsight = async (
  userId: string,
  notebookId: string,
  insight: Omit<Insight, "id" | "createdAt">
): Promise<Insight> => {
  const path = "insights";
  const docData = {
    ...insight,
    userId,
    researchNotebookId: notebookId,
    createdAt: new Date().toISOString()
  };
  try {
    const docRef = await addDoc(collection(db, path), docData);
    return {
      id: docRef.id,
      ...docData
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
};

export const updateJournalEntry = async (
  entryId: string,
  updatedFields: Partial<JournalEntry>
): Promise<void> => {
  const path = `journal/${entryId}`;
  const ref = doc(db, "journal", entryId);
  try {
    await updateDoc(ref, updatedFields);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
};

export const updateInsight = async (
  insightId: string,
  updatedFields: Partial<Insight>
): Promise<void> => {
  const path = `insights/${insightId}`;
  const ref = doc(db, "insights", insightId);
  try {
    await updateDoc(ref, updatedFields);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
};

export const deleteInsight = async (insightId: string): Promise<void> => {
  const path = `insights/${insightId}`;
  const ref = doc(db, "insights", insightId);
  try {
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
};

// Analytics Events & Logging
export const logAnalyticsEvent = async (
  userId: string,
  eventType: "user_signed_up" | "first_journal_entry" | "first_concept_created" | "first_ai_exploration" | "first_insight_viewed" | "privacy_consent_updated" | "privacy_export_requested" | "account_deletion_requested",
  metadata?: any
): Promise<void> => {
  try {
    const docId = `${userId}_${eventType}`;
    const ref = doc(db, "analytics_events", docId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        userId,
        userEmail: auth.currentUser?.email || "",
        eventType,
        createdAt: new Date().toISOString(),
        metadata: metadata || {}
      });
      console.log(`[ANALYTICS] Logged milestone event: ${eventType} for user: ${userId}`);
    }
  } catch (err) {
    console.warn(`[ANALYTICS] Failed to log event ${eventType}:`, err);
  }
};

export interface AnalyticsReport {
  registrations: {
    total: number;
    byDate: { [date: string]: number };
  };
  activeUsers: {
    total30d: number;
    list: { uid: string; email: string; displayName: string; lastLoginAt: string; createdAt: string; isActive30d: boolean }[];
  };
  milestones: {
    userSignedUp: number;
    firstJournalEntry: number;
    firstConceptCreated: number;
    firstAiExploration: number;
    firstInsightViewed: number;
  };
  communicationPreferences?: {
    productUpdatesCount: number;
    creativeEcosystemCount: number;
    partnersCount: number;
    anonymousResearchCount: number;
  };
  events: {
    id: string;
    userId: string;
    userEmail: string;
    eventType: string;
    createdAt: string;
    metadata?: any;
  }[];
}

export const getAnalyticsDashboardData = async (): Promise<AnalyticsReport> => {
  let usersSnap;
  try {
    usersSnap = await getDocs(collection(db, "users"));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "users");
    throw err;
  }
  const users = usersSnap.docs.map((d) => d.data());

  let eventsSnap;
  try {
    eventsSnap = await getDocs(collection(db, "analytics_events"));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "analytics_events");
    throw err;
  }
  const events = eventsSnap.docs.map((d) => ({
    id: d.id,
    ...d.data()
  })) as any[];

    // Calculate metrics
    const registrationsTotal = users.length;
    const registrationsByDate: { [date: string]: number } = {};
    const activeUsersList: any[] = [];
    let activeUsers30d = 0;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let productUpdatesCount = 0;
    let creativeEcosystemCount = 0;
    let partnersCount = 0;
    let anonymousResearchCount = 0;

    users.forEach((u: any) => {
      // Reg date
      if (u.createdAt) {
        const dateStr = u.createdAt.split("T")[0];
        registrationsByDate[dateStr] = (registrationsByDate[dateStr] || 0) + 1;
      }
      
      // Communication and Research Preferences sums
      if (u.productUpdatesConsent === true) productUpdatesCount++;
      if (u.creativeEcosystemConsent === true) creativeEcosystemCount++;
      if (u.partnersConsent === true) partnersCount++;
      if (u.anonymousResearchConsent === true || u.analyticsConsentAccepted === true) anonymousResearchCount++;

      // Active check
      let isActive30d = false;
      if (u.lastLoginAt) {
        const lastLogin = new Date(u.lastLoginAt);
        if (lastLogin >= thirtyDaysAgo) {
          activeUsers30d++;
          isActive30d = true;
        }
      }

      activeUsersList.push({
        uid: u.uid || "",
        email: u.email || "",
        displayName: u.displayName || "",
        lastLoginAt: u.lastLoginAt || "",
        createdAt: u.createdAt || "",
        isActive30d
      });
    });

    // Count milestones
    const milestones = {
      userSignedUp: events.filter((e) => e.eventType === "user_signed_up").length,
      firstJournalEntry: events.filter((e) => e.eventType === "first_journal_entry").length,
      firstConceptCreated: events.filter((e) => e.eventType === "first_concept_created").length,
      firstAiExploration: events.filter((e) => e.eventType === "first_ai_exploration").length,
      firstInsightViewed: events.filter((e) => e.eventType === "first_insight_viewed").length,
    };

    return {
      registrations: {
        total: registrationsTotal,
        byDate: registrationsByDate
      },
      activeUsers: {
        total30d: activeUsers30d,
        list: activeUsersList.sort((a, b) => b.lastLoginAt.localeCompare(a.lastLoginAt))
      },
      milestones,
      communicationPreferences: {
        productUpdatesCount,
        creativeEcosystemCount,
        partnersCount,
        anonymousResearchCount
      },
      events: events.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    };
};

export interface AdminUser {
  email: string;
  role: "super_admin" | "admin";
  createdAt: string;
}

export const getAdminUserRole = async (email: string): Promise<"super_admin" | "admin" | null> => {
  if (!email) return null;
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const adminRef = doc(db, "admin_users", normalizedEmail);
    const adminSnap = await getDoc(adminRef);
    if (adminSnap.exists()) {
      return adminSnap.data().role as "super_admin" | "admin";
    }
    
    // Proactive auto-bootstrapping for pedroarf@gmail.com
    if (normalizedEmail === "pedroarf@gmail.com") {
      console.log(`[DB] Auto-bootstrapping admin role for pedroarf@gmail.com in getAdminUserRole`);
      try {
        await setDoc(adminRef, {
          role: "super_admin",
          createdAt: new Date().toISOString()
        });
        return "super_admin";
      } catch (err) {
        console.error("[DB] Failed to auto-bootstrap admin document:", err);
      }
      return "super_admin";
    }
    
    return null;
  } catch (err) {
    console.warn("[DB] Non-critical error checking admin role:", err);
    
    // Fallback security mechanism: If database check fails for pedroarf@gmail.com, still grant super_admin
    if (normalizedEmail === "pedroarf@gmail.com") {
      console.log("[DB] Fallback: Granting super_admin to pedroarf@gmail.com despite Firestore error");
      return "super_admin";
    }
    return null;
  }
};

export const getAdminUsers = async (): Promise<AdminUser[]> => {
  const path = "admin_users";
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => ({
      email: d.id,
      ...d.data()
    })) as AdminUser[];
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
};

export const addAdminUser = async (email: string, role: "super_admin" | "admin"): Promise<void> => {
  const normalizedEmail = email.toLowerCase().trim();
  const path = `admin_users/${normalizedEmail}`;
  try {
    const adminRef = doc(db, "admin_users", normalizedEmail);
    await setDoc(adminRef, {
      role,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
};

export const removeAdminUser = async (email: string): Promise<void> => {
  const normalizedEmail = email.toLowerCase().trim();
  const path = `admin_users/${normalizedEmail}`;
  try {
    const adminRef = doc(db, "admin_users", normalizedEmail);
    await deleteDoc(adminRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return {
        uid: snap.id,
        ...snap.data()
      } as UserProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
};

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>): Promise<void> => {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, data);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
};

export const getExports = async (userId: string, notebookId?: string): Promise<ExportItem[]> => {
  const path = "exports";
  try {
    let q;
    if (notebookId) {
      q = query(
        collection(db, path),
        where("userId", "==", userId),
        where("researchNotebookId", "==", notebookId)
      );
    } else {
      q = query(
        collection(db, path),
        where("userId", "==", userId)
      );
    }
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any)
    })) as ExportItem[];
    return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
};

export const addExport = async (userId: string, notebookId: string, exportData: Omit<ExportItem, "id">): Promise<ExportItem> => {
  const path = "exports";
  try {
    const docRef = await addDoc(collection(db, path), {
      ...exportData,
      userId,
      researchNotebookId: notebookId,
      createdAt: exportData.createdAt || new Date().toISOString()
    });
    return {
      id: docRef.id,
      userId,
      researchNotebookId: notebookId,
      ...exportData
    } as ExportItem;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
};

export const updateExport = async (id: string, updatedFields: Partial<ExportItem>): Promise<void> => {
  const path = `exports/${id}`;
  try {
    const docRef = doc(db, "exports", id);
    await updateDoc(docRef, updatedFields);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
};

export const deleteExport = async (id: string): Promise<void> => {
  const path = `exports/${id}`;
  try {
    const docRef = doc(db, "exports", id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
};

export const getResearchNotebooks = async (userId: string): Promise<ResearchNotebook[]> => {
  const path = "research_notebooks";
  try {
    const q = query(
      collection(db, path),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({
      id: d.id,
      ...d.data()
    })) as ResearchNotebook[];
    return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
};

export const addResearchNotebook = async (
  userId: string,
  notebookData: Omit<ResearchNotebook, "id">
): Promise<ResearchNotebook> => {
  const path = "research_notebooks";
  const now = new Date().toISOString();
  const docData = {
    ...notebookData,
    userId,
    createdAt: notebookData.createdAt || now,
    updatedAt: notebookData.updatedAt || now
  };
  try {
    const docRef = await addDoc(collection(db, path), docData);
    return {
      id: docRef.id,
      ...docData
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
};

export const updateResearchNotebook = async (
  notebookId: string,
  updatedFields: Partial<ResearchNotebook>
): Promise<void> => {
  const path = `research_notebooks/${notebookId}`;
  try {
    const docRef = doc(db, "research_notebooks", notebookId);
    await updateDoc(docRef, {
      ...updatedFields,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
};

export const deleteResearchNotebook = async (notebookId: string): Promise<void> => {
  const path = `research_notebooks/${notebookId}`;
  try {
    const docRef = doc(db, "research_notebooks", notebookId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
};

export const migrateUserLegacyData = async (userId: string, notebookId: string): Promise<void> => {
  console.log(`[MIGRATION] Checking for legacy user data to migrate to notebook: ${notebookId}`);
  try {
    // 1. Migrate journal
    const journalCol = collection(db, "journal");
    const jq = query(journalCol, where("userId", "==", userId));
    const jSnap = await getDocs(jq);
    for (const d of jSnap.docs) {
      if (!d.data().researchNotebookId) {
        console.log(`[MIGRATION] Migrating journal entry ${d.id} to notebook ${notebookId}`);
        await updateDoc(doc(db, "journal", d.id), { researchNotebookId: notebookId });
      }
    }

    // 2. Migrate concepts
    const conceptsCol = collection(db, "concepts");
    const cq = query(conceptsCol, where("userId", "==", userId));
    const cSnap = await getDocs(cq);
    for (const d of cSnap.docs) {
      if (!d.data().researchNotebookId) {
        console.log(`[MIGRATION] Migrating concept ${d.id} to notebook ${notebookId}`);
        await updateDoc(doc(db, "concepts", d.id), { researchNotebookId: notebookId });
      }
    }

    // 3. Migrate insights
    const insightsCol = collection(db, "insights");
    const iq = query(insightsCol, where("userId", "==", userId));
    const iSnap = await getDocs(iq);
    for (const d of iSnap.docs) {
      if (!d.data().researchNotebookId) {
        console.log(`[MIGRATION] Migrating insight ${d.id} to notebook ${notebookId}`);
        await updateDoc(doc(db, "insights", d.id), { researchNotebookId: notebookId });
      }
    }

    // 4. Migrate exports
    const exportsCol = collection(db, "exports");
    const eq = query(exportsCol, where("userId", "==", userId));
    const eSnap = await getDocs(eq);
    for (const d of eSnap.docs) {
      if (!d.data().researchNotebookId) {
        console.log(`[MIGRATION] Migrating export ${d.id} to notebook ${notebookId}`);
        await updateDoc(doc(db, "exports", d.id), { researchNotebookId: notebookId });
      }
    }

    console.log(`[MIGRATION] Legacy user data migration completed for user ${userId}`);
  } catch (err) {
    console.warn(`[MIGRATION] Legacy data migration encountered error:`, err);
  }
};

export const getPortfolios = async (userId: string, notebookId: string): Promise<Portfolio[]> => {
  const path = "portfolios";
  try {
    const q = query(
      collection(db, path),
      where("userId", "==", userId),
      where("researchNotebookId", "==", notebookId)
    );
    const snap = await getDocs(q);
    const results = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any)
    })) as Portfolio[];
    return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
};

export const addPortfolio = async (
  userId: string,
  notebookId: string,
  portfolio: Omit<Portfolio, "id" | "createdAt" | "updatedAt" | "userId" | "researchNotebookId">
): Promise<Portfolio> => {
  const path = "portfolios";
  const now = new Date().toISOString();
  const docData = {
    ...portfolio,
    userId,
    researchNotebookId: notebookId,
    createdAt: now,
    updatedAt: now
  };
  try {
    const docRef = await addDoc(collection(db, path), docData);
    return {
      id: docRef.id,
      ...docData
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
};

export const updatePortfolio = async (
  portfolioId: string,
  updatedFields: Partial<Portfolio>
): Promise<void> => {
  const path = `portfolios/${portfolioId}`;
  const ref = doc(db, "portfolios", portfolioId);
  const docData = {
    ...updatedFields,
    updatedAt: new Date().toISOString()
  };
  try {
    await updateDoc(ref, docData);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
};

export const deletePortfolio = async (portfolioId: string): Promise<void> => {
  const path = `portfolios/${portfolioId}`;
  const ref = doc(db, "portfolios", portfolioId);
  try {
    await deleteDoc(ref);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
};

export const deleteUserAccountAndData = async (userId: string): Promise<void> => {
  console.log(`[DB] Starting full GDPR erasure for userId: ${userId}`);
  
  const collectionsToDelete = [
    "journal",
    "concepts",
    "insights",
    "exports",
    "portfolios",
    "analytics_events",
    "research_notebooks"
  ];

  for (const collName of collectionsToDelete) {
    try {
      const q = query(collection(db, collName), where("userId", "==", userId));
      const snap = await getDocs(q);
      console.log(`[DB] Found ${snap.size} documents to delete in '${collName}'`);
      
      const deletePromises = snap.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);
    } catch (err) {
      console.warn(`[DB] Error purging collection '${collName}':`, err);
    }
  }

  // Delete user profile document
  try {
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    console.log(`[DB] User profile document successfully deleted for userId: ${userId}`);
  } catch (err) {
    console.error(`[DB] Error deleting user profile document:`, err);
    handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
    throw err;
  }
};

// --- Beta Feedback Service ---
export const addFeedback = async (
  feedback: Omit<BetaFeedback, "id" | "createdAt" | "updatedAt" | "status" | "adminNotes">
): Promise<BetaFeedback> => {
  const path = "feedback";
  const now = new Date().toISOString();
  const docData = {
    ...feedback,
    status: "new" as const,
    adminNotes: "",
    createdAt: now,
    updatedAt: now
  };
  try {
    const docRef = await addDoc(collection(db, path), docData);
    return {
      id: docRef.id,
      ...docData
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
};

export const getFeedbacksForUser = async (userId: string): Promise<BetaFeedback[]> => {
  const path = "feedback";
  try {
    const q = query(
      collection(db, path),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const results = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data
      } as BetaFeedback;
    });
    // Sort client-side by createdAt descending to avoid composite index requirement
    return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    throw err;
  }
};

export const getAllFeedbacks = async (): Promise<BetaFeedback[]> => {
  const path = "feedback";
  try {
    const q = query(
      collection(db, path),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data
      } as BetaFeedback;
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    throw err;
  }
};

export const updateFeedbackStatusAndNotes = async (
  feedbackId: string,
  status: "new" | "review" | "resolved" | "archived",
  adminNotes: string
): Promise<void> => {
  const path = `feedback/${feedbackId}`;
  const ref = doc(db, "feedback", feedbackId);
  try {
    await updateDoc(ref, {
      status,
      adminNotes,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
};


