import React, { useState, useMemo, useRef } from "react";
import { Production, Concept } from "../types";
import { useTranslation } from "../lib/i18n";
import { 
  Plus, 
  Search, 
  Calendar, 
  Trash2, 
  Edit3, 
  Layout, 
  Camera, 
  Tag, 
  Maximize2, 
  Layers, 
  Check, 
  AlertCircle, 
  Palette,
  ArrowRight,
  Eye,
  Video,
  Mic,
  QrCode,
  Image as ImageIcon,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProductionsModuleProps {
  productions: Production[];
  concepts: Concept[];
  onAddProduction: (production: Omit<Production, "id" | "userId" | "researchNotebookId" | "createdAt" | "updatedAt">) => Promise<void>;
  onUpdateProduction: (id: string, updatedFields: Partial<Omit<Production, "id" | "userId" | "researchNotebookId" | "createdAt">>) => Promise<void>;
  onDeleteProduction: (id: string) => Promise<void>;
}

// Beautiful botanical decorative element for the empty state or sidebar
const StudioEaselIcon = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 text-stone-300 stroke-current fill-none stroke-1" strokeLinecap="round">
    <line x1="50" y1="10" x2="30" y2="90" />
    <line x1="50" y1="10" x2="70" y2="90" />
    <line x1="50" y1="20" x2="50" y2="90" />
    <rect x="20" y="45" width="60" height="8" rx="1" fill="none" />
    <rect x="25" y="25" width="50" height="20" rx="1" fill="none" />
    <path d="M 45 45 L 45 40 L 55 40 L 55 45 Z" />
  </svg>
);

export default function ProductionsModule({
  productions,
  concepts,
  onAddProduction,
  onUpdateProduction,
  onDeleteProduction
}: ProductionsModuleProps) {
  const { t, locale } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  
  // Modal & Edit States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduction, setEditingProduction] = useState<Production | null>(null);
  
  // Detail View State
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Form Fields State
  const [title, setTitle] = useState("");
  const [technique, setTechnique] = useState("");
  const [customTechnique, setCustomTechnique] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [surface, setSurface] = useState("");
  const [customSurface, setCustomSurface] = useState("");
  const [creationDate, setCreationDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<Production["status"]>("in_progress");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [associatedConcepts, setAssociatedConcepts] = useState<string[]>([]);
  
  // Image upload handling states
  const [dragActive, setDragActive] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Techniques List for select
  const predefinedTechniques = [
    { value: "oil", label: t.techOil },
    { value: "acrylic", label: t.techAcrylic },
    { value: "charcoal", label: t.techCharcoal },
    { value: "graphite", label: t.techGraphite },
    { value: "watercolor", label: t.techWatercolor },
    { value: "digital", label: t.techDigital },
    { value: "mixed", label: t.techMixed },
    { value: "other", label: t.techOther }
  ];

  // Surface supports list
  const predefinedSurfaces = [
    { value: "canvas", label: t.surfCanvas },
    { value: "paper", label: t.surfPaper },
    { value: "wood", label: t.surfWood },
    { value: "wall", label: t.surfWall },
    { value: "fabric", label: t.surfFabric },
    { value: "other", label: t.surfOther }
  ];

  // Helper to format date nicely
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(locale === "en" ? "en-US" : "pt-BR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC"
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to get translated status label and styling
  const getStatusMeta = (statusVal: Production["status"]) => {
    switch (statusVal) {
      case "in_progress":
        return {
          label: t.statusInProgress,
          bg: "bg-amber-50 text-amber-700 border-amber-200/50",
          dot: "bg-amber-400"
        };
      case "finished":
        return {
          label: t.statusFinished,
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
          dot: "bg-emerald-500"
        };
      case "exhibited":
        return {
          label: t.statusExhibited,
          bg: "bg-blue-50 text-blue-700 border-blue-200/50",
          dot: "bg-blue-500"
        };
      case "sold":
        return {
          label: t.statusSold,
          bg: "bg-stone-100 text-stone-600 border-stone-200/50",
          dot: "bg-stone-400"
        };
      case "private_collection":
        return {
          label: t.statusPrivate,
          bg: "bg-purple-50 text-purple-700 border-purple-200/50",
          dot: "bg-purple-400"
        };
      default:
        return {
          label: statusVal,
          bg: "bg-stone-50 text-stone-600 border-stone-200",
          dot: "bg-stone-400"
        };
    }
  };

  // Filter and Search productions
  const filteredProductions = useMemo(() => {
    return productions.filter((prod) => {
      const matchesSearch = 
        prod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.technique.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prod.surface && prod.surface.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (prod.notes && prod.notes.toLowerCase().includes(searchQuery.toLowerCase()));
        
      const matchesStatus = 
        selectedStatusFilter === "all" || prod.status === selectedStatusFilter;
        
      return matchesSearch && matchesStatus;
    });
  }, [productions, searchQuery, selectedStatusFilter]);

  // Handle Drag & Drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Convert File to Base64 String
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setFormError(locale === "en" ? "Only image files are accepted." : "Apenas arquivos de imagem são aceitos.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageUrl(result);
      setFormError("");
    };
    reader.onerror = () => {
      setFormError(locale === "en" ? "Error reading file." : "Erro ao ler o arquivo.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Reset form states
  const resetForm = () => {
    setTitle("");
    setTechnique("");
    setCustomTechnique("");
    setDimensions("");
    setSurface("");
    setCustomSurface("");
    setCreationDate(new Date().toISOString().split("T")[0]);
    setStatus("in_progress");
    setNotes("");
    setImageUrl("");
    setAssociatedConcepts([]);
    setFormError("");
    setIsEditing(false);
    setEditingProduction(null);
  };

  // Submit Artwork Entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError(locale === "en" ? "Please enter an artwork title." : "Por favor, insira o título da obra.");
      return;
    }
    if (!imageUrl) {
      setFormError(locale === "en" ? "Please upload an image of the artwork." : "Por favor, faça o upload de uma imagem da obra.");
      return;
    }

    const selectedTech = technique === "other" ? customTechnique : predefinedTechniques.find(t => t.value === technique)?.label || technique;
    const selectedSurf = surface === "other" ? customSurface : predefinedSurfaces.find(s => s.value === surface)?.label || surface;

    if (!selectedTech) {
      setFormError(locale === "en" ? "Please select or write a technique." : "Por favor, selecione ou digite a técnica.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    const productionData = {
      title,
      imageUrl,
      technique: selectedTech,
      surface: selectedSurf,
      dimensions,
      creationDate,
      status,
      notes,
      associatedConcepts,
      // Future-ready schema placeholders
      supportingMedia: [],
      qrCodeUrl: ""
    };

    try {
      if (isEditing && editingProduction) {
        await onUpdateProduction(editingProduction.id, productionData);
        setToastMessage(locale === "en" ? "Artwork updated successfully" : "Obra atualizada com sucesso");
        
        // If the updated production is currently selected for detail view, update it
        if (selectedProduction?.id === editingProduction.id) {
          setSelectedProduction({ ...editingProduction, ...productionData, updatedAt: new Date().toISOString() });
        }
      } else {
        await onAddProduction(productionData);
        setToastMessage(locale === "en" ? "Artwork registered successfully" : "Obra registrada com sucesso");
      }
      
      resetForm();
      setIsCreateModalOpen(false);
      setTimeout(() => setToastMessage(""), 3000);
    } catch (err: any) {
      setFormError(err.message || (locale === "en" ? "An error occurred." : "Ocorreu um erro."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger editing from card or detail view
  const handleStartEdit = (prod: Production) => {
    setEditingProduction(prod);
    setIsEditing(true);
    
    setTitle(prod.title);
    
    // Map technique value back to select or "other"
    const techValueMatch = predefinedTechniques.find(t => t.label === prod.technique)?.value;
    if (techValueMatch) {
      setTechnique(techValueMatch);
      setCustomTechnique("");
    } else {
      setTechnique("other");
      setCustomTechnique(prod.technique);
    }
    
    // Map surface support back to select or "other"
    const surfValueMatch = predefinedSurfaces.find(s => s.label === prod.surface)?.value;
    if (surfValueMatch) {
      setSurface(surfValueMatch);
      setCustomSurface("");
    } else {
      setSurface("other");
      setCustomSurface(prod.surface || "");
    }
    
    setDimensions(prod.dimensions || "");
    setCreationDate(prod.creationDate || new Date().toISOString().split("T")[0]);
    setStatus(prod.status);
    setNotes(prod.notes || "");
    setImageUrl(prod.imageUrl);
    setAssociatedConcepts(prod.associatedConcepts || []);
    
    setIsCreateModalOpen(true);
  };

  // Trigger Delete operation
  const handleDelete = async (id: string) => {
    try {
      await onDeleteProduction(id);
      setToastMessage(locale === "en" ? "Artwork deleted" : "Obra excluída");
      setShowDeleteConfirm(null);
      if (selectedProduction?.id === id) {
        setIsDetailOpen(false);
        setSelectedProduction(null);
      }
      setTimeout(() => setToastMessage(""), 3000);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleConceptToggle = (conceptId: string) => {
    setAssociatedConcepts((prev) =>
      prev.includes(conceptId)
        ? prev.filter((id) => id !== conceptId)
        : [...prev, conceptId]
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-100px)] overflow-hidden">
      
      {/* 1. LEFT PANEL: Sidebar Controls */}
      <div className="lg:col-span-3 flex flex-col border-r border-[#E6E2D5] pr-5 h-full overflow-y-auto custom-scrollbar space-y-6">
        
        {/* Editorial Branding Header */}
        <div className="flex items-center gap-3 border-b border-[#E6E2D5]/70 pb-5">
          <StudioEaselIcon />
          <div>
            <h2 className="text-xl font-serif font-bold tracking-widest text-stone-900 uppercase">
              {t.tabProductions}
            </h2>
            <p className="text-[9px] font-mono text-stone-500 uppercase tracking-widest leading-tight">
              {locale === "en" ? "ARTWORK ARCHIVING CATALOG" : "CATÁLOGO DE ARQUIVAMENTO DE OBRAS"}
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => {
            resetForm();
            setIsCreateModalOpen(true);
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-stone-900 hover:bg-stone-850 text-white font-mono text-xs uppercase tracking-widest font-semibold cursor-pointer transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newProductionBtn}</span>
        </button>

        {/* Search & Filter Options */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-800">
              {locale === "en" ? "Search" : "Busca"}
            </span>
            <Search className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <input
            type="text"
            placeholder={t.searchProductions}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-1.5 text-xs font-sans text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-400"
          />
        </div>

        {/* Status Filters */}
        <div className="space-y-2.5 pt-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block">
            {locale === "en" ? "STATUS FILTER" : "FILTRAR STATUS"}
          </span>
          <div className="flex flex-col gap-1.5">
            {[
              { id: "all", label: locale === "en" ? "All Artworks" : "Todas as Obras" },
              { id: "in_progress", label: t.statusInProgress },
              { id: "finished", label: t.statusFinished },
              { id: "exhibited", label: t.statusExhibited },
              { id: "sold", label: t.statusSold },
              { id: "private_collection", label: t.statusPrivate }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatusFilter(st.id)}
                className={`w-full text-left px-3 py-1.5 text-xs rounded transition-all font-sans flex items-center gap-2 ${
                  selectedStatusFilter === st.id
                    ? "bg-stone-150 font-semibold text-stone-900 border-l-2 border-stone-800 pl-2"
                    : "text-stone-600 hover:bg-stone-50 hover:text-stone-900 pl-3"
                }`}
              >
                {st.id !== "all" && (
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusMeta(st.id as any).dot}`} />
                )}
                <span>{st.label}</span>
                <span className="ml-auto text-[9px] font-mono text-stone-400">
                  ({st.id === "all" ? productions.length : productions.filter(p => p.status === st.id).length})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Informative Intro Banner */}
        <div className="bg-[#FAF9F5] border border-[#DDD9CE]/60 rounded p-4 text-xs space-y-3.5 mt-auto">
          <div className="font-serif font-bold text-stone-850 flex items-center gap-2">
            <Palette className="w-4 h-4 text-stone-600" />
            <span>{t.infoProductionsWhatIs}</span>
          </div>
          <p className="text-stone-600 leading-relaxed text-[11px] font-sans">
            {t.infoProductionsWhatIsDesc}
          </p>
          <div className="border-t border-[#DDD9CE]/40 my-2" />
          <div className="font-serif font-bold text-stone-850 flex items-center gap-2">
            <Layers className="w-4 h-4 text-stone-600" />
            <span>{t.infoProductionsWhyMatter}</span>
          </div>
          <p className="text-stone-600 leading-relaxed text-[11px] font-sans">
            {t.infoProductionsWhyMatterDesc}
          </p>
        </div>

      </div>

      {/* 2. RIGHT/CENTER PANEL: Card Catalog Grid */}
      <div className="lg:col-span-9 h-full flex flex-col overflow-y-auto custom-scrollbar pb-10 pr-2">
        
        {/* Header / Stats Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E6E2D5] pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
              {t.productionsTitle}
            </h1>
            <p className="text-xs text-stone-500 font-sans mt-0.5">
              {t.productionsSubtitle}
            </p>
          </div>
          <div className="text-right mt-2 sm:mt-0">
            <span className="font-mono text-xs text-stone-500 uppercase tracking-widest">
              {locale === "en" ? "TOTAL ARCHIVED" : "TOTAL ARQUIVADO"}: {filteredProductions.length}
            </span>
          </div>
        </div>

        {/* Toast Messages */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-stone-900 text-white font-mono text-[10px] tracking-widest uppercase px-4 py-2.5 rounded shadow-lg self-center mb-6 z-40 flex items-center gap-2 border border-stone-800"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty Catalog State */}
        {filteredProductions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-[#FAF9F5] rounded border border-dashed border-[#DDD9CE] max-w-2xl mx-auto w-full my-auto">
            <StudioEaselIcon />
            <h3 className="text-base font-serif font-bold text-stone-850 uppercase tracking-wider mt-4">
              {locale === "en" ? "THE WORK IS BORN FROM THE PROCESS" : "A OBRA NASCE DO PROCESSO"}
            </h3>
            <p className="text-xs text-stone-500 font-sans mt-2 max-w-md leading-relaxed">
              {t.noProductionsYet}
            </p>
            <button
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
              className="mt-6 flex items-center gap-2 px-4 py-2 rounded bg-stone-900 hover:bg-stone-850 text-white font-mono text-[10px] uppercase tracking-widest font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.newProductionBtn}</span>
            </button>
          </div>
        ) : (
          /* Artwork Archival Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProductions.map((prod) => {
              const meta = getStatusMeta(prod.status);
              return (
                <div 
                  key={prod.id}
                  className="bg-white border border-[#DDD9CE] rounded overflow-hidden flex flex-col group hover:shadow-md hover:border-stone-400 transition-all duration-300"
                >
                  {/* Aspect-Ratio Boxed Image container */}
                  <div className="relative aspect-4/3 overflow-hidden bg-stone-100 border-b border-[#DDD9CE] cursor-pointer"
                    onClick={() => {
                      setSelectedProduction(prod);
                      setIsDetailOpen(true);
                    }}
                  >
                    <img 
                      src={prod.imageUrl} 
                      alt={prod.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                    {/* Hover Inspect overlay */}
                    <div className="absolute inset-0 bg-stone-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-white/90 px-3 py-1.5 rounded shadow text-[10px] font-mono uppercase tracking-widest text-stone-850 flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{locale === "en" ? "Inspect" : "Inspecionar"}</span>
                      </div>
                    </div>
                    {/* Status Badge absolute pinned */}
                    <div className={`absolute top-3 left-3 px-2 py-1 border rounded shadow-xs text-[9px] font-mono uppercase tracking-wider font-semibold flex items-center gap-1.5 backdrop-blur-xs ${meta.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      <span>{meta.label}</span>
                    </div>
                  </div>

                  {/* Artwork Metadata card section */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-sm font-serif font-bold text-stone-900 line-clamp-1 group-hover:text-stone-850 cursor-pointer"
                      onClick={() => {
                        setSelectedProduction(prod);
                        setIsDetailOpen(true);
                      }}
                    >
                      {prod.title}
                    </h3>

                    <div className="mt-3.5 space-y-1.5 text-[10px] font-sans text-stone-500 border-b border-[#E6E2D5]/40 pb-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Palette className="w-3 h-3 text-stone-400 flex-shrink-0" />
                        <span className="font-semibold text-stone-700">{t.techniqueLabel}:</span>
                        <span className="line-clamp-1">{prod.technique}</span>
                      </div>
                      {prod.surface && (
                        <div className="flex items-center gap-2">
                          <Layers className="w-3 h-3 text-stone-400 flex-shrink-0" />
                          <span className="font-semibold text-stone-700">{t.surfaceLabel}:</span>
                          <span className="line-clamp-1">{prod.surface}</span>
                        </div>
                      )}
                      {prod.dimensions && (
                        <div className="flex items-center gap-2">
                          <Maximize2 className="w-3 h-3 text-stone-400 flex-shrink-0" />
                          <span className="font-semibold text-stone-700">{t.dimensionsLabel}:</span>
                          <span className="line-clamp-1 font-mono text-[9px]">{prod.dimensions}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-stone-400 flex-shrink-0" />
                        <span className="font-semibold text-stone-700">{t.creationDateLabel}:</span>
                        <span className="font-mono text-[9px]">{formatDate(prod.creationDate)}</span>
                      </div>
                    </div>

                    {/* Poetic Short Note if present */}
                    {prod.notes && (
                      <p className="text-[11px] text-stone-600 italic font-serif line-clamp-2 mt-3 leading-relaxed">
                        "{prod.notes}"
                      </p>
                    )}

                    {/* Card Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-[#E6E2D5]/70 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedProduction(prod);
                          setIsDetailOpen(true);
                        }}
                        className="text-[10px] font-mono text-stone-500 hover:text-stone-850 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        <span>{locale === "en" ? "Review notes" : "Ver notas"}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleStartEdit(prod)}
                          title={t.editLog}
                          className="p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-50 rounded cursor-pointer transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        
                        {showDeleteConfirm === prod.id ? (
                          <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
                            <button
                              onClick={() => handleDelete(prod.id)}
                              className="text-[9px] font-mono text-red-600 uppercase font-bold"
                            >
                              {locale === "en" ? "Delete?" : "Excluir?"}
                            </button>
                            <span className="text-stone-300">|</span>
                            <button
                              onClick={() => setShowDeleteConfirm(null)}
                              className="text-[9px] font-mono text-stone-500"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowDeleteConfirm(prod.id)}
                            title={t.deleteLog}
                            className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. SLIDING INSPECTION DETAIL DRAWER */}
      <AnimatePresence>
        {isDetailOpen && selectedProduction && (
          <>
            {/* Backdrop cover overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="fixed inset-0 bg-stone-950 z-40"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[500px] bg-white border-l border-[#DDD9CE] shadow-2xl z-50 flex flex-col h-full overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-[#E6E2D5] bg-[#FAF9F5] flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest block font-semibold">
                    {locale === "en" ? "ARTWORK ARCHIVAL RECORD" : "REGISTRO DE ARQUIVAMENTO DA OBRA"}
                  </span>
                  <h2 className="text-base font-serif font-bold text-stone-900 leading-tight">
                    {selectedProduction.title}
                  </h2>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1.5 rounded-full hover:bg-stone-150 text-stone-400 hover:text-stone-850 cursor-pointer transition-colors"
                >
                  <Maximize2 className="w-4 h-4 rotate-45" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                
                {/* Full Resolution Main Image */}
                <div className="relative aspect-4/3 overflow-hidden bg-stone-100 rounded border border-[#DDD9CE] shadow-xs">
                  <img 
                    src={selectedProduction.imageUrl} 
                    alt={selectedProduction.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute top-3 left-3 px-2 py-1 border rounded shadow-xs text-[9px] font-mono uppercase tracking-wider font-semibold bg-white/95 backdrop-blur-xs flex items-center gap-1.5 ${getStatusMeta(selectedProduction.status).bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusMeta(selectedProduction.status).dot}`} />
                    <span>{getStatusMeta(selectedProduction.status).label}</span>
                  </div>
                </div>

                {/* Archival Attributes list */}
                <div className="bg-[#FAF9F5] rounded border border-[#DDD9CE]/60 p-4 space-y-3 font-sans text-xs">
                  <h4 className="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-bold mb-1 border-b border-[#DDD9CE]/40 pb-1.5">
                    {locale === "en" ? "Archival Metadata" : "Metadados de Arquivamento"}
                  </h4>
                  <div className="grid grid-cols-3 gap-y-3">
                    <div className="text-stone-400 font-semibold">{t.techniqueLabel}:</div>
                    <div className="col-span-2 text-stone-800 font-medium">{selectedProduction.technique}</div>

                    {selectedProduction.surface && (
                      <>
                        <div className="text-stone-400 font-semibold">{t.surfaceLabel}:</div>
                        <div className="col-span-2 text-stone-800 font-medium">{selectedProduction.surface}</div>
                      </>
                    )}

                    {selectedProduction.dimensions && (
                      <>
                        <div className="text-stone-400 font-semibold">{t.dimensionsLabel}:</div>
                        <div className="col-span-2 text-stone-800 font-mono text-[11px]">{selectedProduction.dimensions}</div>
                      </>
                    )}

                    <div className="text-stone-400 font-semibold">{t.creationDateLabel}:</div>
                    <div className="col-span-2 text-stone-800 font-mono text-[11px]">{formatDate(selectedProduction.creationDate)}</div>
                  </div>
                </div>

                {/* Poetical & Artistic Notes */}
                {selectedProduction.notes && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-bold">
                      {t.artistNotesLabel}
                    </h4>
                    <p className="text-sm font-serif text-stone-800 italic leading-relaxed bg-[#FFFDF9] border border-[#DDD9CE]/30 rounded p-4 shadow-3xs">
                      "{selectedProduction.notes}"
                    </p>
                  </div>
                )}

                {/* Linked Research Concepts */}
                {selectedProduction.associatedConcepts && selectedProduction.associatedConcepts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-bold">
                      {locale === "en" ? "Linked Research Concepts" : "Conceitos de Pesquisa Vinculados"}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProduction.associatedConcepts.map((cid) => {
                        const matchingConcept = concepts.find((c) => c.id === cid);
                        if (!matchingConcept) return null;
                        return (
                          <span
                            key={cid}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-50 border border-[#DDD9CE] text-stone-700 rounded text-[10px] font-sans"
                          >
                            <Tag className="w-2.5 h-2.5 text-stone-400" />
                            <span>{matchingConcept.name}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* FUTURE-READY PORTFOLIO BUILDER & DIGITAL GUIDE PREPARATION PLACEHOLDERS */}
                <div className="border-t border-[#E6E2D5] pt-5 space-y-4">
                  <div>
                    <h4 className="text-[10px] font-mono text-stone-400 uppercase tracking-widest font-bold block mb-1">
                      {locale === "en" ? "Future Extensions (Phase 2)" : "Extensões Futuras (Fase 2)"}
                    </h4>
                    <p className="text-[9px] text-stone-400 leading-normal font-sans">
                      {locale === "en" 
                        ? "Prepare schemas and components for future artwork publication features, enabling instant physical-to-digital lineages."
                        : "Preparação de esquemas e componentes para recursos futuros de publicação de obras, permitindo elos físico-digitais instantâneos."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-stone-400 font-sans text-[10px]">
                    <div className="flex items-center gap-2 p-2 bg-[#FAF9F5] border border-dashed border-[#DDD9CE]/60 rounded opacity-60">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <div>
                        <span className="font-semibold block">{locale === "en" ? "Process Gallery" : "Galeria de Processo"}</span>
                        <span className="text-[8px]">{locale === "en" ? "Supporting studies" : "Estudos de suporte"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-[#FAF9F5] border border-dashed border-[#DDD9CE]/60 rounded opacity-60">
                      <Video className="w-3.5 h-3.5" />
                      <div>
                        <span className="font-semibold block">{locale === "en" ? "Video Showcase" : "Apresentação em Vídeo"}</span>
                        <span className="text-[8px]">{locale === "en" ? "Studio records" : "Registros de ateliê"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-[#FAF9F5] border border-dashed border-[#DDD9CE]/60 rounded opacity-60">
                      <Mic className="w-3.5 h-3.5" />
                      <div>
                        <span className="font-semibold block">{locale === "en" ? "Audio Guide" : "Audioguia Poético"}</span>
                        <span className="text-[8px]">{locale === "en" ? "Voice annotations" : "Anotações em voz"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-[#FAF9F5] border border-dashed border-[#DDD9CE]/60 rounded opacity-60">
                      <QrCode className="w-3.5 h-3.5" />
                      <div>
                        <span className="font-semibold block">{locale === "en" ? "Exhibition QR Link" : "Código QR de Exposição"}</span>
                        <span className="text-[8px]">{locale === "en" ? "Instant catalog scan" : "Acesso instantâneo"}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-[#E6E2D5] bg-[#FAF9F5] flex items-center gap-2 justify-end">
                <button
                  onClick={() => handleStartEdit(selectedProduction)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 border border-[#DDD9CE] rounded hover:border-stone-400 bg-white text-stone-700 font-mono text-[10px] uppercase tracking-wider font-semibold cursor-pointer transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{t.editLog}</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(selectedProduction.id)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded font-mono text-[10px] uppercase tracking-wider font-semibold cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{locale === "en" ? "Delete Record" : "Excluir Registro"}</span>
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 4. REGISTER NEW ARTWORK / EDIT MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop cover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="fixed inset-0 bg-stone-900"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#FFFDF9] rounded-lg border border-[#DDD9CE] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-50"
            >
              <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                
                {/* Modal Header */}
                <div className="p-5 border-b border-[#E6E2D5] bg-[#FAF9F5] flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-serif font-bold text-stone-900 uppercase tracking-wider">
                      {isEditing ? (locale === "en" ? "Edit Artwork Details" : "Editar Detalhes da Obra") : t.newProductionTitle}
                    </h3>
                    <p className="text-[10px] text-stone-500 font-sans mt-0.5">
                      {locale === "en" 
                        ? "Register physical artworks directly connected to this notebook's processes and aesthetic lineages." 
                        : "Registre obras físicas conectadas diretamente aos processos e linhagens estéticas deste caderno."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="p-1 rounded-full hover:bg-stone-150 text-stone-400 hover:text-stone-850 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Form scrollable content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
                  
                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2.5 text-xs text-red-700">
                      <AlertCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Left Col: Image Upload Area */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block font-bold">
                        {t.prodImageLabel}
                      </label>
                      
                      <div 
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative w-full aspect-4/3 rounded border border-dashed flex flex-col items-center justify-center text-center p-4 cursor-pointer transition-all ${
                          dragActive 
                            ? "border-stone-850 bg-stone-50/50" 
                            : imageUrl 
                              ? "border-[#DDD9CE] hover:border-stone-400" 
                              : "border-[#DDD9CE] hover:border-stone-400 bg-[#FAF9F5]"
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileInputChange}
                          className="hidden"
                        />

                        {imageUrl ? (
                          <div className="relative w-full h-full rounded overflow-hidden">
                            <img 
                              src={imageUrl} 
                              alt="Uploaded artwork preview" 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-mono uppercase tracking-widest">
                              <Camera className="w-5 h-5 mb-1 text-white" />
                              <span>{locale === "en" ? "Change Image" : "Alterar Imagem"}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 text-stone-400 py-6">
                            <Camera className="w-8 h-8 mx-auto stroke-1" />
                            <p className="text-[11px] font-sans px-4">
                              {t.prodImagePlaceholder}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Col: Title, Date, Dimensions, Status */}
                    <div className="space-y-4">
                      {/* Artwork Title */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block font-bold">
                          {t.prodTitleLabel}
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder={t.prodTitlePlaceholder}
                          className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-400"
                          required
                        />
                      </div>

                      {/* Creation Date */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block font-bold">
                          {t.prodCreationDateLabel}
                        </label>
                        <input
                          type="date"
                          value={creationDate}
                          onChange={(e) => setCreationDate(e.target.value)}
                          className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-mono text-stone-850 focus:outline-none focus:border-stone-500"
                          required
                        />
                      </div>

                      {/* Dimensions */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block font-bold">
                          {t.prodDimensionsLabel}
                        </label>
                        <input
                          type="text"
                          value={dimensions}
                          onChange={(e) => setDimensions(e.target.value)}
                          placeholder={t.prodDimensionsPlaceholder}
                          className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-400"
                        />
                      </div>

                      {/* Status select */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block font-bold">
                          {t.prodStatusLabel}
                        </label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as Production["status"])}
                          className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500"
                        >
                          <option value="in_progress">{t.statusInProgress}</option>
                          <option value="finished">{t.statusFinished}</option>
                          <option value="exhibited">{t.statusExhibited}</option>
                          <option value="sold">{t.statusSold}</option>
                          <option value="private_collection">{t.statusPrivate}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Technique selection */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block font-bold">
                        {t.prodTechniqueLabel}
                      </label>
                      <select
                        value={technique}
                        onChange={(e) => setTechnique(e.target.value)}
                        className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500"
                      >
                        <option value="">-- {locale === "en" ? "Select technique" : "Selecionar técnica"} --</option>
                        {predefinedTechniques.map((tech) => (
                          <option key={tech.value} value={tech.value}>{tech.label}</option>
                        ))}
                      </select>
                      
                      {technique === "other" && (
                        <input
                          type="text"
                          value={customTechnique}
                          onChange={(e) => setCustomTechnique(e.target.value)}
                          placeholder={locale === "en" ? "Type custom technique" : "Digite a técnica personalizada"}
                          className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500 mt-2"
                          required
                        />
                      )}
                    </div>

                    {/* Surface selection */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block font-bold">
                        {t.prodSurfaceLabel}
                      </label>
                      <select
                        value={surface}
                        onChange={(e) => setSurface(e.target.value)}
                        className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500"
                      >
                        <option value="">-- {locale === "en" ? "Select surface" : "Selecionar superfície"} --</option>
                        {predefinedSurfaces.map((surf) => (
                          <option key={surf.value} value={surf.value}>{surf.label}</option>
                        ))}
                      </select>

                      {surface === "other" && (
                        <input
                          type="text"
                          value={customSurface}
                          onChange={(e) => setCustomSurface(e.target.value)}
                          placeholder={locale === "en" ? "Type custom surface support" : "Digite o suporte/superfície personalizado"}
                          className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500 mt-2"
                          required
                        />
                      )}
                    </div>
                  </div>

                  {/* Poetic Artist Notes */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block font-bold">
                      {t.prodNotesLabel}
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t.prodNotesPlaceholder}
                      rows={4}
                      className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-serif text-stone-850 focus:outline-none focus:border-stone-500 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Linking Active Research Concepts */}
                  {concepts.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block font-bold">
                        {locale === "en" ? "Link Research Concepts" : "Vincular Conceitos de Pesquisa"}
                      </label>
                      <div className="flex flex-wrap gap-1.5 p-3 bg-[#FAF9F5] border border-[#DDD9CE] rounded max-h-[120px] overflow-y-auto custom-scrollbar">
                        {concepts.map((concept) => {
                          const isLinked = associatedConcepts.includes(concept.id);
                          return (
                            <button
                              type="button"
                              key={concept.id}
                              onClick={() => handleConceptToggle(concept.id)}
                              className={`px-2.5 py-1 text-[10px] font-sans rounded border transition-all flex items-center gap-1 cursor-pointer ${
                                isLinked
                                  ? "bg-stone-900 border-stone-900 text-white font-medium"
                                  : "bg-white border-[#DDD9CE] text-stone-600 hover:border-stone-400"
                              }`}
                            >
                              {isLinked && <Check className="w-2.5 h-2.5" />}
                              <span>{concept.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>

                {/* Modal Footer Controls */}
                <div className="p-4 border-t border-[#E6E2D5] bg-[#FAF9F5] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setIsCreateModalOpen(false);
                    }}
                    className="px-4 py-2 text-[10px] font-mono text-stone-400 hover:text-stone-800 uppercase tracking-widest"
                  >
                    {t.discard}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded bg-stone-900 hover:bg-stone-850 text-white font-mono text-[10px] uppercase tracking-widest font-bold transition-colors shadow-xs disabled:bg-stone-300 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-stone-600 border-t-white rounded-full animate-spin" />
                        <span>{t.saving}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{isEditing ? (locale === "en" ? "Save Changes" : "Salvar Alterações") : t.prodSubmitBtn}</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
