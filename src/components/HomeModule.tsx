import React, { useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "../lib/i18n";
import { JournalEntry, Concept, Insight, ActiveTab } from "../types";
import { useResearch } from "../context/ResearchContext";
import EditorialManifesto from "./EditorialManifesto";
import { 
  ArrowRight, 
  BookOpen, 
  Compass, 
  GitBranch, 
  Archive, 
  Sparkles, 
  Plus, 
  Layout, 
  Trash2, 
  Loader2, 
  AlertCircle,
  X,
  FileText
} from "lucide-react";

interface HomeModuleProps {
  entries: JournalEntry[];
  concepts: Concept[];
  insights: Insight[];
  onNavigate: (tab: ActiveTab) => void;
  onStartFirstEntry: () => void;
  onCreateDemoNotebook?: () => Promise<void>;
  onDeleteDemoNotebook?: (notebookId: string) => Promise<void>;
}

export default function HomeModule({
  entries,
  concepts,
  insights,
  onNavigate,
  onStartFirstEntry,
  onCreateDemoNotebook,
  onDeleteDemoNotebook
}: HomeModuleProps) {
  const { locale, t } = useTranslation();
  const { currentNotebook, notebooks, createNotebook } = useResearch();

  const [isHomeCreateOpen, setIsHomeCreateOpen] = useState(false);
  const [isHomeSubmitting, setIsHomeSubmitting] = useState(false);
  const [homeCreateError, setHomeCreateError] = useState("");
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);

  // Find the latest items
  const latestEntry = entries.length > 0 
    ? [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  const latestConcept = concepts.length > 0
    ? [...concepts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  const latestInsight = insights.length > 0
    ? [...insights].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  const handleTriggerDemo = async () => {
    if (!onCreateDemoNotebook) return;
    setIsGeneratingDemo(true);
    try {
      await onCreateDemoNotebook();
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  const handleDeleteDemo = async () => {
    if (!onDeleteDemoNotebook || !currentNotebook) return;
    try {
      await onDeleteDemoNotebook(currentNotebook.id);
    } catch (err) {
      console.error(err);
    }
  };

  // Visual botanical separator
  const BotanicalAccent = () => (
    <div className="flex items-center justify-center gap-3 my-14 text-stone-300">
      <div className="h-[1px] w-16 bg-stone-200"></div>
      <span className="text-stone-400 font-serif text-base">❧</span>
      <div className="h-[1px] w-16 bg-stone-200"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 md:px-8 space-y-20 animate-fadeIn font-sans selection:bg-[#EFECE6] text-stone-850">
      
      {/* SECTION 1: Covered Page of Artistic Research Notebook */}
      {currentNotebook ? (
        <motion.section 
          className="border border-[#E6E2D5] bg-white rounded-sm p-8 md:p-12 relative shadow-2xs space-y-8"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          id="home-cover-section"
        >
          {/* Cover Header Details */}
          <div className="flex justify-between items-start border-b border-stone-100 pb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-stone-400 uppercase tracking-[0.2em] font-semibold">
                  {locale === "en" ? "ACTIVE RESEARCH WORKSPACE" : "CADERNO DE PESQUISA ATIVO"}
                </span>
                {currentNotebook.isDemo && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[8px] font-mono uppercase tracking-wider rounded border border-amber-200">
                    {locale === "en" ? "Temporary Notebook" : "Caderno Temporário"}
                  </span>
                )}
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-light text-stone-950 tracking-wide leading-tight">
                {currentNotebook.title}
              </h2>
              {currentNotebook.subtitle && (
                <p className="text-sm text-stone-500 font-serif tracking-wide">
                  {currentNotebook.subtitle}
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => onNavigate("journal")}
                className="px-4.5 py-2.5 bg-stone-950 hover:bg-stone-850 text-white font-mono text-[9px] uppercase tracking-[0.18em] rounded-xs transition-all cursor-pointer font-bold inline-flex items-center gap-2"
              >
                <span>{locale === "en" ? "Continue where I left off" : "Continuar de onde parei"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {currentNotebook.isDemo ? (
                <button
                  type="button"
                  onClick={handleDeleteDemo}
                  className="px-4.5 py-2.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-mono text-[9px] uppercase tracking-[0.18em] rounded-xs transition-all cursor-pointer font-bold inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{locale === "en" ? "Delete demonstration" : "Excluir demonstração"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onNavigate("profile")}
                  className="px-4.5 py-2.5 border border-[#DDD9CE] hover:border-stone-400 hover:bg-[#FCFAF7] text-stone-700 font-mono text-[9px] uppercase tracking-[0.18em] rounded-sm transition-all cursor-pointer font-bold"
                >
                  {t.homeSwitchBtn}
                </button>
              )}
            </div>
          </div>

          {/* Cover Description Block */}
          {currentNotebook.description && (
            <p className="text-xs text-stone-600 font-serif leading-relaxed max-w-2xl">
              {currentNotebook.description}
            </p>
          )}

          {/* Sub-grid with Activity and Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4 border-t border-stone-100">
            {/* Left Column: Continue where I left off (Latest Logs) */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-mono text-stone-400 uppercase tracking-[0.18em] font-bold">
                {locale === "en" ? "CONTINUE WHERE I LEFT OFF" : "CONTINUAR DE ONDE PAREI"}
              </h4>
              
              {latestEntry || latestConcept || latestInsight ? (
                <div className="space-y-4 border-l border-stone-200 pl-4 py-1">
                  {latestEntry && (
                    <div className="space-y-1">
                      <span className="text-[8px] font-mono text-stone-400 uppercase tracking-wider block">
                        {locale === "en" ? "Latest Journal Entry" : "Último Registro de Diário"}
                      </span>
                      <button 
                        onClick={() => onNavigate("journal")}
                        className="font-serif text-sm font-semibold text-stone-900 hover:text-stone-700 text-left line-clamp-1 tracking-wide cursor-pointer"
                      >
                        {latestEntry.title}
                      </button>
                      <p className="text-[8px] text-stone-450 font-mono uppercase tracking-wider">
                        {new Date(latestEntry.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "pt-BR")}
                      </p>
                    </div>
                  )}

                  {latestConcept && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[8px] font-mono text-stone-400 uppercase tracking-wider block">
                        {locale === "en" ? "Latest Concept" : "Último Conceito"}
                      </span>
                      <button
                        onClick={() => onNavigate("lab")}
                        className="font-serif text-sm font-semibold text-stone-900 hover:text-stone-700 text-left line-clamp-1 tracking-wide cursor-pointer"
                      >
                        {latestConcept.name}
                      </button>
                      <p className="text-[8px] text-stone-450 font-mono uppercase tracking-wider">
                        {new Date(latestConcept.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "pt-BR")}
                      </p>
                    </div>
                  )}

                  {latestInsight && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[8px] font-mono text-stone-400 uppercase tracking-wider block">
                        {locale === "en" ? "Latest Reflection" : "Última Reflexão de IA"}
                      </span>
                      <button
                        onClick={() => onNavigate("insights")}
                        className="font-serif text-sm font-semibold text-stone-900 hover:text-stone-700 text-left line-clamp-1 tracking-wide cursor-pointer"
                      >
                        {latestInsight.title || (locale === "en" ? "Synthesis Reflection" : "Reflexão de Síntese")}
                      </button>
                      <p className="text-[8px] text-stone-450 font-mono uppercase tracking-wider">
                        {new Date(latestInsight.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "pt-BR")}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-2">
                  <p className="text-xs text-stone-400 font-serif leading-relaxed">
                    {locale === "en" ? "No activity recorded in this notebook yet." : "Nenhuma atividade registrada neste caderno ainda."}
                  </p>
                  <button
                    type="button"
                    onClick={onStartFirstEntry}
                    className="text-[9px] font-mono text-stone-500 hover:text-stone-950 underline mt-3 cursor-pointer block uppercase tracking-wider font-semibold"
                  >
                    {locale === "en" ? "+ Write first journal entry" : "+ Criar primeiro registro no diário"}
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Statistics */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-mono text-stone-400 uppercase tracking-[0.18em] font-bold">
                {t.homeNotebookStats}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#FCFAF7] border border-[#E6E2D5] rounded-sm p-4 text-center hover:bg-white transition-colors">
                  <span className="block text-3xl font-serif font-light text-stone-900 leading-none">{entries.length}</span>
                  <span className="text-[8px] font-mono text-stone-400 uppercase tracking-[0.12em] block mt-2">{locale === "en" ? "Journal Logs" : "Logs do Diário"}</span>
                </div>
                <div className="bg-[#FCFAF7] border border-[#E6E2D5] rounded-sm p-4 text-center hover:bg-white transition-colors">
                  <span className="block text-3xl font-serif font-light text-stone-900 leading-none">{concepts.length}</span>
                  <span className="text-[8px] font-mono text-stone-400 uppercase tracking-[0.12em] block mt-2">{locale === "en" ? "Concepts" : "Conceitos"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Closed Beta Banner */}
          <div className="mt-6 pt-6 border-t border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FCFAF7] border border-[#E6E2D5] rounded-sm p-4 text-xs">
            <div className="space-y-1">
              <span className="font-serif font-semibold text-stone-900 block">
                {locale === "en" ? "Closed Beta" : "Beta Fechado"}
              </span>
              <p className="text-stone-500 text-[11px] font-sans">
                {locale === "en" 
                  ? "You are using a Beta version. Your feedback helps shape MyArtNotes." 
                  : "Você está usando uma versão Beta. Seu feedback ajuda a moldar o MyArtNotes."}
              </p>
            </div>
            <div className="flex items-center gap-2 text-stone-850 font-mono text-[9px] uppercase tracking-wider font-semibold">
              <span className="text-amber-500">✦</span>
              <span>{locale === "en" ? "Talk to Myan anytime." : "Fale com a Myan a qualquer momento."}</span>
            </div>
          </div>
        </motion.section>
      ) : (
        /* Empty State */
        <motion.section 
          className="max-w-2xl mx-auto bg-white border border-[#E6E2D5] rounded-lg p-8 space-y-6 shadow-xs hover:border-stone-400 transition-colors text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="space-y-2.5 max-w-md mx-auto">
            <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold block">
              MyArtNotes
            </span>
            <h4 className="font-serif text-lg font-semibold text-stone-900 leading-tight">
              {locale === "en" ? "No Active Research Notebook" : "Nenhum Caderno de Pesquisa Ativo"}
            </h4>
            <p className="text-xs text-stone-550 leading-relaxed font-sans">
              {locale === "en" 
                ? "Every artistic research begins with a first record." 
                : "Toda pesquisa artística começa com um primeiro registro."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setHomeCreateError("");
              setIsHomeCreateOpen(true);
            }}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-850 text-white font-mono text-xs uppercase tracking-wider rounded font-bold cursor-pointer transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <span>{locale === "en" ? "Create New Notebook" : "Criar Novo Caderno"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.section>
      )}

      {/* NEW SECTION 2: Myan Demo (Triggered if there is no notebook or active notebook is NOT a demo) */}
      {onCreateDemoNotebook && (!currentNotebook || !currentNotebook.isDemo) && (
        <motion.section 
          className="max-w-xl mx-auto bg-[#FAF8F3] border border-[#E6E2D5] rounded-sm p-6 text-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          id="myan-demo-section"
        >
          <div className="space-y-1">
            <span className="text-[8px] font-mono text-stone-450 uppercase tracking-widest font-bold block">
              {locale === "en" ? "DEMO WORKSPACE" : "AMBIENTE DE DEMONSTRAÇÃO"}
            </span>
            <h4 className="font-serif text-sm font-semibold text-stone-950 leading-snug">
              {locale === "en" 
                ? "Want to explore how an artistic research notebook works?" 
                : "Quer explorar como funciona um caderno de pesquisa artística?"}
            </h4>
            <p className="text-xs text-stone-600 font-serif leading-relaxed max-w-md mx-auto">
              {locale === "en"
                ? "Myan can generate a temporary, fully populated fictional notebook for demonstration purposes only. This allows you to freely explore the platform's mapping, timeline, and AI synthesis features. You can permanently delete this demo workspace at any time."
                : "Myan pode gerar um caderno ficcional temporário e totalmente preenchido para fins de demonstração apenas. Isso permite que você explore livremente o mapeamento, a linha do tempo e os recursos de síntese por IA. Você pode excluir permanentemente essa área de demonstração a qualquer momento."}
            </p>
          </div>

          <button
            onClick={handleTriggerDemo}
            disabled={isGeneratingDemo}
            className="px-6 py-2.5 bg-white hover:bg-[#FAF8F3] border border-[#DDD9CE] hover:border-stone-450 text-stone-800 font-mono text-xs font-bold rounded cursor-pointer transition-all inline-flex items-center gap-2 disabled:opacity-50"
          >
            {isGeneratingDemo ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-500" />
                <span>{locale === "en" ? "Creating..." : "Gerando..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{locale === "en" ? "Create Demo Notebook" : "Criar Caderno de Demonstração"}</span>
              </>
            )}
          </button>
        </motion.section>
      )}

      <EditorialManifesto
        onCreateNotebookClick={() => {
          setHomeCreateError("");
          setIsHomeCreateOpen(true);
        }}
      />

      <BotanicalAccent />

      {/* SECTION 3: Visual Methodology */}
      <motion.section 
        className="space-y-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        id="home-methodology-section"
      >
        <div className="text-center space-y-2">
          <h3 className="text-[10px] font-mono font-bold text-stone-450 uppercase tracking-[0.25em]">
            {locale === "en" ? "VISUAL METHODOLOGY" : "METODOLOGIA VISUAL"}
          </h3>
          <p className="text-[11px] font-serif text-stone-500 tracking-wide">
            {locale === "en" ? "The six loops of artistic research" : "Os seis ciclos da pesquisa artística"}
          </p>
        </div>

        {/* Stunning vertical pipeline with arrows */}
        <div className="max-w-2xl mx-auto space-y-4">
          {[
            { 
              id: "journal", 
              step: "Record",
              stepPt: "Registrar", 
              methodology: "Diário de Ateliê", 
              descEn: "Document your daily studio practice, materials, and developments freely.", 
              descPt: "Documente o seu fazer diário de ateliê, materiais e desdobramentos livremente.",
              icon: <BookOpen className="w-4 h-4 text-stone-700 stroke-[1.2]" />
            },
            { 
              id: "lab", 
              step: "Investigate",
              stepPt: "Investigar", 
              methodology: "Laboratório de Sementes", 
              descEn: "Seed, cultivate, and deepen core thematic and poetic questions.", 
              descPt: "Semeie, cultive e aprofunde perguntas temáticas e poéticas fundamentais.",
              icon: <Compass className="w-4 h-4 text-stone-700 stroke-[1.2]" />
            },
            { 
              id: "map", 
              step: "Connect",
              stepPt: "Conectar", 
              methodology: "Constelação Poética", 
              descEn: "Trace critical, semantic, and associative paths between sowed ideas.", 
              descPt: "Trace caminhos críticos, semânticos e associativos entre suas ideias.",
              icon: <GitBranch className="w-4 h-4 text-stone-700 stroke-[1.2]" />
            },
            { 
              id: "timeline", 
              step: "Follow",
              stepPt: "Acompanhar", 
              methodology: "Linha do Tempo", 
              descEn: "Observe the chronological iteration and evolution of your materials.", 
              descPt: "Observe a evolução cronológica de experimentos e materiais.",
              icon: <Archive className="w-4 h-4 text-stone-700 stroke-[1.2]" />
            },
            { 
              id: "insights", 
              step: "Reflect",
              stepPt: "Refletir", 
              methodology: "Insights & Sínteses", 
              descEn: "Uncover latent patterns and receive critical provocations generated by AI.", 
              descPt: "Identifique padrões latentes e receba provocações geradas pela IA.",
              icon: <Sparkles className="w-4 h-4 text-stone-700 stroke-[1.2]" />
            },
            { 
              id: "portfolio", 
              step: "Portfolio",
              stepPt: "Compilar", 
              methodology: "Compilação Poética", 
              descEn: "Curate, publish, and present your processes and results to the world.", 
              descPt: "Cure, publique e apresente seus processos e resultados ao mundo.",
              icon: <Layout className="w-4 h-4 text-stone-700 stroke-[1.2]" />
            }
          ].map((item, idx) => (
            <React.Fragment key={item.id}>
              {idx > 0 && (
                <div className="flex justify-center text-stone-300 py-2">
                  <span className="text-[14px] font-light">↓</span>
                </div>
              )}
              <div 
                className="group flex flex-col md:flex-row md:items-center justify-between p-5 bg-[#FCFAF7] border border-[#E6E2D5] rounded-sm hover:bg-white hover:border-stone-400 transition-all duration-300 gap-4"
              >
                <div className="flex items-start gap-4">
                  <span className="font-mono text-[9px] text-stone-300 font-bold pt-1.5">0{idx + 1}</span>
                  <div className="p-2 bg-white border border-[#E6E2D5] rounded-sm group-hover:border-stone-400 transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-xs font-bold text-stone-900 uppercase tracking-widest">
                        {locale === "en" ? item.step : item.stepPt}
                      </span>
                      <span className="text-[10px] text-stone-400 font-serif">({item.methodology})</span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1 font-serif leading-relaxed tracking-wide">
                      {locale === "en" ? item.descEn : item.descPt}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate(item.id as ActiveTab)}
                  className="self-end md:self-auto flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest text-stone-400 hover:text-stone-950 transition-colors cursor-pointer"
                >
                  <span>{locale === "en" ? "Open" : "Abrir"}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </React.Fragment>
          ))}
        </div>
      </motion.section>

      <BotanicalAccent />

      {/* SECTION 4: Who is it for? */}
      <motion.section 
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        id="home-audiences-section"
      >
        <h3 className="text-center text-[10px] font-mono font-bold text-stone-400 uppercase tracking-[0.25em]">
          {locale === "en" ? "WHO IS IT FOR" : "DESTINADO A QUEM"}
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 max-w-3xl mx-auto">
          {[
            { en: "Artists", pt: "Artistas" },
            { en: "Students", pt: "Estudantes" },
            { en: "Researchers", pt: "Pesquisadores" },
            { en: "Professors", pt: "Professores" },
            { en: "Collectives", pt: "Coletivos" }
          ].map((item, idx) => (
            <div 
              key={idx} 
              className="bg-[#FCFAF7] border border-[#E6E2D5] rounded-sm px-4 py-8 text-center hover:border-stone-400 hover:bg-white hover:shadow-xs transition-all duration-300 flex flex-col justify-between items-center h-28"
            >
              <span className="font-mono text-[9px] text-stone-300 font-bold block mb-1">0{idx + 1}</span>
              <span className="font-serif text-sm text-stone-900 font-medium">
                {locale === "en" ? item.en : item.pt}
              </span>
              <span className="w-4 h-[1px] bg-stone-200 mt-2"></span>
            </div>
          ))}
        </div>
      </motion.section>

      <BotanicalAccent />

      {/* SECTION 5: About MyArtNotes */}
      <motion.section 
        className="bg-[#FAF8F3]/50 border border-[#E6E2D5] rounded-lg p-6 md:p-8 max-w-2xl mx-auto space-y-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        id="home-about-section"
      >
        <div className="flex justify-center mb-1">
          <span className="text-stone-400 font-serif text-lg">❦</span>
        </div>
        <h3 className="text-xs font-mono font-bold text-stone-900 uppercase tracking-[0.25em]">
          {locale === "en" ? "About MyArtNotes" : "Sobre o MyArtNotes"}
        </h3>
        <p className="text-xs font-serif text-stone-650 leading-relaxed max-w-lg mx-auto">
          {locale === "en" 
            ? "This platform was custom-designed to accompany artistic research processes. Its goal is not to generate ideas for you, but rather to help you observe, organize, and understand the internal structure of your own creative process."
            : "Esta plataforma foi desenhada sob medida para acompanhar processos de pesquisa artística. Seu objetivo não é gerar ideias para você, mas sim apoiar sua capacidade de observar, organizar e compreender a estrutura interna do seu próprio fazer criativo."}
        </p>
      </motion.section>

      <BotanicalAccent />

      {/* SECTION 6: AI Transparency & Data Governance Charter */}
      <motion.section 
        className="max-w-2xl mx-auto border border-[#E6E2D5] bg-white rounded-lg p-6 md:p-8 space-y-6 shadow-2xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        id="home-charter-section"
      >
        <div className="space-y-1 text-center border-b border-stone-100 pb-4">
          <h3 className="text-xs font-mono font-bold text-stone-900 uppercase tracking-[0.2em]">
            {locale === "en" ? "AI Transparency & Data Governance" : "Transparência de IA e Governança de Dados"}
          </h3>
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
            {locale === "en" ? "Our Ethical Commitment to Artists" : "Nosso Compromisso Ético com os Artistas"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* AI Authorship Section */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-stone-450 uppercase tracking-wider font-bold block flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
              <span>{locale === "en" ? "AI & Human Authorship" : "IA e Autoria Humana"}</span>
            </span>
            <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
              {locale === "en"
                ? "ATLAS AI is designed strictly to assist and catalyze your research. It never replaces your artistic authorship. You remain the sole author and owner of your work, sowed concepts, and insights."
                : "O ATLAS AI foi desenhado estritamente para apoiar e catalisar sua pesquisa. Ele nunca substitui sua autoria artística. Você permanece como único autor e proprietário de seus trabalhos, conceitos semeados e insights."}
            </p>
          </div>

          {/* Privacy & Compliance Section */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-stone-450 uppercase tracking-wider font-bold block flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
              <span>{locale === "en" ? "Privacy & Request Safety" : "Privacidade e Segurança de Requisições"}</span>
            </span>
            <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
              {locale === "en"
                ? "All synthesis requests follow our strict server-side platform privacy policy. We protect your logs and queries from unauthorized indexing or leakage."
                : "Todas as requisições de síntese seguem nossa estrita política de privacidade do servidor. Protegemos seus logs e consultas contra indexação não autorizada ou vazamentos."}
            </p>
          </div>

          {/* Data Minimization Section */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-stone-450 uppercase tracking-wider font-bold block flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
              <span>{locale === "en" ? "Data Minimization & Audit" : "Minimização e Auditoria de Dados"}</span>
            </span>
            <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
              {locale === "en"
                ? "We store minimal logs and perform routine browser and local storage audits to prevent redundant persistence. We respect your storage footprint."
                : "Armazenamos o mínimo de logs e realizamos auditorias de rotina no armazenamento local e do navegador para evitar persistência redundante. Respeitamos seu espaço digital."}
            </p>
          </div>

          {/* Retention & Rights Section */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-stone-450 uppercase tracking-wider font-bold block flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
              <span>{locale === "en" ? "Data Rights & Retention" : "Direitos e Retenção de Dados"}</span>
            </span>
            <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
              {locale === "en"
                ? "You have full rights to your data. Stored notebooks, research concepts, and profiles can be downloaded as JSON or permanently erased instantly upon request."
                : "Você tem direitos totais sobre seus dados. Cadernos, conceitos de pesquisa e perfis podem ser baixados em JSON ou apagados permanentemente de imediato."}
            </p>
          </div>
        </div>
      </motion.section>

      {/* Editorial Notebook Creation Modal from Home Page */}
      {isHomeCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white border border-[#E6E2D5] rounded-lg p-6 shadow-xl space-y-5 animate-fadeIn font-sans text-stone-850 text-left">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-mono font-bold text-stone-950 uppercase tracking-widest">
                {locale === "en" ? "New Research Notebook" : "Novo Caderno de Pesquisa"}
              </h3>
              <button 
                type="button"
                onClick={() => setIsHomeCreateOpen(false)}
                className="text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {homeCreateError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded flex items-start gap-2 text-red-700 text-[11px] leading-normal">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{homeCreateError}</span>
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
                setHomeCreateError(locale === "en" ? "Title is required" : "Título é obrigatório");
                return;
              }

              try {
                setIsHomeSubmitting(true);
                setHomeCreateError("");
                await createNotebook(
                  titleVal,
                  subtitleInput.value.trim(),
                  descInput.value.trim(),
                  langInput.value as "en" | "pt"
                );
                setIsHomeCreateOpen(false);
              } catch (err) {
                console.error("Error creating notebook from Home modal:", err);
                setHomeCreateError(
                  locale === "en" 
                    ? "Failed to create notebook. Please verify your connection." 
                    : "Falha ao criar caderno. Verifique sua conexão."
                );
              } finally {
                setIsHomeSubmitting(false);
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
                  onClick={() => setIsHomeCreateOpen(false)}
                  className="px-4 py-2 border border-stone-300 hover:bg-stone-50 text-stone-600 font-mono text-[10px] uppercase tracking-wider rounded font-bold cursor-pointer transition-colors"
                >
                  {locale === "en" ? "Cancel" : "Cancelar"}
                </button>
                <button
                  type="submit"
                  disabled={isHomeSubmitting}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white font-mono text-[10px] uppercase tracking-wider rounded font-bold cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isHomeSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{locale === "en" ? "Create Notebook" : "Criar Caderno"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
