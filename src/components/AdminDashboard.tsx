import React, { useState, useEffect } from "react";
import { 
  getAnalyticsDashboardData, 
  logAnalyticsEvent, 
  AnalyticsReport,
  AdminUser,
  getAdminUsers,
  addAdminUser,
  removeAdminUser,
  getAllFeedbacks,
  updateFeedbackStatusAndNotes
} from "../lib/dbService";
import { 
  Users, 
  UserCheck, 
  Award, 
  Clock, 
  BarChart, 
  TrendingUp, 
  RefreshCw, 
  ShieldAlert, 
  Sparkles, 
  BookOpen, 
  Compass, 
  PlusCircle, 
  CheckCircle, 
  Database,
  UserPlus,
  Trash2,
  Shield,
  MessageSquare,
  Filter,
  Check,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Eye
} from "lucide-react";
import { BetaFeedback } from "../types";
import { useTranslation } from "../lib/i18n";

interface AdminDashboardProps {
  onBack: () => void;
  currentUser: any;
  adminRole: "super_admin" | "admin" | null;
}

const localTranslations = {
  pt: {
    adminOnly: "Acesso Restrito",
    title: "MyArtNotes — Métricas de Engajamento",
    subtitle: "Painel administrativo para avaliar se os artistas estão ativando os ciclos criativos centrais.",
    refresh: "Atualizar",
    back: "Voltar para o Caderno",
    errorTitle: "Erro de Acesso ao Banco de Dados",
    totalRegistrations: "Total de Registros",
    accounts: "contas",
    googleAuth: "Sincronizado via Google Auth",
    activeUsers: "Usuários Ativos (30d)",
    activeRate: "taxa de atividade",
    lastLogin30d: "Login nos últimos 30 dias",
    loopCompletion: "Taxa de Conclusão",
    retention: "de retenção",
    aiExploration: "Exploração com IA",
    expandedConcepts: "Conceitos expandidos por IA",
    coreFunnel: "FUNIL DE ATIVAÇÃO DO CICLO DE CRIAÇÃO",
    coreFunnelDesc: "Acompanha a jornada de engajamento do artista.",
    funnelStep1: "1. Conta Registrada",
    funnelStep2: "2. Primeira Anotação Criada",
    funnelStep3: "3. Primeiro Conceito Criado",
    funnelStep4: "4. Primeira Exploração IA",
    funnelStep5: "5. Relatório de Insights Sintetizado",
    simulatorTitle: "Simulador de Eventos",
    simulatorDesc: "Simule marcos de uso para validar o funil sem precisar realizar cada ação manualmente.",
    simulatorEmail: "Email do Usuário Simulado",
    simBtnRegister: "Registrar Conta",
    simBtnJournal: "Criar Anotação",
    simBtnConcept: "Semear Conceito",
    simBtnAi: "Explorar com IA",
    simBtnInsight: "Sintetizar Insights",
    registeredUsersTitle: "Usuários Registrados",
    milestoneFeedTitle: "Atividades e Marcos Recentes",
    lastLoginStatus: "Status de login recente",
    realtimeAudits: "Auditorias em tempo real",
    colEmail: "Email do Usuário",
    colLastActive: "Último Acesso",
    colAge: "Idade da Conta",
    colEvent: "Evento",
    colActor: "Ator / Autor",
    colLoggedAt: "Registrado às",
    noUsers: "Nenhum usuário registrado.",
    noEvents: "Nenhum evento registrado ainda.",
    manageAdminsTitle: "Gerenciar Administradores da Plataforma",
    manageAdminsDesc: "Administradores Master podem conceder ou revogar privilégios administrativos.",
    grantPrivilegeTitle: "Conceder Função Administrativa",
    userEmailLabel: "Endereço de Email",
    systemRoleLabel: "Função no Sistema",
    roleAnalyticsOnly: "Admin (Apenas Métricas)",
    roleFullAccess: "Admin Master (Acesso Total)",
    btnAddAdmin: "Adicionar Administrador",
    btnProcessing: "Processando...",
    currentAdminsTitle: "Administradores Ativos",
    colRole: "Função",
    colAddedAt: "Concedido em",
    colActions: "Ações",
    removeConfirm: "Tem certeza que deseja remover {email} dos administradores?",
    cannotRemoveSelf: "Você não pode revogar seus próprios privilégios de administrador.",
    removeTooltip: "Revogar privilégios",
    youLabel: "Você"
  },
  en: {
    adminOnly: "Admin Only",
    title: "MyArtNotes Loop Analytics",
    subtitle: "Real-time validation dashboard measuring if artists are completing the core creative loops.",
    refresh: "Refresh",
    back: "Back to Notebook",
    errorTitle: "Database Access Error",
    totalRegistrations: "Total Registrations",
    accounts: "accounts",
    googleAuth: "Synced from Google authentication",
    activeUsers: "Active Users (30d)",
    activeRate: "activity rate",
    lastLogin30d: "Last login within 30 days",
    loopCompletion: "Loop Completion Pct",
    retention: "retention",
    aiExploration: "AI Exploration",
    expandedConcepts: "Concept expansion & pattern detection",
    coreFunnel: "CORE USER LOOP ACTIVATION FUNNEL",
    coreFunnelDesc: "Tracks drop-offs from sign up through advanced AI synthesis.",
    funnelStep1: "1. Account Registered (`user_signed_up`)",
    funnelStep2: "2. Completed First Journal Entry (`first_journal_entry`)",
    funnelStep3: "3. Seeded First Research Concept (`first_concept_created`)",
    funnelStep4: "4. Performed AI Concept Exploration (`first_ai_exploration`)",
    funnelStep5: "5. Generated Synthetic Insight Report (`first_insight_viewed`)",
    simulatorTitle: "Event Simulator",
    simulatorDesc: "Simulate milestones to preview the validation loop without manually triggering each flow.",
    simulatorEmail: "Simulator User Email",
    simBtnRegister: "Register Account",
    simBtnJournal: "Create Journal Entry",
    simBtnConcept: "Seed Concept",
    simBtnAi: "Run AI Exploration",
    simBtnInsight: "Synthesize Insight",
    registeredUsersTitle: "Registered Users",
    milestoneFeedTitle: "Milestone Activity Feed",
    lastLoginStatus: "Last login status",
    realtimeAudits: "Real-time audits",
    colEmail: "User Email",
    colLastActive: "Last Active",
    colAge: "Account Age",
    colEvent: "Event Type",
    colActor: "Actor",
    colLoggedAt: "Logged At",
    noUsers: "No registered users.",
    noEvents: "No milestone events recorded yet.",
    manageAdminsTitle: "Manage Platform Administrators",
    manageAdminsDesc: "Super admins can add or remove users from the administrators list.",
    grantPrivilegeTitle: "Grant Admin Privileges",
    userEmailLabel: "User Email Address",
    systemRoleLabel: "System Role",
    roleAnalyticsOnly: "Admin (Analytics Only)",
    roleFullAccess: "Super Admin (Full Access)",
    btnAddAdmin: "Add Administrator",
    btnProcessing: "Processing...",
    currentAdminsTitle: "Current Administrators",
    colRole: "Role",
    colAddedAt: "Added At",
    colActions: "Actions",
    removeConfirm: "Are you sure you want to remove {email} from administrators?",
    cannotRemoveSelf: "You cannot remove yourself as an administrator.",
    removeTooltip: "Remove administrator",
    youLabel: "You"
  }
};

export default function AdminDashboard({ onBack, currentUser, adminRole }: AdminDashboardProps) {
  const { locale } = useTranslation();
  const [activeTab, setActiveTab] = useState<"analytics" | "feedback">("analytics");
  const [data, setData] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [simulatedUserEmail, setSimulatedUserEmail] = useState("artist_test@example.com");
  const [simulating, setSimulating] = useState(false);

  // Admin Management State
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<"super_admin" | "admin">("admin");
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [adminActionError, setAdminActionError] = useState("");

  // Feedback dashboard states
  const [feedbacks, setFeedbacks] = useState<BetaFeedback[]>([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSearch, setFilterSearch] = useState<string>("");
  const [selectedFeedback, setSelectedFeedback] = useState<BetaFeedback | null>(null);
  const [adminNotesText, setAdminNotesText] = useState("");
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [notesSaveSuccess, setNotesSaveSuccess] = useState(false);

  const lt = locale === "en" ? localTranslations.en : localTranslations.pt;

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const report = await getAnalyticsDashboardData();
      setData(report);
    } catch (err: any) {
      console.error(err);
      setError(`Failed to fetch analytics data. Error: ${err.message || String(err)} | Details: ${JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAdmins = async () => {
    if (adminRole !== "super_admin") return;
    try {
      const list = await getAdminUsers();
      setAdminsList(list);
    } catch (err: any) {
      console.error("Failed to load admin list:", err);
    }
  };

  useEffect(() => {
    loadData();
    loadAdmins();
  }, [adminRole]);

  // --- Feedback Dashboard Helpers ---
  const loadFeedbacks = async () => {
    setFeedbacksLoading(true);
    try {
      const list = await getAllFeedbacks();
      setFeedbacks(list);
    } catch (err) {
      console.error("Failed to load feedbacks:", err);
    } finally {
      setFeedbacksLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "feedback") {
      loadFeedbacks();
    }
  }, [activeTab]);

  const handleUpdateFeedback = async (feedbackId: string, status: "new" | "review" | "resolved" | "archived", notes: string) => {
    setStatusUpdatingId(feedbackId);
    setNotesSaveSuccess(false);
    try {
      await updateFeedbackStatusAndNotes(feedbackId, status, notes);
      // Update local state
      setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, status, adminNotes: notes, updatedAt: new Date().toISOString() } : f));
      if (selectedFeedback && selectedFeedback.id === feedbackId) {
        setSelectedFeedback(prev => prev ? { ...prev, status, adminNotes: notes, adminNotesText: notes, updatedAt: new Date().toISOString() } : null);
      }
      setNotesSaveSuccess(true);
      setTimeout(() => setNotesSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update feedback status/notes:", err);
      alert(locale === "en" ? "Failed to save feedback changes. Please try again." : "Falha ao salvar alterações de feedback. Tente novamente.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    setAdminActionLoading(true);
    setAdminActionError("");
    try {
      await addAdminUser(newAdminEmail.toLowerCase().trim(), newAdminRole);
      setNewAdminEmail("");
      await loadAdmins();
    } catch (err: any) {
      setAdminActionError(err.message || "Failed to add administrator.");
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (email.toLowerCase() === currentUser?.email?.toLowerCase()) {
      alert(lt.cannotRemoveSelf);
      return;
    }
    if (!window.confirm(lt.removeConfirm.replace("{email}", email))) {
      return;
    }
    setAdminActionLoading(true);
    setAdminActionError("");
    try {
      await removeAdminUser(email);
      await loadAdmins();
    } catch (err: any) {
      setAdminActionError(err.message || "Failed to remove administrator.");
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleSimulateEvent = async (eventType: any) => {
    setSimulating(true);
    try {
      const mockUid = "sim_" + Math.random().toString(36).substring(2, 9);
      // Log event
      await logAnalyticsEvent(mockUid, eventType, { 
        simulated: true, 
        email: simulatedUserEmail, 
        timestamp: new Date().toISOString() 
      });
      await loadData();
    } catch (err: any) {
      alert("Simulation failed: " + err.message);
    } finally {
      setSimulating(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="w-8 h-8 text-stone-400 animate-spin" />
        <p className="text-xs font-mono text-stone-500 uppercase tracking-widest">
          {locale === "en" ? "Loading Analytics Dashboard..." : "Carregando Painel de Métricas..."}
        </p>
      </div>
    );
  }

  const milestones = data?.milestones || {
    userSignedUp: 0,
    firstJournalEntry: 0,
    firstConceptCreated: 0,
    firstAiExploration: 0,
    firstInsightViewed: 0,
  };

  const totalUsers = data?.registrations.total || 0;
  const active30d = data?.activeUsers.total30d || 0;
  
  // Percentages of loop completion
  const firstEntryPct = totalUsers > 0 ? Math.round((milestones.firstJournalEntry / totalUsers) * 100) : 0;
  const firstConceptPct = totalUsers > 0 ? Math.round((milestones.firstConceptCreated / totalUsers) * 100) : 0;
  const aiExplorationPct = totalUsers > 0 ? Math.round((milestones.firstAiExploration / totalUsers) * 100) : 0;
  const insightViewedPct = totalUsers > 0 ? Math.round((milestones.firstInsightViewed / totalUsers) * 100) : 0;

  // Simple Retention Indicator: % of users who completed both journal entry and concept creation
  const retentionIndicator = totalUsers > 0 
    ? Math.round((Math.min(milestones.firstJournalEntry, milestones.firstConceptCreated) / totalUsers) * 100) 
    : 0;

  // Compute feedback states
  const feedbackStats = {
    total: feedbacks.length,
    bugs: feedbacks.filter(f => f.category === "bug").length,
    suggestions: feedbacks.filter(f => f.category === "suggestion").length,
    questions: feedbacks.filter(f => f.category === "question").length,
    ideas: feedbacks.filter(f => f.category === "idea").length,
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (filterCategory !== "all" && f.category !== filterCategory) return false;
    if (filterStatus !== "all" && f.status !== filterStatus) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      const matchEmail = f.userEmail?.toLowerCase().includes(q) || false;
      const matchTitle = f.title?.toLowerCase().includes(q) || false;
      const matchDesc = f.description?.toLowerCase().includes(q) || false;
      if (!matchEmail && !matchTitle && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8 font-sans">
      {/* Top Navigation Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E6E2D5] pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-red-900 text-white font-mono text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded">
              {lt.adminOnly}
            </span>
            <h1 className="text-xl font-serif font-bold text-stone-950">{lt.title}</h1>
          </div>
          <p className="text-xs text-stone-500 font-mono mt-1">
            {lt.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#DDD9CE] hover:bg-[#EFECE6] text-stone-700 font-mono text-xs rounded transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{lt.refresh}</span>
          </button>
          <button
            onClick={onBack}
            className="px-4 py-1.5 bg-stone-900 hover:bg-stone-850 text-white font-mono text-xs font-bold rounded cursor-pointer transition-colors"
          >
            {lt.back}
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-[#E6E2D5] gap-4">
        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-2.5 px-1 font-mono text-xs uppercase tracking-wider font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "analytics"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-400 hover:text-stone-700"
          }`}
        >
          {locale === "en" ? "Loop Analytics" : "Análise de Loops"}
        </button>
        <button
          onClick={() => setActiveTab("feedback")}
          className={`pb-2.5 px-1 font-mono text-xs uppercase tracking-wider font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "feedback"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-400 hover:text-stone-700"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{locale === "en" ? "Beta Feedback" : "Feedback da Beta"}</span>
          {feedbacks.length > 0 && (
            <span className="ml-1 bg-stone-900 text-white text-[9px] px-1.5 py-0.5 rounded-full font-mono">
              {feedbacks.filter(f => f.status === "new").length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "analytics" ? (
        <>
          {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3 text-xs text-red-700">
          <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <span className="font-bold block mb-1">{lt.errorTitle}</span>
            <p className="font-sans leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Registrations */}
        <div className="bg-white border border-[#E6E2D5] rounded p-5 space-y-2">
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">{lt.totalRegistrations}</span>
            <Users className="w-4 h-4 text-stone-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-stone-900">{totalUsers}</span>
            <span className="text-xs font-mono text-stone-500">{lt.accounts}</span>
          </div>
          <p className="text-[10px] text-stone-400 font-mono">{lt.googleAuth}</p>
        </div>

        {/* Active Users (30d) */}
        <div className="bg-white border border-[#E6E2D5] rounded p-5 space-y-2">
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">{lt.activeUsers}</span>
            <UserCheck className="w-4 h-4 text-stone-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-stone-900">{active30d}</span>
            <span className="text-xs font-mono text-emerald-600 font-bold">
              {totalUsers > 0 ? `${Math.round((active30d / totalUsers) * 100)}%` : "0%"}
            </span>
          </div>
          <p className="text-[10px] text-stone-400 font-mono">{lt.lastLogin30d}</p>
        </div>

        {/* Core Loop Retention */}
        <div className="bg-white border border-[#E6E2D5] rounded p-5 space-y-2">
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">{lt.loopCompletion}</span>
            <TrendingUp className="w-4 h-4 text-stone-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-stone-900">{retentionIndicator}%</span>
            <span className="text-xs font-mono text-stone-500">{lt.retention}</span>
          </div>
          <div className="w-full bg-[#EFECE6] h-1.5 rounded-full overflow-hidden">
            <div className="bg-stone-900 h-full rounded-full" style={{ width: `${retentionIndicator}%` }} />
          </div>
        </div>

        {/* AI Explorations */}
        <div className="bg-white border border-[#E6E2D5] rounded p-5 space-y-2">
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">{lt.aiExploration}</span>
            <Sparkles className="w-4 h-4 text-stone-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-stone-900">{milestones.firstAiExploration}</span>
            <span className="text-xs font-mono text-stone-500">users ({aiExplorationPct}%)</span>
          </div>
          <p className="text-[10px] text-stone-400 font-mono">{lt.expandedConcepts}</p>
        </div>
      </div>

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Funnel loop */}
        <div className="bg-white border border-[#E6E2D5] rounded p-6 space-y-6 lg:col-span-2">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-800">
              {lt.coreFunnel}
            </h3>
            <p className="text-[10px] font-sans text-stone-500">
              {lt.coreFunnelDesc}
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {/* Step 1 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-stone-700">{lt.funnelStep1}</span>
                <span className="font-bold text-stone-900">100% ({totalUsers} users)</span>
              </div>
              <div className="w-full bg-[#EFECE6] h-2.5 rounded-full">
                <div className="bg-stone-800 h-full rounded-full w-full" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-stone-700">{lt.funnelStep2}</span>
                <span className="font-bold text-stone-900">{firstEntryPct}% ({milestones.firstJournalEntry} users)</span>
              </div>
              <div className="w-full bg-[#EFECE6] h-2.5 rounded-full">
                <div className="bg-stone-800 h-full rounded-full" style={{ width: `${firstEntryPct}%` }} />
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-stone-700">{lt.funnelStep3}</span>
                <span className="font-bold text-stone-900">{firstConceptPct}% ({milestones.firstConceptCreated} users)</span>
              </div>
              <div className="w-full bg-[#EFECE6] h-2.5 rounded-full">
                <div className="bg-stone-800 h-full rounded-full" style={{ width: `${firstConceptPct}%` }} />
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-stone-700">{lt.funnelStep4}</span>
                <span className="font-bold text-stone-900">{aiExplorationPct}% ({milestones.firstAiExploration} users)</span>
              </div>
              <div className="w-full bg-[#EFECE6] h-2.5 rounded-full">
                <div className="bg-stone-800 h-full rounded-full" style={{ width: `${aiExplorationPct}%` }} />
              </div>
            </div>

            {/* Step 5 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-stone-700">{lt.funnelStep5}</span>
                <span className="font-bold text-stone-900">{insightViewedPct}% ({milestones.firstInsightViewed} users)</span>
              </div>
              <div className="w-full bg-[#EFECE6] h-2.5 rounded-full">
                <div className="bg-stone-800 h-full rounded-full" style={{ width: `${insightViewedPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Testing Box */}
        <div className="bg-stone-50 border border-[#E6E2D5] rounded p-6 space-y-4">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>{lt.simulatorTitle}</span>
            </h3>
            <p className="text-[10px] font-sans text-stone-500 mt-0.5">
              {lt.simulatorDesc}
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-stone-400 uppercase">{lt.simulatorEmail}</label>
              <input
                type="text"
                value={simulatedUserEmail}
                onChange={(e) => setSimulatedUserEmail(e.target.value)}
                className="w-full border border-[#DDD9CE] bg-white text-xs px-2 py-1.5 rounded focus:outline-none"
              />
            </div>

            <div className="space-y-2 pt-1.5">
              <button
                onClick={() => handleSimulateEvent("user_signed_up")}
                disabled={simulating}
                className="w-full py-1.5 bg-white border border-[#DDD9CE] text-stone-700 hover:bg-[#EFECE6] font-mono text-[10px] uppercase rounded text-left px-3 flex justify-between items-center transition-colors disabled:opacity-50"
              >
                <span>{lt.simBtnRegister}</span>
                <span className="text-stone-400">`user_signed_up`</span>
              </button>

              <button
                onClick={() => handleSimulateEvent("first_journal_entry")}
                disabled={simulating}
                className="w-full py-1.5 bg-white border border-[#DDD9CE] text-stone-700 hover:bg-[#EFECE6] font-mono text-[10px] uppercase rounded text-left px-3 flex justify-between items-center transition-colors disabled:opacity-50"
              >
                <span>{lt.simBtnJournal}</span>
                <span className="text-stone-400">`first_journal_entry`</span>
              </button>

              <button
                onClick={() => handleSimulateEvent("first_concept_created")}
                disabled={simulating}
                className="w-full py-1.5 bg-white border border-[#DDD9CE] text-stone-700 hover:bg-[#EFECE6] font-mono text-[10px] uppercase rounded text-left px-3 flex justify-between items-center transition-colors disabled:opacity-50"
              >
                <span>{lt.simBtnConcept}</span>
                <span className="text-stone-400">`first_concept_created`</span>
              </button>

              <button
                onClick={() => handleSimulateEvent("first_ai_exploration")}
                disabled={simulating}
                className="w-full py-1.5 bg-white border border-[#DDD9CE] text-stone-700 hover:bg-[#EFECE6] font-mono text-[10px] uppercase rounded text-left px-3 flex justify-between items-center transition-colors disabled:opacity-50"
              >
                <span>{lt.simBtnAi}</span>
                <span className="text-stone-400">`first_ai_exploration`</span>
              </button>

              <button
                onClick={() => handleSimulateEvent("first_insight_viewed")}
                disabled={simulating}
                className="w-full py-1.5 bg-white border border-[#DDD9CE] text-stone-700 hover:bg-[#EFECE6] font-mono text-[10px] uppercase rounded text-left px-3 flex justify-between items-center transition-colors disabled:opacity-50"
              >
                <span>{lt.simBtnInsight}</span>
                <span className="text-stone-400">`first_insight_viewed`</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy & Consent Governance Metrics Card */}
      <div className="bg-white border border-[#E6E2D5] rounded p-6 space-y-6">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-800">
            {locale === "en" ? "PRIVACY & CONSENT GOVERNANCE METRICS" : "MÉTRICAS DE GOVERNANÇA DE PRIVACIDADE E CONSENTIMENTO"}
          </h3>
          <p className="text-[10px] font-sans text-stone-500">
            {locale === "en"
              ? "Aggregated active subscriptions and research opt-ins. Individual private preferences are strictly isolated and never exposed."
              : "Assinaturas ativas agregadas e opt-ins de pesquisa. As preferências de privacidade individuais são estritamente isoladas e nunca expostas."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* 1. Product Updates */}
          <div className="bg-[#FAF8F3] border border-[#E6E2D5] rounded p-4 space-y-1">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-bold block">
              {locale === "en" ? "Product Updates" : "Atualizações de Produto"}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-stone-900">
                {data?.communicationPreferences?.productUpdatesCount || 0}
              </span>
              <span className="text-xs font-mono text-stone-500">
                ({totalUsers > 0 ? Math.round(((data?.communicationPreferences?.productUpdatesCount || 0) / totalUsers) * 100) : 0}%)
              </span>
            </div>
            <span className="text-[9px] text-stone-400 leading-tight block">
              {locale === "en" ? "Opted-in accounts" : "Contas com opt-in ativo"}
            </span>
          </div>

          {/* 2. Creative Ecosystem */}
          <div className="bg-[#FAF8F3] border border-[#E6E2D5] rounded p-4 space-y-1">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-bold block">
              {locale === "en" ? "Creative Ecosystem" : "Ecossistema Criativo"}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-stone-900">
                {data?.communicationPreferences?.creativeEcosystemCount || 0}
              </span>
              <span className="text-xs font-mono text-stone-500">
                ({totalUsers > 0 ? Math.round(((data?.communicationPreferences?.creativeEcosystemCount || 0) / totalUsers) * 100) : 0}%)
              </span>
            </div>
            <span className="text-[9px] text-stone-400 leading-tight block">
              {locale === "en" ? "Opted-in accounts" : "Contas com opt-in ativo"}
            </span>
          </div>

          {/* 3. Partners */}
          <div className="bg-[#FAF8F3] border border-[#E6E2D5] rounded p-4 space-y-1">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-bold block">
              {locale === "en" ? "Partners Info" : "Info de Parceiros"}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-stone-900">
                {data?.communicationPreferences?.partnersCount || 0}
              </span>
              <span className="text-xs font-mono text-stone-500">
                ({totalUsers > 0 ? Math.round(((data?.communicationPreferences?.partnersCount || 0) / totalUsers) * 100) : 0}%)
              </span>
            </div>
            <span className="text-[9px] text-stone-400 leading-tight block">
              {locale === "en" ? "Opted-in accounts" : "Contas com opt-in ativo"}
            </span>
          </div>

          {/* 4. Anonymous Research */}
          <div className="bg-[#FAF8F3] border border-[#E6E2D5] rounded p-4 space-y-1">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-bold block">
              {locale === "en" ? "Anonymous Research" : "Pesquisa Anônima"}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-stone-900">
                {data?.communicationPreferences?.anonymousResearchCount || 0}
              </span>
              <span className="text-xs font-mono text-stone-500">
                ({totalUsers > 0 ? Math.round(((data?.communicationPreferences?.anonymousResearchCount || 0) / totalUsers) * 100) : 0}%)
              </span>
            </div>
            <span className="text-[9px] text-stone-400 leading-tight block">
              {locale === "en" ? "Opted-in accounts" : "Contas com opt-in ativo"}
            </span>
          </div>
        </div>
      </div>

      {/* Tables of Users and Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Registered Users */}
        <div className="bg-white border border-[#E6E2D5] rounded p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-850">
              {lt.registeredUsersTitle} ({data?.activeUsers.list.length || 0})
            </h3>
            <span className="text-[10px] text-stone-400 font-mono">{lt.lastLoginStatus}</span>
          </div>

          <div className="max-h-[300px] overflow-y-auto border border-[#EFECE6] rounded">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF8F3] border-b border-[#E6E2D5] text-[10px] text-stone-400 uppercase tracking-wider">
                  <th className="p-3">{lt.colEmail}</th>
                  <th className="p-3">{lt.colLastActive}</th>
                  <th className="p-3">{lt.colAge}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6]">
                {data?.activeUsers.list && data.activeUsers.list.length > 0 ? (
                  data.activeUsers.list.map((u, i) => (
                    <tr key={u.uid || i} className="hover:bg-stone-50/50">
                      <td className="p-3 font-semibold text-stone-800">
                        {u.email || "anonymous"}
                        {u.email === currentUser?.email && (
                          <span className="ml-2 px-1 bg-stone-100 text-[8px] text-stone-500 rounded">{lt.youLabel}</span>
                        )}
                      </td>
                      <td className="p-3 text-stone-550">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
                      </td>
                      <td className="p-3 text-stone-500 text-[10px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-stone-400 italic">
                      {lt.noUsers}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics Milestone Log */}
        <div className="bg-white border border-[#E6E2D5] rounded p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-850">
              {lt.milestoneFeedTitle} ({data?.events.length || 0})
            </h3>
            <span className="text-[10px] text-stone-400 font-mono">{lt.realtimeAudits}</span>
          </div>

          <div className="max-h-[300px] overflow-y-auto border border-[#EFECE6] rounded">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF8F3] border-b border-[#E6E2D5] text-[10px] text-stone-400 uppercase tracking-wider">
                  <th className="p-3">{lt.colEvent}</th>
                  <th className="p-3">{lt.colActor}</th>
                  <th className="p-3">{lt.colLoggedAt}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6]">
                {data?.events && data.events.length > 0 ? (
                  data.events.map((e, idx) => (
                    <tr key={e.id || idx} className="hover:bg-stone-50/50">
                      <td className="p-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-100 text-stone-800 font-bold">
                          {e.eventType}
                        </span>
                      </td>
                      <td className="p-3 text-stone-550 truncate max-w-[150px]" title={e.userEmail || e.userId}>
                        {e.userEmail || e.userId}
                      </td>
                      <td className="p-3 text-stone-400 text-[10px]">
                        {e.createdAt ? new Date(e.createdAt).toLocaleTimeString() : "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-stone-400 italic">
                      {lt.noEvents}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Admin management section for super admins */}
      {adminRole === "super_admin" && (
        <div className="bg-white border border-[#E6E2D5] rounded p-6 space-y-6">
          <div className="border-b border-[#E6E2D5] pb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-850 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-stone-800" />
              <span>{lt.manageAdminsTitle}</span>
            </h3>
            <p className="text-[10px] font-sans text-stone-500 mt-0.5">
              {lt.manageAdminsDesc}
            </p>
          </div>

          {adminActionError && (
            <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded font-mono">
              {adminActionError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form to add admin */}
            <form onSubmit={handleAddAdmin} className="space-y-4 lg:border-r lg:border-[#E6E2D5] lg:pr-8">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-600">
                {lt.grantPrivilegeTitle}
              </h4>
              
              <div className="space-y-1">
                <label className="text-[9px] font-mono text-stone-400 uppercase">{lt.userEmailLabel}</label>
                <input
                  type="email"
                  required
                  placeholder="artist_partner@example.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full border border-[#DDD9CE] bg-white text-xs px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-stone-400 uppercase">{lt.systemRoleLabel}</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as "super_admin" | "admin")}
                  className="w-full border border-[#DDD9CE] bg-white text-xs px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-stone-900 font-mono"
                >
                  <option value="admin">{lt.roleAnalyticsOnly}</option>
                  <option value="super_admin">{lt.roleFullAccess}</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={adminActionLoading}
                className="w-full py-2 bg-stone-900 hover:bg-stone-850 text-white font-mono text-xs font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{adminActionLoading ? lt.btnProcessing : lt.btnAddAdmin}</span>
              </button>
            </form>

            {/* List of admins */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-600">
                {lt.currentAdminsTitle} ({adminsList.length})
              </h4>

              <div className="border border-[#EFECE6] rounded overflow-hidden">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F3] border-b border-[#E6E2D5] text-[10px] text-stone-400 uppercase tracking-wider">
                      <th className="p-3">{lt.colEmail}</th>
                      <th className="p-3">{lt.colRole}</th>
                      <th className="p-3">{lt.colAddedAt}</th>
                      <th className="p-3 text-right">{lt.colActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFECE6]">
                    {adminsList.map((adminUser) => {
                      const isSelf = adminUser.email.toLowerCase() === currentUser?.email?.toLowerCase();
                      return (
                        <tr key={adminUser.email} className="hover:bg-stone-50/50">
                          <td className="p-3 font-semibold text-stone-850">
                            {adminUser.email}
                            {isSelf && (
                              <span className="ml-2 px-1.5 py-0.5 bg-stone-100 text-[8px] text-stone-500 rounded uppercase tracking-wider font-bold">
                                {lt.youLabel}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold ${
                              adminUser.role === "super_admin" 
                                ? "bg-stone-900 text-white" 
                                : "bg-stone-100 text-stone-800"
                            }`}>
                              {adminUser.role === "super_admin" ? "Super Admin" : "Admin"}
                            </span>
                          </td>
                          <td className="p-3 text-stone-400 text-[10px]">
                            {adminUser.createdAt ? new Date(adminUser.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveAdmin(adminUser.email)}
                              disabled={isSelf || adminActionLoading}
                              className={`p-1 text-stone-400 hover:text-red-700 rounded transition-colors disabled:opacity-30 disabled:hover:text-stone-400 cursor-pointer`}
                              title={isSelf ? lt.cannotRemoveSelf : lt.removeTooltip}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          {/* Stat counters */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white border border-[#E6E2D5] rounded p-4 text-center">
              <span className="block text-[9px] font-mono uppercase tracking-wider text-stone-400 font-bold">Total</span>
              <span className="text-2xl font-serif font-bold text-stone-900">{feedbackStats.total}</span>
            </div>
            <div className="bg-white border border-[#E6E2D5] rounded p-4 text-center">
              <span className="block text-[9px] font-mono uppercase tracking-wider text-red-500 font-bold">Bugs</span>
              <span className="text-2xl font-serif font-bold text-red-700">{feedbackStats.bugs}</span>
            </div>
            <div className="bg-white border border-[#E6E2D5] rounded p-4 text-center">
              <span className="block text-[9px] font-mono uppercase tracking-wider text-blue-500 font-bold">Suggestions</span>
              <span className="text-2xl font-serif font-bold text-blue-700">{feedbackStats.suggestions}</span>
            </div>
            <div className="bg-white border border-[#E6E2D5] rounded p-4 text-center">
              <span className="block text-[9px] font-mono uppercase tracking-wider text-amber-500 font-bold">Questions</span>
              <span className="text-2xl font-serif font-bold text-amber-700">{feedbackStats.questions}</span>
            </div>
            <div className="bg-white border border-[#E6E2D5] rounded p-4 text-center">
              <span className="block text-[9px] font-mono uppercase tracking-wider text-emerald-500 font-bold">Ideas</span>
              <span className="text-2xl font-serif font-bold text-emerald-700">{feedbackStats.ideas}</span>
            </div>
          </div>

          {/* Filter and search bar */}
          <div className="bg-white border border-[#E6E2D5] rounded p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-stone-550 font-mono">
                <Filter className="w-3.5 h-3.5" />
                <span>Filters:</span>
              </div>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-white border border-[#DDD9CE] rounded px-2.5 py-1 text-xs font-sans text-stone-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="bug">Bug Report</option>
                <option value="suggestion">Suggestion</option>
                <option value="question">Question</option>
                <option value="idea">Idea</option>
                <option value="other">Other</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-[#DDD9CE] rounded px-2.5 py-1 text-xs font-sans text-stone-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="w-full md:w-72">
              <input
                type="text"
                placeholder="Search email, title or content..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs font-sans text-stone-800 focus:outline-none focus:border-stone-500"
              />
            </div>
          </div>

          {/* Main split-view or grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left List Column */}
            <div className="lg:col-span-2 bg-white border border-[#E6E2D5] rounded overflow-hidden flex flex-col max-h-[600px]">
              <div className="p-3 bg-[#FAF8F3] border-b border-[#E6E2D5] font-mono text-[10px] text-stone-500 uppercase tracking-wider font-bold">
                Feedback Inbox ({filteredFeedbacks.length})
              </div>

              {feedbacksLoading ? (
                <div className="py-20 text-center flex-1 flex flex-col justify-center items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-stone-400" />
                  <span className="text-xs font-mono text-stone-400">Loading feedback entries...</span>
                </div>
              ) : filteredFeedbacks.length === 0 ? (
                <div className="py-20 text-center text-xs text-stone-400 italic flex-1 flex flex-col justify-center">
                  No matching submissions found.
                </div>
              ) : (
                <div className="overflow-y-auto divide-y divide-[#EFECE6] flex-1">
                  {filteredFeedbacks.map((f) => {
                    const isSelected = selectedFeedback?.id === f.id;
                    const statusColors =
                      f.status === "new" ? "bg-amber-50 border-amber-200 text-amber-800" :
                      f.status === "review" ? "bg-blue-50 border-blue-200 text-blue-800" :
                      f.status === "resolved" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                      "bg-stone-100 border-stone-200 text-stone-600";

                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          setSelectedFeedback(f);
                          setAdminNotesText(f.adminNotes || "");
                        }}
                        className={`w-full text-left p-4 hover:bg-[#FAF8F3]/50 transition-colors cursor-pointer flex flex-col gap-2 relative ${
                          isSelected ? "bg-[#FAF8F3] border-r-2 border-stone-900" : ""
                        }`}
                      >
                        <div className="flex justify-between items-center w-full gap-2">
                          <span className="text-[10px] font-bold font-mono uppercase bg-stone-100 border border-stone-200 text-stone-700 px-1.5 py-0.5 rounded">
                            {f.category}
                          </span>
                          <span className={`text-[9px] font-bold font-mono uppercase border px-1.5 py-0.5 rounded ${statusColors}`}>
                            {f.status}
                          </span>
                        </div>

                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-stone-900 line-clamp-1">{f.title}</h4>
                          <p className="text-[10px] text-stone-500 font-mono line-clamp-1">{f.userEmail}</p>
                        </div>

                        <div className="flex justify-between items-center w-full text-[9px] text-stone-400 font-mono mt-1 pt-1 border-t border-stone-100">
                          <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                          {f.attachment && <span className="text-emerald-600 flex items-center gap-0.5">📎 Has Image</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Detail Column */}
            <div className="lg:col-span-3 bg-white border border-[#E6E2D5] rounded p-6 flex flex-col gap-6 min-h-[400px]">
              {selectedFeedback ? (
                <div className="space-y-6 animate-fadeIn flex-1 flex flex-col">
                  {/* Detail Header */}
                  <div className="border-b border-[#E6E2D5] pb-4 space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold">Subject / Title</span>
                        <h3 className="text-xs font-bold text-stone-900 leading-snug">{selectedFeedback.title}</h3>
                      </div>
                      <span className="text-[10px] font-mono text-stone-400 whitespace-nowrap bg-stone-50 px-2 py-1 rounded border border-stone-200">
                        ID: {selectedFeedback.id.slice(0, 8)}...
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1 text-xs">
                      <div>
                        <span className="block text-[9px] font-mono text-stone-400 uppercase">From User</span>
                        <span className="font-mono text-[11px] text-stone-855 font-semibold">{selectedFeedback.userEmail}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-mono text-stone-400 uppercase">Submitted on</span>
                        <span className="text-[11px] text-stone-650">{new Date(selectedFeedback.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Content */}
                  <div className="space-y-2 flex-1">
                    <span className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold">Feedback Description</span>
                    <p className="text-xs text-stone-800 leading-relaxed whitespace-pre-wrap font-sans bg-[#FAF8F3] p-4 rounded border border-[#EFECE6]">
                      {selectedFeedback.description}
                    </p>

                    {/* Screenshot Attachment */}
                    {selectedFeedback.attachment && (
                      <div className="pt-2">
                        <span className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold mb-1">Screenshot Uploaded</span>
                        <div className="border border-[#E6E2D5] rounded overflow-hidden max-w-sm">
                          <img
                            src={selectedFeedback.attachment}
                            alt="Screenshot submitted by user"
                            className="max-h-48 object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
                            onClick={() => {
                              const w = window.open();
                              w?.document.write(`<img src="${selectedFeedback.attachment}" style="max-width:100%;" />`);
                            }}
                          />
                          <div className="bg-[#FAF8F3] px-3 py-1.5 border-t border-[#E6E2D5] text-[10px] font-mono text-stone-500 flex justify-between items-center">
                            <span>Click image to view in new window</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Environmental Metadata */}
                  <div className="bg-[#FAF8F3] border border-[#E6E2D5] rounded p-4 space-y-3 font-mono text-[10px]">
                    <h5 className="font-bold uppercase tracking-widest text-stone-500">Diagnostic Context</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-stone-600">
                      <div><span className="text-stone-400">Browser:</span> {selectedFeedback.browser}</div>
                      <div><span className="text-stone-400">OS:</span> {selectedFeedback.os}</div>
                      <div><span className="text-stone-400">Language:</span> {selectedFeedback.language}</div>
                      <div><span className="text-stone-400">App Version:</span> {selectedFeedback.appVersion || "1.0.0"}</div>
                      <div><span className="text-stone-400">Active Notebook:</span> {selectedFeedback.notebookId || "None"}</div>
                      <div><span className="text-stone-400">Module Context:</span> {selectedFeedback.module || "None"}</div>
                      <div><span className="text-stone-400">Contact Authorized:</span> {selectedFeedback.emailConsent ? "Yes" : "No"}</div>
                    </div>
                  </div>

                  {/* Status Update & Internal Notes Area */}
                  <div className="border-t border-[#E6E2D5] pt-4 space-y-4 font-sans">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold">Feedback Status</label>
                        <select
                          value={selectedFeedback.status}
                          onChange={(e) => handleUpdateFeedback(selectedFeedback.id, e.target.value as any, adminNotesText)}
                          disabled={statusUpdatingId === selectedFeedback.id}
                          className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs text-stone-800 focus:outline-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="new">New</option>
                          <option value="review">Under Review</option>
                          <option value="resolved">Resolved</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                      
                      <div className="md:col-span-2 pt-4 md:pt-0 flex items-center justify-end">
                        {notesSaveSuccess && (
                          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded flex items-center gap-1.5 animate-fadeIn">
                            <Check className="w-3.5 h-3.5" />
                            <span>Changes saved successfully</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold">Internal Notes</label>
                      <textarea
                        rows={3}
                        placeholder="Write team response, notes on fix progress, or diagnostic records here..."
                        value={adminNotesText}
                        onChange={(e) => setAdminNotesText(e.target.value)}
                        className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs text-stone-850 focus:outline-none focus:border-stone-500 font-sans"
                      />
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateFeedback(selectedFeedback.id, selectedFeedback.status, adminNotesText)}
                          disabled={statusUpdatingId === selectedFeedback.id}
                          className="px-4 py-1.5 bg-stone-900 hover:bg-stone-850 disabled:opacity-50 text-white font-mono text-[10px] uppercase font-bold rounded cursor-pointer transition-colors flex items-center gap-1.5"
                        >
                          {statusUpdatingId === selectedFeedback.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Save Notes</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-stone-400 py-20 gap-2">
                  <MessageSquare className="w-8 h-8 text-stone-300" />
                  <p className="text-xs font-mono uppercase tracking-widest">Select a feedback entry from the inbox list to inspect details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
