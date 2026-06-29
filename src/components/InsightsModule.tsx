import React, { useState } from "react";
import { Insight } from "../types";
import { Sparkles, HelpCircle, Loader2, AlertCircle, Quote, Tag, BookOpen, MoreVertical, Edit3, Trash2, Check, X } from "lucide-react";
import { useTranslation } from "../lib/i18n";

interface InsightsModuleProps {
  insights: Insight[];
  onGenerateInsights: () => Promise<Insight>;
  onUpdateInsight: (id: string, updatedFields: Partial<Insight>) => Promise<void>;
  onDeleteInsight: (id: string) => Promise<void>;
  hasData: boolean;
}

const getLoadingTexts = (locale: string) => {
  if (locale === "pt") {
    return [
      "Analisando registros de diário e tags...",
      "Cruzando materiais de pesquisa...",
      "Detectando associações conceituais...",
      "Formulando questionamentos do processo...",
    ];
  }
  return [
    "Analyzing journal entries and tags...",
    "Cross-referencing research materials...",
    "Detecting conceptual associations...",
    "Formulating process inquiries...",
  ];
};

export default function InsightsModule({ insights, onGenerateInsights, onUpdateInsight, onDeleteInsight, hasData }: InsightsModuleProps) {
  const { t, locale } = useTranslation();
  const [activeInsightIndex, setActiveInsightIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // Editing Insight State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editAssociations, setEditAssociations] = useState("");
  const [editQuestions, setEditQuestions] = useState("");
  const [editPatterns, setEditPatterns] = useState<Array<{ title: string; description: string; evidence: string[] }>>([]);
  const [activeMenuInsightId, setActiveMenuInsightId] = useState<string | null>(null);
  const [showDeleteConfirmInsight, setShowDeleteConfirmInsight] = useState<Insight | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  const activeInsight = insights[activeInsightIndex];
  const loadingTexts = getLoadingTexts(locale);

  const handleTriggerEditInsight = (insight: Insight) => {
    setEditTitle(insight.title || (locale === "en" ? "Latest Report" : "Último Relatório"));
    setEditAssociations(insight.associations ? insight.associations.join(", ") : "");
    setEditQuestions(insight.questions ? insight.questions.join("\n") : "");
    setEditPatterns(insight.patterns ? [...insight.patterns] : []);
    setIsEditing(true);
    setActiveMenuInsightId(null);
  };

  const handleSaveInsightEdit = async () => {
    if (!activeInsight) return;
    
    const associations = editAssociations
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    const questions = editQuestions
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0);

    try {
      await onUpdateInsight(activeInsight.id, {
        title: editTitle,
        associations,
        questions,
        patterns: editPatterns
      });
      setIsEditing(false);
      setToastMessage(locale === "en" ? "Insight saved successfully" : "Reflexão salva com sucesso");
      setTimeout(() => setToastMessage(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save insight.");
    }
  };

  const startLoadingTimer = () => {
    setLoadingTextIndex(0);
    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 2500);
    return interval;
  };

  const handleSynthesize = async () => {
    setIsLoading(true);
    setErrorMsg("");
    const timer = startLoadingTimer();

    try {
      await onGenerateInsights();
      setActiveInsightIndex(0); // View newest
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message ||
          (locale === "en"
            ? "Failed to generate insights. Ensure you have journal entries or concepts created."
            : "Falha ao gerar reflexões. Certifique-se de que possui registros de diário ou conceitos criados.")
      );
    } finally {
      clearInterval(timer);
      setIsLoading(false);
    }
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString(locale === "en" ? "en-US" : "pt-BR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-4 overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E6E2D5] pb-3 gap-2">
        <div>
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-850">
            {locale === "en" ? "Insights & Reflection" : "Reflexões e Conexões"}
          </h2>
          <p className="text-[10px] text-stone-500 font-mono">
            {locale === "en"
              ? "Factual pattern detection and rigorous concept associations compiled from your log."
              : "Detecção de padrões factuais e associações conceituais rigorosas compiladas do seu diário."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* History selector */}
          {insights.length > 1 && (
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-stone-400 uppercase text-[10px]">{locale === "en" ? "History:" : "Histórico:"}</span>
              <select
                value={activeInsightIndex}
                onChange={(e) => setActiveInsightIndex(Number(e.target.value))}
                className="bg-white border border-[#DDD9CE] rounded px-2.5 py-1 text-stone-800 text-xs focus:outline-none"
              >
                {insights.map((ins, idx) => (
                  <option key={ins.id} value={idx}>
                    {idx === 0
                      ? (locale === "en" ? "Latest Report" : "Último Relatório")
                      : `${locale === "en" ? "Report" : "Relatório"} - ${formatDate(ins.createdAt)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {hasData && (
            <button
              onClick={handleSynthesize}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-stone-900 hover:bg-stone-850 text-white font-mono text-xs font-bold cursor-pointer transition-colors disabled:opacity-50 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-stone-200" />
              <span>{locale === "en" ? "Generate Report" : "Gerar Relatório"}</span>
            </button>
          )}

          {activeInsight && (
            <div className="relative">
              <button
                onClick={() => setActiveMenuInsightId(activeMenuInsightId === activeInsight.id ? null : activeInsight.id)}
                title="Menu"
                className="p-1.5 rounded hover:bg-[#EFECE6] border border-transparent hover:border-[#DDD9CE] text-stone-600 hover:text-stone-900 cursor-pointer transition-all"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {activeMenuInsightId === activeInsight.id && (
                <div className="absolute right-0 mt-1 w-32 bg-white border border-[#E6E2D5] rounded shadow-md z-30 font-mono text-[10px] uppercase tracking-wider text-left">
                  <button
                    onClick={() => handleTriggerEditInsight(activeInsight)}
                    className="w-full text-left px-3 py-2.5 hover:bg-[#FAF8F3] text-stone-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-stone-400" />
                    <span>{locale === "en" ? "Edit" : "Editar"}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirmInsight(activeInsight);
                      setActiveMenuInsightId(null);
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-red-50 text-red-600 flex items-center gap-2 border-t border-[#E6E2D5]/50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>{locale === "en" ? "Delete" : "Excluir"}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-1 custom-scrollbar">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center p-8">
            <Loader2 className="w-6 h-6 text-stone-400 animate-spin mb-4" />
            <p className="text-stone-700 font-mono text-xs tracking-wider uppercase text-center max-w-md">
              {loadingTexts[loadingTextIndex]}
            </p>
          </div>
        ) : errorMsg ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded flex flex-col items-center gap-3 max-w-md mx-auto my-12 text-center shadow-xs">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h4 className="text-xs font-mono font-bold text-red-800 uppercase">
              {locale === "en" ? "Analysis Interrupted" : "Análise Interrompida"}
            </h4>
            <p className="text-xs text-stone-600 font-sans leading-relaxed">{errorMsg}</p>
            <button
              onClick={handleSynthesize}
              className="px-4 py-1.5 bg-stone-900 hover:bg-stone-850 text-white font-mono text-xs rounded cursor-pointer transition-colors"
            >
              {locale === "en" ? "Retry" : "Tentar Novamente"}
            </button>
          </div>
        ) : isEditing ? (
          /* EDIT INSIGHT FORM */
          <div className="space-y-6 max-w-4xl mx-auto py-2 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#E6E2D5] pb-3">
              <div>
                <h3 className="text-xs font-mono font-bold text-stone-850 uppercase tracking-wider">
                  {locale === "en" ? "Edit Research Synthesis" : "Editar Síntese de Pesquisa"}
                </h3>
                <p className="text-[10px] text-stone-500 font-sans mt-0.5">
                  {locale === "en"
                    ? "Manually refine key insights, pattern titles, descriptions, associations, and core questions."
                    : "Refine manualmente os principais insights, títulos e descrições de padrões, associações e perguntas centrais."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs font-mono text-stone-500 hover:text-stone-850 cursor-pointer"
              >
                {t.discard}
              </button>
            </div>

            <div className="space-y-4">
              {/* Optional overall report Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block font-semibold">
                  {locale === "en" ? "Report Custom Title" : "Título Personalizado do Relatório"}
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-800 focus:outline-none focus:border-stone-500"
                  placeholder={locale === "en" ? "e.g. Phase 1 Material Synthesis" : "ex: Síntese Material da Fase 1"}
                />
              </div>

              {/* Associations */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block font-semibold">
                  {locale === "en" ? "Sensory / Material Associations (comma-separated)" : "Associações Sensoriais / Materiais (separadas por vírgula)"}
                </label>
                <input
                  type="text"
                  value={editAssociations}
                  onChange={(e) => setEditAssociations(e.target.value)}
                  className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-800 focus:outline-none focus:border-stone-500"
                />
              </div>

              {/* Inquiries */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block font-semibold">
                  {locale === "en" ? "Key Inquiries / Questions (one per line)" : "Perguntas / Questionamentos Centrais (uma por linha)"}
                </label>
                <textarea
                  value={editQuestions}
                  onChange={(e) => setEditQuestions(e.target.value)}
                  rows={4}
                  className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-serif italic text-stone-800 focus:outline-none focus:border-stone-500 resize-none leading-relaxed"
                />
              </div>

              {/* Patterns List */}
              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block font-semibold">
                  {locale === "en" ? "Detected Process Patterns" : "Padrões de Processo Detectados"}
                </label>
                <div className="space-y-4">
                  {editPatterns.map((pat, idx) => (
                    <div key={idx} className="bg-[#FAF8F3]/50 border border-[#E6E2D5] p-4 rounded space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-stone-450 font-bold">
                          {locale === "en" ? `Pattern #${idx + 1}` : `Padrão #${idx + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditPatterns(editPatterns.filter((_, i) => i !== idx));
                          }}
                          className="text-[10px] font-mono text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{locale === "en" ? "Remove" : "Remover"}</span>
                        </button>
                      </div>

                      <div className="space-y-1">
                        <input
                          type="text"
                          value={pat.title}
                          onChange={(e) => {
                            const updated = [...editPatterns];
                            updated[idx] = { ...pat, title: e.target.value };
                            setEditPatterns(updated);
                          }}
                          placeholder={locale === "en" ? "Pattern Name" : "Nome do Padrão"}
                          className="w-full bg-white border border-[#DDD9CE] rounded px-2.5 py-1.5 text-xs font-serif font-bold text-stone-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <textarea
                          value={pat.description}
                          onChange={(e) => {
                            const updated = [...editPatterns];
                            updated[idx] = { ...pat, description: e.target.value };
                            setEditPatterns(updated);
                          }}
                          placeholder={locale === "en" ? "Pattern Explanation..." : "Explicação do Padrão..."}
                          rows={2}
                          className="w-full bg-white border border-[#DDD9CE] rounded px-2.5 py-1.5 text-xs font-sans text-stone-750 resize-none leading-relaxed"
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setEditPatterns([...editPatterns, { title: "", description: "", evidence: [] }]);
                    }}
                    className="w-full py-2.5 border border-dashed border-[#DDD9CE] text-stone-500 hover:text-stone-800 text-xs font-mono hover:bg-white rounded cursor-pointer transition-all uppercase tracking-wider"
                  >
                    + {locale === "en" ? "Add Custom Pattern" : "Adicionar Padrão Personalizado"}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E6E2D5] flex justify-end gap-3 font-mono text-xs">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-[#DDD9CE] hover:bg-stone-50 rounded cursor-pointer text-stone-600 transition-colors"
              >
                {locale === "en" ? "Cancel" : "Cancelar"}
              </button>
              <button
                type="button"
                onClick={handleSaveInsightEdit}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-850 text-white uppercase tracking-wider font-bold rounded cursor-pointer transition-colors"
              >
                {locale === "en" ? "Save Changes" : "Salvar Alterações"}
              </button>
            </div>
          </div>
        ) : activeInsight ? (
          <div className="space-y-8 max-w-4xl mx-auto py-2 animate-fadeIn">
            
            {/* Title Block */}
            <div className="border-b border-[#E6E2D5] pb-4">
              <h3 className="text-xl font-serif font-bold text-stone-900 tracking-tight">
                {activeInsight.title || (locale === "en" ? "Research Synthesis Report" : "Relatório de Síntese de Pesquisa")}
              </h3>
              <p className="text-[10px] font-mono text-stone-500 mt-1 uppercase tracking-wider">
                {locale === "en" ? "Compiled:" : "Compilado em:"} {formatDate(activeInsight.createdAt)}
              </p>
            </div>
            
            {/* Detected Patterns */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-450 block">
                {locale === "en" ? "Detected Patterns" : "Padrões Detectados"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {activeInsight.patterns && activeInsight.patterns.map((pattern, index) => (
                  <div
                    key={index}
                    className="p-5 bg-white border border-[#E6E2D5] rounded flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400">
                          {locale === "en" ? `Pattern [${index + 1}]` : `Padrão [${index + 1}]`}
                        </span>
                      </div>
                      <h4 className="text-base font-serif font-bold text-stone-950 mb-2">
                        {pattern.title}
                      </h4>
                      <p className="text-xs text-stone-600 leading-relaxed font-sans mb-4">
                        {pattern.description}
                      </p>
                    </div>

                    {/* Cited Evidence */}
                    {pattern.evidence && pattern.evidence.length > 0 && (
                      <div className="pt-3 border-t border-[#E6E2D5] space-y-1.5">
                        <span className="text-[9px] font-mono text-stone-400 uppercase tracking-wider block">
                          {locale === "en" ? "Supporting Evidence" : "Evidências de Apoio"}
                        </span>
                        {pattern.evidence.map((ev, evIdx) => (
                          <div key={evIdx} className="flex gap-1.5 text-[10px] font-sans text-stone-500 italic">
                            <Quote className="w-3 h-3 text-stone-300 flex-shrink-0 mt-0.5" />
                            <p className="line-clamp-2">{ev}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sensory Associations */}
            {activeInsight.associations && activeInsight.associations.length > 0 && (
              <div className="space-y-3 p-5 bg-[#FAF8F3]/70 border border-[#E6E2D5] rounded">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-stone-400" />
                  <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-450 block">
                    {locale === "en" ? "Sensory Associations" : "Associações Sensoriais"}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeInsight.associations.map((assoc, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-white border border-[#DDD9CE] rounded text-xs text-stone-850 font-mono uppercase tracking-wider text-[10px]"
                    >
                      {assoc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Grid of Prompts and References */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Questions */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-450 block">
                  {locale === "en" ? "Questions" : "Questionamentos"}
                </h3>
                <div className="space-y-2.5">
                  {activeInsight.questions && activeInsight.questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-white border border-[#E6E2D5] rounded flex gap-3 text-xs text-stone-850 leading-relaxed font-serif italic"
                    >
                      <HelpCircle className="w-4 h-4 text-stone-300 flex-shrink-0 mt-0.5" />
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* References */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-450 block">
                  {locale === "en" ? "Suggested Contextual References" : "Referências Contextuais Sugeridas"}
                </h3>
                <div className="space-y-2.5">
                  {activeInsight.suggestedReferences && activeInsight.suggestedReferences.length > 0 ? (
                    activeInsight.suggestedReferences.map((ref, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white border border-[#E6E2D5] rounded font-sans"
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-stone-300" />
                          <span className="text-xs font-mono font-bold text-stone-900">
                            {ref.title}
                          </span>
                          <span className="text-stone-300 font-mono text-[10px]">|</span>
                          <span className="text-[10px] font-mono text-stone-500 font-medium">
                            {ref.artist}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-650 font-sans leading-relaxed">
                          {ref.description}
                        </p>
                        <span className="inline-block mt-2.5 text-[8px] font-mono text-stone-500 border border-[#DDD9CE] bg-[#FAF8F3] px-1.5 py-0.5 rounded uppercase font-bold">
                          {ref.type}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-stone-500 font-mono italic">
                      {locale === "en"
                        ? "No references suggested for this sequence."
                        : "Nenhuma referência sugerida para esta sequência."}
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="h-[50vh] flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
            <Sparkles className="w-8 h-8 text-stone-400 mb-3 animate-pulse" />
            <p className="text-stone-800 font-mono text-xs font-bold uppercase tracking-wider mb-1">
              {locale === "en" ? "Reflections Unprepared" : "Reflexões Não Preparadas"}
            </p>
            <p className="text-stone-500 font-sans text-xs mb-6 leading-relaxed">
              {locale === "en"
                ? "Compile an objective report mapping detected process patterns, sensory associations, questions, and references from your active studio logs."
                : "Compile um relatório objetivo mapeando padrões de processo detectados, associações sensoriais, questionamentos e referências de seus registros ativos do ateliê."}
            </p>
            {hasData ? (
              <button
                onClick={handleSynthesize}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white font-mono text-xs font-bold rounded cursor-pointer transition-all shadow-xs"
              >
                {locale === "en" ? "Compile Report" : "Compilar Relatório"}
              </button>
            ) : (
              <div className="text-stone-500 font-mono text-[10px] uppercase tracking-wider border border-dashed border-[#DDD9CE] px-4 py-2 rounded bg-white/40">
                {locale === "en" ? "Awaiting Studio Data" : "Aguardando Dados do Ateliê"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmInsight && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white border border-[#E6E2D5] rounded max-w-sm w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
            <div className="p-6 pb-3 border-b border-[#E6E2D5]/50 flex-shrink-0">
              <h3 className="text-sm font-mono font-bold text-stone-900 uppercase tracking-wider">
                {locale === "en" ? "CONFIRM PERMANENT PURGE" : "CONFIRMAR EXCLUSÃO PERMANENTE"}
              </h3>
            </div>

            <div className="p-6 pt-3 pb-3 overflow-y-auto flex-1 min-h-0">
              <p className="text-xs text-stone-600 leading-relaxed">
                {locale === "en"
                  ? `Are you sure you want to permanently delete this research synthesis report? This action is irreversible and will not delete associated studio logs or concepts.`
                  : `Tem certeza de que deseja excluir permanentemente este relatório de síntese de pesquisa? Esta ação é irreversível e não afetará os registros de diário ou conceitos associados.`}
              </p>
            </div>

            <div className="p-6 pt-3 border-t border-[#E6E2D5]/50 flex justify-end gap-3 font-mono text-xs flex-shrink-0 bg-stone-50/50">
              <button
                onClick={() => setShowDeleteConfirmInsight(null)}
                className="px-3 py-1.5 border border-[#DDD9CE] hover:bg-white text-stone-600 rounded cursor-pointer transition-colors"
              >
                {locale === "en" ? "Cancel" : "Cancelar"}
              </button>
              <button
                onClick={async () => {
                  try {
                    await onDeleteInsight(showDeleteConfirmInsight.id);
                    setActiveInsightIndex(0);
                    setShowDeleteConfirmInsight(null);
                    setToastMessage(locale === "en" ? "Report deleted successfully" : "Relatório excluído com sucesso");
                    setTimeout(() => setToastMessage(""), 3000);
                  } catch (err: any) {
                    setErrorMsg(err.message || "Failed to delete report.");
                    setShowDeleteConfirmInsight(null);
                  }
                }}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded cursor-pointer transition-colors font-bold"
              >
                {locale === "en" ? "Delete Permanently" : "Excluir Permanentemente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded shadow-lg border border-stone-800 text-xs font-mono tracking-wide flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
