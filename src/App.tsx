import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import JournalModule from "./components/JournalModule";
import LabModule from "./components/LabModule";
import MapModule from "./components/MapModule";
import TimelineModule from "./components/TimelineModule";
import InsightsModule from "./components/InsightsModule";
import AuthAndOnboarding from "./components/AuthAndOnboarding";
import OnboardingScreen from "./components/OnboardingScreen";
import AdminDashboard from "./components/AdminDashboard";
import ProfilePage from "./components/ProfilePage";
import SettingsPage from "./components/SettingsPage";
import GettingStarted from "./components/GettingStarted";
import HomeModule from "./components/HomeModule";
import ExportModule from "./components/ExportModule";
import PortfolioBuilder from "./components/PortfolioBuilder";
import PublicPortfolioViewer from "./components/PublicPortfolioViewer";
import MyanCommunicationCenter from "./components/MyanCommunicationCenter";
import GuestLocker from "./components/GuestLocker";
import { JournalEntry, Concept, Insight, ActiveTab } from "./types";
import { onAuthStateChanged, User, signOut, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "./lib/firebase";
import {
  getJournalEntries,
  addJournalEntry,
  deleteJournalEntry,
  getConcepts,
  addConcept,
  updateConcept,
  deleteConcept,
  getInsights,
  addInsight,
  updateInsight,
  deleteInsight,
  updateJournalEntry,
  syncUserDoc,
  testConnectionAndLog,
  logAnalyticsEvent,
  getAnalyticsDashboardData,
  getAdminUserRole,
  getUserProfile
} from "./lib/dbService";
import { AlertCircle, Loader2, BookOpen } from "lucide-react";
import { I18nProvider, useTranslation } from "./lib/i18n";
import { ResearchProvider, useResearch } from "./context/ResearchContext";
import ConsentFlow from "./components/ConsentFlow";

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}

function AppContent() {
  const { t, locale } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [firestoreSyncStatus, setFirestoreSyncStatus] = useState<"idle" | "pending" | "success" | "failed">("idle");
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");

  // GDPR Consent states
  const [privacyConsentRequired, setPrivacyConsentRequired] = useState<boolean>(false);
  const [checkingPrivacyConsent, setCheckingPrivacyConsent] = useState<boolean>(false);

  // Onboarding controls
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [autoOpenNewEntry, setAutoOpenNewEntry] = useState<boolean>(false);

  // Administrator role state
  const [adminRole, setAdminRole] = useState<"super_admin" | "admin" | null>(null);

  // System Loading / Errors
  const [systemError, setSystemError] = useState("");

  // Guest Sign-In states
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState("");

  const [publicPortfolioId, setPublicPortfolioId] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    console.log("[AUTH] Initiating Google Sign-In popup flow...");
    setSignInError("");
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account"
    });
    try {
      const result = await signInWithPopup(auth, provider);
      console.log(`[AUTH] Google Sign-In successful. User: ${result.user.uid}`);
      setUser(result.user);
    } catch (err: any) {
      console.error("[AUTH] Google Sign-In error:", err);
      let errMsg = err.message || "An unexpected error occurred during Google Sign-In.";
      if (err.code === "auth/popup-blocked") {
        errMsg = locale === "en"
          ? "The Google sign-in window was blocked by your browser. Please check your browser's address bar settings to allow popups, or try opening this application in a new tab."
          : "A janela de login do Google foi bloqueada pelo seu navegador. Por favor, verifique suas configurações de pop-up ou tente abrir este aplicativo em uma nova aba.";
      } else if (err.code === "auth/popup-closed-by-user") {
        errMsg = locale === "en"
          ? "The sign-in window was closed before completing authentication. Please try again."
          : "A janela de login foi fechada antes da conclusão do processo de autenticação. Por favor, tente novamente.";
      } else if (err.code === "auth/unauthorized-domain") {
        errMsg = locale === "en"
          ? "This domain is not authorized for Firebase Authentication. If you are on Vercel, please add your domain to the Authorized Domains list in the Firebase Console."
          : "Este domínio não está autorizado para Autenticação do Firebase. Se você está no Vercel, adicione o seu domínio à lista de Domínios Autorizados no Console do Firebase.";
      }
      setSignInError(errMsg);
    } finally {
      setIsSigningIn(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pId = params.get("portfolioId");
    if (pId) {
      setPublicPortfolioId(pId);
    }
  }, []);

  // Fetch administrator role on login and sync success
  useEffect(() => {
    const fetchRole = async () => {
      if (user && user.email) {
        console.log(`[AUTH] Fetching admin role for email: ${user.email}`);
        const role = await getAdminUserRole(user.email);
        console.log(`[AUTH] Fetched admin role: ${role}`);
        setAdminRole(role);
      } else {
        setAdminRole(null);
      }
    };
    fetchRole();
  }, [user, firestoreSyncStatus]);

  // GDPR Consent check effect
  useEffect(() => {
    const checkConsent = async () => {
      if (user && firestoreSyncStatus === "success") {
        setCheckingPrivacyConsent(true);
        try {
          console.log(`[PRIVACY] Checking consent for user: ${user.uid}`);
          const profile = await getUserProfile(user.uid);
          if (!profile || !profile.privacyConsentAccepted) {
            console.log("[PRIVACY] User has not accepted privacy consent. Requiring consent flow.");
            setPrivacyConsentRequired(true);
          } else {
            console.log("[PRIVACY] User has already accepted privacy consent.");
            setPrivacyConsentRequired(false);
          }
        } catch (err) {
          console.error("[PRIVACY] Error checking privacy consent:", err);
          // If checking fails, require consent to be safe
          setPrivacyConsentRequired(true);
        } finally {
          setCheckingPrivacyConsent(false);
        }
      } else {
        setPrivacyConsentRequired(false);
      }
    };
    checkConsent();
  }, [user, firestoreSyncStatus]);

  // Route-based protection for Admin view
  useEffect(() => {
    if (activeTab === "admin" && !adminRole && authChecked) {
      console.warn("[SECURITY] Non-admin user attempted to access the Admin view. Redirecting...");
      setActiveTab("journal");
    }
  }, [activeTab, adminRole, authChecked]);

  // Handle Auth State Change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(`[AUTH] onAuthStateChanged triggered. User status: ${firebaseUser ? `Logged in as ${firebaseUser.uid}` : "Logged out"}`);
      
      if (firebaseUser) {
        setUser(firebaseUser);
        setSystemError(""); // Clear any previous system errors
        setFirestoreSyncStatus("pending");
        
        try {
          await syncUserDoc(
            firebaseUser.uid,
            firebaseUser.email,
            firebaseUser.displayName,
            firebaseUser.photoURL
          );
          setFirestoreSyncStatus("success");
          console.log("[AUTH] firestore sync success");
        } catch (err: any) {
          setFirestoreSyncStatus("failed");
          console.error("[AUTH] firestore sync failure:", err);
        }
      } else {
        setUser(null);
        setFirestoreSyncStatus("idle");
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  if (publicPortfolioId) {
    return <PublicPortfolioViewer portfolioId={publicPortfolioId} />;
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex flex-col items-center justify-center gap-4 font-sans">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
        <p className="text-stone-500 font-mono text-xs tracking-widest uppercase">
          {t.loadingWorkspace}
        </p>
      </div>
    );
  }

  if (user && checkingPrivacyConsent) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex flex-col items-center justify-center gap-4 font-sans">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
        <p className="text-stone-500 font-mono text-xs tracking-widest uppercase">
          {locale === "en" ? "Verifying Credentials..." : "Verificando Credenciais..."}
        </p>
      </div>
    );
  }

  if (user && privacyConsentRequired) {
    return (
      <ConsentFlow
        userId={user.uid}
        userEmail={user.email || ""}
        initialLocale={locale}
        onConsentComplete={() => setPrivacyConsentRequired(false)}
      />
    );
  }

  return (
    <ResearchProvider userId={user ? user.uid : null} preferredLanguage={locale}>
      <WorkspaceContainer 
        user={user}
        locale={locale}
        t={t}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        adminRole={adminRole}
        handleSignOut={handleSignOut}
        systemError={systemError}
        setSystemError={setSystemError}
        showOnboarding={showOnboarding}
        setShowOnboarding={setShowOnboarding}
        autoOpenNewEntry={autoOpenNewEntry}
        setAutoOpenNewEntry={setAutoOpenNewEntry}
        onSignIn={handleGoogleSignIn}
        isSigningIn={isSigningIn}
        signInError={signInError}
      />
    </ResearchProvider>
  );
}

// Sub-component wrapper that securely consumes ResearchContext inside ResearchProvider
interface WorkspaceContainerProps {
  user: User | null;
  locale: "pt" | "en";
  t: any;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  adminRole: "super_admin" | "admin" | null;
  handleSignOut: () => Promise<void>;
  systemError: string;
  setSystemError: (err: string) => void;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  autoOpenNewEntry: boolean;
  setAutoOpenNewEntry: (open: boolean) => void;
  onSignIn?: () => void;
  isSigningIn?: boolean;
  signInError?: string;
}

function WorkspaceContainer({
  user,
  locale,
  t,
  activeTab,
  setActiveTab,
  adminRole,
  handleSignOut,
  systemError,
  setSystemError,
  showOnboarding,
  setShowOnboarding,
  autoOpenNewEntry,
  setAutoOpenNewEntry,
  onSignIn,
  isSigningIn,
  signInError
}: WorkspaceContainerProps) {
  const { 
    currentNotebook, 
    isLoadingNotebooks, 
    notebooks, 
    createNotebook, 
    archiveNotebook, 
    switchNotebook,
    deleteNotebook
  } = useResearch();

  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastModule, setLastModule] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== "profile" && activeTab !== "admin" && activeTab !== "settings") {
      setLastModule(activeTab);
    }
  }, [activeTab]);

  // Toast State for Notebook switches
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const lastNotebookIdRef = useRef<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Watch current notebook to trigger toast
  useEffect(() => {
    if (currentNotebook) {
      if (lastNotebookIdRef.current && lastNotebookIdRef.current !== currentNotebook.id) {
        triggerToast(locale === "en" ? "Active notebook changed." : "Caderno ativo alterado.");
      }
      lastNotebookIdRef.current = currentNotebook.id;
    }
  }, [currentNotebook, locale]);

  // Fetch active notebook's data streams
  const fetchArchiveData = async (userId: string, notebookId: string) => {
    setIsLoading(true);
    setSystemError("");
    
    // Explicit connection check with up to 3 retries
    let isOnline = false;
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[DB] Connection test attempt ${attempt}/${maxRetries} for notebook ${notebookId}...`);
      isOnline = await testConnectionAndLog(userId);
      if (isOnline) {
        break;
      }
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (!isOnline) {
      console.error("[DB] Firestore connection could not be resolved. Triggering offline fallback screen.");
      setSystemError(t.dbConnFailed);
      setIsLoading(false);
      return;
    }

    try {
      console.log(`[DB] Syncing notebook workspace data streams for notebook: ${notebookId}...`);
      
      const [journalData, conceptsData, insightsData] = await Promise.all([
        getJournalEntries(userId, notebookId).catch((err) => {
          console.warn("[DB] Non-critical error fetching journals, falling back to empty:", err);
          return [] as JournalEntry[];
        }),
        getConcepts(userId, notebookId).catch((err) => {
          console.warn("[DB] Non-critical error fetching concepts, falling back to empty:", err);
          return [] as Concept[];
        }),
        getInsights(userId, notebookId).catch((err) => {
          console.warn("[DB] Non-critical error fetching insights, falling back to empty:", err);
          return [] as Insight[];
        })
      ]);

      setJournal(journalData);
      setConcepts(conceptsData);
      setInsights(insightsData);
      
      // Determine onboarding display - only show onboarding if the current notebook is totally empty
      // AND user has not completed first onboard bypass
      const hasBypassedOnboarding = localStorage.getItem(`atlas_onboarded_uid_${userId}_notebook_${notebookId}`) === "true";
      if (journalData.length === 0 && conceptsData.length === 0 && !hasBypassedOnboarding) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }

      console.log("[DB] Scoped notebook workspace data successfully synced.");
    } catch (err: any) {
      console.error("[DB] Unexpected notebook data load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch data every time active notebook changes
  useEffect(() => {
    if (user && currentNotebook) {
      fetchArchiveData(user.uid, currentNotebook.id);
    } else if (!isLoadingNotebooks) {
      setJournal([]);
      setConcepts([]);
      setInsights([]);
    }
  }, [user, currentNotebook, isLoadingNotebooks]);

  // Journal Mutations (Scoped by Active Notebook)
  const handleAddJournalEntry = async (
    title: string,
    content: string,
    tags: string[],
    associatedConcepts: string[]
  ) => {
    if (!user || !currentNotebook) return;
    try {
      const isFirst = journal.length === 0;
      const newEntry = await addJournalEntry(user.uid, currentNotebook.id, {
        title,
        content,
        tags,
        associatedConcepts
      });
      setJournal((prev) => [newEntry, ...prev]);
      if (isFirst) {
        logAnalyticsEvent(user.uid, "first_journal_entry", { title, notebookId: currentNotebook.id });
      }
    } catch (err) {
      console.error(err);
      triggerToast(locale === "en" ? "Failed to save process log. Check your network." : "Falha ao salvar registro. Verifique sua conexão.");
    }
  };

  const handleDeleteJournalEntry = async (id: string) => {
    try {
      await deleteJournalEntry(id);
      setJournal((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      triggerToast(locale === "en" ? "Failed to delete the process log." : "Falha ao excluir o registro do diário.");
    }
  };

  const handleUpdateJournalEntry = async (id: string, updatedFields: Partial<JournalEntry>) => {
    try {
      await updateJournalEntry(id, updatedFields);
      setJournal((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, ...updatedFields } as JournalEntry : entry))
      );
    } catch (err) {
      console.error(err);
      triggerToast(locale === "en" ? "Failed to save changes to the process log." : "Falha ao salvar alterações do registro.");
    }
  };

  const handleUpdateInsight = async (id: string, updatedFields: Partial<Insight>) => {
    try {
      await updateInsight(id, updatedFields);
      setInsights((prev) =>
        prev.map((ins) => (ins.id === id ? { ...ins, ...updatedFields } as Insight : ins))
      );
    } catch (err) {
      console.error(err);
      triggerToast(locale === "en" ? "Failed to save changes to the reflection." : "Falha ao salvar alterações da reflexão.");
    }
  };

  const handleDeleteInsight = async (id: string) => {
    try {
      await deleteInsight(id);
      setInsights((prev) => prev.filter((ins) => ins.id !== id));
    } catch (err) {
      console.error(err);
      triggerToast(locale === "en" ? "Failed to delete the reflection." : "Falha ao excluir a reflexão.");
    }
  };

  // Concept Mutations (Scoped by Active Notebook)
  const handleAddConcept = async (
    name: string,
    description: string,
    status: "seed" | "growing" | "mature"
  ) => {
    if (!user || !currentNotebook) return;
    try {
      const isFirst = concepts.length === 0;
      const newConcept = await addConcept(user.uid, currentNotebook.id, {
        name,
        description,
        status
      });
      setConcepts((prev) => [newConcept, ...prev]);
      if (isFirst) {
        logAnalyticsEvent(user.uid, "first_concept_created", { name, notebookId: currentNotebook.id });
      }
    } catch (err) {
      console.error(err);
      triggerToast(locale === "en" ? "Failed to seed your concept." : "Falha ao semear seu conceito.");
    }
  };

  const handleUpdateConcept = async (id: string, updatedFields: Partial<Concept>) => {
    try {
      await updateConcept(id, updatedFields);
      setConcepts((prev) =>
        prev.map((c) => (c.id === id ? ({ ...c, ...updatedFields } as Concept) : c))
      );
    } catch (err) {
      console.error(err);
      triggerToast(locale === "en" ? "Failed to save changes to the concept seed." : "Falha ao salvar alterações do conceito semente.");
    }
  };

  const handleDeleteConcept = async (id: string) => {
    if (!user || !currentNotebook) return;
    try {
      await deleteConcept(id);
      setConcepts((prev) => prev.filter((item) => item.id !== id));

      // Re-fetch scoped journal entries to clean any broken references locally
      const updatedJournal = await getJournalEntries(user.uid, currentNotebook.id);
      setJournal(updatedJournal);
    } catch (err) {
      console.error(err);
      triggerToast(locale === "en" ? "Failed to purge concept from the archive." : "Falha ao expurgar o conceito do arquivo.");
    }
  };

  const handleExploreConcept = async (
    conceptName: string,
    conceptDescription: string,
    existingConceptId: string
  ): Promise<Concept> => {
    if (!user || !currentNotebook) throw new Error("No active workspace context.");
    const idToken = await user.getIdToken();

    const res = await fetch("/api/concepts/explore", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`
      },
      body: JSON.stringify({
        conceptName,
        conceptDescription,
        existingConcepts: concepts.filter((c) => c.id !== existingConceptId),
        locale,
        researchNotebookId: currentNotebook.id // Enforce secure notebook context to AI route
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || t.errorGenAI);
    }

    const aiReflections = await res.json();
    const updatedFields = {
      description: aiReflections.description,
      associations: aiReflections.associations,
      questions: aiReflections.questions,
      references: aiReflections.references,
      connections: aiReflections.connections || []
    };

    await updateConcept(existingConceptId, updatedFields);

    const updatedConcept = {
      ...concepts.find((c) => c.id === existingConceptId)!,
      ...updatedFields
    } as Concept;

    setConcepts((prev) => prev.map((c) => (c.id === existingConceptId ? updatedConcept : c)));
    logAnalyticsEvent(user.uid, "first_ai_exploration", { conceptName, notebookId: currentNotebook.id });
    
    return updatedConcept;
  };

  // Generate Insights (Scoped by Active Notebook)
  const handleGenerateInsights = async (): Promise<Insight> => {
    if (!user || !currentNotebook) throw new Error("No active workspace context.");
    const idToken = await user.getIdToken();

    const res = await fetch("/api/insights/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`
      },
      body: JSON.stringify({ 
        journalEntries: journal, 
        concepts, 
        locale,
        researchNotebookId: currentNotebook.id // Enforce secure notebook context to AI route
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(
        errData.error || "Synthesis interrupted. Please make sure you have active studio data."
      );
    }

    const aiResult = await res.json();
    const newInsight = await addInsight(user.uid, currentNotebook.id, {
      patterns: aiResult.patterns,
      associations: aiResult.associations,
      questions: aiResult.questions,
      suggestedReferences: aiResult.suggestedReferences
    });

    setInsights((prev) => [newInsight, ...prev]);
    logAnalyticsEvent(user.uid, "first_insight_viewed", { patternsCount: aiResult.patterns?.length, notebookId: currentNotebook.id });
    
    return newInsight;
  };

  // Onboarding actions (Scoped by Active Notebook)
  const handleOnboardingCreateFirstEntry = () => {
    if (user && currentNotebook) {
      localStorage.setItem(`atlas_onboarded_uid_${user.uid}_notebook_${currentNotebook.id}`, "true");
    }
    setShowOnboarding(false);
    setActiveTab("journal");
    setAutoOpenNewEntry(true);
  };

  const handleCreateDemoNotebook = async () => {
    if (!user) return;
    try {
      // 1. Create a brand new notebook
      const title = locale === "en" ? "Demonstration: Aesthetics of Impermanence" : "Demonstração: Estética da Impermanência";
      const subtitle = locale === "en" ? "Fictional Study Workspace" : "Espaço de Estudo Ficcional";
      const description = locale === "en" 
        ? "A temporary study of ecological decay and natural oxidation acting as co-authoring agents in material creation."
        : "Estudo temporário da deterioração ecológica e oxidação natural agindo como agentes de coautoria na criação material.";
      
      const newNb = await createNotebook(title, subtitle, description, locale, true);

      // 2. Add Concept
      const conceptData = await addConcept(user.uid, newNb.id, {
        name: locale === "en" ? "Aesthetics of Impermanence" : "Estética da Impermanência",
        description: locale === "en" 
          ? "The poetics of letting ecological forces act upon the physical medium of the artwork. Instead of conserving and freezing the artistic object, the practice consists of welcoming degradation, wear, and oxidation as co-authoring agents. Time is not an external element that destroys, but the very raw material of the work."
          : "A poética de deixar que as forças ecológicas ajam sobre o suporte físico da obra. Em vez de conservar e congelar o objeto artístico, a prática consiste em acolher a degradação, o desgaste e a oxidação como agentes de coautoria. O tempo não é um elemento externo que destrói, mas a própria matéria-prima do trabalho.",
        status: "growing"
      });

      // Update fields with associations, questions, references
      const updatedConceptFields = {
        associations: locale === "en"
          ? ["Natural oxidation", "Patina", "Wabi-Sabi", "Process Art"]
          : ["Oxidação natural", "Pátina", "Wabi-Sabi", "Arte Processual"],
        questions: locale === "en"
          ? [
              "How to document change without freezing it?",
              "To what extent should the artist's control intervene in the natural process?",
              "What are the political relationships between urban decay and material oxidation?"
            ]
          : [
              "Como documentar a mudança sem congelá-la?",
              "Até que ponto o controle do artista deve intervir no processo natural?",
              "Quais são as relações políticas entre a degradação urbana e a oxidação material?"
            ],
        references: [
          {
            title: "Spiral Jetty",
            artist: "Robert Smithson",
            type: "Land Art / Sculpture",
            description: locale === "en"
              ? "A classic reference for entropy and geologic time acting on physical form."
              : "Referência clássica de entropia e tempo geológico agindo sobre a forma física."
          },
          {
            title: "Aesthetics of Chance",
            artist: "John Cage",
            type: "Music / Performance",
            description: locale === "en"
              ? "Inviting uncontrolled environments to participate in creation."
              : "Convidar ambientes não controlados para participar da criação."
          }
        ],
        connections: []
      };

      await updateConcept(conceptData.id, updatedConceptFields);

      // 3. Add Journal Entry
      const entryData = await addJournalEntry(user.uid, newNb.id, {
        title: locale === "en" ? "Oxidation on Iron and Copper Sheets" : "Oxidação em Chapas de Ferro e Cobre",
        content: locale === "en"
          ? "Installed four metal sheets in the backyard garden of the studio to monitor reaction with atmospheric moisture and acid rain. After 12 days, iron oxidation revealed a rich gradation of ochres, oranges, and deep browns, while copper began to present discrete points of basic copper carbonate (bluish/greenish). The texture of the metal is physically shifting, accumulating the temporality of the weather. I intend to use this texture as a matrix for printmaking or as a base for a new pictorial series."
          : "Instalei quatro chapas de metal no jardim dos fundos do ateliê para monitorar a reação com a umidade atmosférica e a chuva ácida. Após 12 dias, a oxidação do ferro revelou uma gradação rica em ocres, laranjas e marrons profundos, enquanto o cobre começou a apresentar pontos discretos de carbonato básico de cobre (azulado/esverdeado). A textura do metal está mudando fisicamente, acumulando a temporalidade do clima. Pretendo usar essa textura como matriz para gravuras ou como base para uma nova série pictórica.",
        tags: locale === "en" ? ["oxidation", "matter", "time", "experiment"] : ["oxidação", "matéria", "tempo", "experimento"],
        associatedConcepts: [conceptData.id]
      });

      // 4. Add AI Insight / Reflection
      await addInsight(user.uid, newNb.id, {
        title: locale === "en" ? "Synthesis: Entropy & Co-Authorship" : "Síntese: Entropia e Coautoria",
        patterns: [
          {
            title: locale === "en" ? "Material Entropic Evolution" : "Evolução Entrópica Material",
            description: locale === "en"
              ? "You actively invite environmental forces like oxidation and moisture to share authorship of the physical medium."
              : "Você convida ativamente forças ambientais como a oxidação e a umidade para compartilhar a autoria do suporte físico.",
            evidence: [
              locale === "en" ? "Oxidation on Iron and Copper Sheets (Journal)" : "Oxidação em Chapas de Ferro e Cobre (Diário)",
              locale === "en" ? "Aesthetics of Impermanence (Concept)" : "Estética da Impermanência (Conceito)"
            ]
          }
        ],
        associations: locale === "en"
          ? ["Environmental Co-Authorship", "John Cage", "Robert Smithson", "Atmospheric Chemistry"]
          : ["Coautoria Ambiental", "John Cage", "Robert Smithson", "Química Atmosférica"],
        questions: locale === "en"
          ? [
              "How does your choice of metal sheets change the viewer's awareness of environmental degradation?",
              "What is the threshold where natural deterioration compromises structural intent?"
            ]
          : [
              "Como a escolha das chapas de metal muda a percepção do espectador sobre a degradação ambiental?",
              "Qual é o limiar onde a deterioração natural compromete a intenção estrutural?"
            ],
        suggestedReferences: [
          {
            title: "Over Time",
            artist: "Andy Goldsworthy",
            type: "Sculpture / Environment",
            description: locale === "en"
              ? "Exploring how natural cycles reshape the artist's structural works."
              : "Explorando como ciclos naturais remodelam os trabalhos estruturais do artista."
          }
        ]
      });

      // 5. Force update of local state so everything is loaded immediately
      await fetchArchiveData(user.uid, newNb.id);

      // Complete onboarding and go home
      localStorage.setItem(`atlas_onboarded_uid_${user.uid}_notebook_${newNb.id}`, "true");
      setShowOnboarding(false);
      setActiveTab("home");
    } catch (err) {
      console.error("Failed to seed example data:", err);
      triggerToast(locale === "en" ? "Failed to generate demonstration notebook. Please try again." : "Falha ao gerar o caderno de demonstração. Por favor, tente novamente.");
    }
  };

  const handleDeleteDemoNotebook = async (notebookId: string) => {
    if (!user) return;
    if (!window.confirm(locale === "en" ? "Are you sure you want to permanently delete this demonstration notebook and all of its contents?" : "Tem certeza de que deseja excluir permanentemente este caderno de demonstração e todo o seu conteúdo?")) return;
    
    try {
      // 1. Delete associated concepts, entries, and insights
      const associatedEntries = journal.filter(e => e.researchNotebookId === notebookId);
      const associatedConcepts = concepts.filter(c => c.researchNotebookId === notebookId);
      const associatedInsights = insights.filter(i => i.researchNotebookId === notebookId);

      for (const entry of associatedEntries) {
        await deleteJournalEntry(entry.id);
      }
      for (const concept of associatedConcepts) {
        await deleteConcept(concept.id);
      }
      for (const insight of associatedInsights) {
        await deleteInsight(insight.id);
      }

      // 2. Delete notebook itself via context
      await deleteNotebook(notebookId);

      // 3. Inform user
      triggerToast(locale === "en" ? "Demonstration notebook successfully deleted!" : "Caderno de demonstração excluído com sucesso!");
    } catch (err) {
      console.error("Failed to delete demo notebook:", err);
      triggerToast(locale === "en" ? "Failed to delete demonstration." : "Falha ao excluir a demonstração.");
    }
  };

  const handleDeleteDemoContent = async () => {
    if (!user || !currentNotebook) return;
    try {
      const onboardingEntries = journal.filter(
        (e) => (e.title === "Oxidation on Iron and Copper Sheets" || e.title === "Oxidação em Chapas de Ferro e Cobre") && e.researchNotebookId === currentNotebook.id
      );
      const onboardingConcepts = concepts.filter(
        (c) => (c.name === "Aesthetics of Impermanence" || c.name === "Estética da Impermanência") && c.researchNotebookId === currentNotebook.id
      );

      for (const entry of onboardingEntries) {
        await deleteJournalEntry(entry.id);
      }
      for (const concept of onboardingConcepts) {
        await deleteConcept(concept.id);
      }

      setJournal(prev => prev.filter(e => !onboardingEntries.some(oe => oe.id === e.id)));
      setConcepts(prev => prev.filter(c => !onboardingConcepts.some(oc => oc.id === c.id)));

      triggerToast(locale === "en" ? "Demo content deleted successfully." : "Conteúdo de demonstração excluído com sucesso.");
    } catch (err) {
      console.error("Failed to delete demo content:", err);
      triggerToast(locale === "en" ? "Failed to delete demo content." : "Falha ao excluir conteúdo de demonstração.");
    }
  };

  // Loading notebooks from context
  if (isLoadingNotebooks) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex flex-col items-center justify-center gap-4 font-sans">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
        <p className="text-stone-500 font-mono text-xs tracking-widest uppercase">
          {locale === "en" ? "Loading research notebooks..." : "Carregando cadernos de pesquisa..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-stone-850 flex flex-col font-sans selection:bg-[#EFECE6] selection:text-stone-950">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        journalCount={journal.length}
        conceptCount={concepts.length}
        user={user}
        onSignOut={handleSignOut}
        adminRole={adminRole}
        onSignIn={onSignIn}
        isSigningIn={isSigningIn}
      />

      {showOnboarding ? (
        <OnboardingScreen
          onCreateFirstEntry={handleOnboardingCreateFirstEntry}
          onLoadExample={handleCreateDemoNotebook}
        />
      ) : (
        <main className="flex-1 p-5 md:p-6 max-w-[1450px] mx-auto w-full overflow-hidden">
          {isLoading ? (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
              <p className="text-stone-500 font-mono text-xs tracking-widest uppercase">
                {t.loadingWorkspace}
              </p>
            </div>
          ) : systemError ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <h2 className="text-lg font-mono font-bold text-stone-900 uppercase tracking-wider mb-2">
                {t.systemOffline}
              </h2>
              <p className="text-stone-600 text-xs mb-6 leading-relaxed">{systemError}</p>
              <button
                onClick={() => currentNotebook && fetchArchiveData(user.uid, currentNotebook.id)}
                className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded font-mono text-xs hover:bg-stone-800 cursor-pointer"
              >
                <span>{t.reconnect}</span>
              </button>
            </div>
          ) : (
            <div key={currentNotebook?.id || "no-notebook"} className="animate-fadeIn h-full">
              {activeTab === "home" && (
                <HomeModule
                  entries={journal}
                  concepts={concepts}
                  insights={insights}
                  onNavigate={(tab) => {
                    setActiveTab(tab);
                    if (tab === "map") {
                      localStorage.setItem("atlas_onboarding_visited_map", "true");
                    }
                  }}
                  onStartFirstEntry={() => {
                    if (user) {
                      setActiveTab("journal");
                      setAutoOpenNewEntry(true);
                    } else if (onSignIn) {
                      onSignIn();
                    }
                  }}
                  onCreateDemoNotebook={user ? handleCreateDemoNotebook : undefined}
                  onDeleteDemoNotebook={user ? handleDeleteDemoNotebook : undefined}
                  isGuest={!user}
                  onSignIn={onSignIn}
                />
              )}

              {!user && activeTab !== "home" && activeTab !== "getting-started" ? (
                <GuestLocker 
                  tab={activeTab} 
                  onSignIn={onSignIn || (() => {})} 
                  isSigningIn={isSigningIn || false} 
                  signInError={signInError} 
                />
              ) : (
                <>
                  {activeTab !== "home" && activeTab !== "profile" && activeTab !== "admin" && activeTab !== "settings" && activeTab !== "getting-started" && activeTab !== "portfolio" && !currentNotebook && (
                    <div className="h-[60vh] flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto space-y-4">
                      <BookOpen className="w-12 h-12 text-stone-300 animate-pulse" />
                      <h3 className="text-xs font-mono font-bold text-stone-900 uppercase tracking-widest">
                        {locale === "en" ? "Select an Active Notebook" : "Selecione um Caderno Ativo"}
                      </h3>
                      <p className="text-stone-500 text-[11px] leading-relaxed">
                        {locale === "en"
                          ? "To record logs, investigate concepts, or view your research maps, you must first select or create an active notebook in the header dropdown or your profile."
                          : "Para fazer registros, investigar conceitos ou visualizar seus mapas, você precisa selecionar ou criar um caderno ativo no menu superior ou em seu perfil."}
                      </p>
                      <button
                        onClick={() => setActiveTab("home")}
                        className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white font-mono text-[10px] uppercase tracking-wider rounded font-bold transition-colors cursor-pointer"
                      >
                        {locale === "en" ? "Go to Home Page" : "Ir para a Página Inicial"}
                      </button>
                    </div>
                  )}

                  {activeTab === "journal" && currentNotebook && (
                    <JournalModule
                      entries={journal}
                      concepts={concepts}
                      onAddEntry={handleAddJournalEntry}
                      onUpdateEntry={handleUpdateJournalEntry}
                      onDeleteEntry={handleDeleteJournalEntry}
                      initialIsCreating={autoOpenNewEntry}
                    />
                  )}

                  {activeTab === "lab" && currentNotebook && (
                    <LabModule
                      concepts={concepts}
                      onAddConcept={handleAddConcept}
                      onUpdateConcept={handleUpdateConcept}
                      onDeleteConcept={handleDeleteConcept}
                      onExploreConcept={handleExploreConcept}
                    />
                  )}

                  {activeTab === "map" && currentNotebook && (
                    <MapModule concepts={concepts} onUpdateConcept={handleUpdateConcept} />
                  )}

                  {activeTab === "timeline" && currentNotebook && (
                    <TimelineModule entries={journal} concepts={concepts} />
                  )}

                  {activeTab === "insights" && currentNotebook && (
                    <InsightsModule
                      insights={insights}
                      onGenerateInsights={handleGenerateInsights}
                      onUpdateInsight={handleUpdateInsight}
                      onDeleteInsight={handleDeleteInsight}
                      hasData={journal.length > 0 || concepts.length > 0}
                    />
                  )}

                  {activeTab === "export" && currentNotebook && (
                    <ExportModule
                      journal={journal}
                      concepts={concepts}
                      insights={insights}
                      user={user}
                    />
                  )}

                  {activeTab === "portfolio" && currentNotebook && (
                    <PortfolioBuilder
                      journal={journal}
                      concepts={concepts}
                      user={user}
                      onBack={() => setActiveTab("home")}
                    />
                  )}

                  {activeTab === "admin" && (
                    <AdminDashboard
                      onBack={() => setActiveTab("home")}
                      currentUser={user}
                      adminRole={adminRole}
                    />
                  )}

                  {activeTab === "profile" && (
                    <ProfilePage
                      currentUser={user}
                      onBack={() => setActiveTab("home")}
                      lastModule={lastModule}
                    />
                  )}

                  {activeTab === "settings" && (
                    <SettingsPage
                      onBack={() => setActiveTab("home")}
                      onDeleteDemoContent={handleDeleteDemoContent}
                    />
                  )}

                  {activeTab === "getting-started" && (
                    <GettingStarted
                      journal={journal}
                      concepts={concepts}
                      insights={insights}
                      onBack={() => setActiveTab("home")}
                      onNavigate={(tab) => setActiveTab(tab)}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </main>
      )}

      <MyanCommunicationCenter
        currentUser={user}
        locale={locale}
        activeTab={activeTab}
        currentNotebookId={currentNotebook?.id || null}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white font-mono text-[11px] uppercase tracking-wider px-4 py-2.5 rounded shadow-lg border border-stone-800 flex items-center gap-2 animate-slideIn">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
