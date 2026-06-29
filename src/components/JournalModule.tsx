import React, { useState, useEffect, useMemo } from "react";
import { JournalEntry, Concept, Attachment } from "../types";
import { 
  BookOpen, 
  Calendar, 
  Tag, 
  Trash2, 
  Plus, 
  Search, 
  Link as LinkIcon, 
  AlertCircle, 
  Check, 
  Sparkles,
  Paperclip,
  MoreVertical,
  Edit3,
  X
} from "lucide-react";
import { useTranslation } from "../lib/i18n";

interface JournalModuleProps {
  entries: JournalEntry[];
  concepts: Concept[];
  onAddEntry: (title: string, content: string, tags: string[], associatedConcepts: string[]) => void;
  onUpdateEntry: (id: string, updatedFields: Partial<JournalEntry>) => void;
  onDeleteEntry: (id: string) => void;
  initialIsCreating?: boolean;
}

// Fine botanical SVG illustration representing visual catalog warmth
const BotanicalBranch = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14 text-stone-850 hover:scale-105 transition-transform" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M50 90 C 50 70, 48 50, 45 15" />
    {/* Delicate offset leaves */}
    <path d="M45 20 C 32 18, 25 28, 45 32 C 45 32, 45 20, 45 20 Z" fill="currentColor" fillOpacity="0.04" />
    <path d="M45 38 C 58 35, 65 46, 46 52 C 46 52, 45 38, 45 38 Z" fill="currentColor" fillOpacity="0.04" />
    <path d="M46 48 C 32 46, 28 58, 46 62 C 46 62, 46 48, 46 48 Z" fill="currentColor" fillOpacity="0.04" />
    <path d="M47 64 C 60 60, 68 72, 47 78 C 47 78, 47 64, 47 64 Z" fill="currentColor" fillOpacity="0.04" />
    <path d="M48 76 C 36 74, 32 84, 48 88 C 48 88, 48 76, 48 76 Z" fill="currentColor" fillOpacity="0.04" />
  </svg>
);

// Dynamic materials guide based on selected entry tags
const getMaterialsForTags = (tags: string[], locale: string) => {
  const lowercaseTags = tags.map(t => t.toLowerCase());
  const list: string[] = [];

  if (lowercaseTags.includes("carvão") || lowercaseTags.includes("charcoal")) {
    list.push(locale === "en" ? "Compressed charcoal (soft, medium, hard)" : "Carvão comprimido (soft, médio, duro)");
    list.push(locale === "en" ? "Cotton paper 300g (textured)" : "Papel algodão 300g (texturado)");
  }
  if (lowercaseTags.includes("argila") || lowercaseTags.includes("clay")) {
    list.push(locale === "en" ? "Natural terracotta clay" : "Argila terracota natural");
    list.push(locale === "en" ? "Spatulas & iron modeling tools" : "Espátulas e estecas de ferro");
  }
  if (lowercaseTags.includes("pigmento") || lowercaseTags.includes("pigment") || lowercaseTags.includes("pigmentos")) {
    list.push(locale === "en" ? "Earthy mineral pigments" : "Pigmentos minerais de terra");
    list.push(locale === "en" ? "Pure beeswax & linseed oil binder" : "Aglutinante de cera de abelha pura e linhaça");
  }
  if (lowercaseTags.includes("grafite") || lowercaseTags.includes("graphite")) {
    list.push(locale === "en" ? "Siberian dry graphite powder" : "Grafite seco siberiano em pó");
    list.push(locale === "en" ? "Natural hair wash brushes" : "Pincéis de pelo natural");
  }
  if (lowercaseTags.includes("água") || lowercaseTags.includes("water") || lowercaseTags.includes("tinta") || lowercaseTags.includes("ink")) {
    list.push(locale === "en" ? "Iron gall ink & rainwater" : "Tinta ferro-gálica e água da chuva");
    list.push(locale === "en" ? "Goose quill / dip pen" : "Bico de pena de ganso / pena metálica");
  }

  // Fallback defaults
  if (list.length === 0) {
    list.push(locale === "en" ? "Siberian raw graphite powder" : "Pó de grafite cru siberiano");
    list.push(locale === "en" ? "Pressed cotton cotton paper" : "Papel algodão prensado a frio");
  }

  return list;
};

export default function JournalModule({
  entries,
  concepts,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  initialIsCreating = false
}: JournalModuleProps) {
  const { t, locale } = useTranslation();
  const [isCreating, setIsCreating] = useState(initialIsCreating);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [activeMenuEntryId, setActiveMenuEntryId] = useState<string | null>(null);
  const [showDeleteConfirmEntry, setShowDeleteConfirmEntry] = useState<JournalEntry | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedConceptFilter, setSelectedConceptFilter] = useState<string | null>(null);

  // Default onboarding process attachments (fully manageable)
  const defaultOnboardingAttachments = useMemo<Attachment[]>(() => [
    {
      id: "default-1",
      name: "estudo_carvao_01.jpg",
      type: "image/svg+xml",
      url: "svg-charcoal",
      caption: locale === "en" ? "Initial charcoal exploration study." : "Estudo inicial de exploração em carvão."
    },
    {
      id: "default-2",
      name: "detalhe_textura.jpg",
      type: "image/svg+xml",
      url: "svg-wash",
      caption: locale === "en" ? "Copper wash texture detail." : "Detalhe de textura de lavagem de cobre."
    }
  ], [locale]);

  // Selected attachment for lightbox/management
  const [activeAttachment, setActiveAttachment] = useState<Attachment | null>(null);
  const [editAttachmentName, setEditAttachmentName] = useState("");
  const [editAttachmentCaption, setEditAttachmentCaption] = useState("");

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [chosenConcepts, setChosenConcepts] = useState<string[]>([]);
  const [formError, setFormError] = useState("");

  // Tag frequency counts derived dynamically
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach((e) => {
      e.tags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [entries]);

  // All unique tags sorted by popularity
  const allTags = useMemo(() => {
    return Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);
  }, [tagCounts]);

  // Concept frequency counts (linked entries count)
  const conceptCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach((e) => {
      e.associatedConcepts.forEach((cid) => {
        counts[cid] = (counts[cid] || 0) + 1;
      });
    });
    return counts;
  }, [entries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || entry.tags.includes(selectedTag);
      const matchesConcept =
        !selectedConceptFilter || entry.associatedConcepts.includes(selectedConceptFilter);
      return matchesSearch && matchesTag && matchesConcept;
    });
  }, [entries, searchQuery, selectedTag, selectedConceptFilter]);

  const [activeViewEntry, setActiveViewEntry] = useState<JournalEntry | null>(null);

  // Auto-select first entry on load
  useEffect(() => {
    if (entries.length > 0 && !activeViewEntry && !isCreating) {
      setActiveViewEntry(entries[0]);
    }
  }, [entries, activeViewEntry, isCreating]);

  const handleTriggerEdit = (entry: JournalEntry) => {
    setTitle(entry.title);
    setContent(entry.content);
    setTagInput(entry.tags.join(", "));
    setChosenConcepts(entry.associatedConcepts || []);
    setIsEditing(true);
    setEditingEntry(entry);
    setIsCreating(false);
    setActiveMenuEntryId(null);
  };

  const handleSubmit = () => {
    setFormError("");

    if (!title.trim()) {
      setFormError(locale === "en" ? "Title is required." : "O título é obrigatório.");
      return;
    }
    if (!content.trim()) {
      setFormError(locale === "en" ? "Content cannot be blank." : "O conteúdo não pode estar vazio.");
      return;
    }

    const tags = tagInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    if (isEditing && editingEntry) {
      onUpdateEntry(editingEntry.id, {
        title,
        content,
        tags,
        associatedConcepts: chosenConcepts
      });
      setActiveViewEntry({
        ...editingEntry,
        title,
        content,
        tags,
        associatedConcepts: chosenConcepts
      });
      setIsEditing(false);
      setEditingEntry(null);
      setToastMessage(locale === "en" ? "Entry saved successfully" : "Registro salvo com sucesso");
      setTimeout(() => setToastMessage(""), 3000);
    } else {
      onAddEntry(title, content, tags, chosenConcepts);
      setToastMessage(locale === "en" ? "Entry created successfully" : "Registro criado com sucesso");
      setTimeout(() => setToastMessage(""), 3000);
    }

    // Reset Form
    setTitle("");
    setContent("");
    setTagInput("");
    setChosenConcepts([]);
    setIsCreating(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleOpenAttachment = (att: Attachment) => {
    setActiveAttachment(att);
    setEditAttachmentName(att.name);
    setEditAttachmentCaption(att.caption || "");
  };

  const handleConceptToggle = (conceptId: string) => {
    setChosenConcepts((prev) =>
      prev.includes(conceptId) ? prev.filter((id) => id !== conceptId) : [...prev, conceptId]
    );
  };

  const handleSuggestedTagClick = (tag: string) => {
    const currentTags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
      setTagInput(currentTags.join(", "));
    }
  };

  const selectEntry = (entry: JournalEntry) => {
    setActiveViewEntry(entry);
    setIsCreating(false);
  };

  const formatDateString = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString(locale === "en" ? "en-US" : "pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  // Materials extracted from active view entry tags
  const activeMaterials = useMemo(() => {
    if (!activeViewEntry) return [];
    return getMaterialsForTags(activeViewEntry.tags, locale);
  }, [activeViewEntry, locale]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-100px)] overflow-hidden">
      
      {/* 1. LEFT COLUMN: Filter Sidebar (1/4 space) */}
      <div className="lg:col-span-3 flex flex-col border-r border-[#E6E2D5] pr-5 h-full overflow-y-auto custom-scrollbar space-y-6">
        
        {/* Editorial Branding */}
        <div className="flex items-center gap-3 border-b border-[#E6E2D5]/70 pb-5">
          <BotanicalBranch />
          <div>
            <h2 className="text-xl font-serif font-bold tracking-widest text-stone-900 uppercase">
              MyArtNotes
            </h2>
            <p className="text-[9px] font-mono text-stone-500 uppercase tracking-widest leading-tight">
              {locale === "en" ? "ARTISTIC RESEARCH NOTEBOOK" : "CADERNO DE PESQUISA ARTÍSTICA"}
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          id="new-entry-btn"
          onClick={() => {
            setIsCreating(true);
            setActiveViewEntry(null);
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-stone-900 hover:bg-stone-850 text-white font-mono text-xs uppercase tracking-widest font-semibold cursor-pointer transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{locale === "en" ? "New Entry" : "Nova entrada"}</span>
        </button>

        {/* Filters Panel */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-800">
              {locale === "en" ? "Filters" : "Filtros"}
            </span>
            <Search className="w-3.5 h-3.5 text-stone-400" />
          </div>
          
          <input
            type="text"
            placeholder={t.searchJournal}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs font-sans text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-400"
          />
        </div>

        {/* SENSORY TAGS Filter */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
              {locale === "en" ? "TAGS" : "TAGS"}
            </span>
            {selectedTag && (
              <button 
                onClick={() => setSelectedTag(null)}
                className="text-[9px] font-mono text-stone-500 hover:text-stone-950 underline"
              >
                {locale === "en" ? "clear" : "limpar"}
              </button>
            )}
          </div>
          {allTags.length === 0 ? (
            <p className="text-[10px] font-mono text-stone-400 italic">No tags logged yet.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {allTags.slice(0, 10).map((tag) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(isSelected ? null : tag)}
                    className={`flex items-center justify-between text-left py-1 px-1.5 rounded text-xs font-mono transition-all ${
                      isSelected
                        ? "bg-[#EFECE6] text-stone-950 font-bold"
                        : "text-stone-600 hover:text-stone-900 hover:bg-[#FAF8F3]"
                    }`}
                  >
                    <span>• {tag}</span>
                    <span className="text-[9px] opacity-60 font-semibold">{tagCounts[tag]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RESEARCH CONCEPTS Filter */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
              {locale === "en" ? "CONCEPTS" : "CONCEITOS"}
            </span>
            {selectedConceptFilter && (
              <button 
                onClick={() => setSelectedConceptFilter(null)}
                className="text-[9px] font-mono text-stone-500 hover:text-stone-950 underline"
              >
                {locale === "en" ? "clear" : "limpar"}
              </button>
            )}
          </div>
          {concepts.length === 0 ? (
            <p className="text-[10px] font-mono text-stone-400 italic">No concepts seeded.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {concepts.map((concept) => {
                const isSelected = selectedConceptFilter === concept.id;
                const linkCount = conceptCounts[concept.id] || 0;
                return (
                  <button
                    key={concept.id}
                    onClick={() => setSelectedConceptFilter(isSelected ? null : concept.id)}
                    className={`flex items-center justify-between text-left py-1 px-1.5 rounded text-xs font-mono transition-all ${
                      isSelected
                        ? "bg-[#EFECE6] text-stone-950 font-bold"
                        : "text-stone-600 hover:text-stone-900 hover:bg-[#FAF8F3]"
                    }`}
                  >
                    <span className="truncate pr-2">✦ {concept.name}</span>
                    <span className="text-[9px] opacity-60 font-semibold">{linkCount}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic quote on side bottom */}
        <div className="pt-6 mt-auto border-t border-[#E6E2D5]/70 pb-4">
          <p className="font-serif italic text-stone-500 text-[11px] leading-relaxed text-center tracking-wide">
            {locale === "en" 
              ? "“To record is to transform the passing instant into raw research material.”" 
              : "“Registrar é transformar o instante em matéria de pesquisa.”"}
          </p>
          <div className="w-12 h-[1px] bg-stone-300 mx-auto mt-2" />
        </div>

        {/* Closed Beta Reminder */}
        <div className="pt-4 border-t border-[#E6E2D5]/70 pb-4 space-y-2 text-center bg-[#FCFAF7] border border-[#E6E2D5] rounded p-3 flex-shrink-0">
          <p className="text-[10px] text-stone-600 font-serif">
            {locale === "en" ? "Found something unexpected?" : "Encontrou algo inesperado?"}
          </p>
          <p className="text-[9px] text-stone-500 font-mono uppercase tracking-wider font-semibold flex items-center justify-center gap-1">
            <span className="text-amber-500">✦</span>
            <span>{locale === "en" ? "Tell Myan." : "Conte para a Myan."}</span>
          </p>
        </div>

      </div>

      {/* 2. CENTER COLUMN: Editor & Log details (1/2 space) */}
      <div className="lg:col-span-6 flex flex-col h-full overflow-y-auto pr-2 custom-scrollbar space-y-6">
        {isCreating || isEditing ? (
          /* NEW ENTRY EDITOR */
          <div className="bg-white rounded border border-[#E6E2D5] p-6 md:p-8 space-y-5 flex-shrink-0 animate-fadeIn" onKeyDown={handleKeyDown}>
            <div className="flex items-center justify-between border-b border-[#E6E2D5] pb-3">
              <div>
                <h3 className="text-[11px] font-mono font-bold text-stone-800 uppercase tracking-widest">
                  {isEditing 
                    ? (locale === "en" ? "EDIT LOG" : "EDITAR ENTRADA")
                    : (locale === "en" ? "WRITE LOG" : "NOVA ENTRADA")}
                </h3>
                <p className="text-[10px] text-stone-500 font-sans mt-0.5">
                  {locale === "en" ? "Document observations, experiments, and sensory records. (Ctrl+Enter to save)" : "Documente observações, experimentos e registros sensoriais. (Ctrl+Enter para salvar)"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                  setEditingEntry(null);
                  if (entries.length > 0) setActiveViewEntry(entries[0]);
                }}
                className="text-[10px] font-mono text-stone-400 hover:text-stone-850 cursor-pointer uppercase tracking-wider"
              >
                {t.discard}
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block font-semibold">
                {t.newLogTitle}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.newLogTitlePlaceholder}
                className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-400"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block font-semibold">
                {t.newLogContent}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t.newLogContentPlaceholder}
                rows={10}
                className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-3.5 text-xs text-stone-850 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-400 font-sans resize-none leading-relaxed"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              {/* Tags Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block font-semibold">
                  {t.newLogTags}
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder={t.newLogTagsPlaceholder}
                  className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500"
                />
                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                     {allTags.slice(0, 5).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleSuggestedTagClick(tag)}
                        className="px-1.5 py-0.5 rounded border border-[#DDD9CE] bg-white text-[9px] font-mono text-stone-500 hover:text-stone-850 cursor-pointer"
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Link to Concepts */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block font-semibold">
                  {t.linkConceptsOptional}
                </label>
                {concepts.length > 0 ? (
                  <div className="border border-[#DDD9CE] rounded bg-white p-2 max-h-[100px] overflow-y-auto space-y-1">
                    {concepts.map((concept) => {
                      const isChecked = chosenConcepts.includes(concept.id);
                      return (
                        <button
                          key={concept.id}
                          type="button"
                          onClick={() => handleConceptToggle(concept.id)}
                          className={`w-full flex items-center justify-between text-left p-1 rounded text-[11px] font-mono cursor-pointer ${
                            isChecked ? "bg-[#EFECE6] text-stone-900 font-bold" : "text-stone-500 hover:text-stone-800 hover:bg-[#FAF8F3]"
                          }`}
                        >
                          <span>✦ {concept.name}</span>
                          {isChecked && <Check className="w-3 h-3 text-stone-700" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[10px] font-mono text-stone-400 border border-dashed border-[#DDD9CE] p-3 rounded text-center">
                    {t.noConceptsYet}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6E2D5] flex justify-end">
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-850 text-white font-mono text-xs uppercase tracking-widest font-bold rounded cursor-pointer transition-colors"
              >
                {isEditing 
                  ? (locale === "en" ? "Save Changes" : "Salvar Alterações")
                  : t.submitLog}
              </button>
            </div>
          </div>
        ) : activeViewEntry ? (
          /* ACTIVE ENTRY DETAIL VIEW - Writing is the Visual Center */
          <div className="bg-white rounded border border-[#E6E2D5] p-6 md:p-8 space-y-5 flex-shrink-0 animate-fadeIn relative">
            
            {/* Fine Header Lines */}
            <div className="flex items-start justify-between border-b border-[#E6E2D5]/80 pb-4">
              <div>
                <span className="text-[10px] font-mono text-stone-400 tracking-wider uppercase">
                  {formatDateString(activeViewEntry.createdAt)}
                </span>
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-stone-950 tracking-tight leading-snug mt-1">
                  {activeViewEntry.title}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-stone-400 bg-[#FAF8F3] px-2 py-0.5 rounded border border-[#E6E2D5]">
                  {new Date(activeViewEntry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {locale === "en" ? "Saved" : "Salvo"} ✓
                </span>
                <div className="relative">
                  <button
                    onClick={() => setActiveMenuEntryId(activeMenuEntryId === "active-detail" ? null : "active-detail")}
                    title="Menu"
                    className="p-1.5 rounded hover:bg-[#EFECE6] border border-transparent hover:border-[#DDD9CE] text-stone-600 hover:text-stone-900 cursor-pointer transition-all"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {activeMenuEntryId === "active-detail" && (
                    <div className="absolute right-0 mt-1 w-32 bg-white border border-[#E6E2D5] rounded shadow-md z-10 font-mono text-[10px] uppercase tracking-wider">
                      <button
                        onClick={() => handleTriggerEdit(activeViewEntry)}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#FAF8F3] text-stone-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-stone-400" />
                        <span>{locale === "en" ? "Edit" : "Editar"}</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirmEntry(activeViewEntry);
                          setActiveMenuEntryId(null);
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-red-50 text-red-600 flex items-center gap-2 border-t border-[#E6E2D5]/50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>{locale === "en" ? "Delete" : "Excluir"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Luxurious body copy - high legibility & whitespace */}
            <div className="text-stone-900 font-serif leading-[1.8] text-[16px] md:text-[17px] whitespace-pre-wrap py-5 tracking-wide antialiased">
              {activeViewEntry.content}
            </div>

            {/* Detail Footer row */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-[#EFECE6]">
              {activeViewEntry.tags.map((tag) => (
                <span key={tag} className="text-[10px] font-mono text-stone-500 bg-[#FAF8F3] border border-[#E6E2D5] px-2 py-0.5 rounded">
                  #{tag}
                </span>
              ))}
            </div>

          </div>
        ) : (
          /* EMPTY STATE */
          <div className="bg-white rounded border border-[#E6E2D5] p-12 text-center flex-shrink-0">
            <BookOpen className="w-10 h-10 text-stone-400 mx-auto mb-4 animate-pulse" />
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-stone-800">
              {locale === "en" ? "ARCHIVE IS EMPTY" : "CADERNO VAZIO"}
            </h3>
            <p className="text-xs text-stone-500 font-sans max-w-sm mx-auto mt-2 leading-relaxed">
              {locale === "en"
                ? "Every dynamic practice thrives on rigorous, regular documentation of sensory experiments, observations, and structural adjustments. Your studio journal is the repository for these daily processes."
                : "Toda prática criativa prospera com a documentação sistemática e rigorosa de experimentos materiais, observações e ajustes estruturais. Seu diário de ateliê é o repositório para estes processos diários."}
            </p>
            <p className="text-xs text-stone-900 font-mono uppercase tracking-wider font-semibold mt-4">
              {locale === "en"
                ? "What to do next: Click '+ Write Log' at the top left to create your first entry."
                : "Próximo passo: Clique em '+ Escrever Registro' no canto superior esquerdo para criar sua primeira entrada."}
            </p>
          </div>
        )}

        {/* 2.2. REGISTROS RECENTES: Chromatic history list underneath */}
        <div className="pt-2">
          <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-450 mb-3">
            {locale === "en" ? "RECENT ENTRIES / REGISTROS RECENTES" : "REGISTROS RECENTES"}
          </h3>
          
          {filteredEntries.length === 0 ? (
            <div className="p-8 border border-dashed border-[#DDD9CE] rounded text-center bg-[#FAF8F3]/50">
              <span className="text-xs font-mono text-stone-400">
                {locale === "en" ? "No entries match filter criteria." : "Nenhum registro corresponde aos filtros."}
              </span>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredEntries.map((entry) => {
                const isSelected = activeViewEntry?.id === entry.id && !isCreating;
                const date = new Date(entry.createdAt);
                const day = date.getDate().toString().padStart(2, "0");
                const monthStr = date.toLocaleDateString(locale === "en" ? "en-US" : "pt-BR", { month: "short" }).toUpperCase().replace(".", "");
                const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
                
                return (
                  <div
                    key={entry.id}
                    onClick={() => selectEntry(entry)}
                    className={`flex items-start gap-4 p-4 rounded-sm border transition-all duration-350 cursor-pointer ${
                      isSelected
                        ? "bg-white border-[#DDD9CE] border-l-[3px] border-l-stone-900 shadow-xs"
                        : "bg-[#FCFAF7] border-[#E6E2D5]/70 hover:bg-white hover:border-stone-400 hover:shadow-xs"
                    }`}
                  >
                    {/* Date Block */}
                    <div className="flex flex-col items-center justify-center text-center w-10 flex-shrink-0 border-r border-[#E6E2D5]/80 pr-4 self-stretch">
                      <span className="text-sm font-serif font-bold text-stone-850">{day}</span>
                      <span className="text-[8px] font-mono text-stone-400 tracking-widest font-semibold uppercase">{monthStr}</span>
                    </div>

                    {/* Meta & Summary */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-serif font-bold text-stone-900 tracking-tight leading-tight">
                        {entry.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 line-clamp-1 mt-1.5 font-sans leading-relaxed">
                        {entry.content}
                      </p>
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {entry.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[8px] font-mono text-stone-500 bg-white border border-[#DDD9CE] px-2 py-0.5 rounded-sm">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Time indicator and menu */}
                    <div className="flex flex-col justify-between items-end self-stretch flex-shrink-0 text-[9px] font-mono text-stone-400">
                      <span className="font-light">{timeStr}</span>
                      <div className="flex items-center gap-2 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTriggerEdit(entry);
                          }}
                          className="p-1 hover:bg-[#FAF8F3] text-stone-400 hover:text-stone-700 rounded transition-colors cursor-pointer"
                          title={locale === "en" ? "Edit" : "Editar"}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirmEntry(entry);
                          }}
                          className="p-1 hover:bg-red-50 text-stone-400 hover:text-red-700 rounded transition-colors cursor-pointer"
                          title={locale === "en" ? "Delete" : "Excluir"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* 3. RIGHT COLUMN: Context & Linked Lineages (1/4 space) */}
      <div className="lg:col-span-3 flex flex-col h-full overflow-y-auto pl-5 border-l border-[#E6E2D5] space-y-6">
        
        {/* CONEXÕES (Connections) */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 border-b border-[#E6E2D5]/70 pb-2">
            <LinkIcon className="w-3.5 h-3.5 text-stone-500" />
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-800">
              {locale === "en" ? "CONNECTIONS" : "CONEXÕES"}
            </h3>
          </div>
          {activeViewEntry && activeViewEntry.associatedConcepts && activeViewEntry.associatedConcepts.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] text-stone-400 font-mono italic">
                {locale === "en" 
                  ? `Connected to ${activeViewEntry.associatedConcepts.length} concept threads:` 
                  : `Conectada a ${activeViewEntry.associatedConcepts.length} conceitos:`}
              </p>
              <div className="space-y-1.5">
                {activeViewEntry.associatedConcepts.map((cid) => {
                  const concept = concepts.find(c => c.id === cid);
                  return concept ? (
                    <div key={cid} className="flex items-center gap-2 text-xs font-mono text-stone-700">
                      <span className="text-stone-400">✦</span>
                      <span className="font-semibold underline underline-offset-2 decoration-stone-300">
                        {concept.name}
                      </span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-stone-400 font-mono italic">
              {locale === "en" ? "No concepts linked to this record." : "Nenhum conceito conectado a este registro."}
            </p>
          )}
        </div>

        {/* MATERIAIS (Mediums & Materials) */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 border-b border-[#E6E2D5]/70 pb-2">
            <span className="text-[10px] font-mono text-stone-400">•</span>
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-800">
              {locale === "en" ? "MATERIALS / EXPERIMENTS" : "MATERIAIS"}
            </h3>
          </div>
          <ul className="space-y-1.5 pl-1">
            {activeMaterials.map((mat, i) => (
              <li key={i} className="text-xs font-mono text-stone-600 flex items-start gap-2 leading-relaxed">
                <span className="text-stone-400 mt-1">•</span>
                <span>{mat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ANOTAÇÕES (Aesthetic handwritten notes card) */}
        <div className="bg-[#FAF8F3] border border-[#E6E2D5] rounded p-4 space-y-2 relative overflow-hidden">
          <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-700 border-b border-[#E6E2D5] pb-1.5">
            {locale === "en" ? "ANNOTATIONS" : "ANOTAÇÕES"}
          </h3>
          <p className="font-serif text-xs text-stone-600 leading-relaxed tracking-wide antialiased">
            {locale === "en"
              ? "Observe how the physical direction of the gesture alters the density of the charcoal stroke. Repeat with slow, deliberate circular loops."
              : "Observar como a direção física do gesto altera a densidade da mancha do carvão. Repetir com movimentos circulares lentos e deliberados."}
          </p>
          {/* Aesthetic tiny leaf sketch in notes */}
          <div className="absolute bottom-1 right-2 opacity-15 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-10 h-10 text-stone-800" fill="none" stroke="currentColor">
              <path d="M50 90 Q 40 50 30 10 C 60 40 50 90 50 90 Z" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* ARQUIVOS (Exhibition catalog polaroid sketch items) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-1.5 border-b border-[#E6E2D5]/70 pb-2">
            <Paperclip className="w-3.5 h-3.5 text-stone-400" />
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-800">
              {locale === "en" ? "SKETCH ATTACHMENTS" : "ARQUIVOS DE PROCESSO"}
            </h3>
          </div>

          {/* Hidden File Inputs for Upload/Replace */}
          <input
            type="file"
            id="journal-file-upload"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && activeViewEntry) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const dataUrl = event.target?.result as string;
                  const newAttachment: Attachment = {
                    id: "att_" + Date.now(),
                    name: file.name,
                    type: file.type,
                    url: dataUrl,
                    caption: ""
                  };
                  const currentAtts = activeViewEntry.attachments || (
                    (activeViewEntry.title === "Oxidation on Iron and Copper Sheets" || activeViewEntry.title === "Oxidação em Chapas de Ferro e Cobre")
                      ? defaultOnboardingAttachments
                      : []
                  );
                  const updated = [...currentAtts, newAttachment];
                  onUpdateEntry(activeViewEntry.id, { attachments: updated });
                  setActiveViewEntry({ ...activeViewEntry, attachments: updated });
                };
                reader.readAsDataURL(file);
              }
            }}
          />

          <input
            type="file"
            id="journal-file-replace"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && activeViewEntry && activeAttachment) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const dataUrl = event.target?.result as string;
                  const currentAtts = activeViewEntry.attachments || (
                    (activeViewEntry.title === "Oxidation on Iron and Copper Sheets" || activeViewEntry.title === "Oxidação em Chapas de Ferro e Cobre")
                      ? defaultOnboardingAttachments
                      : []
                  );
                  const updated = currentAtts.map(att => att.id === activeAttachment.id ? { ...att, name: file.name, type: file.type, url: dataUrl } : att);
                  onUpdateEntry(activeViewEntry.id, { attachments: updated });
                  setActiveViewEntry({ ...activeViewEntry, attachments: updated });
                  // update local active attachment in modal if open
                  setActiveAttachment({ ...activeAttachment, name: file.name, type: file.type, url: dataUrl });
                  setToastMessage(locale === "en" ? "Attachment replaced successfully" : "Arquivo substituído com sucesso");
                  setTimeout(() => setToastMessage(""), 3000);
                };
                reader.readAsDataURL(file);
              }
            }}
          />

          {(() => {
            const currentAtts = activeViewEntry?.attachments || (
              (activeViewEntry?.title === "Oxidation on Iron and Copper Sheets" || activeViewEntry?.title === "Oxidação em Chapas de Ferro e Cobre")
                ? defaultOnboardingAttachments
                : []
            );

            if (currentAtts.length === 0) {
              return (
                <div className="p-4 border border-dashed border-[#DDD9CE] rounded text-center bg-[#FAF8F3]/40">
                  <span className="text-[10px] font-mono text-stone-400">
                    {locale === "en" ? "No process files attached." : "Nenhum arquivo de processo anexo."}
                  </span>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-2 gap-3.5">
                {currentAtts.map((att) => (
                  <div key={att.id} onClick={() => handleOpenAttachment(att)} className="space-y-1 group cursor-pointer">
                    <div className="relative aspect-square w-full rounded border border-[#E6E2D5] bg-[#FAF8F3] overflow-hidden group-hover:border-stone-400 transition-colors shadow-2xs">
                      {att.url === "svg-charcoal" ? (
                        <svg viewBox="0 0 100 100" className="w-full h-full opacity-85 mix-blend-multiply">
                          <rect width="100" height="100" fill="#FCFAF6" />
                          <path d="M20,50 Q40,30 80,45" stroke="#292524" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
                          <path d="M15,35 C35,70 65,15 85,60" stroke="#1C1917" strokeWidth="5.5" strokeLinecap="round" fill="none" opacity="0.9" />
                          <path d="M30,75 Q60,85 70,25" stroke="#44403C" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6" />
                          <circle cx="45" cy="50" r="15" fill="#292524" opacity="0.12" />
                          <circle cx="65" cy="35" r="10" fill="#1C1917" opacity="0.18" />
                        </svg>
                      ) : att.url === "svg-wash" ? (
                        <svg viewBox="0 0 100 100" className="w-full h-full opacity-85 mix-blend-multiply">
                          <rect width="100" height="100" fill="#F4EFE6" />
                          <circle cx="30" cy="40" r="1.5" fill="#78350F" opacity="0.5" />
                          <circle cx="75" cy="25" r="2" fill="#78350F" opacity="0.4" />
                          <circle cx="50" cy="70" r="2.5" fill="#78350F" opacity="0.3" />
                          <path d="M10,80 C30,75 50,85 90,70 C80,50 60,65 10,80 Z" fill="#D97706" fillOpacity="0.12" />
                          <path d="M20,20 C40,15 70,30 80,10 C60,40 50,25 20,20 Z" fill="#78350F" fillOpacity="0.1" />
                          <path d="M5,40 Q45,60 95,30" stroke="#78350F" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.35" />
                        </svg>
                      ) : (
                        <img src={att.url} alt={att.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute top-1.5 right-1.5 bg-stone-900/10 text-stone-800 font-mono text-[7px] uppercase tracking-wider px-1 py-0.2 rounded scale-90">
                        {att.url.startsWith("svg-") ? "sketch" : "image"}
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-stone-400 group-hover:text-stone-700 transition-colors truncate block text-center" title={att.name}>{att.name}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          {activeViewEntry && (
            <button
              onClick={() => document.getElementById("journal-file-upload")?.click()}
              className="w-full text-center border border-dashed border-[#DDD9CE] hover:border-stone-400 rounded py-1.5 bg-white text-[9px] font-mono text-stone-500 uppercase tracking-widest cursor-pointer transition-all"
            >
              + {locale === "en" ? "add attachment" : "adicionar arquivo"}
            </button>
          )}
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmEntry && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E6E2D5] rounded max-w-sm w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
            <div className="p-6 pb-3 border-b border-[#E6E2D5]/50 flex-shrink-0">
              <h3 className="text-sm font-mono font-bold text-stone-900 uppercase tracking-wider">
                {locale === "en" ? "CONFIRM PERMANENT PURGE" : "CONFIRMAR EXCLUSÃO PERMANENTE"}
              </h3>
            </div>
            
            <div className="p-6 pt-3 pb-3 overflow-y-auto flex-1 min-h-0">
              <p className="text-xs text-stone-600 leading-relaxed font-sans">
                {locale === "en"
                  ? `Are you sure you want to permanently delete "${showDeleteConfirmEntry.title}"? This action is irreversible.`
                  : `Tem certeza de que deseja excluir permanentemente "${showDeleteConfirmEntry.title}"? Esta ação é irreversível.`}
              </p>
            </div>

            <div className="p-6 pt-3 border-t border-[#E6E2D5]/50 flex justify-end gap-3 font-mono text-xs flex-shrink-0 bg-stone-50/50">
              <button
                onClick={() => setShowDeleteConfirmEntry(null)}
                className="px-3 py-1.5 border border-[#DDD9CE] hover:bg-white text-stone-600 rounded cursor-pointer transition-colors"
              >
                {locale === "en" ? "Cancel" : "Cancelar"}
              </button>
              <button
                onClick={() => {
                  onDeleteEntry(showDeleteConfirmEntry.id);
                  if (activeViewEntry?.id === showDeleteConfirmEntry.id) {
                    setActiveViewEntry(entries.find(e => e.id !== showDeleteConfirmEntry.id) || null);
                  }
                  setShowDeleteConfirmEntry(null);
                  setToastMessage(locale === "en" ? "Entry deleted successfully" : "Registro excluído com sucesso");
                  setTimeout(() => setToastMessage(""), 3000);
                }}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded cursor-pointer transition-colors font-bold"
              >
                {locale === "en" ? "Delete Permanently" : "Excluir Permanentemente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Lightbox & Management Modal */}
      {activeAttachment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white border border-[#E6E2D5] rounded max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
            <button
              onClick={() => setActiveAttachment(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 cursor-pointer z-10 p-1"
              title={locale === "en" ? "Close" : "Fechar"}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="p-6 pb-3 border-b border-[#E6E2D5] flex-shrink-0 pr-12">
              <h3 className="text-sm font-mono font-bold text-stone-900 uppercase tracking-wider">
                {locale === "en" ? "MANAGE PROCESS FILE" : "GERENCIAR ARQUIVO DE PROCESSO"}
              </h3>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 pt-3 pb-3 overflow-y-auto flex-1 min-h-0 space-y-4 custom-scrollbar">
              {/* Visual Preview */}
              <div className="relative aspect-video max-h-64 w-full rounded border border-[#E6E2D5] bg-[#FAF8F3] overflow-hidden flex items-center justify-center flex-shrink-0">
                {activeAttachment.url === "svg-charcoal" ? (
                  <svg viewBox="0 0 100 100" className="w-4/5 h-4/5 opacity-85 mix-blend-multiply">
                    <rect width="100" height="100" fill="#FCFAF6" />
                    <path d="M20,50 Q40,30 80,45" stroke="#292524" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
                    <path d="M15,35 C35,70 65,15 85,60" stroke="#1C1917" strokeWidth="5.5" strokeLinecap="round" fill="none" opacity="0.9" />
                    <path d="M30,75 Q60,85 70,25" stroke="#44403C" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6" />
                    <circle cx="45" cy="50" r="15" fill="#292524" opacity="0.12" />
                    <circle cx="65" cy="35" r="10" fill="#1C1917" opacity="0.18" />
                  </svg>
                ) : activeAttachment.url === "svg-wash" ? (
                  <svg viewBox="0 0 100 100" className="w-4/5 h-4/5 opacity-85 mix-blend-multiply">
                    <rect width="100" height="100" fill="#F4EFE6" />
                    <circle cx="30" cy="40" r="1.5" fill="#78350F" opacity="0.5" />
                    <circle cx="75" cy="25" r="2" fill="#78350F" opacity="0.4" />
                    <circle cx="50" cy="70" r="2.5" fill="#78350F" opacity="0.3" />
                    <path d="M10,80 C30,75 50,85 90,70 C80,50 60,65 10,80 Z" fill="#D97706" fillOpacity="0.12" />
                    <path d="M20,20 C40,15 70,30 80,10 C60,40 50,25 20,20 Z" fill="#78350F" fillOpacity="0.1" />
                    <path d="M5,40 Q45,60 95,30" stroke="#78350F" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.35" />
                  </svg>
                ) : (
                  <img src={activeAttachment.url} alt={activeAttachment.name} referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                )}
              </div>

              {/* Editable Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1">
                    {locale === "en" ? "File Name" : "Nome do Arquivo"}
                  </label>
                  <input
                    type="text"
                    value={editAttachmentName}
                    onChange={(e) => setEditAttachmentName(e.target.value)}
                    className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-stone-500 text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1">
                    {locale === "en" ? "Caption / Notes" : "Legenda / Notas"}
                  </label>
                  <textarea
                    value={editAttachmentCaption}
                    onChange={(e) => setEditAttachmentCaption(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs font-sans focus:outline-none focus:border-stone-500 text-stone-850 resize-none"
                    placeholder={locale === "en" ? "Add context about this sketch..." : "Adicione contexto sobre este esboço..."}
                  />
                </div>
              </div>
            </div>

            {/* Sticky Actions Bar */}
            <div className="p-6 pt-3 border-t border-[#E6E2D5] flex-shrink-0 flex flex-wrap items-center justify-between gap-3 bg-stone-50/50">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const currentAtts = activeViewEntry?.attachments || (
                      (activeViewEntry?.title === "Oxidation on Iron and Copper Sheets" || activeViewEntry?.title === "Oxidação em Chapas de Ferro e Cobre")
                        ? defaultOnboardingAttachments
                        : []
                    );
                    if (window.confirm(locale === "en" ? "Delete this attachment permanently?" : "Excluir este arquivo permanentemente?")) {
                      const updated = currentAtts.filter(att => att.id !== activeAttachment.id);
                      onUpdateEntry(activeViewEntry!.id, { attachments: updated });
                      setActiveViewEntry({ ...activeViewEntry!, attachments: updated });
                      setActiveAttachment(null);
                      setToastMessage(locale === "en" ? "Attachment deleted" : "Arquivo excluído");
                      setTimeout(() => setToastMessage(""), 3000);
                    }
                  }}
                  className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 font-mono text-[10px] uppercase rounded cursor-pointer transition-colors"
                >
                  {locale === "en" ? "Delete" : "Excluir"}
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById("journal-file-replace")?.click()}
                  className="px-3 py-1.5 border border-[#DDD9CE] hover:bg-[#FAF8F3] text-stone-700 font-mono text-[10px] uppercase rounded cursor-pointer transition-colors"
                >
                  {locale === "en" ? "Replace" : "Substituir"}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveAttachment(null)}
                  className="px-4 py-1.5 border border-[#DDD9CE] hover:bg-[#FAF8F3] text-stone-600 font-mono text-[10px] uppercase rounded cursor-pointer transition-colors"
                >
                  {locale === "en" ? "Close" : "Fechar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentAtts = activeViewEntry?.attachments || (
                      (activeViewEntry?.title === "Oxidation on Iron and Copper Sheets" || activeViewEntry?.title === "Oxidação em Chapas de Ferro e Cobre")
                        ? defaultOnboardingAttachments
                        : []
                    );
                    const updated = currentAtts.map(att => att.id === activeAttachment.id ? { ...att, name: editAttachmentName, caption: editAttachmentCaption } : att);
                    onUpdateEntry(activeViewEntry!.id, { attachments: updated });
                    setActiveViewEntry({ ...activeViewEntry!, attachments: updated });
                    setActiveAttachment(null);
                    setToastMessage(locale === "en" ? "Attachment updated successfully" : "Arquivo atualizado com sucesso");
                    setTimeout(() => setToastMessage(""), 3000);
                  }}
                  className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-mono text-[10px] font-bold uppercase rounded cursor-pointer transition-colors"
                >
                  {locale === "en" ? "Save Changes" : "Salvar Alterações"}
                </button>
              </div>
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
