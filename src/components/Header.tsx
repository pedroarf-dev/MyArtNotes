import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ActiveTab } from "../types";
import { 
  BookOpen, 
  Compass, 
  GitBranch, 
  Archive, 
  Sparkles, 
  Clock, 
  LogOut, 
  BarChart, 
  Bell, 
  Search,
  User,
  Settings,
  Shield,
  ChevronDown,
  X,
  Info,
  Home,
  Download,
  Check,
  AlertCircle,
  Loader2,
  Layout,
  Palette
} from "lucide-react";
import { useTranslation } from "../lib/i18n";
import InfoPopover, { PopoverModuleId } from "./InfoPopover";
import { useResearch } from "../context/ResearchContext";


interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  journalCount: number;
  conceptCount: number;
  productionsCount?: number;
  user: any;
  onSignOut: () => void;
  adminRole: "super_admin" | "admin" | null;
  onSignIn?: () => void;
  isSigningIn?: boolean;
}

const localTranslations = {
  pt: {
    profile: "Meu Perfil",
    settings: "Configurações",
    language: "Idioma / Language",
    admin: "Ambiente Admin",
    logout: "Fechar Caderno",
    profileTitle: "Perfil do Artista",
    settingsTitle: "Configurações do Estúdio",
    role: "Função no Sistema",
    superAdmin: "Administrador Master",
    adminRole: "Administrador de Métricas",
    regularUser: "Artista",
    joined: "Membro desde",
    close: "Fechar",
    selectLanguage: "Selecione o Idioma",
    soundEffects: "Efeitos Sonoros",
    on: "Ativado",
    off: "Desativado",
    defaultTab: "Página Inicial Padrão",
    resetData: "Redefinir Dados",
    resetWarning: "Aviso: Isso limpará suas preferências locais no navegador.",
    resetSuccess: "Notebook redefinido com sucesso!",
    connectionStatus: "Status de Conexão",
    connected: "Conectado à nuvem MyArtNotes",
    notConnected: "Não conectado"
  },
  en: {
    profile: "My Profile",
    settings: "Settings",
    language: "Language / Idioma",
    admin: "Admin Environment",
    logout: "Close Notebook",
    profileTitle: "Artist Profile",
    settingsTitle: "Studio Settings",
    role: "System Role",
    superAdmin: "Master Administrator",
    adminRole: "Metrics Administrator",
    regularUser: "Artist",
    joined: "Member since",
    close: "Close",
    selectLanguage: "Select Language",
    soundEffects: "Sound Effects",
    on: "Enabled",
    off: "Disabled",
    defaultTab: "Default Landing Page",
    resetData: "Reset Data",
    resetWarning: "Warning: This will clear your local browser session preferences.",
    resetSuccess: "Notebook successfully reset!",
    connectionStatus: "Connection Status",
    connected: "Connected to MyArtNotes cloud",
    notConnected: "Not connected"
  }
};

export default function Header({
  activeTab,
  setActiveTab,
  journalCount,
  conceptCount,
  productionsCount = 0,
  user,
  onSignOut,
  adminRole,
  onSignIn,
  isSigningIn
}: HeaderProps) {
  const { t, locale, setLocale } = useTranslation();
  const { currentNotebook, notebooks, switchNotebook, createNotebook } = useResearch();
  const [isBreadcrumbOpen, setIsBreadcrumbOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalSubmitting, setCreateModalSubmitting] = useState(false);
  const [createModalError, setCreateModalError] = useState("");
  const [timeString, setTimeString] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; time: string; read: boolean }>>([
    {
      id: "welcome",
      text: locale === "en" 
        ? "Welcome to MyArtNotes! Your digital studio research notebook is ready." 
        : "Bem-vindo ao MyArtNotes! Seu caderno digital de pesquisa de ateliê está pronto.",
      time: "10m ago",
      read: false
    }
  ]);
  const [helpModule, setHelpModule] = useState<PopoverModuleId | null>(null);
  const [helpTrigger, setHelpTrigger] = useState<HTMLButtonElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const lt = locale === "en" ? localTranslations.en : localTranslations.pt;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000); // 1 minute interval for quiet display
    return () => clearInterval(interval);
  }, []);

  // Handle dropdown outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const pContainer = document.getElementById("profile-dropdown-container");
      if (pContainer && !pContainer.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      const nContainer = document.getElementById("notifications-dropdown-container");
      if (nContainer && !nContainer.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    if (isDropdownOpen || isNotifOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isDropdownOpen, isNotifOpen]);

  // Handle Escape key for Create Notebook Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCreateModalOpen(false);
      }
    };
    if (isCreateModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCreateModalOpen]);

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "home", label: t.tabHome, icon: <Home className="w-4 h-4" /> },
    { id: "journal", label: t.tabJournal, icon: <BookOpen className="w-4 h-4" />, count: journalCount },
    { id: "lab", label: t.tabLab, icon: <Compass className="w-4 h-4" />, count: conceptCount },
    { id: "map", label: t.tabConceptMap, icon: <GitBranch className="w-4 h-4" /> },
    { id: "timeline", label: t.tabTimeline, icon: <Archive className="w-4 h-4" /> },
    { id: "insights", label: t.tabInsights, icon: <Sparkles className="w-4 h-4 text-stone-500" /> },
    { id: "export", label: t.tabExport, icon: <Download className="w-4 h-4 text-stone-500" /> },
    { id: "productions", label: locale === "en" ? "Productions" : "Produções", icon: <Palette className="w-4 h-4 text-stone-500" />, count: productionsCount },
    { id: "portfolio", label: locale === "en" ? "Portfolio" : "Portfólio", icon: <Layout className="w-4 h-4 text-stone-500" /> }
  ];

  const handleResetPreferences = () => {
    if (window.confirm(lt.resetWarning)) {
      localStorage.removeItem("atlas_locale");
      alert(lt.resetSuccess);
      window.location.reload();
    }
  };

  return (
    <header className="border-b border-[#E6E2D5] bg-[#FAF8F3] px-8 md:px-12 py-5 flex flex-col md:flex-row md:items-center justify-between gap-5 sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
      <div className="flex items-center justify-between md:justify-start gap-6">
        <button
          onClick={() => setActiveTab("home")}
          className="flex items-center gap-3 text-left focus:outline-none cursor-pointer hover:opacity-85 transition-all select-none group"
          id="header-logo-btn"
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-serif font-bold tracking-[0.2em] text-stone-950 uppercase group-hover:text-stone-800 transition-colors">
                {t.appName}
              </h1>
            </div>
            <p className="text-[8px] font-mono text-stone-400 uppercase tracking-[0.25em] mt-1">
              {locale === "en" ? "Artistic Research Notebook" : "Caderno de Pesquisa Artística"}
            </p>
          </div>
        </button>

        {/* TODO: Relocate Notebook Selector into Artist Profile after beta testing */}
        <div className="relative">
          <button
            onClick={() => setIsBreadcrumbOpen(!isBreadcrumbOpen)}
            className="hidden sm:flex items-center gap-2 font-mono text-[9px] text-stone-450 select-none border-l border-[#E6E2D5] pl-5 h-8 cursor-pointer hover:text-stone-900 transition-colors"
          >
            <span className="text-stone-300 font-light">↓</span>
            <span className="text-stone-600 bg-[#FCFAF7] px-2.5 py-1 border border-[#DDD9CE] hover:border-stone-350 rounded-xs max-w-[280px] truncate flex items-center gap-1.5 transition-all text-[10px]">
              <span className="truncate font-semibold">{locale === "en" ? "My Notebooks" : "Meus Cadernos"}</span>
              <span className="text-[7px] text-stone-400">▼</span>
            </span>
          </button>

          {isBreadcrumbOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setIsBreadcrumbOpen(false)} />
              
              {/* Dropdown Menu */}
              <div className="absolute left-3 top-9 z-50 w-64 bg-white border border-[#E6E2D5] rounded shadow-lg p-3 space-y-3 font-sans animate-fadeIn text-stone-850">
                {notebooks.length === 0 ? (
                  /* Elegant Empty State */
                  <div className="text-center py-4 px-2 space-y-3">
                    <p className="text-xs text-stone-500 font-serif italic">
                      {locale === "en" ? "No research notebooks yet." : "Nenhum caderno de pesquisa ainda."}
                    </p>
                    <button
                      onClick={() => {
                        setIsBreadcrumbOpen(false);
                        setCreateModalError("");
                        setIsCreateModalOpen(true);
                      }}
                      className="w-full text-center px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white font-mono text-[10px] uppercase tracking-wider font-bold rounded cursor-pointer transition-colors"
                    >
                      {locale === "en" ? "Create New Notebook" : "Criar Novo Caderno"}
                    </button>
                  </div>
                ) : (
                  /* Existing Notebooks State */
                  <>
                    {/* Active Notebook */}
                    <div className="space-y-1.5">
                      <span className="block text-[8px] font-mono text-stone-400 uppercase tracking-widest font-bold">
                        {locale === "en" ? "Active Notebook" : "Caderno Ativo"}
                      </span>
                      {currentNotebook ? (
                        <div className="w-full text-left px-2 py-1.5 rounded text-[11px] bg-stone-100 text-stone-900 font-bold flex items-center justify-between gap-2 border border-stone-200">
                          <span className="truncate flex items-center gap-1.5">
                            <span className="truncate">{currentNotebook.title}</span>
                            {currentNotebook.isDemo && (
                              <span className="px-1 py-0.5 bg-amber-100 text-amber-800 text-[7px] font-mono uppercase tracking-wider rounded border border-amber-200 shrink-0">
                                {locale === "en" ? "Demo" : "Demo"}
                              </span>
                            )}
                          </span>
                          <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                        </div>
                      ) : (
                        <p className="text-[11px] text-stone-400 italic px-1">
                          {locale === "en" ? "No active notebook" : "Nenhum caderno ativo"}
                        </p>
                      )}
                    </div>

                    {/* Other Notebooks */}
                    <div className="space-y-1.5 pt-1">
                      <span className="block text-[8px] font-mono text-stone-400 uppercase tracking-widest font-bold">
                        {locale === "en" ? "Other Notebooks" : "Outros Cadernos"}
                      </span>
                      {notebooks.filter(nb => nb.id !== currentNotebook?.id && nb.status === "active").length === 0 ? (
                        <p className="text-[11px] text-stone-400 italic px-1">
                          {locale === "en" ? "No other active notebooks" : "Nenhum outro caderno ativo"}
                        </p>
                      ) : (
                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                          {notebooks
                            .filter(nb => nb.id !== currentNotebook?.id && nb.status === "active")
                            .sort((a, b) => {
                              if (a.favorite && !b.favorite) return -1;
                              if (!a.favorite && b.favorite) return 1;
                              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                            })
                            .map(nb => (
                              <button
                                key={nb.id}
                                onClick={() => {
                                  switchNotebook(nb.id);
                                  setIsBreadcrumbOpen(false);
                                  setActiveTab("home");
                                }}
                                className="w-full text-left px-2 py-1.5 rounded text-[11px] text-stone-650 hover:bg-stone-50 transition-colors flex items-center justify-between gap-2"
                              >
                                <span className="truncate flex items-center gap-1.5">
                                  <span className="truncate">{nb.title}</span>
                                  {nb.isDemo && (
                                    <span className="px-1 py-0.5 bg-amber-100 text-amber-800 text-[7px] font-mono uppercase tracking-wider rounded border border-amber-200 shrink-0">
                                      {locale === "en" ? "Demo" : "Demo"}
                                    </span>
                                  )}
                                </span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Separator */}
                    <div className="h-[1px] bg-stone-100 my-2" />

                    {/* Actions */}
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setIsBreadcrumbOpen(false);
                          setCreateModalError("");
                          setIsCreateModalOpen(true);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded text-[11px] text-stone-750 hover:bg-stone-50 transition-colors flex items-center gap-1.5 font-mono uppercase tracking-wider font-bold cursor-pointer animate-fadeIn"
                      >
                        <span className="text-stone-400 font-normal">+</span>
                        <span>{locale === "en" ? "Create New Notebook" : "Criar Novo Caderno"}</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsBreadcrumbOpen(false);
                          setActiveTab("profile");
                        }}
                        className="w-full text-left px-2 py-1.5 rounded text-[11px] text-stone-750 hover:bg-stone-50 transition-colors flex items-center gap-1.5 font-mono uppercase tracking-wider font-bold cursor-pointer"
                      >
                        <User className="w-3 h-3 text-stone-400" />
                        <span>{locale === "en" ? "Manage Notebooks..." : "Gerenciar Cadernos..."}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <nav className="flex flex-wrap gap-5 md:gap-8 items-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <div 
              key={tab.id} 
              className={`flex items-center gap-1.5 py-1.5 border-b-[1.5px] transition-all duration-300 ${
                isActive ? "border-stone-950 translate-y-[1px]" : "border-transparent hover:border-stone-300"
              }`}
            >
              <button
                id={`tab-btn-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "map") {
                    localStorage.setItem("atlas_onboarding_visited_map", "true");
                  }
                }}
                className={`flex items-center gap-1 cursor-pointer transition-colors duration-200 ${
                  isActive
                    ? "text-stone-950 font-semibold"
                    : "text-stone-400 hover:text-stone-800"
                }`}
              >
                <span className="font-mono tracking-[0.18em] uppercase text-[9px]">{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="text-[8px] font-mono text-stone-400 align-super ml-0.5 font-light">
                    [{tab.count}]
                  </span>
                )}
              </button>
              <button
                id={`help-btn-${tab.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setHelpTrigger(e.currentTarget);
                  setHelpModule(tab.id === "map" ? "map" : tab.id as any);
                }}
                className="p-0.5 rounded-full text-stone-300 hover:text-stone-700 hover:bg-stone-100/50 transition-colors cursor-pointer"
                title={locale === "en" ? "Learn more" : "Saiba mais"}
              >
                <Info className="w-2.5 h-2.5 stroke-[1.5]" />
              </button>
            </div>
          );
        })}
      </nav>

      {/* User Info & Actions */}
      <div className="flex items-center justify-between md:justify-end gap-5">
        {/* Mock Search and Bell for Catalog design completeness */}
        <div className="flex items-center gap-4 border-r border-[#E6E2D5] pr-4 text-stone-500">
          <button className="hover:text-stone-900 transition-colors cursor-pointer" title={locale === "en" ? "Search" : "Buscar"}>
            <Search className="w-4 h-4 stroke-[1.5]" />
          </button>
          <div className="relative" id="notifications-dropdown-container">
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsDropdownOpen(false);
              }}
              className="hover:text-stone-900 transition-colors cursor-pointer"
              title={locale === "en" ? "Notifications" : "Notificações"}
            >
              <Bell className="w-4 h-4 stroke-[1.5]" />
            </button>
            {notifications.some(n => !n.read) && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-700 rounded-full animate-pulse" />
            )}

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E6E2D5] rounded shadow-lg z-50 overflow-hidden py-1">
                <div className="px-4 py-2 border-b border-[#FAF8F3] bg-[#FAF8F3] flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-stone-900 uppercase tracking-wider">
                    {locale === "en" ? "Notifications" : "Notificações"}
                  </span>
                  {notifications.some(n => !n.read) && (
                    <button 
                      onClick={() => {
                        setNotifications(notifications.map(n => ({ ...n, read: true })));
                      }}
                      className="text-[9px] font-mono text-amber-700 hover:text-amber-950 cursor-pointer"
                    >
                      {locale === "en" ? "Mark all as read" : "Ler todas"}
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-[#FAF8F3] custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div key={notif.id} className={`px-4 py-2.5 hover:bg-[#FAF8F3] transition-colors flex flex-col gap-1 ${notif.read ? "opacity-60" : ""}`}>
                        <p className="text-xs text-stone-850 leading-relaxed font-sans">
                          {notif.text}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-stone-400">{notif.time}</span>
                          {!notif.read && (
                            <button
                              onClick={() => {
                                setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
                              }}
                              className="text-[9px] font-mono text-stone-500 hover:text-stone-900 cursor-pointer border border-[#DDD9CE] px-1.5 py-0.5 rounded bg-white hover:bg-stone-50"
                            >
                              {locale === "en" ? "Dismiss" : "Dispensar"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-stone-400 font-mono text-[10px]">
                      {locale === "en" ? "You have no notifications." : "Você não tem notificações."}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {user && (
          <div className="relative pl-1" id="profile-dropdown-container">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 border border-[#DDD9CE] hover:border-stone-400 bg-white rounded-sm transition-all duration-300 cursor-pointer text-left"
              title={user.email}
            >
              <div className="w-5 h-5 rounded-sm bg-stone-100 border border-[#DDD9CE] flex items-center justify-center text-[9px] font-mono font-semibold text-stone-600 uppercase">
                {user.email ? user.email.slice(0, 2) : "PA"}
              </div>
              <span className="font-mono text-[9px] text-stone-500 uppercase tracking-wider truncate max-w-[90px]">
                {user.email ? user.email.split("@")[0] : "pedroarf"}
              </span>
              <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E6E2D5] rounded shadow-lg z-50 overflow-hidden py-1">
                {/* Header info */}
                <div className="px-4 py-2.5 border-b border-[#FAF8F3] bg-[#FAF8F3]">
                  <p className="text-[8px] font-mono text-stone-400 uppercase tracking-wider">
                    {lt.role}
                  </p>
                  <p className="text-[11px] font-mono font-bold text-stone-900 mt-0.5 truncate">
                    {user.email}
                  </p>
                  {adminRole && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-stone-900 text-[8px] font-mono font-bold text-white uppercase tracking-wider rounded">
                      {adminRole === "super_admin" ? lt.superAdmin : lt.adminRole}
                    </span>
                  )}
                </div>

                {/* Menu items */}
                <div className="divide-y divide-[#FAF8F3]">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setActiveTab("profile");
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-mono text-stone-700 hover:bg-[#FAF8F3] hover:text-stone-950 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-stone-500" />
                      <span>{lt.profile}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setActiveTab("getting-started");
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-mono text-stone-700 hover:bg-[#FAF8F3] hover:text-stone-950 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                      <span>{locale === "en" ? "Getting Started" : "Primeiros Passos"}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setActiveTab("settings");
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-mono text-stone-700 hover:bg-[#FAF8F3] hover:text-stone-950 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-stone-500" />
                      <span>{lt.settings}</span>
                    </button>
                  </div>

                  {/* Language direct inline switch inside dropdown */}
                  <div className="px-4 py-2">
                    <p className="text-[9px] font-mono text-stone-400 uppercase tracking-widest mb-1.5">
                      {lt.language}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setLocale("pt")}
                        className={`flex-1 text-center py-1 text-[9px] font-mono rounded font-bold cursor-pointer transition-colors border ${
                          locale === "pt"
                            ? "bg-stone-900 border-stone-900 text-white"
                            : "bg-white border-[#DDD9CE] text-stone-500 hover:text-stone-955"
                        }`}
                      >
                        PT
                      </button>
                      <button
                        onClick={() => setLocale("en")}
                        className={`flex-1 text-center py-1 text-[9px] font-mono rounded font-bold cursor-pointer transition-colors border ${
                          locale === "en"
                            ? "bg-stone-900 border-stone-900 text-white"
                            : "text-stone-500 hover:text-stone-955"
                        }`}
                      >
                        EN
                      </button>
                    </div>
                  </div>

                  {/* Admin section link */}
                  {adminRole && (
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setActiveTab("admin");
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                          activeTab === "admin"
                            ? "bg-[#EFECE6] text-stone-950"
                            : "text-stone-800 hover:bg-stone-50 hover:text-stone-955"
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-700" />
                        <span>{lt.admin}</span>
                      </button>
                    </div>
                  )}

                  {/* Logout section */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onSignOut();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-mono text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{lt.logout}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {!user && (
          <div className="relative pl-1">
            <button
              onClick={onSignIn}
              disabled={isSigningIn}
              className="flex items-center gap-2 px-3 py-1.5 border border-[#DDD9CE] hover:border-stone-400 bg-stone-900 hover:bg-stone-850 text-white rounded-sm font-mono text-[9px] uppercase tracking-wider font-bold transition-all duration-300 cursor-pointer disabled:opacity-75"
            >
              {isSigningIn ? (
                <Loader2 className="w-3 h-3 animate-spin text-stone-350" />
              ) : (
                <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{locale === "en" ? "Sign In" : "Acessar"}</span>
            </button>
          </div>
        )}
      </div>

      <InfoPopover 
        isOpen={!!helpModule} 
        onClose={() => setHelpModule(null)} 
        moduleId={helpModule || "journal"} 
        triggerEl={helpTrigger}
      />

      {/* Create Notebook Editorial Modal */}
      {isCreateModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/45 backdrop-blur-xs overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCreateModalOpen(false);
            }
          }}
        >
          <div className="max-w-md w-full bg-[#FCFAF7] border border-[#DDD9CE] rounded-lg p-6 shadow-2xl space-y-5 animate-fadeIn font-sans text-stone-850 max-h-[calc(100vh-3rem)] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-mono font-bold text-stone-950 uppercase tracking-widest">
                {locale === "en" ? "New Research Notebook" : "Novo Caderno de Pesquisa"}
              </h3>
              <button 
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createModalError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded flex items-start gap-2 text-red-700 text-[11px] leading-normal">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{createModalError}</span>
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const titleInput = form.elements.namedItem("nb_title") as HTMLInputElement;
              const subtitleInput = form.elements.namedItem("nb_subtitle") as HTMLInputElement;
              const descInput = form.elements.namedItem("nb_desc") as HTMLTextAreaElement;
              const langInput = form.elements.namedItem("nb_lang") as HTMLSelectElement;

              const titleVal = titleInput.value.trim();
              if (!titleVal) {
                setCreateModalError(locale === "en" ? "Title is required" : "Título é obrigatório");
                return;
              }

              try {
                setCreateModalSubmitting(true);
                setCreateModalError("");
                await createNotebook(
                  titleVal,
                  subtitleInput.value.trim(),
                  descInput.value.trim(),
                  langInput.value as "en" | "pt"
                );
                setIsCreateModalOpen(false);
                setActiveTab("home");
              } catch (err) {
                console.error("Error creating notebook from Header modal:", err);
                setCreateModalError(
                  locale === "en" 
                    ? "Failed to create notebook. Please verify your connection." 
                    : "Falha ao criar caderno. Verifique sua conexão."
                );
              } finally {
                setCreateModalSubmitting(false);
              }
            }} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-widest font-bold mb-1">
                  {locale === "en" ? "Title" : "Título"} *
                </label>
                <input
                  name="nb_title"
                  type="text"
                  required
                  placeholder={locale === "en" ? "E.g., Immigration, Memory..." : "Ex: Imigração, Memória..."}
                  className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-widest font-bold mb-1">
                  {locale === "en" ? "Subtitle (Optional)" : "Subtítulo (Opcional)"}
                </label>
                <input
                  name="nb_subtitle"
                  type="text"
                  placeholder={locale === "en" ? "E.g., Studio process log" : "Ex: Diário de ateliê"}
                  className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-widest font-bold mb-1">
                  {locale === "en" ? "Description" : "Descrição"}
                </label>
                <textarea
                  name="nb_desc"
                  rows={3}
                  placeholder={locale === "en" ? "Poetic scope, material inquiry..." : "Escopo poético, inquirições de materiais..."}
                  className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-widest font-bold mb-1">
                  {locale === "en" ? "Research Language" : "Idioma de Pesquisa"}
                </label>
                <select
                  name="nb_lang"
                  defaultValue={locale}
                  className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500"
                >
                  <option value="pt">Português (PT)</option>
                  <option value="en">English (EN)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 hover:bg-stone-50 text-stone-600 font-mono text-[10px] uppercase tracking-wider rounded font-bold cursor-pointer transition-colors"
                >
                  {locale === "en" ? "Cancel" : "Cancelar"}
                </button>
                <button
                  type="submit"
                  disabled={createModalSubmitting}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white font-mono text-[10px] uppercase tracking-wider rounded font-bold cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {createModalSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{locale === "en" ? "Create Notebook" : "Criar Caderno"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
