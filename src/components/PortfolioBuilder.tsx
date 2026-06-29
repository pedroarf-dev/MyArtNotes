import React, { useState, useEffect } from "react";
import { useTranslation } from "../lib/i18n";
import { JournalEntry, Concept, Portfolio } from "../types";
import { 
  getPortfolios, 
  addPortfolio, 
  updatePortfolio, 
  deletePortfolio 
} from "../lib/dbService";
import { useResearch } from "../context/ResearchContext";
import { 
  FileText, 
  Save, 
  Trash2, 
  Share2, 
  Globe, 
  Check, 
  Palette, 
  Printer, 
  Copy, 
  Eye, 
  Sparkles, 
  Loader2, 
  ArrowLeft, 
  Plus, 
  Layout, 
  ExternalLink,
  ChevronRight,
  BookOpen,
  Compass
} from "lucide-react";

interface PortfolioBuilderProps {
  journal: JournalEntry[];
  concepts: Concept[];
  user: any;
  onBack: () => void;
}

export default function PortfolioBuilder({
  journal,
  concepts,
  user,
  onBack
}: PortfolioBuilderProps) {
  const { t, locale } = useTranslation();
  const { currentNotebook } = useResearch();

  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activePortfolio, setActivePortfolio] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [artistStatement, setArtistStatement] = useState("");
  const [template, setTemplate] = useState<"minimal" | "grid" | "editorial">("minimal");
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingStatement, setIsGeneratingStatement] = useState(false);
  const [searchEntryQuery, setSearchEntryQuery] = useState("");
  const [searchConceptQuery, setSearchConceptQuery] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "curate" | "layout">("details");

  const isEn = locale === "en";

  // Load existing portfolios on mount
  useEffect(() => {
    if (user && currentNotebook) {
      loadPortfolios();
    }
  }, [user, currentNotebook]);

  const loadPortfolios = async () => {
    if (!user || !currentNotebook) return;
    setIsLoading(true);
    try {
      const data = await getPortfolios(user.uid, currentNotebook.id);
      setPortfolios(data);
      if (data.length > 0) {
        selectPortfolio(data[0]);
      } else {
        handleNewPortfolio();
      }
    } catch (err) {
      console.error("Failed to load portfolios:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectPortfolio = (p: Portfolio) => {
    setActivePortfolio(p);
    setTitle(p.title);
    setSubtitle(p.subtitle || "");
    setArtistStatement(p.artistStatement);
    setTemplate(p.template);
    setSelectedEntries(p.selectedEntries || []);
    setSelectedConcepts(p.selectedConcepts || []);
    setIsPublic(p.isPublic || false);
  };

  const handleNewPortfolio = () => {
    setActivePortfolio(null);
    setTitle(isEn ? "New Studio Portfolio" : "Novo Portfólio de Ateliê");
    setSubtitle(isEn ? "Process and Concept Curative Showcase" : "Exposição Curatorial de Processos e Conceitos");
    setArtistStatement(
      isEn 
        ? "Write your personal artist statement, research manifesto, or studio concerns here..." 
        : "Escreva seu depoimento de artista, manifesto de pesquisa ou preocupações de ateliê aqui..."
    );
    setTemplate("minimal");
    setSelectedEntries([]);
    setSelectedConcepts([]);
    setIsPublic(false);
  };

  const handleSave = async () => {
    if (!user || !currentNotebook) return;
    if (!title.trim()) {
      alert(isEn ? "Portfolio Title is required." : "O título do portfólio é obrigatório.");
      return;
    }

    setIsSaving(true);
    const data = {
      title,
      subtitle,
      artistStatement,
      template,
      selectedEntries,
      selectedConcepts,
      curatedEntries: journal.filter((j) => selectedEntries.includes(j.id)),
      curatedConcepts: concepts.filter((c) => selectedConcepts.includes(c.id)),
      isPublic
    };

    try {
      if (activePortfolio) {
        // Update
        await updatePortfolio(activePortfolio.id, data);
        const updatedPortfolios = portfolios.map((p) =>
          p.id === activePortfolio.id ? ({ ...p, ...data, updatedAt: new Date().toISOString() } as Portfolio) : p
        );
        setPortfolios(updatedPortfolios);
        alert(isEn ? "Portfolio updated successfully." : "Portfólio atualizado com sucesso.");
      } else {
        // Create new
        const newP = await addPortfolio(user.uid, currentNotebook.id, data);
        setPortfolios([newP, ...portfolios]);
        setActivePortfolio(newP);
        alert(isEn ? "Portfolio created successfully." : "Portfólio criado com sucesso.");
      }
    } catch (err) {
      console.error("Failed to save portfolio:", err);
      alert(isEn ? "Failed to save portfolio. Please check your connection." : "Falha ao salvar portfólio. Verifique sua conexão.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(isEn ? "Are you sure you want to permanently delete this portfolio?" : "Tem certeza que deseja excluir permanentemente este portfólio?")) {
      return;
    }
    try {
      await deletePortfolio(id);
      const updated = portfolios.filter((p) => p.id !== id);
      setPortfolios(updated);
      if (updated.length > 0) {
        selectPortfolio(updated[0]);
      } else {
        handleNewPortfolio();
      }
      alert(isEn ? "Portfolio deleted successfully." : "Portfólio excluído com sucesso.");
    } catch (err) {
      console.error("Failed to delete portfolio:", err);
      alert(isEn ? "Failed to delete portfolio." : "Falha ao excluir portfólio.");
    }
  };

  // AI Assist to Generate/Draft Artist Statement
  const handleAIAssist = async () => {
    if (!user) return;
    setIsGeneratingStatement(true);
    try {
      const idToken = await user.getIdToken();
      
      // Filter selected entries and concepts to send as context
      const filteredEntries = journal.filter((j) => selectedEntries.includes(j.id));
      const filteredConcepts = concepts.filter((c) => selectedConcepts.includes(c.id));

      if (filteredEntries.length === 0 && filteredConcepts.length === 0) {
        alert(
          isEn 
            ? "Please select some journal logs or concept seeds in the 'Curation' tab first to give context to ATLAS."
            : "Por favor, selecione alguns registros de diário ou sementes de conceito na aba 'Curadoria' primeiro para dar contexto ao ATLAS."
        );
        setIsGeneratingStatement(false);
        return;
      }

      const res = await fetch("/api/portfolio/assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          journalEntries: filteredEntries,
          concepts: filteredConcepts,
          currentStatement: artistStatement,
          locale
        })
      });

      if (!res.ok) {
        throw new Error("AI request failed");
      }

      const data = await res.json();
      if (data.statement) {
        setArtistStatement(data.statement);
      }
    } catch (err) {
      console.error("AI Statement generator failed:", err);
      alert(isEn ? "AI was unable to generate a statement. Please check your connection." : "A IA não pôde gerar o texto. Verifique sua conexão.");
    } finally {
      setIsGeneratingStatement(false);
    }
  };

  // Copy Public Share URL
  const copyShareLink = () => {
    if (!activePortfolio) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?portfolioId=${activePortfolio.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  // Print/Trigger PDF compiling
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const renderedHTML = document.getElementById("portfolio-preview-sheet")?.innerHTML || "";

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #1c1917;
              line-height: 1.6;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              background: #fff;
            }
            h1 { font-family: 'Playfair Display', serif; font-size: 2.5rem; margin-bottom: 0.5rem; }
            h2 { font-family: 'Playfair Display', serif; font-size: 1.5rem; border-bottom: 1px solid #e6e2d5; padding-bottom: 0.5rem; margin-top: 2rem; }
            .subtitle { font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: #78716c; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 2rem; }
            .statement { font-size: 1.05rem; font-style: italic; color: #444; margin-bottom: 3rem; white-space: pre-wrap; }
            .concept-card { border: 1px solid #e6e2d5; padding: 20px; margin-bottom: 1.5rem; page-break-inside: avoid; }
            .concept-title { font-family: 'Playfair Display', serif; font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem; }
            .concept-desc { font-size: 0.95rem; color: #444; margin-bottom: 1rem; }
            .log-card { border-left: 2px solid #1c1917; padding-left: 15px; margin-bottom: 1.5rem; page-break-inside: avoid; }
            .log-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: bold; margin-bottom: 0.25rem; }
            .log-date { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #78716c; margin-bottom: 0.5rem; }
            .log-content { font-size: 0.9rem; color: #555; }
            .badge { display: inline-block; background: #f5f5f4; font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; padding: 2px 8px; margin-right: 5px; text-transform: uppercase; border: 1px solid #e6e2d5; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body onload="window.print()">
          ${renderedHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filter content
  const filteredJournal = journal.filter(
    (e) =>
      e.title.toLowerCase().includes(searchEntryQuery.toLowerCase()) ||
      e.content.toLowerCase().includes(searchEntryQuery.toLowerCase()) ||
      e.tags.some((t) => t.toLowerCase().includes(searchEntryQuery.toLowerCase()))
  );

  const filteredConcepts = concepts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchConceptQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchConceptQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] max-h-[1000px] overflow-hidden" id="portfolio-builder-module">
      {/* Module Title */}
      <div className="flex items-center justify-between border-b border-[#E6E2D5] pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1 hover:bg-[#F0EDE6] rounded-sm transition-colors text-stone-500 hover:text-stone-900 cursor-pointer"
              title={isEn ? "Back to Workspace" : "Voltar para o Espaço de Trabalho"}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-mono font-bold tracking-widest uppercase text-stone-900">
              {isEn ? "Poetic Portfolio Builder" : "Construtor de Portfólio Poético"}
            </h2>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {isEn 
              ? "Select and compile your concepts, daily logs, and artistic research statement into a shareable dossier."
              : "Selecione e compile seus conceitos, registros diários e depoimento artístico em um dossiê compartilhável."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {portfolios.length > 0 && (
            <select
              value={activePortfolio?.id || ""}
              onChange={(e) => {
                const found = portfolios.find((p) => p.id === e.target.value);
                if (found) selectPortfolio(found);
                else handleNewPortfolio();
              }}
              className="bg-white border border-[#DDD9CE] rounded-sm px-2.5 py-1 text-xs text-stone-800 font-mono font-medium focus:outline-none"
            >
              <option value="">{isEn ? " [ Create New Portfolio ] " : " [ Criar Novo Portfólio ] "}</option>
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleNewPortfolio}
            className="flex items-center gap-1.5 px-3 py-1 border border-[#DDD9CE] bg-white text-stone-700 hover:text-stone-900 hover:border-stone-400 font-mono text-[10px] uppercase tracking-wider rounded-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isEn ? "New" : "Novo"}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1 bg-stone-900 text-white hover:bg-stone-850 font-mono text-[10px] uppercase tracking-wider rounded-sm transition-all cursor-pointer font-bold"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isEn ? "Save" : "Salvar"}</span>
          </button>

          {activePortfolio && (
            <button
              onClick={() => handleDelete(activePortfolio.id)}
              className="p-1 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
              title={isEn ? "Delete Portfolio" : "Excluir Portfólio"}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Closed Beta Header Reminder */}
      <div className="bg-[#FCFAF7] border border-[#E6E2D5]/70 rounded px-4 py-2 flex items-center justify-between text-[11px] text-stone-600 mb-4 font-serif flex-shrink-0">
        <span>
          {isEn 
            ? "✦ This module is evolving with artists. Your ideas are welcome." 
            : "✦ Este módulo está evoluindo com os artistas. Suas ideias são bem-vindas."}
        </span>
        <span className="text-[9px] font-mono uppercase tracking-wider text-stone-500 font-semibold bg-white border border-[#E6E2D5] px-2 py-0.5 rounded">
          {isEn ? "Beta" : "Beta"}
        </span>
      </div>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-7 h-7 text-stone-400 animate-spin" />
          <p className="text-xs font-mono text-stone-400 uppercase tracking-widest">
            {isEn ? "Loading portfolios..." : "Carregando portfólios..."}
          </p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          {/* LEFT: CURATOR CONTROLS (5 cols) */}
          <div className="lg:col-span-5 flex flex-col bg-white border border-[#E6E2D5] rounded-sm p-4 overflow-y-auto min-h-0 space-y-4">
            {/* Tabs Selector */}
            <div className="flex border-b border-[#E6E2D5] pb-2">
              <button
                onClick={() => setActiveTab("details")}
                className={`flex-1 text-center py-1.5 font-mono text-[10px] uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                  activeTab === "details"
                    ? "border-b-2 border-stone-900 text-stone-950 font-bold"
                    : "text-stone-400 hover:text-stone-700"
                }`}
              >
                {isEn ? "1. Details" : "1. Detalhes"}
              </button>
              <button
                onClick={() => setActiveTab("curate")}
                className={`flex-1 text-center py-1.5 font-mono text-[10px] uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                  activeTab === "curate"
                    ? "border-b-2 border-stone-900 text-stone-950 font-bold"
                    : "text-stone-400 hover:text-stone-700"
                }`}
              >
                {isEn ? "2. Curation" : "2. Curadoria"}
              </button>
              <button
                onClick={() => setActiveTab("layout")}
                className={`flex-1 text-center py-1.5 font-mono text-[10px] uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                  activeTab === "layout"
                    ? "border-b-2 border-stone-900 text-stone-950 font-bold"
                    : "text-stone-400 hover:text-stone-700"
                }`}
              >
                {isEn ? "3. Layout" : "3. Visual"}
              </button>
            </div>

            {/* TAB 1: DETAILS */}
            {activeTab === "details" && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold mb-1.5">
                    {isEn ? "Portfolio Title" : "Título do Portfólio"}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#FCFAF7] border border-[#DDD9CE] focus:border-stone-500 focus:bg-white rounded-sm px-3 py-2 text-xs font-serif text-stone-900 placeholder-stone-400 transition-all focus:outline-none"
                    placeholder={isEn ? "E.g., Aesthetics of Erosion" : "Ex: Estética da Erosão"}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold mb-1.5">
                    {isEn ? "Optional Subtitle / Curator Statement Note" : "Subtítulo Opcional"}
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full bg-[#FCFAF7] border border-[#DDD9CE] focus:border-stone-500 focus:bg-white rounded-sm px-3 py-2 text-xs font-mono text-stone-850 placeholder-stone-400 transition-all focus:outline-none"
                    placeholder={isEn ? "E.g., Selected materials and research lines" : "Ex: Materiais e linhas de pesquisa selecionados"}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold">
                      {isEn ? "Artist Statement / Manifesto" : "Depoimento de Artista / Manifesto"}
                    </label>
                    <button
                      onClick={handleAIAssist}
                      disabled={isGeneratingStatement}
                      className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 font-bold transition-colors cursor-pointer"
                    >
                      {isGeneratingStatement ? (
                        <>
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          <span>{isEn ? "Drafting..." : "Rascunhando..."}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                          <span>{isEn ? "AI Assist" : "Assistente IA"}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[9px] text-stone-400 italic mb-1.5">
                    {isEn 
                      ? "Tip: Curate concepts or daily logs first in tab 2. AI Assist compiles them into a structured statement."
                      : "Dica: Curadoria conceitos ou diários na aba 2 primeiro. A Assistente IA os compilará em um texto estruturado."}
                  </p>
                  <textarea
                    rows={12}
                    value={artistStatement}
                    onChange={(e) => setArtistStatement(e.target.value)}
                    className="w-full bg-[#FCFAF7] border border-[#DDD9CE] focus:border-stone-500 focus:bg-white rounded-sm px-3 py-2 text-xs font-sans text-stone-800 placeholder-stone-400 transition-all focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: CURATION */}
            {activeTab === "curate" && (
              <div className="space-y-4 animate-fadeIn">
                {/* Concepts curation */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold">
                      {isEn ? "Curate Concepts" : "Curadoria de Conceitos"}
                    </label>
                    <span className="text-[9px] font-mono text-stone-400">
                      {selectedConcepts.length} {isEn ? "selected" : "selecionados"}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={searchConceptQuery}
                    onChange={(e) => setSearchConceptQuery(e.target.value)}
                    placeholder={isEn ? "Search concepts..." : "Buscar conceitos..."}
                    className="w-full bg-[#FCFAF7] border border-[#DDD9CE] rounded-sm px-2.5 py-1.5 text-[11px] font-mono focus:outline-none mb-2"
                  />
                  {concepts.length === 0 ? (
                    <p className="text-[11px] text-stone-400 italic">
                      {isEn ? "No concepts found in active notebook." : "Nenhum conceito no caderno ativo."}
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-[#E6E2D5] rounded-sm bg-[#FCFAF7] p-2 space-y-1.5">
                      {filteredConcepts.map((concept) => {
                        const isChecked = selectedConcepts.includes(concept.id);
                        return (
                          <label
                            key={concept.id}
                            className={`flex items-start gap-2.5 p-1.5 rounded-sm transition-all cursor-pointer text-left ${
                              isChecked ? "bg-white border border-[#DDD9CE]" : "hover:bg-stone-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedConcepts(selectedConcepts.filter((id) => id !== concept.id));
                                } else {
                                  setSelectedConcepts([...selectedConcepts, concept.id]);
                                }
                              }}
                              className="mt-0.5 rounded border-stone-300 text-stone-900 focus:ring-stone-500 w-3 h-3 cursor-pointer"
                            />
                            <div>
                              <p className="text-xs font-serif font-bold text-stone-900 leading-tight">
                                {concept.name}
                              </p>
                              <p className="text-[10px] text-stone-500 line-clamp-1">
                                {concept.description}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Journal entry curation */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold">
                      {isEn ? "Curate Journal Logs" : "Curadoria do Diário de Ateliê"}
                    </label>
                    <span className="text-[9px] font-mono text-stone-400">
                      {selectedEntries.length} {isEn ? "selected" : "selecionados"}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={searchEntryQuery}
                    onChange={(e) => setSearchEntryQuery(e.target.value)}
                    placeholder={isEn ? "Search process logs..." : "Buscar diário..."}
                    className="w-full bg-[#FCFAF7] border border-[#DDD9CE] rounded-sm px-2.5 py-1.5 text-[11px] font-mono focus:outline-none mb-2"
                  />
                  {journal.length === 0 ? (
                    <p className="text-[11px] text-stone-400 italic">
                      {isEn ? "No logs found in active notebook." : "Nenhum registro no diário ativo."}
                    </p>
                  ) : (
                    <div className="max-h-56 overflow-y-auto border border-[#E6E2D5] rounded-sm bg-[#FCFAF7] p-2 space-y-1.5">
                      {filteredJournal.map((entry) => {
                        const isChecked = selectedEntries.includes(entry.id);
                        const date = new Date(entry.createdAt);
                        const dateStr = date.toLocaleDateString(isEn ? "en-US" : "pt-BR", {
                          day: "2-digit",
                          month: "short"
                        });
                        return (
                          <label
                            key={entry.id}
                            className={`flex items-start gap-2.5 p-1.5 rounded-sm transition-all cursor-pointer text-left ${
                              isChecked ? "bg-white border border-[#DDD9CE]" : "hover:bg-stone-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedEntries(selectedEntries.filter((id) => id !== entry.id));
                                } else {
                                  setSelectedEntries([...selectedEntries, entry.id]);
                                }
                              }}
                              className="mt-0.5 rounded border-stone-300 text-stone-900 focus:ring-stone-500 w-3 h-3 cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] font-mono text-stone-400 uppercase">
                                  {dateStr}
                                </span>
                                <p className="text-xs font-serif font-bold text-stone-900 leading-tight">
                                  {entry.title}
                                </p>
                              </div>
                              <p className="text-[10px] text-stone-500 line-clamp-1">
                                {entry.content}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: LAYOUT & PUBLISHING */}
            {activeTab === "layout" && (
              <div className="space-y-4 animate-fadeIn">
                {/* Layout templates */}
                <div>
                  <label className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest font-bold mb-2">
                    {isEn ? "Aesthetic Template" : "Modelo Estético"}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setTemplate("minimal")}
                      className={`p-2.5 border rounded-sm text-left transition-all flex flex-col justify-between h-20 cursor-pointer ${
                        template === "minimal"
                          ? "bg-stone-900 text-white border-stone-900"
                          : "bg-white text-stone-700 border-[#DDD9CE] hover:border-stone-400"
                      }`}
                    >
                      <Layout className="w-4 h-4" />
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider font-bold">
                          {isEn ? "Minimal" : "Minimal"}
                        </p>
                        <p className={`text-[8px] leading-tight ${template === "minimal" ? "text-stone-300" : "text-stone-450"}`}>
                          {isEn ? "Spacious, linear, black & white" : "Linear, espaçoso e clássico"}
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => setTemplate("grid")}
                      className={`p-2.5 border rounded-sm text-left transition-all flex flex-col justify-between h-20 cursor-pointer ${
                        template === "grid"
                          ? "bg-stone-900 text-white border-stone-900"
                          : "bg-white text-stone-700 border-[#DDD9CE] hover:border-stone-400"
                      }`}
                    >
                      <Palette className="w-4 h-4" />
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider font-bold">
                          {isEn ? "Bento Grid" : "Bento Grid"}
                        </p>
                        <p className={`text-[8px] leading-tight ${template === "grid" ? "text-stone-300" : "text-stone-450"}`}>
                          {isEn ? "Bento-style blocks, conceptual" : "Estilo bento, conceitual"}
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => setTemplate("editorial")}
                      className={`p-2.5 border rounded-sm text-left transition-all flex flex-col justify-between h-20 cursor-pointer ${
                        template === "editorial"
                          ? "bg-stone-900 text-white border-stone-900"
                          : "bg-white text-stone-700 border-[#DDD9CE] hover:border-stone-400"
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider font-bold">
                          {isEn ? "Editorial" : "Editorial"}
                        </p>
                        <p className={`text-[8px] leading-tight ${template === "editorial" ? "text-stone-300" : "text-stone-450"}`}>
                          {isEn ? "Elegant serifs, monograph" : "Tipografia elegante de monografia"}
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Cloud publishing and sharing */}
                <div className="border border-[#E6E2D5] bg-[#FCFAF7] p-3 rounded-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-900">
                        {isEn ? "Cloud Public Sharing" : "Compartilhamento Público na Nuvem"}
                      </p>
                      <p className="text-[9px] text-stone-500 mt-0.5">
                        {isEn 
                          ? "Mark as public to make it shareable beyond your studio."
                          : "Marque como público para torná-lo compartilhável além do seu ateliê."}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="sr-only peer cursor-pointer"
                      />
                      <div className="w-7 h-4 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-stone-900" />
                    </label>
                  </div>

                  {activePortfolio ? (
                    <div className="space-y-2 pt-2 border-t border-stone-200">
                      <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-stone-450" />
                          <span>{isPublic ? (isEn ? "PUBLIC LINK LIVE" : "LINK PÚBLICO ATIVO") : (isEn ? "PRIVATE ACCESS" : "ACESSO PRIVADO")}</span>
                        </span>
                        {isPublic && (
                          <button
                            onClick={copyShareLink}
                            className="flex items-center gap-1 text-[9px] hover:text-stone-900 uppercase font-bold cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copySuccess ? (isEn ? "Copied!" : "Copiado!") : (isEn ? "Copy" : "Copiar")}</span>
                          </button>
                        )}
                      </div>
                      
                      {isPublic && (
                        <div className="bg-white border border-[#DDD9CE] p-1.5 rounded-sm flex items-center justify-between gap-2">
                          <p className="text-[9px] font-mono text-stone-500 truncate select-all flex-1">
                            {window.location.origin}{window.location.pathname}?portfolioId={activePortfolio.id}
                          </p>
                          <a
                            href={`${window.location.origin}${window.location.pathname}?portfolioId=${activePortfolio.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-stone-450 hover:text-stone-950 p-1 flex-shrink-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[9px] text-stone-400 italic">
                      {isEn ? "Save your portfolio first to enable public cloud sharing links." : "Salve seu portfólio primeiro para ativar links públicos de compartilhamento."}
                    </p>
                  )}
                </div>

                {/* Print button */}
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-stone-900 text-stone-900 hover:bg-stone-50 font-mono text-[10px] uppercase tracking-wider rounded-sm font-bold transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isEn ? "Compile Print-to-PDF / Print" : "Imprimir / Gerar PDF de Impressão"}</span>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: LIVE SHEET PREVIEW (7 cols) */}
          <div className="lg:col-span-7 flex flex-col bg-[#F5F2EB] border border-[#E6E2D5] rounded-sm p-4 min-h-0 relative">
            <div className="absolute top-2 right-4 flex items-center gap-2 z-10">
              <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-sm">
                {isEn ? "Live Canvas Preview" : "Prévia em Tempo Real"}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 min-h-0 bg-white shadow-sm border border-[#DDD9CE] p-8 md:p-12 text-stone-850 mt-6" id="portfolio-preview-sheet">
              {/* Cover/Main Header */}
              <div className="border-b border-stone-200 pb-6 mb-8 text-left">
                <h1 className={`font-bold text-stone-900 tracking-tight leading-tight ${template === "editorial" ? "font-serif text-3xl italic" : "text-2xl"}`}>
                  {title || (isEn ? "Untitled Portfolio" : "Portfólio Sem Título")}
                </h1>
                {subtitle && (
                  <p className="text-xs font-mono text-stone-500 uppercase tracking-widest mt-2">
                    {subtitle}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-4 text-[9px] font-mono text-stone-400">
                  <span>{isEn ? "ARTIST:" : "ARTISTA:"} {user?.displayName || user?.email || (isEn ? "Studio Researcher" : "Pesquisador")}</span>
                  <span>•</span>
                  <span>{isEn ? "STUDIO NOTEBOOK:" : "CADERNO:"} {currentNotebook?.title.toUpperCase()}</span>
                </div>
              </div>

              {/* Artist Statement Section */}
              {artistStatement && (
                <div className="mb-10 text-left">
                  <h2 className="text-xs font-mono font-bold tracking-wider text-stone-400 uppercase mb-4">
                    {isEn ? "Research Statement" : "Depoimento de Pesquisa"}
                  </h2>
                  <p className={`text-stone-750 whitespace-pre-wrap leading-relaxed ${template === "editorial" ? "font-serif text-[13px]" : "text-xs"}`}>
                    {artistStatement}
                  </p>
                </div>
              )}

              {/* Selected Concepts Section */}
              {selectedConcepts.length > 0 && (
                <div className="mb-10 text-left">
                  <h2 className="text-xs font-mono font-bold tracking-wider text-stone-400 uppercase mb-4 border-b border-stone-100 pb-1">
                    {isEn ? "Curated Conceptual Seeds" : "Sementes Conceituais"}
                  </h2>

                  {template === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {concepts
                        .filter((c) => selectedConcepts.includes(c.id))
                        .map((concept) => (
                          <div key={concept.id} className="border border-stone-200 p-4 rounded-sm bg-[#FCFAF7]">
                            <h3 className="text-xs font-serif font-bold text-stone-900">
                              {concept.name}
                            </h3>
                            <p className="text-[10px] text-stone-500 font-mono uppercase tracking-widest mt-1">
                              {concept.status}
                            </p>
                            <p className="text-xs text-stone-650 mt-2 leading-relaxed">
                              {concept.description}
                            </p>
                            {concept.associations && concept.associations.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {concept.associations.slice(0, 3).map((a) => (
                                  <span key={a} className="text-[8px] font-mono text-stone-500 bg-white border border-[#DDD9CE] px-1.5 py-0.2 rounded-sm">
                                    {a}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {concepts
                        .filter((c) => selectedConcepts.includes(c.id))
                        .map((concept) => (
                          <div key={concept.id} className="border-l-[2px] border-stone-950 pl-4 py-1">
                            <h3 className="text-xs font-serif font-bold text-stone-900">
                              {concept.name}
                            </h3>
                            <p className="text-[10px] text-stone-650 mt-1.5 leading-relaxed">
                              {concept.description}
                            </p>
                            {concept.associations && concept.associations.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2.5">
                                {concept.associations.map((a) => (
                                  <span key={a} className="text-[8px] font-mono text-stone-500 bg-stone-100/60 px-1.5 py-0.5 rounded-sm">
                                    #{a}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Selected Journal Logs Section */}
              {selectedEntries.length > 0 && (
                <div className="text-left">
                  <h2 className="text-xs font-mono font-bold tracking-wider text-stone-400 uppercase mb-4 border-b border-stone-100 pb-1">
                    {isEn ? "Curated Process Records" : "Registros Curados do Diário"}
                  </h2>
                  <div className="space-y-6">
                    {journal
                      .filter((e) => selectedEntries.includes(e.id))
                      .map((entry) => {
                        const date = new Date(entry.createdAt);
                        const dateStr = date.toLocaleDateString(isEn ? "en-US" : "pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric"
                        });
                        return (
                          <div key={entry.id} className="border-b border-stone-100 pb-4 last:border-0 last:pb-0">
                            <div className="flex items-baseline justify-between gap-4">
                              <h3 className="text-xs font-serif font-bold text-stone-900">
                                {entry.title}
                              </h3>
                              <span className="text-[9px] font-mono text-stone-400">
                                {dateStr}
                              </span>
                            </div>
                            <p className="text-xs text-stone-650 leading-relaxed mt-2 whitespace-pre-wrap">
                              {entry.content}
                            </p>
                            {entry.tags && entry.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2.5">
                                {entry.tags.map((t) => (
                                  <span key={t} className="text-[8px] font-mono text-stone-500 bg-stone-50 border border-stone-150 px-1.5 py-0.2 rounded-sm">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {selectedEntries.length === 0 && selectedConcepts.length === 0 && !artistStatement && (
                <div className="h-[250px] flex flex-col items-center justify-center text-center p-6 text-stone-400 border border-dashed border-[#DDD9CE] rounded-sm bg-[#FCFAF7] space-y-2">
                  <FileText className="w-8 h-8 text-stone-300 mb-2 animate-pulse" />
                  <p className="text-xs font-mono uppercase tracking-widest text-stone-800 font-bold">
                    {isEn ? "No Portfolio Curated Yet" : "Nenhum Portfólio Curado Ainda"}
                  </p>
                  <p className="text-xs text-stone-550 max-w-sm mx-auto font-sans leading-relaxed">
                    {isEn
                      ? "A curated portfolio compiles your selected conceptual seeds, studio journal logs, and artist statement into a unified publication-ready presentation."
                      : "Um portfólio curado compila suas sementes conceituais selecionadas, registros do diário de ateliê e texto de artista em uma apresentação unificada pronta para publicação."}
                  </p>
                  <p className="text-xs text-stone-900 font-mono uppercase tracking-wider font-semibold">
                    {isEn
                      ? "What to do next: Select entries and concepts from the tabs on the left, and compose or auto-draft your artist statement."
                      : "Próximo passo: Selecione entradas e conceitos nas abas à esquerda, e escreva ou rascunhe seu texto de artista."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
