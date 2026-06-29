import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Portfolio } from "../types";
import { 
  Loader2, 
  AlertCircle, 
  Printer, 
  BookOpen, 
  Compass, 
  ExternalLink,
  ChevronRight
} from "lucide-react";

interface PublicPortfolioViewerProps {
  portfolioId: string;
}

export default function PublicPortfolioViewer({ portfolioId }: PublicPortfolioViewerProps) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicPortfolio = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const ref = doc(db, "portfolios", portfolioId);
        const snap = await getDoc(ref);
        
        if (!snap.exists()) {
          setErrorMsg("Portfolio not found. Please verify the URL.");
          setIsLoading(false);
          return;
        }

        const data = snap.data() as Portfolio;
        if (!data.isPublic) {
          setErrorMsg("This portfolio is marked as private by the artist.");
          setIsLoading(false);
          return;
        }

        setPortfolio({
          id: snap.id,
          ...data
        });
      } catch (err: any) {
        console.error("Error loading public portfolio:", err);
        setErrorMsg("Failed to load portfolio. There may be a network error.");
      } finally {
        setIsLoading(false);
      }
    };

    if (portfolioId) {
      fetchPublicPortfolio();
    }
  }, [portfolioId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex flex-col items-center justify-center gap-4 font-sans">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
        <p className="text-stone-500 font-mono text-xs tracking-widest uppercase">
          Loading Public Portfolio...
        </p>
      </div>
    );
  }

  if (errorMsg || !portfolio) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto font-sans">
        <AlertCircle className="w-12 h-12 text-stone-400 mb-4" />
        <h2 className="text-lg font-mono font-bold text-stone-900 uppercase tracking-wider mb-2">
          Access Denied
        </h2>
        <p className="text-stone-600 text-xs mb-6 leading-relaxed">
          {errorMsg || "This portfolio is unavailable."}
        </p>
        <div className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
          MyArtNotes • Artistic Research Network
        </div>
      </div>
    );
  }

  const { title, subtitle, artistStatement, template, curatedEntries = [], curatedConcepts = [] } = portfolio;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FCFAF7] text-stone-850 font-sans selection:bg-[#EFECE6] selection:text-stone-950 p-6 md:p-12">
      {/* Printable page layout */}
      <div className="max-w-[850px] mx-auto bg-white border border-[#E6E2D5] rounded-sm shadow-xs p-8 md:p-16 relative" id="public-portfolio-sheet">
        {/* Print / PDF Action Trigger floating at the top-right */}
        <div className="absolute top-6 right-6 no-print flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white hover:bg-stone-850 font-mono text-[9px] uppercase tracking-wider rounded-sm transition-all cursor-pointer font-bold"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>

        {/* Cover / Main Header */}
        <div className="border-b border-stone-200 pb-8 mb-10 text-left">
          <h1 className={`font-bold text-stone-900 tracking-tight leading-tight ${template === "editorial" ? "font-serif text-4xl italic" : "text-3xl"}`}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs font-mono text-stone-500 uppercase tracking-widest mt-2.5">
              {subtitle}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-5 text-[9px] font-mono text-stone-400 uppercase tracking-wider">
            <span>MYARTNOTES STUDIO ARCHIVE</span>
            <span>•</span>
            <span>PUBLISHED POETIC PORTFOLIO</span>
          </div>
        </div>

        {/* Artist Statement Section */}
        {artistStatement && (
          <div className="mb-12 text-left">
            <h2 className="text-xs font-mono font-bold tracking-wider text-stone-400 uppercase mb-5">
              Artist Statement / Manifesto
            </h2>
            <p className={`text-stone-750 whitespace-pre-wrap leading-relaxed ${template === "editorial" ? "font-serif text-[14px]" : "text-xs"}`}>
              {artistStatement}
            </p>
          </div>
        )}

        {/* Selected Concepts Section */}
        {curatedConcepts.length > 0 && (
          <div className="mb-12 text-left">
            <h2 className="text-xs font-mono font-bold tracking-wider text-stone-400 uppercase mb-5 border-b border-stone-100 pb-1">
              Curated Conceptual Seeds
            </h2>

            {template === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {curatedConcepts.map((concept) => (
                  <div key={concept.id} className="border border-stone-200 p-5 rounded-sm bg-[#FCFAF7] page-break-inside-avoid">
                    <h3 className="text-sm font-serif font-bold text-stone-900">
                      {concept.name}
                    </h3>
                    <p className="text-[9px] text-stone-500 font-mono uppercase tracking-widest mt-1">
                      {concept.status}
                    </p>
                    <p className="text-xs text-stone-650 mt-3 leading-relaxed">
                      {concept.description}
                    </p>
                    {concept.associations && concept.associations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-4">
                        {concept.associations.map((a) => (
                          <span key={a} className="text-[8px] font-mono text-stone-500 bg-white border border-[#DDD9CE] px-2 py-0.5 rounded-sm">
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
                {curatedConcepts.map((concept) => (
                  <div key={concept.id} className="border-l-2 border-stone-900 pl-4 py-1 page-break-inside-avoid">
                    <h3 className="text-sm font-serif font-bold text-stone-900">
                      {concept.name}
                    </h3>
                    <p className="text-xs text-stone-650 mt-2 leading-relaxed">
                      {concept.description}
                    </p>
                    {concept.associations && concept.associations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {concept.associations.map((a) => (
                          <span key={a} className="text-[8px] font-mono text-stone-500 bg-stone-100/60 px-2 py-0.5 rounded-sm">
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
        {curatedEntries.length > 0 && (
          <div className="text-left mb-12">
            <h2 className="text-xs font-mono font-bold tracking-wider text-stone-400 uppercase mb-5 border-b border-stone-100 pb-1">
              Curated Process Records
            </h2>
            <div className="space-y-8">
              {curatedEntries.map((entry) => {
                const date = new Date(entry.createdAt);
                const dateStr = date.toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric"
                });
                return (
                  <div key={entry.id} className="border-b border-stone-100 pb-5 last:border-0 last:pb-0 page-break-inside-avoid">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-xs font-serif font-bold text-stone-900">
                        {entry.title}
                      </h3>
                      <span className="text-[9px] font-mono text-stone-400">
                        {dateStr}
                      </span>
                    </div>
                    <p className="text-xs text-stone-650 leading-relaxed mt-2.5 whitespace-pre-wrap">
                      {entry.content}
                    </p>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {entry.tags.map((t) => (
                          <span key={t} className="text-[8px] font-mono text-stone-500 bg-stone-50 border border-stone-150 px-2 py-0.5 rounded-sm">
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

        {/* Footer info */}
        <div className="border-t border-stone-200 pt-8 mt-16 text-center text-[10px] font-mono text-stone-400 uppercase tracking-widest no-print">
          Generated via <span className="font-bold text-stone-600">MyArtNotes</span> — Artistic Research Space
        </div>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            padding: 0 !important;
          }
          #public-portfolio-sheet {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
