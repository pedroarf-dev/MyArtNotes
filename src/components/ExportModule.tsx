import React, { useState, useEffect } from "react";
import { useTranslation } from "../lib/i18n";
import { ExportItem, JournalEntry, Concept, Insight } from "../types";
import { 
  getExports, 
  addExport, 
  deleteExport, 
  updateExport, 
  getUserProfile 
} from "../lib/dbService";
import { exportEngineInstance } from "../lib/exportService";
import { useResearch } from "../context/ResearchContext";
import { 
  FileText, 
  BookOpen, 
  Activity, 
  Layers, 
  Trash2, 
  Download, 
  RefreshCw, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Eye,
  Printer,
  ChevronRight
} from "lucide-react";

interface ExportModuleProps {
  journal: JournalEntry[];
  concepts: Concept[];
  insights: Insight[];
  user: any;
}

export default function ExportModule({
  journal,
  concepts,
  insights,
  user
}: ExportModuleProps) {
  const { t, locale } = useTranslation();
  const { currentNotebook } = useResearch();
  const [exportsList, setExportsList] = useState<ExportItem[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // UI states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Document viewer modal
  const [viewingDoc, setViewingDoc] = useState<ExportItem | null>(null);

  // Load history and user profile
  useEffect(() => {
    if (user && currentNotebook) {
      fetchHistory(currentNotebook.id);
      getUserProfile(user.uid).then((prof) => {
        setUserProfile(prof);
      }).catch((err) => {
        console.warn("Failed to fetch user profile for export:", err);
      });
    }
  }, [user, currentNotebook]);

  const fetchHistory = async (notebookId: string) => {
    if (!user) return;
    try {
      const data = await getExports(user.uid, notebookId);
      setExportsList(data);
    } catch (err) {
      console.error("Failed to load export history:", err);
    }
  };

  // Status steps for compilation progress simulation
  const stepsPT = [
    "Verificando integridade dos registros de ateliê...",
    "Estruturando conceitos e elos poéticos do mapa...",
    "Compilando cronologia do diário e tags vinculadas...",
    "Integrando com o modelo ATLAS de inteligência...",
    "Revisando o tom acadêmico e formatando em Markdown...",
    "Documento compilado com sucesso e arquivado."
  ];

  const stepsEN = [
    "Verifying integrity of studio logs...",
    "Structuring concepts and poetic map links...",
    "Compiling journal chronology and linked tags...",
    "Integrating with ATLAS intelligence core...",
    "Reviewing academic tone and formatting as Markdown...",
    "Document compiled successfully and archived."
  ];

  const steps = locale === "en" ? stepsEN : stepsPT;

  const handleGenerate = async (typeId: string) => {
    if (!user) return;
    setErrorBanner(null);
    setSuccessBanner(null);
    setIsGenerating(true);
    setGeneratingType(typeId);
    setGenerationStep(0);
    setStatusMessage(steps[0]);

    // Setup an interval to advance steps for visual feedback
    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev < steps.length - 2) {
          const next = prev + 1;
          setStatusMessage(steps[next]);
          return next;
        }
        return prev;
      });
    }, 3000);

    // Create the pending export item in Firestore
    let pendingItem: ExportItem | null = null;
    try {
      const generator = exportEngineInstance.getGenerator(typeId);
      if (!generator) {
        throw new Error("Generator not found in ATLAS Registry.");
      }

      // Check current version for the document type
      const previousExports = exportsList.filter((e) => e.type === typeId);
      const nextVersion = previousExports.length > 0 
        ? Math.max(...previousExports.map((e) => e.version)) + 1 
        : 1;

      pendingItem = await addExport(user.uid, currentNotebook?.id || "default", {
        userId: user.uid,
        type: typeId as any,
        language: locale as "en" | "pt",
        createdAt: new Date().toISOString(),
        status: "pending",
        version: nextVersion,
        metadata: {
          journalCount: journal.length,
          conceptCount: concepts.length,
          insightCount: insights.length
        }
      });

      // Optimistically add to UI list
      setExportsList((prev) => [pendingItem!, ...prev]);

      // Execute generation strategy
      const result = await generator.generate({
        journalEntries: journal,
        concepts,
        insights,
        userProfile,
        language: locale as "en" | "pt",
        t
      });

      // Update item in Firestore to success
      await updateExport(pendingItem.id, {
        status: "success",
        title: result.title,
        content: result.content
      });

      // Update local state
      setExportsList((prev) =>
        prev.map((item) =>
          item.id === pendingItem!.id
            ? { ...item, status: "success", title: result.title, content: result.content }
            : item
        )
      );

      setGenerationStep(steps.length - 1);
      setStatusMessage(steps[steps.length - 1]);
      setSuccessBanner(
        locale === "en" 
          ? `Document "${result.title}" (v${nextVersion}) compiled successfully!` 
          : `Documento "${result.title}" (v${nextVersion}) compilado com sucesso!`
      );
    } catch (err: any) {
      console.error("Export generation failure:", err);
      const errorMsg = err.message || "Compilation failed due to network or empty archive resources.";
      setErrorBanner(errorMsg);

      if (pendingItem) {
        await updateExport(pendingItem.id, { status: "failed" });
        setExportsList((prev) =>
          prev.map((item) =>
            item.id === pendingItem!.id ? { ...item, status: "failed" } : item
          )
        );
      }
    } finally {
      clearInterval(stepInterval);
      setIsGenerating(false);
      setGeneratingType(null);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(locale === "en" ? "Delete this export from history?" : "Excluir esta exportação do histórico?")) {
      return;
    }
    try {
      await deleteExport(id);
      setExportsList((prev) => prev.filter((item) => item.id !== id));
      setSuccessBanner(locale === "en" ? "Export item deleted successfully." : "Item exportado excluído com sucesso.");
    } catch (err) {
      console.error(err);
      setErrorBanner(locale === "en" ? "Failed to delete export." : "Falha ao excluir exportação.");
    }
  };

  const handleDownload = (item: ExportItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.content) return;
    
    const element = document.createElement("a");
    const file = new Blob([item.content], { type: "text/markdown;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${item.type}_export_v${item.version}_${locale}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const triggerPrint = (item: ExportItem) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert(locale === "en" ? "Please allow popups to print documents." : "Por favor, permita popups para imprimir documentos.");
      return;
    }

    const isEn = item.language === "en";
    
    // Convert basic markdown to formatted HTML for printing
    const formattedHtml = parseMarkdownToHtml(item.content || "");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${item.title || "MyArtNotes Export"}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4;
            margin: 25mm 20mm 25mm 20mm;
          }
          body {
            font-family: "Inter", sans-serif;
            color: #1c1917;
            line-height: 1.62;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 11pt;
          }
          h1, h2, h3, h4 {
            font-family: "Playfair Display", serif;
            color: #0c0a09;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            page-break-after: avoid;
          }
          h1 {
            font-size: 24pt;
            font-weight: 600;
            text-align: center;
            margin-top: 2em;
            margin-bottom: 1em;
            letter-spacing: -0.01em;
          }
          h2 {
            font-size: 16pt;
            font-weight: 600;
            border-bottom: 1px solid #e7e5e4;
            padding-bottom: 0.3em;
            margin-top: 2em;
          }
          h3 {
            font-size: 12pt;
            font-weight: 600;
          }
          p {
            margin-top: 0;
            margin-bottom: 1em;
            text-align: justify;
          }
          ul, ol {
            margin-top: 0;
            margin-bottom: 1em;
            padding-left: 1.5em;
          }
          li {
            margin-bottom: 0.4em;
          }
          code {
            font-family: "JetBrains Mono", monospace;
            font-size: 9.5pt;
            background-color: #f5f5f4;
            padding: 0.1em 0.3em;
            border-radius: 3px;
          }
          blockquote {
            margin: 1.5em 0;
            padding-left: 1.2em;
            border-left: 3px solid #78716c;
            color: #44403c;
            font-style: italic;
          }
          hr {
            border: 0;
            border-top: 1px solid #e7e5e4;
            margin: 2em 0;
          }
          .meta-info {
            font-family: "JetBrains Mono", monospace;
            font-size: 8.5pt;
            text-align: center;
            color: #78716c;
            margin-bottom: 4em;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          .footer-note {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            font-family: "JetBrains Mono", monospace;
            font-size: 8pt;
            text-align: center;
            color: #a8a29e;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          /* Print optimizations */
          @media print {
            body {
              background-color: transparent;
            }
            .no-print {
              display: none;
            }
            /* Add cover page break if desired */
            .cover-break {
              page-break-after: always;
            }
          }
        </style>
      </head>
      <body>
        <div class="content-wrapper">
          ${formattedHtml}
        </div>
        <div class="footer-note">
          MyArtNotes - ${isEn ? "ARTISTIC RESEARCH NOTEBOOK" : "CADERNO DE PESQUISA ARTÍSTICA"} - PAGE ${item.version}
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Basic utility to convert simple Markdown structure into readable HTML tags
  const parseMarkdownToHtml = (markdown: string): string => {
    let html = markdown;

    // Split lines and process structurally
    const lines = html.split("\n");
    let inList = false;
    let listType: "ul" | "ol" | null = null;
    const processedLines = lines.map((line) => {
      let trimmed = line.trim();

      // Headers
      if (trimmed.startsWith("# ")) {
        if (inList) { inList = false; return `</${listType}>\n<h1>${trimmed.slice(2)}</h1>`; }
        return `<h1>${trimmed.slice(2)}</h1>`;
      }
      if (trimmed.startsWith("## ")) {
        if (inList) { inList = false; return `</${listType}>\n<h2>${trimmed.slice(3)}</h2>`; }
        return `<h2>${trimmed.slice(3)}</h2>`;
      }
      if (trimmed.startsWith("### ")) {
        if (inList) { inList = false; return `</${listType}>\n<h3>${trimmed.slice(4)}</h3>`; }
        return `<h3>${trimmed.slice(4)}</h3>`;
      }

      // Blockquotes
      if (trimmed.startsWith("> ")) {
        if (inList) { inList = false; return `</${listType}>\n<blockquote>${trimmed.slice(2)}</blockquote>`; }
        return `<blockquote>${trimmed.slice(2)}</blockquote>`;
      }

      // Horizontal Rules
      if (trimmed === "---") {
        if (inList) { inList = false; return `</${listType}>\n<hr />`; }
        return `<hr />`;
      }

      // Bullet Lists
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        let content = trimmed.slice(2);
        // Replace bold inside list
        content = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        content = content.replace(/\*(.*?)\*/g, "<em>$1</em>");
        content = content.replace(/`(.*?)`/g, "<code>$1</code>");
        
        if (!inList) {
          inList = true;
          listType = "ul";
          return `<ul>\n<li>${content}</li>`;
        }
        return `<li>${content}</li>`;
      }

      // Number Lists
      if (/^\d+\.\s/.test(trimmed)) {
        let content = trimmed.replace(/^\d+\.\s/, "");
        content = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        content = content.replace(/\*(.*?)\*/g, "<em>$1</em>");
        content = content.replace(/`(.*?)`/g, "<code>$1</code>");

        if (!inList) {
          inList = true;
          listType = "ol";
          return `<ol>\n<li>${content}</li>`;
        }
        return `<li>${content}</li>`;
      }

      // Paragraph close list if empty line
      if (trimmed === "") {
        if (inList) {
          inList = false;
          return `</${listType}>\n`;
        }
        return "";
      }

      // Normal paragraph
      if (inList) {
        inList = false;
        return `</${listType}>\n<p>${trimmed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/`(.*?)`/g, "<code>$1</code>")}</p>`;
      }

      return `<p>${trimmed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/`(.*?)`/g, "<code>$1</code>")}</p>`;
    });

    if (inList) {
      processedLines.push(`</${listType}>`);
    }

    return processedLines.join("\n");
  };

  const getLocalizedTypeLabel = (type: string) => {
    switch (type) {
      case "pdf": return locale === "en" ? "Complete PDF" : "Caderno Completo (PDF)";
      case "memorial": return locale === "en" ? "Memorial Descritivo" : "Memorial Descritivo";
      case "report": return locale === "en" ? "Research Report" : "Relatório de Pesquisa";
      case "summary": return locale === "en" ? "Research Summary" : "Resumo de Pesquisa";
      default: return type.toUpperCase();
    }
  };

  const getGeneratorCards = () => {
    return [
      {
        id: "pdf",
        icon: <FileText className="w-5 h-5 text-stone-700" />,
        desc: t.pdfCardDesc,
        purpose: t.pdfPurpose,
        whenToUse: t.pdfWhenToUse,
        estTime: t.pdfEstTime,
        disabled: false
      },
      {
        id: "memorial",
        icon: <BookOpen className="w-5 h-5 text-amber-800" />,
        desc: t.memorialCardDesc,
        purpose: t.memorialPurpose,
        whenToUse: t.memorialWhenToUse,
        estTime: t.memorialEstTime,
        // Require at least one journal entry and concept for Memorial Descritivo
        disabled: journal.length < 1 || concepts.length < 1
      },
      {
        id: "report",
        icon: <Activity className="w-5 h-5 text-emerald-800" />,
        desc: t.reportCardDesc,
        purpose: t.reportPurpose,
        whenToUse: t.reportWhenToUse,
        estTime: t.reportEstTime,
        disabled: false
      },
      {
        id: "summary",
        icon: <Layers className="w-5 h-5 text-indigo-800" />,
        desc: t.summaryCardDesc,
        purpose: t.summaryPurpose,
        whenToUse: t.summaryWhenToUse,
        estTime: t.summaryEstTime,
        disabled: false
      }
    ];
  };

  return (
    <div className="flex flex-col gap-8 h-full" id="export-module-root">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E6E2D5] pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-serif font-semibold text-stone-900 tracking-wider uppercase">
            {t.exportTitle}
          </h1>
          <p className="text-xs text-stone-500 font-sans tracking-wide">
            {t.exportSubtitle}
          </p>
        </div>

        {/* Quick archive stats in mono */}
        <div className="flex items-center gap-4 text-[10px] font-mono text-stone-500 uppercase border border-[#DDD9CE] px-3.5 py-1.5 rounded bg-white select-none shadow-sm">
          <span>{locale === "en" ? "Logs" : "Registros"}: {journal.length}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
          <span>{locale === "en" ? "Concepts" : "Conceitos"}: {concepts.length}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
          <span>{locale === "en" ? "Reflections" : "Reflexões"}: {insights.length}</span>
        </div>
      </div>

      {/* Action Notification Banners */}
      {successBanner && (
        <div className="p-4 bg-emerald-50/75 border border-emerald-200 text-emerald-800 rounded flex items-start gap-3 text-xs animate-fadeIn" id="success-banner">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-sans">{successBanner}</div>
          <button onClick={() => setSuccessBanner(null)} className="font-mono text-[10px] uppercase text-emerald-600 hover:text-emerald-900 cursor-pointer">
            {locale === "en" ? "Dismiss" : "Dispensar"}
          </button>
        </div>
      )}

      {errorBanner && (
        <div className="p-4 bg-red-50/75 border border-red-200 text-red-800 rounded flex items-start gap-3 text-xs animate-fadeIn" id="error-banner">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-sans leading-relaxed">{errorBanner}</div>
          <button onClick={() => setErrorBanner(null)} className="font-mono text-[10px] uppercase text-red-600 hover:text-red-900 cursor-pointer">
            {locale === "en" ? "Dismiss" : "Dispensar"}
          </button>
        </div>
      )}

      {/* Progress display */}
      {isGenerating && (
        <div className="p-5 bg-white border border-[#DDD9CE] rounded shadow-sm flex flex-col gap-4 animate-pulse" id="generation-progress-box">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 text-amber-700 animate-spin" />
              <span className="font-mono text-xs text-stone-900 tracking-wider uppercase font-bold">
                {locale === "en" ? "Compiling Document..." : "Compilando Documento..."}
              </span>
            </div>
            <span className="font-mono text-[10px] text-stone-400">
              {Math.round(((generationStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full h-1 bg-[#FAF8F3] rounded-full overflow-hidden border border-[#E6E2D5]">
            <div 
              className="h-full bg-stone-900 transition-all duration-500 ease-out" 
              style={{ width: `${((generationStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <p className="text-xs text-stone-600 italic font-sans leading-normal">
            {statusMessage}
          </p>
        </div>
      )}

      {/* Section 1: Generators Grid */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xs font-mono font-bold text-stone-500 uppercase tracking-widest">
          {t.generatorTitle}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {getGeneratorCards().map((card) => {
            const isThisGenerating = isGenerating && generatingType === card.id;
            return (
              <div 
                key={card.id}
                id={`generator-card-${card.id}`}
                className={`bg-white border p-5 rounded flex flex-col justify-between transition-all duration-200 select-none ${
                  card.disabled 
                    ? "border-stone-200/60 bg-stone-50/50 opacity-60" 
                    : "border-[#DDD9CE] hover:border-stone-400 shadow-sm"
                }`}
              >
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-[#FAF8F3] border border-[#E6E2D5] rounded">
                      {card.icon}
                    </div>
                    {card.disabled && (
                      <span className="text-[8px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {locale === "en" ? "Locked" : "Bloqueado"}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-mono font-bold text-stone-900 uppercase tracking-wide">
                      {getLocalizedTypeLabel(card.id)}
                    </h3>
                    <p className="text-xs text-stone-500 leading-relaxed font-sans">
                      {card.desc}
                    </p>
                  </div>

                  <div className="border-t border-[#FAF8F3] pt-3 flex flex-col gap-2 text-[10px] font-sans">
                    <div>
                      <span className="text-stone-400 font-mono text-[9px] uppercase tracking-wider block">{t.purposeLabel}</span>
                      <span className="text-stone-700 leading-normal">{card.purpose}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 font-mono text-[9px] uppercase tracking-wider block">{t.whenToUseLabel}</span>
                      <span className="text-stone-700 leading-normal">{card.whenToUse}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 font-mono text-[9px] uppercase tracking-wider block">{t.estTimeLabel}</span>
                      <span className="text-stone-800 font-mono font-semibold">{card.estTime}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  {card.disabled ? (
                    <div className="p-2.5 bg-stone-100 rounded text-[9px] text-stone-500 leading-relaxed font-sans">
                      {t.insufficientDataMsg}
                    </div>
                  ) : (
                    <button
                      id={`btn-generate-${card.id}`}
                      disabled={isGenerating}
                      onClick={() => handleGenerate(card.id)}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2 border rounded font-mono text-xs transition-all duration-150 cursor-pointer ${
                        isThisGenerating
                          ? "bg-stone-50 border-stone-300 text-stone-400"
                          : "bg-stone-900 border-stone-900 text-white hover:bg-stone-800"
                      }`}
                    >
                      {isThisGenerating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-400" />
                          <span>{t.generatingStatus}</span>
                        </>
                      ) : (
                        <>
                          <ChevronRight className="w-3.5 h-3.5" />
                          <span>{t.generateBtn}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Recent Exports (History) */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xs font-mono font-bold text-stone-500 uppercase tracking-widest">
          {t.recentExportsTitle}
        </h2>

        <div className="bg-white border border-[#DDD9CE] rounded shadow-sm overflow-hidden" id="exports-history-container">
          {exportsList.length === 0 ? (
            <div className="py-12 px-6 text-center text-stone-400 font-mono text-xs leading-relaxed">
              {t.noRecentExports}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF8F3] border-b border-[#E6E2D5] text-[10px] font-mono text-stone-500 uppercase tracking-wider">
                    <th className="p-4 font-semibold">{t.typeLabel}</th>
                    <th className="p-4 font-semibold">{t.versionLabel}</th>
                    <th className="p-4 font-semibold">{t.languageHeader}</th>
                    <th className="p-4 font-semibold">{t.statusLabel}</th>
                    <th className="p-4 font-semibold">{t.dateLabel}</th>
                    <th className="p-4 font-semibold text-right">{t.actionsLabel}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAF8F3] font-sans">
                  {exportsList.map((item) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-[#FAF8F3]/50 transition-colors cursor-pointer"
                      onClick={() => item.status === "success" && setViewingDoc(item)}
                      id={`export-row-${item.id}`}
                    >
                      <td className="p-4 font-mono font-bold text-stone-900">
                        {getLocalizedTypeLabel(item.type)}
                      </td>
                      <td className="p-4 font-mono text-stone-600">
                        v{item.version}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 border border-[#DDD9CE] text-[9px] font-mono rounded uppercase bg-stone-50">
                          {item.language}
                        </span>
                      </td>
                      <td className="p-4">
                        {item.status === "pending" && (
                          <span className="inline-flex items-center gap-1.5 text-amber-700 font-mono text-[10px] uppercase font-bold">
                            <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                            <span>{locale === "en" ? "Pending" : "Processando"}</span>
                          </span>
                        )}
                        {item.status === "success" && (
                          <span className="inline-flex items-center gap-1 text-emerald-800 font-mono text-[10px] uppercase font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>{locale === "en" ? "Ready" : "Pronto"}</span>
                          </span>
                        )}
                        {item.status === "failed" && (
                          <span className="inline-flex items-center gap-1 text-red-800 font-mono text-[10px] uppercase font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            <span>{locale === "en" ? "Failed" : "Falhou"}</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-stone-500 font-mono text-[10px]">
                        {new Date(item.createdAt).toLocaleString(locale === "en" ? "en-US" : "pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2.5">
                          {item.status === "success" && (
                            <>
                              <button
                                onClick={() => setViewingDoc(item)}
                                className="p-1.5 border border-[#DDD9CE] hover:border-stone-400 bg-white hover:bg-stone-50 rounded text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                                title={locale === "en" ? "View Document" : "Visualizar Documento"}
                                id={`btn-view-${item.id}`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDownload(item, e)}
                                className="p-1.5 border border-[#DDD9CE] hover:border-stone-400 bg-white hover:bg-stone-50 rounded text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                                title={locale === "en" ? "Download Source" : "Baixar Código"}
                                id={`btn-dl-${item.id}`}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            disabled={isGenerating}
                            onClick={() => handleGenerate(item.type)}
                            className="p-1.5 border border-[#DDD9CE] hover:border-stone-400 bg-white hover:bg-stone-50 rounded text-stone-600 hover:text-stone-900 transition-colors disabled:opacity-50 cursor-pointer"
                            title={locale === "en" ? "Regenerate" : "Gerar Nova Versão"}
                            id={`btn-regen-${item.id}`}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1.5 border border-red-200 hover:border-red-400 bg-red-50 hover:bg-red-100/50 rounded text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                            title={locale === "en" ? "Delete Export" : "Excluir Exportação"}
                            id={`btn-del-${item.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Document Modal (Fitted to viewport with scrollable content and sticky actions) */}
      {viewingDoc && (
        <div 
          className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-6" 
          id="export-document-modal"
        >
          <div 
            className="bg-white w-full max-w-4xl rounded-lg shadow-xl flex flex-col overflow-hidden border border-stone-200 max-h-[85vh] h-[85vh] animate-slideUp"
          >
            {/* STICKY HEADER */}
            <div className="bg-[#FAF8F3] border-b border-[#E6E2D5] px-6 py-4 flex items-center justify-between shrink-0 select-none">
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest">
                  {locale === "en" ? "ATLAS Export Output" : "ATLAS Resultado de Exportação"}
                </span>
                <h2 className="text-sm font-serif font-bold text-stone-900 uppercase tracking-wide mt-0.5">
                  {getLocalizedTypeLabel(viewingDoc.type)} — Version {viewingDoc.version}
                </h2>
              </div>
              <span className="text-[10px] font-mono text-stone-500 bg-white border border-[#DDD9CE] px-2.5 py-1 rounded">
                {locale === "en" ? "Lang" : "Idioma"}: {viewingDoc.language.toUpperCase()}
              </span>
            </div>

            {/* SCROLLABLE BODY AREA */}
            <div className="flex-1 overflow-y-auto px-8 py-10 bg-[#FCFBF9] selection:bg-[#F2EFE9]">
              {/* Paper feeling container */}
              <div className="max-w-2xl mx-auto font-serif text-stone-900 leading-relaxed text-sm md:text-base space-y-6">
                <div 
                  className="prose prose-stone max-w-none break-words"
                  dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(viewingDoc.content || "") }}
                />
              </div>
            </div>

            {/* STICKY FOOTER WITH ACTIONS */}
            <div className="bg-[#FAF8F3] border-t border-[#E6E2D5] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 select-none">
              <div className="text-[10px] font-mono text-stone-400">
                {locale === "en" ? "Generated on" : "Compilado em"}: {new Date(viewingDoc.createdAt).toLocaleDateString()}
              </div>
              
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button
                  id="modal-btn-download"
                  onClick={(e) => handleDownload(viewingDoc, e)}
                  className="flex items-center gap-2 px-4 py-2 border border-[#DDD9CE] bg-white hover:bg-stone-50 rounded font-mono text-xs text-stone-700 hover:text-stone-900 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{locale === "en" ? "Download MD" : "Baixar MD"}</span>
                </button>
                <button
                  id="modal-btn-print"
                  onClick={() => triggerPrint(viewingDoc)}
                  className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded font-mono text-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{locale === "en" ? "Print / Save PDF" : "Imprimir / Salvar PDF"}</span>
                </button>
                <button
                  id="modal-btn-close"
                  onClick={() => setViewingDoc(null)}
                  className="flex items-center gap-2 px-4 py-2 border border-stone-300 bg-white hover:bg-stone-50 rounded font-mono text-xs text-stone-700 hover:text-stone-900 cursor-pointer"
                >
                  <span>{locale === "en" ? "Close" : "Fechar"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
