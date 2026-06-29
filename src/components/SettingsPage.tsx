import React, { useState } from "react";
import { Settings, ArrowLeft, Check, AlertCircle, Sparkles, Moon, Volume2 } from "lucide-react";
import { useTranslation } from "../lib/i18n";

interface SettingsPageProps {
  onBack: () => void;
  onDeleteDemoContent?: () => void;
}

export default function SettingsPage({ onBack, onDeleteDemoContent }: SettingsPageProps) {
  const { locale, setLocale, t } = useTranslation();
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Settings States
  const [soundEffects, setSoundEffects] = useState(true);
  const [landingTab, setLandingTab] = useState<"journal" | "lab">("journal");
  const [autoSave, setAutoSave] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleLangChange = (lang: "en" | "pt") => {
    setLocale(lang);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleToggleSound = () => {
    setSoundEffects(!soundEffects);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleToggleAutoSave = () => {
    setAutoSave(!autoSave);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleLandingTabChange = (tab: "journal" | "lab") => {
    setLandingTab(tab);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6 animate-fadeIn">
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
            <Settings className="w-4 h-4 text-stone-850" />
            <span>{locale === "en" ? "Notebook Settings" : "Configurações do Caderno"}</span>
          </h2>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-3 bg-[#FAF8F3] border border-[#DDD9CE] rounded flex items-center gap-2 text-xs text-stone-800 font-mono">
          <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>{locale === "en" ? "Preferences updated in real-time." : "Preferências atualizadas em tempo real."}</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="bg-white rounded border border-[#E6E2D5] divide-y divide-[#E6E2D5]">
        
        {/* Section 1: Language */}
        <div className="p-6 md:p-8 space-y-4">
          <div>
            <h3 className="text-xs font-mono font-bold text-stone-900 uppercase tracking-wider">
              {locale === "en" ? "Language Preference" : "Preocupações de Idioma"}
            </h3>
            <p className="text-[11px] text-stone-500 font-sans mt-1">
              {locale === "en" 
                ? "Select your preferred workspace language. This will affect terms and AI synthesis alignments." 
                : "Selecione o idioma preferencial de sua área de trabalho. Afetará termos e alinhamentos de síntese por IA."}
            </p>
          </div>
          <div className="flex gap-2 max-w-md">
            <button
              onClick={() => handleLangChange("pt")}
              className={`flex-1 py-2 text-center text-xs font-mono font-bold border rounded transition-colors cursor-pointer ${
                locale === "pt"
                  ? "bg-stone-900 border-stone-900 text-white"
                  : "bg-white border-[#DDD9CE] text-stone-600 hover:text-stone-900"
              }`}
            >
              Português (PT)
            </button>
            <button
              onClick={() => handleLangChange("en")}
              className={`flex-1 py-2 text-center text-xs font-mono font-bold border rounded transition-colors cursor-pointer ${
                locale === "en"
                  ? "bg-stone-900 border-stone-900 text-white"
                  : "bg-white border-[#DDD9CE] text-stone-600 hover:text-stone-900"
              }`}
            >
              English (EN)
            </button>
          </div>
        </div>

        {/* Section 2: Appearance */}
        <div className="p-6 md:p-8 space-y-4">
          <div>
            <h3 className="text-xs font-mono font-bold text-stone-900 uppercase tracking-wider">
              {locale === "en" ? "Visual Theme / Appearance" : "Tema Visual / Aparência"}
            </h3>
            <p className="text-[11px] text-stone-500 font-sans mt-1">
              {locale === "en"
                ? "MyArtNotes utilizes a custom-designed eye-safe visual canvas. High contrast botanical slates are optimized for studio screens."
                : "MyArtNotes utiliza uma paleta visual sob medida e segura para a visão. Ocres e slates de alto contraste são otimizados para telas de ateliê."}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
            <div className="p-4 border border-stone-900 bg-[#FAF8F3] rounded flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-stone-900 uppercase block">
                  {locale === "en" ? "Warm Botanical (Default)" : "Botânico Quente (Padrão)"}
                </span>
                <span className="text-[9px] font-mono text-stone-400">
                  #FAF8F3 • HIGH CONTRAST
                </span>
              </div>
              <span className="w-2.5 h-2.5 bg-stone-900 rounded-full" />
            </div>

            <div className="p-4 border border-stone-200 bg-stone-50 rounded flex items-center justify-between opacity-50 cursor-not-allowed">
              <div>
                <span className="text-xs font-mono font-bold text-stone-400 uppercase block">
                  {locale === "en" ? "Atelier Dark (Coming soon)" : "Ateliê Escuro (Em breve)"}
                </span>
                <span className="text-[9px] font-mono text-stone-300">
                  #1C1917 • LOW SENSORY NOISE
                </span>
              </div>
              <Moon className="w-4 h-4 text-stone-300" />
            </div>
          </div>
        </div>

        {/* Section 3: Sensory Preferences & Sound */}
        <div className="p-6 md:p-8 space-y-4">
          <div>
            <h3 className="text-xs font-mono font-bold text-stone-900 uppercase tracking-wider">
              {locale === "en" ? "Workspace Experience" : "Experiência de Trabalho"}
            </h3>
            <p className="text-[11px] text-stone-500 font-sans mt-1">
              {locale === "en"
                ? "Configure auditory responses and automation to suit your creative rhythm."
                : "Configure as respostas auditivas e automação para se adequarem ao seu ritmo criativo."}
            </p>
          </div>
          <div className="space-y-3 max-w-lg">
            {/* Sound effects toggle */}
            <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded border border-stone-200">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-stone-500" />
                <div>
                  <span className="text-xs font-mono font-bold text-stone-800 block">
                    {locale === "en" ? "Acoustic Feedback" : "Efeitos Sonoros"}
                  </span>
                  <span className="text-[9px] text-stone-400 font-sans block mt-0.5">
                    {locale === "en" ? "Play subtle clicks on logs and links" : "Sons discretos ao registrar e tecer elos"}
                  </span>
                </div>
              </div>
              <button
                onClick={handleToggleSound}
                className={`px-3 py-1 border rounded font-mono text-[9px] font-bold cursor-pointer transition-colors ${
                  soundEffects
                    ? "bg-stone-900 border-stone-900 text-white"
                    : "bg-white border-stone-300 text-stone-400 hover:text-stone-850"
                }`}
              >
                {soundEffects ? (locale === "en" ? "ACTIVE" : "ATIVADO") : (locale === "en" ? "MUTED" : "DESATIVADO")}
              </button>
            </div>

            {/* Auto save drafts */}
            <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded border border-stone-200">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-stone-500" />
                <div>
                  <span className="text-xs font-mono font-bold text-stone-800 block">
                    {locale === "en" ? "AI Continuous Drafting" : "Rascunho Contínuo por IA"}
                  </span>
                  <span className="text-[9px] text-stone-400 font-sans block mt-0.5">
                    {locale === "en" ? "Preserve intermediate thoughts automatically" : "Preserva pensamentos intermediários automaticamente"}
                  </span>
                </div>
              </div>
              <button
                onClick={handleToggleAutoSave}
                className={`px-3 py-1 border rounded font-mono text-[9px] font-bold cursor-pointer transition-colors ${
                  autoSave
                    ? "bg-stone-900 border-stone-900 text-white"
                    : "bg-white border-stone-300 text-stone-400 hover:text-stone-850"
                }`}
              >
                {autoSave ? (locale === "en" ? "ACTIVE" : "ATIVADO") : (locale === "en" ? "INACTIVE" : "DESATIVADO")}
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Workspace Landing */}
        <div className="p-6 md:p-8 space-y-4">
          <div>
            <h3 className="text-xs font-mono font-bold text-stone-900 uppercase tracking-wider">
              {locale === "en" ? "Default Landing Module" : "Página de Entrada Padrão"}
            </h3>
            <p className="text-[11px] text-stone-500 font-sans mt-1">
              {locale === "en"
                ? "Decide which screen greets you upon opening your research notebook."
                : "Decida qual tela lhe dará as boas-vindas ao abrir seu caderno de pesquisa."}
            </p>
          </div>
          <div className="flex gap-2 max-w-md">
            <button
              onClick={() => handleLandingTabChange("journal")}
              className={`flex-1 py-2 text-center text-xs font-mono border rounded transition-colors cursor-pointer ${
                landingTab === "journal"
                  ? "bg-stone-900 border-stone-900 text-white font-bold"
                  : "bg-white border-[#DDD9CE] text-stone-600 hover:text-stone-900"
              }`}
            >
              {locale === "en" ? "STUDIO JOURNAL" : "DIÁRIO DE ATELIÊ"}
            </button>
            <button
              onClick={() => handleLandingTabChange("lab")}
              className={`flex-1 py-2 text-center text-xs font-mono border rounded transition-colors cursor-pointer ${
                landingTab === "lab"
                  ? "bg-stone-900 border-stone-900 text-white font-bold"
                  : "bg-white border-[#DDD9CE] text-stone-600 hover:text-stone-900"
              }`}
            >
              {locale === "en" ? "CONCEPT LAB" : "LAB CONCEITUAL"}
            </button>
          </div>
        </div>

        {/* Section 5: Demo Content Management */}
        {onDeleteDemoContent && (
          <div className="p-6 md:p-8 space-y-4">
            <div>
              <h3 className="text-xs font-mono font-bold text-stone-900 uppercase tracking-wider">
                {locale === "en" ? "Demo Content Management" : "Gerenciamento de Conteúdo de Demonstração"}
              </h3>
              <p className="text-[11px] text-stone-500 font-sans mt-1">
                {locale === "en"
                  ? "Clear the onboarding examples ('Estética da Impermanência' concept and related journal entry) from your workspace to begin on a clean slate."
                  : "Remova os exemplos de integração (conceito 'Estética da Impermanência' e registro de diário relacionado) do seu estúdio para começar com uma folha em branco."}
              </p>
            </div>
            <div>
              {!showConfirmDelete ? (
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="px-4 py-2 border border-red-200 text-red-700 hover:bg-red-50 text-xs font-mono uppercase tracking-wider rounded cursor-pointer transition-colors"
                >
                  {locale === "en" ? "Delete Demo Content" : "Excluir Conteúdo de Demonstração"}
                </button>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded space-y-3 max-w-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-mono font-bold text-red-900 uppercase block">
                        {locale === "en" ? "Confirm permanent removal" : "Confirmar remoção permanente"}
                      </span>
                      <p className="text-[10.5px] text-red-750 font-sans leading-relaxed mt-0.5">
                        {locale === "en"
                          ? "This will permanently remove the example concept and journal entries. Any custom files attached to them will also be cleared. This action cannot be undone."
                          : "Isso removerá permanentemente o conceito de exemplo e os registros do diário. Quaisquer arquivos personalizados anexados a eles também serão limpos. Essa ação não pode ser desfeita."}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end font-mono text-[10px] uppercase">
                    <button
                      onClick={() => setShowConfirmDelete(false)}
                      className="px-2.5 py-1 bg-white border border-[#DDD9CE] text-stone-600 rounded hover:text-stone-850 cursor-pointer"
                    >
                      {locale === "en" ? "Cancel" : "Cancelar"}
                    </button>
                    <button
                      onClick={() => {
                        onDeleteDemoContent();
                        setShowConfirmDelete(false);
                      }}
                      className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white font-bold rounded cursor-pointer transition-colors"
                    >
                      {locale === "en" ? "Yes, delete" : "Sim, excluir"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Footer Back */}
      <div className="flex justify-start">
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-stone-900 hover:bg-stone-850 text-white font-mono text-xs uppercase tracking-wider font-bold rounded cursor-pointer transition-colors"
        >
          {locale === "en" ? "Return to workspace" : "Retornar ao estúdio"}
        </button>
      </div>
    </div>
  );
}
