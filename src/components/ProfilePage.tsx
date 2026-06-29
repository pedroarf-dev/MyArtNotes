import React, { useState, useEffect } from "react";
import { User, Loader2, ArrowLeft, Check, AlertCircle, Plus, Trash2, Archive, Star, Edit, BookOpen, Globe, Activity, Calendar, Layers, ShieldCheck, Download, Trash, RefreshCw, MessageSquare, HelpCircle, Send, Upload, FileImage } from "lucide-react";
import { useTranslation } from "../lib/i18n";
import { getUserProfile, updateUserProfile, getJournalEntries, getConcepts, deleteUserAccountAndData, logAnalyticsEvent, getInsights, getPortfolios, getExports, addFeedback, getFeedbacksForUser } from "../lib/dbService";
import { UserProfile, ResearchNotebook, JournalEntry, Concept, BetaFeedback } from "../types";
import { useResearch } from "../context/ResearchContext";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

interface ProfilePageProps {
  currentUser: any;
  onBack: () => void;
  lastModule?: string | null;
}

export default function ProfilePage({ currentUser, onBack, lastModule }: ProfilePageProps) {
  const { locale, setLocale, t } = useTranslation();
  const { 
    notebooks, 
    currentNotebook, 
    switchNotebook, 
    createNotebook, 
    renameNotebook, 
    archiveNotebook, 
    deleteNotebook, 
    toggleFavoriteNotebook 
  } = useResearch();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Privacy tab & actions states
  const [activeSection, setActiveSection] = useState<"profile" | "privacy" | "feedback">("profile");
  const [exporting, setExporting] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteEmailInput, setDeleteEmailInput] = useState("");
  const [deleteConfirm1, setDeleteConfirm1] = useState(false);
  const [deleteConfirm2, setDeleteConfirm2] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Help & Feedback states
  const [feedbackCategory, setFeedbackCategory] = useState<"bug" | "suggestion" | "question" | "idea" | "other">("bug");
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackDescription, setFeedbackDescription] = useState("");
  const [feedbackScreenshot, setFeedbackScreenshot] = useState<string | null>(null);
  const [feedbackEmailConsent, setFeedbackEmailConsent] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackHistory, setFeedbackHistory] = useState<BetaFeedback[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [artisticArea, setArtisticArea] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [prefLang, setPrefLang] = useState<"en" | "pt">("pt");

  // Inclusive language states
  const [addressMode, setAddressMode] = useState<"masculine" | "feminine" | "neutral" | "custom" | "">("");
  const [customAddress, setCustomAddress] = useState("");
  const [preferredPronouns, setPreferredPronouns] = useState<"he" | "she" | "they" | "none" | "custom" | "">("");
  const [customPronouns, setCustomPronouns] = useState("");

  // Notebook statistics grouping state
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newLang, setNewLang] = useState<"en" | "pt">(locale === "en" ? "en" : "pt");
  const [wizardError, setWizardError] = useState("");

  // Rename modal state
  const [renamingNb, setRenamingNb] = useState<ResearchNotebook | null>(null);
  const [renameTitleState, setRenameTitleState] = useState("");
  const [renameSubtitleState, setRenameSubtitleState] = useState("");
  const [renameDescState, setRenameDescState] = useState("");

  // Delete confirmation state
  const [deletingNbId, setDeletingNbId] = useState<string | null>(null);

  // Load profile & statistics for counts
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setErrorMsg("");
      try {
        // Load profile
        const data = await getUserProfile(currentUser.uid);
        if (data) {
          setProfile(data);
          setName(data.name || "");
          setBio(data.bio || "");
          setArtisticArea(data.artisticArea || "");
          setWebsite(data.website || "");
          setInstagram(data.instagram || "");
          setPrefLang(data.preferredLanguage || (locale === "en" ? "en" : "pt"));
          setAddressMode(data.addressMode || "");
          setCustomAddress(data.customAddress || "");
          setPreferredPronouns(data.preferredPronouns || "");
          setCustomPronouns(data.customPronouns || "");
        } else {
          setName(currentUser.displayName || "");
          setPrefLang(locale === "en" ? "en" : "pt");
        }

        // Fetch counts from database safely across all notebooks
        setStatsLoading(true);
        const [userJournals, userConcepts] = await Promise.all([
          getJournalEntries(currentUser.uid).catch(() => []),
          getConcepts(currentUser.uid).catch(() => [])
        ]);
        setJournals(userJournals);
        setConcepts(userConcepts);
      } catch (err) {
        console.error("Failed to load profile details:", err);
        setErrorMsg(
          locale === "en"
            ? "Could not load profile from MyArtNotes cloud."
            : "Não foi possível carregar seu perfil da nuvem MyArtNotes."
        );
      } finally {
        setIsLoading(false);
        setStatsLoading(false);
      }
    }
    if (currentUser) {
      loadData();
    }
  }, [currentUser, locale]);

  // --- Help & Feedback Helper Functions ---
  const loadFeedbackHistory = async () => {
    if (!currentUser?.uid) return;
    setHistoryLoading(true);
    try {
      const history = await getFeedbacksForUser(currentUser.uid);
      setFeedbackHistory(history);
    } catch (err) {
      console.error("Error loading feedback history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "feedback" && currentUser?.uid) {
      loadFeedbackHistory();
    }
  }, [activeSection, currentUser]);

  const getBrowserAndOS = () => {
    const ua = navigator.userAgent;
    let browser = "Unknown Browser";
    let os = "Unknown OS";

    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("SamsungBrowser")) browser = "Samsung Browser";
    else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
    else if (ua.includes("Trident")) browser = "Internet Explorer";
    else if (ua.includes("Edge") || ua.includes("Edg")) browser = "Microsoft Edge";
    else if (ua.includes("Chrome")) browser = "Google Chrome";
    else if (ua.includes("Safari")) browser = "Apple Safari";

    if (ua.includes("Windows NT")) os = "Windows";
    else if (ua.includes("Mac OS X")) os = "macOS";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Linux")) os = "Linux";

    return { browser, os };
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setFeedbackError(locale === "en" ? "Only image files are allowed." : "Apenas arquivos de imagem são permitidos.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setFeedbackError(locale === "en" ? "Image size must be less than 2MB." : "O tamanho da imagem deve ser menor que 2MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFeedbackScreenshot(reader.result as string);
        setFeedbackError("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setFeedbackError(locale === "en" ? "Only image files are allowed." : "Apenas arquivos de imagem são permitidos.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setFeedbackError(locale === "en" ? "Image size must be less than 2MB." : "O tamanho da imagem deve ser menor que 2MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFeedbackScreenshot(reader.result as string);
        setFeedbackError("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTitle.trim()) {
      setFeedbackError(locale === "en" ? "Title is required." : "O título é obrigatório.");
      return;
    }
    if (!feedbackDescription.trim()) {
      setFeedbackError(locale === "en" ? "Description is required." : "A descrição é obrigatória.");
      return;
    }

    setIsSubmittingFeedback(true);
    setFeedbackError("");
    setFeedbackSuccess(false);

    try {
      const { browser, os } = getBrowserAndOS();
      
      await addFeedback({
        userId: currentUser.uid,
        userEmail: currentUser.email || "",
        category: feedbackCategory,
        title: feedbackTitle,
        description: feedbackDescription,
        attachment: feedbackScreenshot || undefined,
        emailReplyConsent: feedbackEmailConsent,
        browser,
        os,
        language: locale === "en" ? "en" : "pt",
        appVersion: "1.0.0-beta",
        notebookId: currentNotebook?.id || null,
        module: lastModule || null,
      });

      setFeedbackSuccess(true);
      setFeedbackTitle("");
      setFeedbackDescription("");
      setFeedbackScreenshot(null);
      setFeedbackEmailConsent(false);
      
      // Reload history
      loadFeedbackHistory();
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setFeedbackError(locale === "en" ? "Failed to submit feedback. Please try again." : "Falha ao enviar feedback. Por favor, tente novamente.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg("");
    setSaveSuccess(false);

    try {
      const updatedData: Partial<UserProfile> = {
        name: name.trim(),
        bio: bio.trim(),
        artisticArea: artisticArea.trim(),
        website: website.trim(),
        instagram: instagram.trim(),
        preferredLanguage: prefLang,
        addressMode: addressMode || undefined,
        customAddress: customAddress || undefined,
        preferredPronouns: preferredPronouns || undefined,
        customPronouns: customPronouns || undefined,
      };

      await updateUserProfile(currentUser.uid, updatedData);
      
      if (prefLang !== locale) {
        setLocale(prefLang);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setErrorMsg(
        locale === "en"
          ? "Failed to save profile. Please check your connection."
          : "Falha ao salvar o perfil. Verifique sua conexão."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleConsent = async (
    consentKey: "productUpdatesConsent" | "creativeEcosystemConsent" | "partnersConsent" | "anonymousResearchConsent",
    optIn: boolean
  ) => {
    setIsSaving(true);
    setErrorMsg("");
    try {
      const now = new Date().toISOString();
      const version = "v1.0-2026";
      
      const updatedFields: any = {
        [consentKey]: optIn,
        [`${consentKey}At`]: now,
      };

      if (consentKey === "anonymousResearchConsent") {
        updatedFields.analyticsConsentAccepted = optIn;
        updatedFields.consentAcceptedAt = now;
      }

      const newHistoryItem = {
        privacyConsentAccepted: true,
        analyticsConsentAccepted: consentKey === "anonymousResearchConsent" ? optIn : (profile?.analyticsConsentAccepted || false),
        productUpdatesConsent: consentKey === "productUpdatesConsent" ? optIn : (profile?.productUpdatesConsent || false),
        creativeEcosystemConsent: consentKey === "creativeEcosystemConsent" ? optIn : (profile?.creativeEcosystemConsent || false),
        partnersConsent: consentKey === "partnersConsent" ? optIn : (profile?.partnersConsent || false),
        anonymousResearchConsent: consentKey === "anonymousResearchConsent" ? optIn : (profile?.anonymousResearchConsent || false),
        timestamp: now,
        version: version
      };

      const updatedHistory = profile?.consentHistory 
        ? [...profile.consentHistory, newHistoryItem]
        : [newHistoryItem];

      updatedFields.consentHistory = updatedHistory;

      await updateUserProfile(currentUser.uid, updatedFields);
      
      setProfile(prev => prev ? { ...prev, ...updatedFields } : null);

      await logAnalyticsEvent(currentUser.uid, "privacy_consent_updated", {
        privacyConsentAccepted: true,
        consentKey,
        optIn,
        version,
        email: currentUser.email
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(`Failed to update consent ${consentKey}:`, err);
      setErrorMsg(
        locale === "en"
          ? "Failed to update permissions. Please try again."
          : "Falha ao atualizar permissões. Tente novamente."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAnalyticsConsent = async (optIn: boolean) => {
    return handleToggleConsent("anonymousResearchConsent", optIn);
  };

  const handleExportData = async () => {
    setExporting(true);
    setErrorMsg("");
    try {
      console.log("[PRIVACY] Initiating full personal data aggregation...");
      
      const [allJournals, allConcepts, allInsights] = await Promise.all([
        getJournalEntries(currentUser.uid).catch(() => []),
        getConcepts(currentUser.uid).catch(() => []),
        getInsights(currentUser.uid).catch(() => [])
      ]);

      const allPortfoliosList: any[] = [];
      const allExportsList: any[] = [];
      
      for (const nb of notebooks) {
        try {
          const ports = await getPortfolios(currentUser.uid, nb.id);
          allPortfoliosList.push(...ports);
        } catch (err) {
          console.warn(`[PRIVACY] Error fetching portfolios for notebook: ${nb.id}`, err);
        }
        try {
          const exps = await getExports(currentUser.uid, nb.id);
          allExportsList.push(...exps);
        } catch (err) {
          console.warn(`[PRIVACY] Error fetching exports for notebook: ${nb.id}`, err);
        }
      }

      const payload = {
        exportVersion: "v1.0",
        exportTimestamp: new Date().toISOString(),
        profile: {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || "",
          name: profile?.name || "",
          bio: profile?.bio || "",
          artisticArea: profile?.artisticArea || "",
          website: profile?.website || "",
          instagram: profile?.instagram || "",
          preferredLanguage: profile?.preferredLanguage || locale,
          privacyConsentAccepted: profile?.privacyConsentAccepted || true,
          analyticsConsentAccepted: profile?.analyticsConsentAccepted || false,
          consentAcceptedAt: profile?.consentAcceptedAt || ""
        },
        researchNotebooks: notebooks,
        journalEntries: allJournals,
        concepts: allConcepts,
        insights: allInsights,
        portfolios: allPortfoliosList,
        exports: allExportsList
      };

      // Create download trigger
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(payload, null, 2)
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `myartnotes-export-${currentUser.uid}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      // Log export request event
      await logAnalyticsEvent(currentUser.uid, "privacy_export_requested", {
        timestamp: new Date().toISOString(),
        email: currentUser.email
      });

      alert(
        locale === "en"
          ? "Your structured research data has been exported successfully."
          : "Seus dados de pesquisa estruturados foram exportados com sucesso."
      );
    } catch (err) {
      console.error("[PRIVACY] Error during data export:", err);
      setErrorMsg(
        locale === "en"
          ? "Failed to compile your research export. Please try again."
          : "Falha ao compilar a exportação dos seus dados. Tente novamente."
      );
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteEmailInput.toLowerCase().trim() !== currentUser.email.toLowerCase().trim()) {
      alert(
        locale === "en"
          ? "The email address typed does not match your active account."
          : "O endereço de e-mail digitado não corresponde à sua conta ativa."
      );
      return;
    }

    setIsDeleting(true);
    setErrorMsg("");

    try {
      console.log(`[PRIVACY] User requested total purge of UID: ${currentUser.uid}`);
      
      // Log event just before purging the analytics collection
      await logAnalyticsEvent(currentUser.uid, "account_deletion_requested", {
        email: currentUser.email,
        timestamp: new Date().toISOString()
      }).catch(() => {});

      // Call GDPR erasure service
      await deleteUserAccountAndData(currentUser.uid);

      console.log("[PRIVACY] Firestore data erased. Executing auth sign out...");
      
      // Sign out
      await signOut(auth);
      
      // Full page reload to clean memory / reset routing
      window.location.reload();
    } catch (err: any) {
      console.error("[PRIVACY] Error during account deletion:", err);
      setErrorMsg(
        locale === "en"
          ? "Failed to completely delete account resources. Please contact support or try again."
          : "Falha ao deletar os recursos da conta por completo. Entre em contato ou tente novamente."
      );
      setIsDeleting(false);
    }
  };

  // Wizard handlers
  const handleOpenWizard = () => {
    setNewTitle("");
    setNewSubtitle("");
    setNewDesc("");
    setNewLang(locale === "en" ? "en" : "pt");
    setWizardStep(1);
    setWizardError("");
    setIsWizardOpen(true);
  };

  const handleNextStep = () => {
    if (wizardStep === 1 && !newTitle.trim()) {
      setWizardError(locale === "en" ? "Title is required." : "O título é obrigatório.");
      return;
    }
    setWizardError("");
    setWizardStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setWizardError("");
    setWizardStep(prev => Math.max(1, prev - 1));
  };

  const handleCreateNotebook = async () => {
    if (!newTitle.trim()) {
      setWizardError(locale === "en" ? "Title is required." : "O título é obrigatório.");
      return;
    }
    try {
      setIsSaving(true);
      await createNotebook(newTitle.trim(), newSubtitle.trim(), newDesc.trim(), newLang);
      setIsWizardOpen(false);
      onBack(); // Switch view to Home where the newly created notebook starts active!
    } catch (err) {
      console.error("Failed to create notebook:", err);
      setWizardError(locale === "en" ? "Failed to create notebook. Please check your connection." : "Falha ao criar caderno. Verifique sua conexão.");
    } finally {
      setIsSaving(false);
    }
  };

  // Rename handlers
  const handleOpenRename = (nb: ResearchNotebook) => {
    setRenamingNb(nb);
    setRenameTitleState(nb.title);
    setRenameSubtitleState(nb.subtitle || "");
    setRenameDescState(nb.description || "");
  };

  const handleSaveRename = async () => {
    if (!renamingNb || !renameTitleState.trim()) return;
    try {
      await renameNotebook(renamingNb.id, renameTitleState.trim(), renameSubtitleState.trim() || undefined, renameDescState.trim() || undefined);
      setRenamingNb(null);
    } catch (err) {
      alert(locale === "en" ? "Failed to rename notebook." : "Falha ao renomear caderno.");
    }
  };

  // Delete with confirmation handler
  const handleDeleteConfirm = async () => {
    if (!deletingNbId) return;
    try {
      await deleteNotebook(deletingNbId);
      setDeletingNbId(null);
    } catch (err) {
      alert(locale === "en" ? "Failed to delete notebook." : "Falha ao excluir o caderno.");
    }
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return "";
    const date = new Date(isoStr);
    return date.toLocaleDateString(locale === "en" ? "en-US" : "pt-BR");
  };

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-8 animate-fadeIn">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-[#E6E2D5] pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-950 transition-colors font-mono text-xs uppercase cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{locale === "en" ? "Back" : "Voltar"}</span>
        </button>
        <div className="text-right">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-850 flex items-center justify-end gap-1.5">
            <User className="w-4 h-4 text-stone-850" />
            <span>{locale === "en" ? "Artist Profile" : "Perfil do Artista"}</span>
          </h2>
        </div>
      </div>

      {/* Closed Beta Header Reminder */}
      <div className="bg-[#FCFAF7] border border-[#E6E2D5] rounded-sm p-4 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="font-serif font-semibold text-stone-900 block">
            {locale === "en" ? "Closed Beta Program" : "Programa de Beta Fechado"}
          </span>
          <p className="text-stone-500 text-[11px] font-sans mt-0.5">
            {locale === "en"
              ? "Thank you for participating in the Closed Beta. Every suggestion matters."
              : "Obrigado por participar do Beta Fechado. Cada sugestão importa."}
          </p>
        </div>
        <div className="text-[10px] text-stone-400 font-serif italic">
          MyArtNotes Beta
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-[#E6E2D5] pb-px gap-6 mt-4">
        <button
          type="button"
          onClick={() => {
            setActiveSection("profile");
            setErrorMsg("");
          }}
          className={`pb-2.5 text-xs font-mono uppercase tracking-widest font-bold border-b-2 transition-all cursor-pointer ${
            activeSection === "profile" ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-750"
          }`}
        >
          {locale === "en" ? "Artist Workspace" : "Espaço do Artista"}
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveSection("privacy");
            setErrorMsg("");
          }}
          className={`pb-2.5 text-xs font-mono uppercase tracking-widest font-bold border-b-2 transition-all cursor-pointer ${
            activeSection === "privacy" ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-750"
          }`}
        >
          {locale === "en" ? "Privacy & Data" : "Privacidade e Dados"}
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveSection("feedback");
            setErrorMsg("");
          }}
          className={`pb-2.5 text-xs font-mono uppercase tracking-widest font-bold border-b-2 transition-all cursor-pointer ${
            activeSection === "feedback" ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-750"
          }`}
        >
          {t.feedbackSectionTitle}
        </button>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded flex items-center gap-2.5 text-xs text-red-700 font-sans">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-[#FAF8F3] border border-[#DDD9CE] rounded flex items-center gap-2.5 text-xs text-stone-800 font-mono">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{locale === "en" ? "Profile updated successfully." : "Perfil atualizado com sucesso."}</span>
        </div>
      )}

      {activeSection === "profile" ? (
        <>
          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded border border-[#E6E2D5] p-6 md:p-8 space-y-6 shadow-sm">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-900 border-b border-stone-100 pb-2">
          {locale === "en" ? "Artist Information" : "Informações do Artista"}
        </h3>
        
        <div className="space-y-4">
          {/* Email read-only */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center">
            <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">
              Email
            </label>
            <div className="md:col-span-2">
              <input
                type="text"
                value={currentUser.email}
                disabled
                className="w-full bg-[#FAF8F3]/60 border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center">
            <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">
              {locale === "en" ? "Artist Name" : "Nome do Artista"}
            </label>
            <div className="md:col-span-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={locale === "en" ? "E.g., Pedro Alvares" : "Ex: Pedro Álvares"}
                className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-400"
              />
            </div>
          </div>

          {/* Artistic Area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center">
            <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">
              {locale === "en" ? "Artistic Area" : "Área Artística"}
            </label>
            <div className="md:col-span-2">
              <input
                type="text"
                value={artisticArea}
                onChange={(e) => setArtisticArea(e.target.value)}
                placeholder={locale === "en" ? "E.g., Sculpture, Printmaking, Painting..." : "Ex: Escultura, Gravura, Pintura Expansiva..."}
                className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500"
              />
            </div>
          </div>

          {/* Biography */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-start">
            <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold mt-2">
              {locale === "en" ? "Short Bio" : "Biografia Curta"}
            </label>
            <div className="md:col-span-2">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={locale === "en" ? "Brief description of your research trajectory, concerns, and materials..." : "Breve descrição sobre sua trajetória, preocupações e materiais de pesquisa..."}
                rows={4}
                className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Website */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center">
            <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">
              {locale === "en" ? "Website" : "Website / Portfólio"}
            </label>
            <div className="md:col-span-2">
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://myportfolio.com"
                className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500"
              />
            </div>
          </div>

          {/* Instagram */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center">
            <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">
              Instagram
            </label>
            <div className="md:col-span-2">
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@my.art.practice"
                className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500"
              />
            </div>
          </div>

          {/* Preferred Language */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center">
            <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">
              {locale === "en" ? "Preferred Language" : "Idioma Preferencial"}
            </label>
            <div className="md:col-span-2 flex gap-2">
              <button
                type="button"
                onClick={() => setPrefLang("pt")}
                className={`flex-1 py-2 text-center text-xs font-mono font-bold border rounded transition-colors cursor-pointer ${
                  prefLang === "pt"
                    ? "bg-stone-900 border-stone-900 text-white"
                    : "bg-white border-[#DDD9CE] text-stone-600 hover:text-stone-900"
                }`}
              >
                Português (PT)
              </button>
              <button
                type="button"
                onClick={() => setPrefLang("en")}
                className={`flex-1 py-2 text-center text-xs font-mono font-bold border rounded transition-colors cursor-pointer ${
                  prefLang === "en"
                    ? "bg-stone-900 border-stone-900 text-white"
                    : "bg-white border-[#DDD9CE] text-stone-600 hover:text-stone-900"
                }`}
              >
                English (EN)
              </button>
            </div>
          </div>

          {/* Inclusive Language Form address & pronouns */}
          <div className="border-t border-stone-100 pt-6 mt-6 space-y-6">
            {/* Address Mode */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-start">
              <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold mt-2 col-span-1">
                {locale === "en" ? "How would you like MyArtNotes to address you?" : "Como gostaria que MyArtNotes se dirigisse a você?"}
              </label>
              <div className="md:col-span-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "masculine", en: "Artist (Masculine)", pt: "Artista (Masculino)" },
                    { id: "feminine", en: "Artist (Feminine)", pt: "Artista (Feminino)" },
                    { id: "neutral", en: "Artist (Neutral)", pt: "Artista (Neutro)" },
                    { id: "custom", en: "Custom", pt: "Personalizado" }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAddressMode(opt.id as any)}
                      className={`py-2 px-3 text-left text-xs font-sans border rounded transition-colors cursor-pointer ${
                        addressMode === opt.id
                          ? "bg-stone-900 border-stone-900 text-white font-semibold"
                          : "bg-white border-[#DDD9CE] text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      {locale === "en" ? opt.en : opt.pt}
                    </button>
                  ))}
                </div>
                {addressMode === "custom" && (
                  <input
                    type="text"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    placeholder={locale === "en" ? "Enter custom form of address (e.g. Creator)" : "Insira o tratamento personalizado (ex: Criador)"}
                    className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500"
                  />
                )}
              </div>
            </div>

            {/* Pronouns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-start">
              <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold mt-2 col-span-1">
                {locale === "en" ? "Preferred Pronouns" : "Pronomes Preferenciais"}
              </label>
              <div className="md:col-span-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "he", en: "he / him", pt: "ele / dele" },
                    { id: "she", en: "she / her", pt: "ela / dela" },
                    { id: "they", en: "they / them", pt: "elu / delu" },
                    { id: "none", en: "prefer not to say", pt: "prefiro não dizer" },
                    { id: "custom", en: "custom", pt: "personalizado" }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPreferredPronouns(opt.id as any)}
                      className={`py-2 px-3 text-left text-xs font-sans border rounded transition-colors cursor-pointer ${
                        preferredPronouns === opt.id
                          ? "bg-stone-900 border-stone-900 text-white font-semibold"
                          : "bg-white border-[#DDD9CE] text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      {locale === "en" ? opt.en : opt.pt}
                    </button>
                  ))}
                </div>
                {preferredPronouns === "custom" && (
                  <input
                    type="text"
                    value={customPronouns}
                    onChange={(e) => setCustomPronouns(e.target.value)}
                    placeholder={locale === "en" ? "Enter preferred pronouns" : "Insira os pronomes preferidos"}
                    className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-4 border-t border-[#E6E2D5] flex justify-end gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 border border-[#DDD9CE] bg-white text-stone-700 hover:bg-[#FAF8F3] font-mono text-xs uppercase tracking-wider rounded cursor-pointer transition-colors"
          >
            {locale === "en" ? "Cancel" : "Cancelar"}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-850 text-white font-mono text-xs uppercase tracking-wider font-bold rounded cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{locale === "en" ? "Saving..." : "Salvando..."}</span>
              </>
            ) : (
              <span>{locale === "en" ? "Save Profile" : "Salvar Perfil"}</span>
            )}
          </button>
        </div>
      </form>

      {/* Notebooks List Section */}
      <div className="bg-white rounded border border-[#E6E2D5] p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-900">
              {t.notebooksSectionTitle}
            </h3>
            <p className="text-[11px] text-stone-500 font-sans mt-0.5">
              {locale === "en" ? "Each notebook behaves as an independent workspace." : "Cada caderno funciona de maneira independente."}
            </p>
          </div>
          <button
            onClick={handleOpenWizard}
            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-850 text-white font-mono text-[11px] uppercase tracking-wider rounded cursor-pointer transition-colors flex items-center gap-1 font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.newNotebookBtn}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...notebooks]
            .sort((a, b) => {
              if (a.id === currentNotebook?.id) return -1;
              if (b.id === currentNotebook?.id) return 1;
              if (a.status === "active" && b.status === "archived") return -1;
              if (a.status === "archived" && b.status === "active") return 1;
              if (a.favorite && !b.favorite) return -1;
              if (!a.favorite && b.favorite) return 1;
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            })
            .map((nb) => {
            const nbJournals = journals.filter(j => j.researchNotebookId === nb.id);
            const nbConcepts = concepts.filter(c => c.researchNotebookId === nb.id);
            
            // Calculate last activity
            const lastActiveDates = [
              nb.updatedAt,
              ...nbJournals.map(j => j.createdAt),
              ...nbConcepts.map(c => c.createdAt)
            ].filter(Boolean);
            const lastActivityIso = lastActiveDates.length > 0 ? lastActiveDates.sort().reverse()[0] : nb.updatedAt;

            const isActive = currentNotebook?.id === nb.id;

            return (
              <div 
                key={nb.id} 
                className={`relative flex flex-col justify-between p-5 rounded border bg-stone-50/50 transition-all ${
                  isActive 
                    ? "border-stone-850 ring-1 ring-stone-900 bg-white" 
                    : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                }`}
              >
                {/* Active Badge */}
                {isActive && (
                  <span className="absolute top-4 left-4 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-900 text-white font-mono text-[9px] uppercase tracking-wider font-semibold">
                    <BookOpen className="w-2.5 h-2.5" />
                    <span>{locale === "en" ? "Active" : "Ativo"}</span>
                  </span>
                )}

                {/* Star Favorite Toggler */}
                <button
                  onClick={() => toggleFavoriteNotebook(nb.id)}
                  className="absolute top-4 right-4 text-stone-400 hover:text-amber-500 transition-colors p-1"
                >
                  <Star 
                    className={`w-4 h-4 ${nb.favorite ? "fill-amber-400 text-amber-500" : ""}`} 
                  />
                </button>

                {/* Notebook Info */}
                <div className={`space-y-2 ${isActive ? "mt-5" : ""}`}>
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900 tracking-tight leading-snug">
                      {nb.title}
                    </h4>
                    {nb.subtitle && (
                      <p className="text-xs text-stone-500 font-sans tracking-wide">
                        {nb.subtitle}
                      </p>
                    )}
                  </div>
                  {nb.description && (
                    <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                      {nb.description}
                    </p>
                  )}
                </div>

                {/* Meta details */}
                <div className="mt-4 pt-4 border-t border-stone-100 space-y-2">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-stone-500">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-stone-400" />
                      <span>{nbJournals.length} Logs</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-stone-400" />
                      <span>{nbConcepts.length} Concepts</span>
                    </span>
                  </div>

                  <div className="space-y-0.5 text-[9px] font-mono text-stone-400 uppercase tracking-wider">
                    <div className="flex justify-between">
                      <span>{t.notebookCreatedDate}:</span>
                      <span className="text-stone-500">{formatDate(nb.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t.notebookLastActivity}:</span>
                      <span className="text-stone-500">{formatDate(lastActivityIso)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-0.5">
                      <span>Status / Language:</span>
                      <span className="flex items-center gap-1 font-bold text-stone-600">
                        <span>{nb.status === "archived" ? t.archivedNotebookLabel : t.activeNotebookLabel}</span>
                        <span>•</span>
                        <span className="uppercase">{nb.language}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notebook Actions */}
                <div className="mt-4 flex gap-1.5 justify-end">
                  {!isActive && nb.status === "active" && (
                    <button
                      onClick={() => switchNotebook(nb.id)}
                      className="px-2.5 py-1 text-[10px] font-mono border border-stone-300 rounded hover:bg-stone-100 text-stone-700 cursor-pointer transition-colors"
                    >
                      {locale === "en" ? "Switch" : "Ativar"}
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenRename(nb)}
                    className="p-1 text-stone-500 hover:text-stone-900 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                    title={locale === "en" ? "Rename" : "Renomear"}
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => archiveNotebook(nb.id, nb.status !== "archived")}
                    className="p-1 text-stone-500 hover:text-stone-950 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                    title={nb.status === "archived" ? t.notebookUnarchiveBtn : t.notebookArchiveBtn}
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingNbId(nb.id)}
                    className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50 transition-colors cursor-pointer"
                    title={t.notebookDeleteBtn}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  ) : activeSection === "privacy" ? (
    <div className="space-y-6 animate-fadeIn">
      {/* Privacy Summary Card */}
      <div className="bg-white rounded border border-[#E6E2D5] p-6 md:p-8 space-y-4 shadow-sm">
        <div className="flex items-start gap-4">
          <ShieldCheck className="w-5 h-5 text-stone-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-900">
              {locale === "en" ? "Privacy Summary" : "Resumo de Privacidade"}
            </h3>
            <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
              {locale === "en"
                ? "MyArtNotes stores your basic authentication details (email, name, photo) and the notes/concepts you actively create. This information is processed strictly to provide your personal notebook experience and is never shared, rented, or sold to third parties."
                : "O MyArtNotes armazena seus dados básicos de autenticação (e-mail, nome, foto) e as notas/conceitos que você cria ativamente. Essas informações são processadas estritamente para fornecer a experiência do seu caderno pessoal e nunca são compartilhadas, alugadas ou vendidas a terceiros."}
            </p>
            <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
              {locale === "en"
                ? "As an artist, you hold the permanent right to export all your research data in structured JSON format or permanently delete your account and all associated resources at any time."
                : "Como artista, você possui o direito permanente de exportar todos os seus dados de pesquisa em formato JSON estruturado ou excluir permanentemente sua conta e todos os recursos associados a qualquer momento."}
            </p>
          </div>
        </div>
      </div>

      {/* Personal Data Overview Card */}
      <div className="bg-white rounded border border-[#E6E2D5] p-6 md:p-8 space-y-6 shadow-sm">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-900 border-b border-stone-100 pb-2">
            {locale === "en" ? "Personal Data Overview" : "Visão Geral de Dados Pessoais"}
          </h3>
          <p className="text-[11px] text-stone-500 mt-1">
            {locale === "en" 
              ? "At MyArtNotes, you own your artistic inquiries and materials. Here is a summary of the personal and research data processed in your safe, private workspace:"
              : "No MyArtNotes, você possui suas preocupações e materiais artísticos. Aqui está um resumo dos dados pessoais e de pesquisa tratados em seu espaço de trabalho privado:"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Profile Details overview */}
          <div className="bg-[#FAF8F3] border border-[#E6E2D5] rounded p-4 space-y-2">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-bold block">
              {locale === "en" ? "Identity & Auth" : "Identidade e Autenticação"}
            </span>
            <div className="space-y-1 text-xs text-stone-700">
              <div className="flex justify-between gap-4">
                <span className="text-stone-400 font-mono text-[10px]">Email:</span>
                <span className="font-semibold truncate max-w-[180px]">{currentUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400 font-mono text-[10px]">{locale === "en" ? "Name:" : "Nome:"}</span>
                <span className="font-semibold">{profile?.name || currentUser.displayName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400 font-mono text-[10px]">{locale === "en" ? "Language:" : "Idioma:"}</span>
                <span className="font-semibold uppercase font-mono">{profile?.preferredLanguage || locale}</span>
              </div>
            </div>
          </div>

          {/* Research Statistics */}
          <div className="bg-[#FAF8F3] border border-[#E6E2D5] rounded p-4 space-y-2">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-bold block">
              {locale === "en" ? "Research Footprint" : "Pegada de Pesquisa"}
            </span>
            <div className="space-y-1 text-xs text-stone-700">
              <div className="flex justify-between">
                <span className="text-stone-400 font-mono text-[10px]">{locale === "en" ? "Notebooks:" : "Cadernos:"}</span>
                <span className="font-semibold font-mono">{notebooks.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400 font-mono text-[10px]">{locale === "en" ? "Logs & Journals:" : "Diários e Notas:"}</span>
                <span className="font-semibold font-mono">{journals.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400 font-mono text-[10px]">{locale === "en" ? "Seeded Concepts:" : "Conceitos Semeados:"}</span>
                <span className="font-semibold font-mono">{concepts.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Consents & Optional Permissions Card */}
      <div className="bg-white rounded border border-[#E6E2D5] p-6 md:p-8 space-y-6 shadow-sm">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-900 border-b border-stone-100 pb-2">
            {locale === "en" ? "Granted Consents" : "Consentimentos Concedidos"}
          </h3>
          <p className="text-[11px] text-stone-500 mt-1">
            {locale === "en"
              ? "Manage and update the data processing permissions you have granted to MyArtNotes. Changes are logged securely in your consent history."
              : "Gerencie e atualize as permissões de processamento de dados que você concedeu ao MyArtNotes. As alterações são registradas com segurança em seu histórico de consentimento."}
          </p>
        </div>

        <div className="space-y-4">
          {/* Mandatory Consent (Read-only status) */}
          <div className="flex items-start gap-3.5 p-3.5 bg-[#FAF8F3] border border-[#E6E2D5] rounded">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-xs font-mono font-bold text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
                <span>{locale === "en" ? "Mandatory Data Processing" : "Tratamento de Dados Obrigatório"}</span>
                <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
                  {locale === "en" ? "Accepted" : "Aceito"}
                </span>
              </span>
              <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                {locale === "en"
                  ? "Allows MyArtNotes to store and index your personal identity (email) and active workspace research data (logs, concepts) to provide the service."
                  : "Permite ao MyArtNotes armazenar e organizar sua identidade (e-mail) e dados de cadernos ativos (diários, conceitos) para fornecer o serviço."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Communication Preferences Card */}
      <div className="bg-white rounded border border-[#E6E2D5] p-6 md:p-8 space-y-6 shadow-sm">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-900 border-b border-stone-100 pb-2">
            {locale === "en" ? "Communication Preferences" : "Preferências de Comunicação"}
          </h3>
          <p className="text-[11px] text-stone-500 mt-1">
            {locale === "en"
              ? "Configure how we communicate with you and what optional research permissions you grant. Every choice is optional and independently tracked with secure timestamps."
              : "Configure como nos comunicamos com você e quais permissões opcionais de pesquisa você concede. Cada escolha é opcional e rastreada de forma independente com carimbos de data/hora seguros."}
          </p>
        </div>

        <div className="space-y-4">
          {/* 1. Product Updates */}
          <label className="flex items-start gap-3.5 p-3.5 bg-white border border-[#E6E2D5] hover:border-stone-400 rounded cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={profile?.productUpdatesConsent || false}
              onChange={(e) => handleToggleConsent("productUpdatesConsent", e.target.checked)}
              disabled={isSaving}
              className="mt-1 accent-stone-900 rounded cursor-pointer"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-mono font-bold text-stone-950 uppercase tracking-wide flex items-center gap-1.5">
                <span>{locale === "en" ? "Product Updates" : "Atualizações do Produto"}</span>
                <span className="text-[8px] bg-[#EFECE6] text-stone-600 px-1.5 py-0.5 rounded uppercase tracking-widest font-mono font-bold">
                  {locale === "en" ? "Optional" : "Opcional"}
                </span>
              </span>
              <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                {locale === "en"
                  ? "Receive emails about MyArtNotes improvements, new features, beta invitations and release notes."
                  : "Receber e-mails sobre melhorias, novas funcionalidades, convites de beta e notas de lançamento do MyArtNotes."}
              </p>
              {profile?.productUpdatesConsentAt && (
                <span className="block text-[9px] font-mono text-stone-400 mt-1">
                  {locale === "en" ? "Granted at: " : "Concedido em: "}
                  {new Date(profile.productUpdatesConsentAt).toLocaleString()}
                </span>
              )}
            </div>
          </label>

          {/* 2. Creative Ecosystem */}
          <label className="flex items-start gap-3.5 p-3.5 bg-white border border-[#E6E2D5] hover:border-stone-400 rounded cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={profile?.creativeEcosystemConsent || false}
              onChange={(e) => handleToggleConsent("creativeEcosystemConsent", e.target.checked)}
              disabled={isSaving}
              className="mt-1 accent-stone-900 rounded cursor-pointer"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-mono font-bold text-stone-955 uppercase tracking-wide flex items-center gap-1.5">
                <span>{locale === "en" ? "Creative Ecosystem" : "Ecossistema Criativo"}</span>
                <span className="text-[8px] bg-[#EFECE6] text-stone-600 px-1.5 py-0.5 rounded uppercase tracking-widest font-mono font-bold">
                  {locale === "en" ? "Optional" : "Opcional"}
                </span>
              </span>
              <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                {locale === "en"
                  ? "Receive information about other products created by the same company (for example Creative Care, Atelier Digital, Creative Challenge and future creative tools)."
                  : "Receber informações sobre outros produtos criados pela mesma empresa (por exemplo, Creative Care, Atelier Digital, Creative Challenge e futuras ferramentas criativas)."}
              </p>
              {profile?.creativeEcosystemConsentAt && (
                <span className="block text-[9px] font-mono text-stone-400 mt-1">
                  {locale === "en" ? "Granted at: " : "Concedido em: "}
                  {new Date(profile.creativeEcosystemConsentAt).toLocaleString()}
                </span>
              )}
            </div>
          </label>

          {/* 3. Partners */}
          <label className="flex items-start gap-3.5 p-3.5 bg-white border border-[#E6E2D5] hover:border-stone-400 rounded cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={profile?.partnersConsent || false}
              onChange={(e) => handleToggleConsent("partnersConsent", e.target.checked)}
              disabled={isSaving}
              className="mt-1 accent-stone-900 rounded cursor-pointer"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-mono font-bold text-stone-955 uppercase tracking-wide flex items-center gap-1.5">
                <span>{locale === "en" ? "Partners" : "Parceiros"}</span>
                <span className="text-[8px] bg-[#EFECE6] text-stone-600 px-1.5 py-0.5 rounded uppercase tracking-widest font-mono font-bold">
                  {locale === "en" ? "Optional" : "Opcional"}
                </span>
              </span>
              <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                {locale === "en"
                  ? "Receive occasional information about carefully selected partners relevant to artistic practice, including materials, exhibitions, grants, courses and creative opportunities."
                  : "Receber informações ocasionais sobre parceiros cuidadosamente selecionados e relevantes para a prática artística, incluindo materiais, exposições, bolsas, cursos e oportunidades criativas."}
              </p>
              {profile?.partnersConsentAt && (
                <span className="block text-[9px] font-mono text-stone-400 mt-1">
                  {locale === "en" ? "Granted at: " : "Concedido em: "}
                  {new Date(profile.partnersConsentAt).toLocaleString()}
                </span>
              )}
            </div>
          </label>

          {/* 4. Anonymous Research */}
          <label className="flex items-start gap-3.5 p-3.5 bg-white border border-[#E6E2D5] hover:border-stone-400 rounded cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={profile?.anonymousResearchConsent || profile?.analyticsConsentAccepted || false}
              onChange={(e) => handleToggleConsent("anonymousResearchConsent", e.target.checked)}
              disabled={isSaving}
              className="mt-1 accent-stone-900 rounded cursor-pointer"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-mono font-bold text-stone-955 uppercase tracking-wide flex items-center gap-1.5">
                <span>{locale === "en" ? "Anonymous Research" : "Pesquisa Anônima"}</span>
                <span className="text-[8px] bg-[#EFECE6] text-stone-600 px-1.5 py-0.5 rounded uppercase tracking-widest font-mono font-bold">
                  {locale === "en" ? "Optional" : "Opcional"}
                </span>
              </span>
              <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                {locale === "en"
                  ? "Allow anonymous usage data (telemetry, layout flows) to help us improve MyArtNotes' performance, layouts, and AI capabilities."
                  : "Permitir dados de uso anônimos (telemetria, fluxos de layout) para nos ajudar a melhorar o desempenho, layouts e recursos de IA do MyArtNotes."}
              </p>
              {(profile?.anonymousResearchConsentAt || profile?.consentAcceptedAt) && (
                <span className="block text-[9px] font-mono text-stone-400 mt-1">
                  {locale === "en" ? "Granted at: " : "Concedido em: "}
                  {new Date(profile.anonymousResearchConsentAt || profile.consentAcceptedAt || "").toLocaleString()}
                </span>
              )}
            </div>
          </label>
        </div>

        {/* Editorial Explanation */}
        <div className="pt-4 border-t border-stone-100 text-[10px] text-stone-500 italic leading-relaxed font-sans text-center">
          {locale === "en"
            ? "We only communicate when the content is genuinely relevant to your artistic practice. Your information is never sold to third parties."
            : "Apenas nos comunicamos quando o conteúdo é genuinamente relevante para a sua prática artística. Suas informações nunca são vendidas a terceiros."}
        </div>
      </div>

      {/* Consent History Section */}
      <div className="bg-white rounded border border-[#E6E2D5] p-6 md:p-8 space-y-6 shadow-sm">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-900 border-b border-stone-100 pb-2">
            {locale === "en" ? "Consent History" : "Histórico de Consentimento"}
          </h3>
          <p className="text-[11px] text-stone-500 mt-1">
            {locale === "en"
              ? "A secure log of all consent modifications and acceptances recorded for auditing compliance:"
              : "Registro seguro de todas as modificações e concessões de consentimento para auditoria de conformidade:"}
          </p>
        </div>

        <div className="overflow-x-auto border border-[#EFECE6] rounded">
          <table className="w-full text-left font-mono text-[10px] border-collapse">
            <thead>
              <tr className="bg-[#FAF8F3] border-b border-[#E6E2D5] text-stone-400 uppercase tracking-wider">
                <th className="p-3">{locale === "en" ? "Date & Time" : "Data e Hora"}</th>
                <th className="p-3">Version</th>
                <th className="p-3">{locale === "en" ? "Mandatory" : "Obrigatório"}</th>
                <th className="p-3">{locale === "en" ? "Preferences" : "Preferências"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6] text-stone-700">
              {profile?.consentHistory && profile.consentHistory.length > 0 ? (
                profile.consentHistory.map((h: any, index) => (
                  <tr key={index} className="hover:bg-stone-50/50">
                    <td className="p-3">{new Date(h.timestamp).toLocaleString()}</td>
                    <td className="p-3 font-semibold text-stone-500">{h.version}</td>
                    <td className="p-3">
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                        {locale === "en" ? "Granted" : "Concedido"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${h.productUpdatesConsent ? "text-emerald-700 bg-emerald-50" : "text-stone-400 bg-stone-100"}`}>
                          {locale === "en" ? "Updates:" : "Atuas:"} {h.productUpdatesConsent ? "Y" : "N"}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${h.creativeEcosystemConsent ? "text-emerald-700 bg-emerald-50" : "text-stone-400 bg-stone-100"}`}>
                          {locale === "en" ? "Eco:" : "Eco:"} {h.creativeEcosystemConsent ? "Y" : "N"}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${h.partnersConsent ? "text-emerald-700 bg-emerald-50" : "text-stone-400 bg-stone-100"}`}>
                          {locale === "en" ? "Partners:" : "Parceiros:"} {h.partnersConsent ? "Y" : "N"}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${h.analyticsConsentAccepted || h.anonymousResearchConsent ? "text-emerald-700 bg-emerald-50" : "text-stone-400 bg-stone-100"}`}>
                          {locale === "en" ? "Research:" : "Pesq:"} {h.analyticsConsentAccepted || h.anonymousResearchConsent ? "Y" : "N"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="hover:bg-stone-50/50">
                  <td className="p-3">{profile?.consentAcceptedAt ? new Date(profile.consentAcceptedAt).toLocaleString() : new Date().toLocaleString()}</td>
                  <td className="p-3 font-semibold text-stone-500">v1.0-2026</td>
                  <td className="p-3">
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      {locale === "en" ? "Granted" : "Concedido"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${profile?.productUpdatesConsent ? "text-emerald-700 bg-emerald-50" : "text-stone-400 bg-stone-100"}`}>
                        {locale === "en" ? "Updates:" : "Atuas:"} {profile?.productUpdatesConsent ? "Y" : "N"}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${profile?.creativeEcosystemConsent ? "text-emerald-700 bg-emerald-50" : "text-stone-400 bg-stone-100"}`}>
                        {locale === "en" ? "Eco:" : "Eco:"} {profile?.creativeEcosystemConsent ? "Y" : "N"}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${profile?.partnersConsent ? "text-emerald-700 bg-emerald-50" : "text-stone-400 bg-stone-100"}`}>
                        {locale === "en" ? "Partners:" : "Parceiros:"} {profile?.partnersConsent ? "Y" : "N"}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${profile?.analyticsConsentAccepted || profile?.anonymousResearchConsent ? "text-emerald-700 bg-emerald-50" : "text-stone-400 bg-stone-100"}`}>
                        {locale === "en" ? "Research:" : "Pesq:"} {profile?.analyticsConsentAccepted || profile?.anonymousResearchConsent ? "Y" : "N"}
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export & Deletion Management Card */}
      <div className="bg-white rounded border border-[#E6E2D5] p-6 md:p-8 space-y-6 shadow-sm">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-900 border-b border-stone-100 pb-2">
            {locale === "en" ? "Export & Account Deletion" : "Exportação e Exclusão de Conta"}
          </h3>
          <p className="text-[11px] text-stone-500 mt-1">
            {locale === "en"
              ? "At any time, you can trigger a full export of your research workspace, or permanently delete your account and clear all stored documents from MyArtNotes."
              : "A qualquer momento, você pode exportar todo o seu espaço de pesquisa estruturado ou apagar permanentemente sua conta e limpar todos os diários e cadernos do MyArtNotes."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          {/* Export Button */}
          <button
            type="button"
            onClick={handleExportData}
            disabled={exporting}
            className="flex-1 flex items-center justify-center gap-2.5 p-4 border border-[#E6E2D5] hover:border-stone-500 bg-[#FAF8F3] hover:bg-white rounded cursor-pointer transition-colors text-left"
          >
            {exporting ? (
              <Loader2 className="w-5 h-5 text-stone-400 animate-spin" />
            ) : (
              <Download className="w-5 h-5 text-stone-700" />
            )}
            <div>
              <span className="block text-xs font-mono font-bold text-stone-900 uppercase tracking-wider">
                {locale === "en" ? "Export My Data" : "Exportar meus Dados"}
              </span>
              <span className="block text-[10px] text-stone-400 leading-tight mt-0.5 font-sans">
                {locale === "en" ? "Download structured research in JSON format." : "Baixe seus dados estruturados de pesquisa em formato JSON."}
              </span>
            </div>
          </button>

          {/* Deletion Button */}
          <button
            type="button"
            onClick={() => setDeletingAccount(true)}
            className="flex-1 flex items-center justify-center gap-2.5 p-4 border border-red-200 hover:border-red-500 bg-red-50/20 hover:bg-red-50/40 rounded cursor-pointer transition-colors text-left"
          >
            <Trash className="w-5 h-5 text-red-600" />
            <div>
              <span className="block text-xs font-mono font-bold text-red-700 uppercase tracking-wider">
                {locale === "en" ? "Delete Account" : "Excluir Conta"}
              </span>
              <span className="block text-[10px] text-red-400 leading-tight mt-0.5 font-sans">
                {locale === "en" ? "Irreversibly purge all notebooks and logs." : "Apague permanentemente todos os diários e cadernos."}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="space-y-6 animate-fadeIn">
      {/* Editorial Header Card */}
      <div className="bg-white rounded border border-[#E6E2D5] p-6 md:p-8 space-y-4 shadow-sm">
        <div className="flex items-start gap-4">
          <HelpCircle className="w-5 h-5 text-stone-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-900">
              {t.feedbackSectionTitle}
            </h3>
            <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
              {t.feedbackIntro}
            </p>
          </div>
        </div>
      </div>

      {/* Submission Form Card */}
      <form onSubmit={handleFeedbackSubmit} className="bg-white rounded border border-[#E6E2D5] p-6 md:p-8 space-y-6 shadow-sm">
        {feedbackSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-xs font-sans leading-relaxed">
            {t.feedbackSuccessMsg}
          </div>
        )}

        {feedbackError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-xs font-sans leading-relaxed flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span>{feedbackError}</span>
          </div>
        )}

        <div className="space-y-4 font-sans">
          {/* Category Selection */}
          <div className="space-y-1.5">
            <label className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold">
              {t.feedbackCategoryLabel}
            </label>
            <select
              value={feedbackCategory}
              onChange={(e) => setFeedbackCategory(e.target.value as any)}
              className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-800 focus:outline-none focus:border-stone-500 cursor-pointer"
            >
              <option value="bug">{t.feedbackCatBug}</option>
              <option value="suggestion">{t.feedbackCatSuggestion}</option>
              <option value="question">{t.feedbackCatQuestion}</option>
              <option value="idea">{t.feedbackCatIdea}</option>
              <option value="other">{t.feedbackCatOther}</option>
            </select>
          </div>

          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold">
              {t.feedbackTitleLabel}
            </label>
            <input
              type="text"
              value={feedbackTitle}
              onChange={(e) => setFeedbackTitle(e.target.value)}
              placeholder={locale === "en" ? "Brief summary of your feedback..." : "Breve resumo do seu feedback..."}
              className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500"
            />
          </div>

          {/* Description Area */}
          <div className="space-y-1.5">
            <label className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold">
              {t.feedbackDescLabel}
            </label>
            <textarea
              value={feedbackDescription}
              onChange={(e) => setFeedbackDescription(e.target.value)}
              rows={4}
              placeholder={locale === "en" ? "Explain in detail what happened or what you suggest..." : "Explique em detalhes o que aconteceu ou o que você sugere..."}
              className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500"
            />
          </div>

          {/* Screenshot Upload with Drag & Drop */}
          <div className="space-y-1.5">
            <label className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold">
              {t.feedbackScreenshotLabel}
            </label>
            
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("feedback-file-input")?.click()}
              className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-stone-950 bg-stone-50"
                  : feedbackScreenshot
                  ? "border-emerald-300 bg-emerald-50/10 hover:border-emerald-400"
                  : "border-stone-200 hover:border-stone-400 bg-[#FAF8F3]"
              }`}
            >
              <input
                id="feedback-file-input"
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                className="hidden"
              />
              
              {feedbackScreenshot ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-850 font-medium">
                    <FileImage className="w-4 h-4 text-emerald-600" />
                    <span>{locale === "en" ? "Screenshot selected successfully" : "Captura de tela selecionada com sucesso"}</span>
                  </div>
                  <img
                    src={feedbackScreenshot}
                    alt="Screenshot preview"
                    className="max-h-32 mx-auto rounded border border-[#E6E2D5] shadow-xs object-contain"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFeedbackScreenshot(null);
                    }}
                    className="text-[10px] text-red-600 hover:underline font-mono uppercase cursor-pointer"
                  >
                    {locale === "en" ? "Remove Image" : "Remover Imagem"}
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-5 h-5 text-stone-400 mx-auto" />
                  <p className="text-xs text-stone-600">
                    <span className="font-semibold text-stone-900">{locale === "en" ? "Click to upload" : "Clique para carregar"}</span> {locale === "en" ? "or drag & drop your image here" : "ou arraste e solte sua imagem aqui"}
                  </p>
                  <p className="text-[10px] text-stone-400">PNG, JPG, GIF (Max 2MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* Email Reply Consent */}
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-stone-750 font-sans select-none">
            <input
              type="checkbox"
              checked={feedbackEmailConsent}
              onChange={(e) => setFeedbackEmailConsent(e.target.checked)}
              className="accent-stone-900 cursor-pointer h-4 w-4 rounded border-stone-300"
            />
            <span>{t.feedbackEmailConsent}</span>
          </label>
        </div>

        {/* Submit button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmittingFeedback}
            className="px-6 py-2 bg-stone-900 hover:bg-stone-850 disabled:opacity-50 text-white font-mono text-xs uppercase font-bold rounded cursor-pointer transition-colors flex items-center gap-2"
          >
            {isSubmittingFeedback ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{locale === "en" ? "Submitting..." : "Enviando..."}</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{t.feedbackSubmitBtn}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Feedback Submission History */}
      <div className="bg-white rounded border border-[#E6E2D5] p-6 md:p-8 space-y-4 shadow-sm">
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-900 border-b border-stone-100 pb-2">
          {t.feedbackHistoryTitle}
        </h3>

        {historyLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-stone-400 mx-auto" />
          </div>
        ) : feedbackHistory.length === 0 ? (
          <p className="text-xs text-stone-500 italic py-2 text-center">
            {t.feedbackNoHistory}
          </p>
        ) : (
          <div className="space-y-4">
            {feedbackHistory.map((item) => {
              const catLabel =
                item.category === "bug" ? t.feedbackCatBug :
                item.category === "suggestion" ? t.feedbackCatSuggestion :
                item.category === "question" ? t.feedbackCatQuestion :
                item.category === "idea" ? t.feedbackCatIdea : t.feedbackCatOther;

              const statusColors =
                item.status === "new" ? "bg-amber-50 text-amber-850 border-amber-200" :
                item.status === "review" ? "bg-blue-50 text-blue-800 border-blue-200" :
                item.status === "resolved" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                "bg-stone-100 text-stone-600 border-stone-200";

              const statusLabel =
                item.status === "new" ? t.feedbackStatusNew :
                item.status === "review" ? t.feedbackStatusReview :
                item.status === "resolved" ? t.feedbackStatusResolved : t.feedbackStatusArchived;

              return (
                <div key={item.id} className="p-4 border border-[#EFECE6] rounded bg-[#FAF8F3] space-y-3 font-sans">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-stone-200/60 text-stone-800 px-2 py-0.5 rounded border border-stone-300">
                        {catLabel}
                      </span>
                      <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusColors}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400">
                      {new Date(item.createdAt).toLocaleString(locale === "en" ? "en-US" : "pt-BR")}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-stone-900 leading-snug">{item.title}</h4>
                    <p className="text-[11px] text-stone-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
                  </div>

                  {item.attachment && (
                    <div className="pt-1">
                      <img
                        src={item.attachment}
                        alt="Submitted attachment"
                        className="max-h-24 rounded border border-stone-200 hover:scale-105 transition-transform cursor-zoom-in"
                        onClick={() => {
                          const w = window.open();
                          w?.document.write(`<img src="${item.attachment}" style="max-width:100%;" />`);
                        }}
                      />
                    </div>
                  )}

                  {item.adminNotes && (
                    <div className="mt-3 p-3 bg-white border border-stone-200 rounded text-[11px]">
                      <span className="block font-mono text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                        {locale === "en" ? "Team Response" : "Resposta da Equipe"}
                      </span>
                      <p className="text-stone-750 whitespace-pre-wrap italic">{item.adminNotes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )}

  {/* Delete Account Modal */}
  {deletingAccount && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-lg border border-red-200 max-w-md w-full p-6 md:p-8 shadow-xl space-y-6">
        <h4 className="font-mono text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-red-100 pb-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{locale === "en" ? "Irreversible Account Deletion" : "Exclusão Irreversível de Conta"}</span>
        </h4>
        
        <div className="p-3.5 bg-red-50 border border-red-200 rounded text-red-800 text-[11px] leading-relaxed space-y-2 font-sans">
          <p className="font-bold">
            {locale === "en" 
              ? "WARNING: THIS ACTION CANNOT BE UNDONE!" 
              : "ATENÇÃO: ESTA AÇÃO NÃO PODE SER DESFEITA!"}
          </p>
          <p>
            {locale === "en"
              ? "Proceeding will permanently delete your user profile and purge every research notebook, log, diary entry, seeded concept, and saved insight from our servers. You will lose access immediately."
              : "Prosseguir apagará permanentemente seu perfil de usuário e todos os seus cadernos, diários, conceitos semeados e insights de nossos servidores. Seu acesso será revogado imediatamente."}
          </p>
        </div>

        <div className="space-y-4 font-sans">
          {/* Double Confirmation Checkboxes */}
          <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-stone-750 leading-normal">
            <input
              type="checkbox"
              checked={deleteConfirm1}
              onChange={(e) => setDeleteConfirm1(e.target.checked)}
              className="mt-0.5 accent-red-600 cursor-pointer"
            />
            <span>
              {locale === "en"
                ? "I understand that all my research notebooks and logs will be permanently deleted from MyArtNotes."
                : "Entendo que todos os meus cadernos de pesquisa e diários serão permanentemente apagados do MyArtNotes."}
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-stone-750 leading-normal">
            <input
              type="checkbox"
              checked={deleteConfirm2}
              onChange={(e) => setDeleteConfirm2(e.target.checked)}
              className="mt-0.5 accent-red-600 cursor-pointer"
            />
            <span>
              {locale === "en"
                ? "I understand that this action is immediate and MyArtNotes cannot recover my data."
                : "Entendo que esta ação é imediata e o MyArtNotes não poderá recuperar os meus dados."}
            </span>
          </label>

          {/* Email Entry Verification */}
          <div className="space-y-1.5 pt-2 border-t border-stone-100">
            <label className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold">
              {locale === "en" 
                ? `Type your email (${currentUser.email}) to confirm:` 
                : `Digite seu e-mail (${currentUser.email}) para confirmar:`}
            </label>
            <input
              type="text"
              value={deleteEmailInput}
              onChange={(e) => setDeleteEmailInput(e.target.value)}
              placeholder="artist@example.com"
              className="w-full bg-white border border-stone-200 rounded px-3 py-1.5 text-xs font-sans text-stone-850 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => {
              setDeletingAccount(false);
              setDeleteEmailInput("");
              setDeleteConfirm1(false);
              setDeleteConfirm2(false);
            }}
            disabled={isDeleting}
            className="px-3 py-1.5 border border-stone-200 text-stone-600 hover:bg-stone-50 font-mono text-[10px] uppercase rounded cursor-pointer"
          >
            {locale === "en" ? "Cancel" : "Cancelar"}
          </button>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={!deleteConfirm1 || !deleteConfirm2 || deleteEmailInput.toLowerCase().trim() !== currentUser.email.toLowerCase().trim() || isDeleting}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-mono text-[10px] uppercase rounded cursor-pointer font-bold flex items-center gap-1.5"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              locale === "en" ? "Delete All My Data" : "Excluir Todos os meus Dados"
            )}
          </button>
        </div>
      </div>
    </div>
  )}

      {/* Delete Confirmation Modal */}
      {deletingNbId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-lg border border-stone-200 max-w-sm w-full p-6 shadow-xl space-y-4">
            <h4 className="font-mono text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>{locale === "en" ? "Confirm Permanent Deletion" : "Confirmar Exclusão"}</span>
            </h4>
            <p className="text-xs text-stone-700 leading-relaxed">
              {t.notebookDeleteConfirm}
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeletingNbId(null)}
                className="px-3 py-1.5 border border-stone-200 text-stone-600 hover:bg-stone-50 font-mono text-[10px] uppercase rounded cursor-pointer"
              >
                {locale === "en" ? "Cancel" : "Cancelar"}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-mono text-[10px] uppercase rounded cursor-pointer"
              >
                {locale === "en" ? "Delete All" : "Excluir Tudo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Notebook Modal */}
      {renamingNb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-lg border border-stone-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <h4 className="font-mono text-xs font-bold text-stone-950 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
              <Edit className="w-4 h-4 text-stone-700" />
              <span>{t.notebookRenameTitle}</span>
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold mb-1">
                  {locale === "en" ? "Title" : "Título"}
                </label>
                <input
                  type="text"
                  value={renameTitleState}
                  onChange={(e) => setRenameTitleState(e.target.value)}
                  className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold mb-1">
                  {locale === "en" ? "Subtitle" : "Subtítulo"}
                </label>
                <input
                  type="text"
                  value={renameSubtitleState}
                  onChange={(e) => setRenameSubtitleState(e.target.value)}
                  className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold mb-1">
                  {locale === "en" ? "Description" : "Descrição"}
                </label>
                <textarea
                  value={renameDescState}
                  onChange={(e) => setRenameDescState(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setRenamingNb(null)}
                className="px-3 py-1.5 border border-stone-200 text-stone-600 hover:bg-stone-50 font-mono text-[10px] uppercase rounded cursor-pointer"
              >
                {locale === "en" ? "Cancel" : "Cancelar"}
              </button>
              <button
                onClick={handleSaveRename}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-mono text-[10px] uppercase rounded cursor-pointer"
              >
                {locale === "en" ? "Save Changes" : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Notebook Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-lg border border-[#E6E2D5] max-w-md w-full p-6 md:p-8 shadow-xl space-y-6 relative">
            
            {/* Header / Step Tracker */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <span className="font-mono text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                {t.wizardTitle}
              </span>
              <span className="font-mono text-[10px] text-stone-500 font-semibold bg-[#FAF8F3] border border-stone-200 px-2 py-0.5 rounded">
                {t.wizardStep} {wizardStep} / 5
              </span>
            </div>

            {wizardError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-[11px] text-red-700">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{wizardError}</span>
              </div>
            )}

            {/* Steps Rendering */}
            <div className="min-h-[160px] flex flex-col justify-center">
              {wizardStep === 1 && (
                <div className="space-y-3 animate-slideIn">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-850">
                    {t.wizardStep1Title}
                  </h4>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {locale === "en" ? "Give your new research notebook a clear, evocative title." : "Dê um título claro e evocativo para o seu novo caderno de pesquisa."}
                  </p>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => {
                      setNewTitle(e.target.value);
                      if (e.target.value.trim()) setWizardError("");
                    }}
                    placeholder={t.wizardStep1Placeholder}
                    className="w-full bg-white border border-[#DDD9CE] rounded px-4 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500"
                    autoFocus
                  />
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-3 animate-slideIn">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-850">
                    {t.wizardStep2Title}
                  </h4>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {locale === "en" ? "Define an optional subtitle or material focus (e.g., Pigments, Sound Synthesis)." : "Defina um subtítulo opcional ou foco material (ex: Pigmentos, Síntese Sonora)."}
                  </p>
                  <input
                    type="text"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    placeholder={t.wizardStep2Placeholder}
                    className="w-full bg-white border border-[#DDD9CE] rounded px-4 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500"
                    autoFocus
                  />
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-3 animate-slideIn">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-850">
                    {t.wizardStep3Title}
                  </h4>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {locale === "en" ? "Briefly outline the artistic inquiries and material concerns of this notebook." : "Esboce brevemente as preocupações artísticas e intenções deste caderno."}
                  </p>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder={t.wizardStep3Placeholder}
                    rows={4}
                    className="w-full bg-white border border-[#DDD9CE] rounded px-4 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500 resize-none leading-relaxed"
                    autoFocus
                  />
                </div>
              )}

              {wizardStep === 4 && (
                <div className="space-y-4 animate-slideIn">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-850">
                      {t.wizardStep4Title}
                    </h4>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      {locale === "en" 
                        ? "Select the primary research language for this notebook. This also guides the context generated by ATLAS AI." 
                        : "Selecione o idioma principal de pesquisa deste caderno. Isso também orienta o contexto gerado pelo ATLAS AI."}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setNewLang("pt")}
                      className={`flex-1 py-2 text-center text-xs font-mono font-bold border rounded transition-colors cursor-pointer ${
                        newLang === "pt"
                          ? "bg-stone-900 border-stone-900 text-white"
                          : "bg-white border-[#DDD9CE] text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      Português (PT)
                    </button>
                    <button
                      onClick={() => setNewLang("en")}
                      className={`flex-1 py-2 text-center text-xs font-mono font-bold border rounded transition-colors cursor-pointer ${
                        newLang === "en"
                          ? "bg-stone-900 border-stone-900 text-white"
                          : "bg-white border-[#DDD9CE] text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      English (EN)
                    </button>
                  </div>
                </div>
              )}

              {wizardStep === 5 && (
                <div className="space-y-3 text-center animate-slideIn py-2">
                  <Check className="w-10 h-10 text-emerald-600 mx-auto bg-[#FAF8F3] border border-stone-200 p-2 rounded-full mb-2" />
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-850">
                    {locale === "en" ? "Ready to Seed" : "Pronto para Semear"}
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed max-w-xs mx-auto">
                    {locale === "en" 
                      ? "Creating this notebook will immediately initialize an empty workspace and switch your focus here." 
                      : "A criação deste caderno inicializará imediatamente um espaço de trabalho limpo e mudará seu foco para ele."}
                  </p>
                </div>
              )}
            </div>

            {/* Wizard Navigation */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                onClick={wizardStep === 1 ? () => setIsWizardOpen(false) : handlePrevStep}
                className="px-3.5 py-1.5 border border-[#DDD9CE] text-stone-600 hover:bg-stone-50 font-mono text-xs uppercase rounded cursor-pointer transition-colors"
              >
                {wizardStep === 1 ? (locale === "en" ? "Cancel" : "Cancelar") : t.wizardPrev}
              </button>
              
              {wizardStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-mono text-xs uppercase font-bold rounded cursor-pointer transition-colors"
                >
                  {t.wizardNext}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateNotebook}
                  disabled={isSaving}
                  className="px-5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs uppercase font-bold rounded cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>{t.wizardCreateBtn}</span>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
