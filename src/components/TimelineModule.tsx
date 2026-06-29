import React, { useState, useMemo } from "react";
import { JournalEntry, Concept } from "../types";
import { Calendar, BookOpen, Compass, Archive, Filter, Tag, ArrowDown } from "lucide-react";
import { useTranslation } from "../lib/i18n";

interface TimelineModuleProps {
  entries: JournalEntry[];
  concepts: Concept[];
}

type TimelineItem =
  | {
      type: "journal";
      id: string;
      date: string;
      title: string;
      body: string;
      tags: string[];
      associatedCount: number;
    }
  | {
      type: "concept";
      id: string;
      date: string;
      title: string;
      body: string;
      status: "seed" | "growing" | "mature";
      associationCount: number;
    };

export default function TimelineModule({ entries, concepts }: TimelineModuleProps) {
  const { t, locale } = useTranslation();
  const [filterType, setFilterType] = useState<"all" | "journal" | "concept">("all");

  // Combine and sort journal entries and concepts by date
  const sortedItems = useMemo(() => {
    const items: TimelineItem[] = [];

    entries.forEach((e) => {
      items.push({
        type: "journal",
        id: e.id,
        date: e.createdAt,
        title: e.title,
        body: e.content,
        tags: e.tags,
        associatedCount: e.associatedConcepts?.length || 0,
      });
    });

    concepts.forEach((c) => {
      items.push({
        type: "concept",
        id: c.id,
        date: c.createdAt,
        title: c.name,
        body: c.description,
        status: c.status,
        associationCount: c.associations?.length || 0,
      });
    });

    // Sort descending by date
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, concepts]);

  const filteredItems = sortedItems.filter((item) => {
    if (filterType === "all") return true;
    return item.type === filterType;
  });

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString(locale === "en" ? "en-US" : "pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRelativeTime = (isoStr: string) => {
    const diff = Date.now() - new Date(isoStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return locale === "en" ? "Today" : "Hoje";
    if (days === 1) return locale === "en" ? "Yesterday" : "Ontem";
    return locale === "en" ? `${days} days ago` : `Há ${days} dias`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-4 overflow-hidden">
      {/* Filters bar */}
      <div className="flex items-center justify-between border-b border-[#E6E2D5] pb-3">
        <div>
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-850">
            {locale === "en" ? "Studio Timeline" : "Linha do Tempo do Ateliê"}
          </h2>
          <p className="text-[10px] text-stone-500 font-mono">
            {locale === "en"
              ? "Sequential historical ledger of journal records and concepts."
              : "Livro de registro histórico sequencial de notas e conceitos."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-xs font-mono text-stone-500 mr-2">{locale === "en" ? "Filter:" : "Filtrar:"}</span>
          {(["all", "journal", "concept"] as const).map((type) => {
            const getFilterLabel = (tType: "all" | "journal" | "concept") => {
              if (locale === "pt") {
                if (tType === "all") return "todos";
                if (tType === "journal") return "diário";
                if (tType === "concept") return "conceitos";
              }
              return tType === "all" ? "all" : `${tType}s`;
            };
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded text-[11px] font-mono border transition-all cursor-pointer capitalize ${
                  filterType === type
                    ? "bg-[#EFECE6] border-[#DDD9CE] text-stone-900 font-bold"
                    : "bg-white border-[#E6E2D5] text-stone-500 hover:text-stone-800"
                }`}
              >
                {getFilterLabel(type)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline body */}
      <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar relative">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <Archive className="w-8 h-8 text-stone-400 mb-2" />
            <p className="text-stone-500 font-mono text-xs">
              {locale === "en" ? "No entries or concepts logged yet." : "Nenhum registro ou conceito inserido ainda."}
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto relative pl-6 border-l border-[#E6E2D5] space-y-6 py-4">
            {/* Top marker */}
            <div className="absolute top-0 -left-[5px] w-2.5 h-2.5 rounded-full bg-stone-400" />

            {filteredItems.map((item, idx) => {
              const isJournal = item.type === "journal";
              const dateObj = new Date(item.date);
              const isFirstOfGroup =
                idx === 0 ||
                new Date(filteredItems[idx - 1].date).getMonth() !== dateObj.getMonth();

              const getStageLabel = (st: string) => {
                if (locale === "pt") {
                  if (st === "seed") return "semente";
                  if (st === "growing") return "cultivo";
                  if (st === "mature") return "maduro";
                }
                return st;
              };

              return (
                <div key={item.id} className="relative group animate-fadeIn">
                  {/* Monthly Heading Indicator */}
                  {isFirstOfGroup && (
                    <div className="absolute -left-[140px] top-1.5 hidden md:block text-right w-[110px]">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-500 block">
                        {dateObj.toLocaleDateString(locale === "en" ? "en-US" : "pt-BR", { month: "long" })}
                      </span>
                      <span className="text-[9px] font-mono text-stone-400">
                        {dateObj.getFullYear()}
                      </span>
                    </div>
                  )}

                  {/* Bullet Node */}
                  <div
                    className={`absolute -left-[31px] top-2 w-2.5 h-2.5 bg-white border-2 transition-colors duration-200 ${
                      isJournal 
                        ? "border-stone-500 rounded-full" 
                        : "border-stone-500 rotate-45"
                    }`}
                  />

                  {/* Card Container */}
                  <div className={`p-5 rounded border bg-[#FCFAF5]/80 hover:border-stone-400 hover:bg-white transition-all border-[#E6E2D5] border-l-4 ${
                    isJournal 
                      ? "border-l-stone-600" 
                      : "border-l-stone-400"
                  }`}>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      <span className="text-[10px] font-mono text-stone-500 flex items-center gap-1.5 uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5 text-stone-300" />
                        {formatDate(item.date)} ({getRelativeTime(item.date)})
                      </span>

                      {/* Mode Badge */}
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-mono border bg-white border-[#DDD9CE] text-stone-600 uppercase tracking-wider"
                      >
                        {isJournal ? (
                          <>
                            <BookOpen className="w-2.5 h-2.5 text-stone-400" />
                            <span className="text-stone-500 font-medium">
                              {locale === "en" ? "Journal Log" : "Registro de Diário"}
                            </span>
                          </>
                        ) : (
                          <>
                            <Compass className="w-2.5 h-2.5 text-stone-400" />
                            <span className="text-stone-500 font-medium">
                              {locale === "en" ? "Concept Seed" : "Semente de Conceito"}
                            </span>
                          </>
                        )}
                      </span>
                    </div>

                    <h3 className="text-base font-serif font-bold text-stone-950 mb-1.5 tracking-tight">
                      {item.title}
                    </h3>

                    <p className="text-[14px] text-stone-850 font-serif leading-relaxed whitespace-pre-wrap mb-3 tracking-wide">
                      {item.body || (locale === "en" ? "No description specified." : "Nenhuma descrição especificada.")}
                    </p>

                    {/* Metadata Footer */}
                    {isJournal ? (
                      item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 items-center pt-2.5 border-t border-[#E6E2D5]">
                          <Tag className="w-3 h-3 text-stone-400" />
                          {item.tags.map((tag) => (
                            <span key={tag} className="text-[10px] font-mono text-stone-500">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-4 pt-2.5 border-t border-[#E6E2D5] text-[10px] font-mono">
                        <span className="text-stone-500">
                          {locale === "en" ? "STAGE:" : "ESTÁGIO:"}{" "}
                          <span
                            className="font-bold text-stone-800 uppercase"
                          >
                            {getStageLabel(item.status)}
                          </span>
                        </span>
                        {item.associationCount > 0 && (
                          <span className="text-stone-500 uppercase">
                            {locale === "en" ? "ASSOCIATIONS:" : "ASSOCIAÇÕES:"} {item.associationCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Bottom arrow */}
            <div className="flex justify-center pt-4">
              <div className="flex flex-col items-center text-stone-400">
                <ArrowDown className="w-4 h-4" />
                <span className="text-[9px] font-mono uppercase tracking-widest mt-1">
                  {locale === "en" ? "First Record" : "Primeiro Registro"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
