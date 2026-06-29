import React, { useState, useEffect } from "react";
import { Sparkles, CheckSquare, Square, Compass, BookOpen, GitBranch, ArrowRight, Loader2 } from "lucide-react";
import { useTranslation } from "../lib/i18n";
import { Concept, JournalEntry, Insight, ActiveTab } from "../types";

interface GettingStartedProps {
  journal: JournalEntry[];
  concepts: Concept[];
  insights: Insight[];
  onBack: () => void;
  onNavigate: (tab: ActiveTab) => void;
}

export default function GettingStarted({
  journal,
  concepts,
  insights,
  onBack,
  onNavigate,
}: GettingStartedProps) {
  const { locale } = useTranslation();
  const [visitedMap, setVisitedMap] = useState(false);

  useEffect(() => {
    // Check if the user has visited the map
    const visited = localStorage.getItem("atlas_onboarding_visited_map") === "true";
    setVisitedMap(visited);
  }, []);

  // Compute completed steps
  const step1Complete = concepts.length > 0;
  const step2Complete = journal.length > 0;
  const step3Complete = journal.some((entry) => entry.associatedConcepts && entry.associatedConcepts.length > 0);
  const step4Complete = visitedMap;
  const step5Complete = insights.length > 0;

  const steps = [
    {
      id: "lab" as ActiveTab,
      num: 1,
      title: locale === "en" ? "Seed your first Concept" : "Semeie o seu primeiro Conceito",
      desc: locale === "en"
        ? "Go to the Concept Lab and create a research thread (e.g., 'Entropic Materials')."
        : "Vá para o Lab de Conceitos e crie um fio condutor de pesquisa (ex: 'Materiais Entrópicos').",
      isComplete: step1Complete,
      actionText: locale === "en" ? "Go to Concept Lab" : "Ir para o Laboratório"
    },
    {
      id: "journal" as ActiveTab,
      num: 2,
      title: locale === "en" ? "Write a Journal Entry" : "Escreva uma entrada no Diário",
      desc: locale === "en"
        ? "Document a daily experiment, raw studio observation, or material discovery."
        : "Documente um experimento diário, observação bruta de ateliê ou descoberta material.",
      isComplete: step2Complete,
      actionText: locale === "en" ? "Go to Journal" : "Ir para o Diário"
    },
    {
      id: "journal" as ActiveTab,
      num: 3,
      title: locale === "en" ? "Link the Journal Entry to your Concept" : "Vincule o Diário ao seu Conceito",
      desc: locale === "en"
        ? "When writing or editing a journal log, associate it with one of your active concept threads."
        : "Ao escrever ou editar um registro do diário, associe-o a um de seus conceitos ativos.",
      isComplete: step3Complete,
      actionText: locale === "en" ? "Link in Journal" : "Fazer Vínculo no Diário"
    },
    {
      id: "map" as ActiveTab,
      num: 4,
      title: locale === "en" ? "Trace the Concept Map" : "Rastreie o Mapa de Conceitos",
      desc: locale === "en"
        ? "Open the Concept Map to spatially visualize the connections and status columns of your work."
        : "Abra o Mapa de Conceitos para visualizar espacialmente as conexões e colunas de estágio de suas ideias.",
      isComplete: step4Complete,
      actionText: locale === "en" ? "Open Concept Map" : "Abrir Mapa de Conceitos"
    },
    {
      id: "insights" as ActiveTab,
      num: 5,
      title: locale === "en" ? "Generate an AI Synthesis" : "Gere uma Síntese Poética por IA",
      desc: locale === "en"
        ? "Visit the Insights tab to trigger a deep AI synthesis of your records, proposing patterns and lineages."
        : "Visite a aba de Reflexões para desencadear uma síntese profunda de seus registros, propondo padrões e linhagens.",
      isComplete: step5Complete,
      actionText: locale === "en" ? "Generate Insights" : "Gerar Reflexões"
    }
  ];

  const completedCount = steps.filter((s) => s.isComplete).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E6E2D5] pb-4">
        <div>
          <h2 className="text-lg font-serif font-bold text-stone-950 uppercase tracking-wider">
            {locale === "en" ? "Getting Started" : "Primeiros Passos"}
          </h2>
          <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mt-0.5">
            {locale === "en" ? "Guide • Estimate: 3 minutes" : "Guia Prático • Estimativa: 3 minutos"}
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-stone-500 hover:text-stone-900 font-mono text-xs uppercase cursor-pointer"
        >
          {locale === "en" ? "Close" : "Fechar"}
        </button>
      </div>

      {/* Progress Card */}
      <div className="bg-[#FCFAF6] border border-[#E6E2D5] p-5 rounded space-y-3.5">
        <div className="flex items-center justify-between font-mono text-xs text-stone-750">
          <span className="font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-700 animate-pulse" />
            <span>{locale === "en" ? "YOUR ONBOARDING PROGRESS" : "SEU PROGRESSO DE INTEGRAÇÃO"}</span>
          </span>
          <span className="font-bold">{completedCount} / {steps.length} ({progressPercent}%)</span>
        </div>
        
        {/* Progress Bar Container */}
        <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-stone-900 h-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-[11px] text-stone-500 font-sans leading-relaxed">
          {locale === "en"
            ? "Follow these 5 simple atelier interactions to understand how MyArtNotes transforms raw documentation into structural concepts and systemic reflections."
            : "Siga estas 5 interações simples de ateliê para compreender como o MyArtNotes transforma documentação bruta em conceitos estruturais e reflexões sistêmicas."}
        </p>
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step) => (
          <div 
            key={step.num}
            className={`p-5 rounded border bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              step.isComplete 
                ? "border-[#DDD9CE] bg-white opacity-85" 
                : "border-[#E6E2D5] hover:border-stone-400"
            }`}
          >
            <div className="flex gap-3 items-start">
              {/* Checkbox Icon */}
              <div className="mt-0.5 text-stone-850">
                {step.isComplete ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600 stroke-[2]" />
                ) : (
                  <Square className="w-5 h-5 text-stone-300 stroke-[1.5]" />
                )}
              </div>

              {/* Step Info */}
              <div className="space-y-1">
                <span className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-widest block">
                  {locale === "en" ? `Step ${step.num}` : `Passo ${step.num}`}
                </span>
                <h4 className={`text-sm font-sans font-bold tracking-tight ${step.isComplete ? "text-stone-500 line-through" : "text-stone-950"}`}>
                  {step.title}
                </h4>
                <p className="text-xs text-stone-500 font-sans leading-relaxed max-w-md">
                  {step.desc}
                </p>
              </div>
            </div>

            {/* Step Action Button */}
            {!step.isComplete && (
              <button
                onClick={() => onNavigate(step.id)}
                className="self-start sm:self-center px-4 py-2 bg-stone-100 hover:bg-stone-900 text-stone-800 hover:text-white border border-[#DDD9CE] hover:border-stone-900 font-mono text-[10px] uppercase font-bold tracking-wider rounded transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{step.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Back to workspace */}
      <div className="flex justify-start">
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-stone-900 hover:bg-stone-850 text-white font-mono text-xs uppercase tracking-wider font-bold rounded cursor-pointer transition-colors"
        >
          {locale === "en" ? "Back to Workspace" : "Voltar à área de trabalho"}
        </button>
      </div>
    </div>
  );
}
