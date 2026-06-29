import React, { useState } from "react";
import { Concept, Reference } from "../types";
import { Compass, Lightbulb, HelpCircle, Plus, Trash2, Globe, Loader2, Sparkles, AlertCircle, Calendar, MoreVertical, Edit3, Check, X } from "lucide-react";
import { useTranslation } from "../lib/i18n";

interface LabModuleProps {
  concepts: Concept[];
  onAddConcept: (name: string, description: string, status: "seed" | "growing" | "mature") => void;
  onUpdateConcept: (id: string, updatedFields: Partial<Concept>) => void;
  onDeleteConcept: (id: string) => void;
  onExploreConcept: (conceptName: string, conceptDescription: string, existingConceptId: string) => Promise<Concept>;
}

const getLoadingTexts = (locale: string) => {
  if (locale === "pt") {
    return [
      "Expandindo parâmetros do conceito...",
      "Alinhando qualidades sensoriais e materiais...",
      "Reunindo linhagens artísticas históricas...",
      "Formulando questionamentos para a prática de ateliê...",
    ];
  }
  return [
    "Expanding concept parameters...",
    "Aligning sensory and material qualities...",
    "Gathering historical artistic lineages...",
    "Formulating inquiries for studio practice...",
  ];
};

export default function LabModule({
  concepts,
  onAddConcept,
  onUpdateConcept,
  onDeleteConcept,
  onExploreConcept,
}: LabModuleProps) {
  const { t, locale } = useTranslation();
  const loadingTexts = getLoadingTexts(locale);
  const [activeConceptId, setActiveConceptId] = useState<string | null>(
    concepts.length > 0 ? concepts[0].id : null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // Create Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"seed" | "growing" | "mature">("seed");

  // Editing Concept State
  const [isEditing, setIsEditing] = useState(false);
  const [activeMenuConceptId, setActiveMenuConceptId] = useState<string | null>(null);
  const [showDeleteConfirmConcept, setShowDeleteConfirmConcept] = useState<Concept | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"seed" | "growing" | "mature">("seed");
  const [editTags, setEditTags] = useState("");
  const [editAssociations, setEditAssociations] = useState("");
  const [editQuestions, setEditQuestions] = useState("");
  const [editReferences, setEditReferences] = useState<Reference[]>([]);

  // Active Concept
  const activeConcept = concepts.find((c) => c.id === activeConceptId);

  const startInterval = () => {
    setLoadingTextIndex(0);
    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 2500);
    return interval;
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg(locale === "en" ? "Concept title is required." : "O título do conceito é obrigatório.");
      return;
    }

    onAddConcept(name, description, status);
    setName("");
    setDescription("");
    setStatus("seed");
    setIsCreating(false);
  };

  const handleTriggerEditConcept = (concept: Concept) => {
    setEditName(concept.name);
    setEditDescription(concept.description);
    setEditStatus(concept.status);
    setEditTags(concept.tags ? concept.tags.join(", ") : "");
    setEditAssociations(concept.associations.join(", "));
    setEditQuestions(concept.questions.join("\n"));
    setEditReferences(concept.references || []);
    setIsEditing(true);
    setIsCreating(false);
    setActiveMenuConceptId(null);
  };

  const handleSaveConceptEdit = () => {
    setErrorMsg("");
    if (!editName.trim()) {
      setErrorMsg(locale === "en" ? "Name is required." : "O nome é obrigatório.");
      return;
    }
    if (!activeConceptId) return;

    const tags = editTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const associations = editAssociations
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    const questions = editQuestions
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0);

    onUpdateConcept(activeConceptId, {
      name: editName,
      description: editDescription,
      status: editStatus,
      tags,
      associations,
      questions,
      references: editReferences,
    });

    setIsEditing(false);
    setToastMessage(locale === "en" ? "Concept saved successfully" : "Conceito salvo com sucesso");
    setTimeout(() => setToastMessage(""), 3000);
  };

  const triggerExplore = async (concept: Concept) => {
    setIsLoading(true);
    setErrorMsg("");
    const timer = startInterval();

    try {
      const updated = await onExploreConcept(concept.name, concept.description, concept.id);
      setActiveConceptId(updated.id);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        locale === "en"
          ? "Failed to run concept exploration. Verify your connection or API configuration."
          : "Falha ao explorar o conceito. Verifique sua conexão ou configuração da API."
      );
    } finally {
      clearInterval(timer);
      setIsLoading(false);
    }
  };

  const handleStatusChange = (newStatus: "seed" | "growing" | "mature") => {
    if (activeConceptId) {
      onUpdateConcept(activeConceptId, { status: newStatus });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-100px)] overflow-hidden">
      {/* Left Pane: Concepts List */}
      <div className="lg:col-span-4 flex flex-col border-r border-[#E6E2D5] pr-2 lg:pr-6 h-full overflow-hidden">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-850">
              {locale === "en" ? "Concepts List" : "Lista de Conceitos"}
            </h2>
            <p className="text-[10px] font-mono text-stone-500">
              {concepts.length} {locale === "en" ? "seeded research threads" : "linhas de pesquisa semeadas"}
            </p>
          </div>
          <button
            onClick={() => {
              setIsCreating(true);
              setActiveConceptId(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-stone-900 hover:bg-stone-850 text-white font-mono text-xs cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{locale === "en" ? "Add Concept" : "Adicionar Conceito"}</span>
          </button>
        </div>

        {/* Concept list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {concepts.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-[#DDD9CE] rounded bg-white/40">
              <p className="text-xs font-mono text-stone-400">
                {locale === "en" ? "No concepts seeded yet." : "Nenhum conceito semeado ainda."}
              </p>
            </div>
          ) : (
            concepts.map((concept) => {
              const isActive = activeConceptId === concept.id && !isCreating;
              const statusColors = {
                seed: "border-[#DDD9CE]/80 bg-[#FAF8F3] text-stone-600",
                growing: "border-[#DDD9CE]/80 bg-[#EFECE6] text-stone-700",
                mature: "border-[#DDD9CE]/80 bg-white text-stone-850 font-bold",
              };

              const getStageLabel = (st: "seed" | "growing" | "mature") => {
                if (locale === "pt") {
                  if (st === "seed") return "semente";
                  if (st === "growing") return "cultivo";
                  if (st === "mature") return "maduro";
                }
                return st;
              };

              return (
                <div
                  key={concept.id}
                  onClick={() => {
                    setActiveConceptId(concept.id);
                    setIsCreating(false);
                    setErrorMsg("");
                  }}
                  className={`p-4 rounded-sm border transition-all duration-300 cursor-pointer text-left ${
                    isActive
                      ? "bg-white border-[#DDD9CE] border-l-[3px] border-l-stone-900 shadow-xs"
                      : "bg-[#FCFAF7] border-[#E6E2D5]/70 hover:border-stone-400 hover:bg-white hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-sm font-serif font-bold text-stone-900 tracking-tight line-clamp-1">
                      {concept.name}
                    </h3>
                    <span className={`text-[8px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-sm border ${statusColors[concept.status]}`}>
                      {getStageLabel(concept.status)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed font-sans">
                    {concept.description || (locale === "en" ? "No description provided." : "Nenhuma descrição fornecida.")}
                  </p>
                  {concept.questions.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 text-[9px] font-mono text-stone-450 uppercase tracking-wider font-semibold">
                      <Sparkles className="w-2.5 h-2.5 text-stone-500 stroke-[1.5]" />
                      <span>
                        {locale === "en"
                          ? `Explored • ${concept.questions.length} questions`
                          : `Explorado • ${concept.questions.length} perguntas`}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane: Exploration Studio */}
      <div className="lg:col-span-8 flex flex-col h-full overflow-hidden bg-[#FCFAF6] rounded border border-[#E6E2D5] p-7 md:p-8">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <Loader2 className="w-6 h-6 text-stone-400 animate-spin mb-4" />
            <p className="text-stone-700 font-mono text-xs tracking-wider uppercase text-center max-w-md">
              {loadingTexts[loadingTextIndex]}
            </p>
          </div>
        ) : isCreating ? (
          /* NEW CONCEPT FORM */
          <form onSubmit={handleCreate} className="flex flex-col h-full overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6E2D5] pb-3">
              <div>
                <h3 className="text-xs font-mono font-bold text-stone-850 uppercase tracking-wider">
                  {locale === "en" ? "Seed a Concept" : "Semear um Conceito"}
                </h3>
                <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                  {locale === "en"
                    ? "Register an inquiry, material interest, or research focus point."
                    : "Registre uma investigação, interesse material ou ponto focal de pesquisa."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  if (concepts.length > 0) setActiveConceptId(concepts[0].id);
                }}
                className="text-xs font-mono text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                {t.discard}
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block">
                {locale === "en" ? "Concept Title" : "Título do Conceito"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={locale === "en" ? "e.g., Digital decay / Iron gall ink oxidation / Kinetic weight" : "ex: Decaimento digital / Oxidação de tinta ferro-gálica / Peso cinético"}
                className="w-full bg-white border border-[#DDD9CE] rounded px-3.5 py-2 text-xs font-sans text-stone-850 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-400"
                required
              />
            </div>

            <div className="flex-1 flex flex-col space-y-1 min-h-[140px]">
              <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block">
                {locale === "en" ? "Description & Inquiry (Optional)" : "Descrição e Investigação (Opcional)"}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={locale === "en" ? "Describe the initial visual, sculptural, or narrative focus of this concept..." : "Descreva o foco visual, escultural ou narrativo inicial deste conceito..."}
                className="w-full flex-1 bg-white border border-[#DDD9CE] rounded px-3.5 py-3 text-xs text-stone-850 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-400 font-sans resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block">
                {locale === "en" ? "Development Stage" : "Estágio de Desenvolvimento"}
              </label>
              <div className="flex gap-4">
                {(["seed", "growing", "mature"] as const).map((stage) => {
                  const getStageLabel = (st: "seed" | "growing" | "mature") => {
                    if (locale === "pt") {
                      if (st === "seed") return "semente";
                      if (st === "growing") return "cultivo";
                      if (st === "mature") return "maduro";
                    }
                    return st;
                  };
                  return (
                    <label
                      key={stage}
                      className="flex items-center gap-2 text-xs font-mono text-stone-700 cursor-pointer uppercase tracking-wider"
                    >
                      <input
                        type="radio"
                        name="status"
                        value={stage}
                        checked={status === stage}
                        onChange={() => setStatus(stage)}
                        className="border-[#DDD9CE] bg-white text-stone-800 focus:ring-1 focus:ring-stone-400"
                      />
                      <span>{getStageLabel(stage)}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-[#E6E2D5] flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white font-mono text-xs font-bold rounded cursor-pointer transition-colors"
              >
                {locale === "en" ? "Create Concept" : "Criar Conceito"}
              </button>
            </div>
          </form>
        ) : isEditing ? (
          /* EDIT CONCEPT FORM */
          <div className="flex flex-col h-full overflow-y-auto space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#E6E2D5] pb-3">
              <div>
                <h3 className="text-xs font-mono font-bold text-stone-850 uppercase tracking-wider">
                  {locale === "en" ? "Edit Concept" : "Editar Conceito"}
                </h3>
                <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                  {locale === "en"
                    ? "Modify metadata, stage, associated terms, inquiries and reference mappings."
                    : "Modifique metadados, estágio, termos associados, indagações e referências mapeadas."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                }}
                className="text-xs font-mono text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                {t.discard}
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block font-semibold">
                    {locale === "en" ? "Concept Title / Name" : "Nome / Título do Conceito"}
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-800 focus:outline-none focus:border-stone-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block font-semibold">
                    {locale === "en" ? "Research Stage" : "Estágio de Pesquisa"}
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-800 focus:outline-none focus:border-stone-500"
                  >
                    <option value="seed">🌱 {locale === "en" ? "Seed" : "Semente"}</option>
                    <option value="growing">🌿 {locale === "en" ? "Growing" : "Em Crescimento"}</option>
                    <option value="mature">🌳 {locale === "en" ? "Mature" : "Maduro"}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block font-semibold">
                  {locale === "en" ? "Description" : "Descrição"}
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-800 focus:outline-none focus:border-stone-500 resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block font-semibold">
                    {locale === "en" ? "Tags (comma-separated)" : "Palavras-chave (separadas por vírgula)"}
                  </label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="e.g. gravidade, carvão, efemeridade"
                    className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-800 focus:outline-none focus:border-stone-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block font-semibold">
                    {locale === "en" ? "AI Associations (comma-separated)" : "Associações IA (separadas por vírgula)"}
                  </label>
                  <input
                    type="text"
                    value={editAssociations}
                    onChange={(e) => setEditAssociations(e.target.value)}
                    className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-sans text-stone-800 focus:outline-none focus:border-stone-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block font-semibold">
                  {locale === "en" ? "AI Exploration - Inquiries / Questions (one per line)" : "Perguntas de Investigação (uma por linha)"}
                </label>
                <textarea
                  value={editQuestions}
                  onChange={(e) => setEditQuestions(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-[#DDD9CE] rounded px-3 py-2 text-xs font-mono text-stone-800 focus:outline-none focus:border-stone-500 resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-2 border-t border-[#E6E2D5] pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block font-semibold">
                    {locale === "en" ? "Academic/Artistic References Mapping" : "Mapeamento de Referências Acadêmicas/Artísticas"}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditReferences([...editReferences, { title: "", artist: "", type: "textual", description: "" }]);
                    }}
                    className="text-[10px] font-mono text-stone-600 hover:text-stone-900 border border-[#DDD9CE] hover:bg-stone-100 px-2.5 py-1 rounded cursor-pointer transition-colors"
                  >
                    + {locale === "en" ? "Add Reference" : "Adicionar Referência"}
                  </button>
                </div>

                {editReferences.length > 0 ? (
                  <div className="space-y-3.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                    {editReferences.map((ref, idx) => (
                      <div key={idx} className="bg-white border border-[#E6E2D5] p-3 rounded space-y-2 relative">
                        <button
                          type="button"
                          onClick={() => {
                            setEditReferences(editReferences.filter((_, i) => i !== idx));
                          }}
                          className="absolute top-1.5 right-1.5 text-stone-400 hover:text-red-600 cursor-pointer text-xs p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={ref.title}
                            onChange={(e) => {
                              const updated = [...editReferences];
                              updated[idx] = { ...ref, title: e.target.value };
                              setEditReferences(updated);
                            }}
                            placeholder={locale === "en" ? "Title / Artwork" : "Título / Obra"}
                            className="bg-[#FAF8F3]/50 border border-[#DDD9CE] rounded px-2 py-1 text-[11px] font-sans text-stone-800"
                          />
                          <input
                            type="text"
                            value={ref.artist || ""}
                            onChange={(e) => {
                              const updated = [...editReferences];
                              updated[idx] = { ...ref, artist: e.target.value };
                              setEditReferences(updated);
                            }}
                            placeholder={locale === "en" ? "Artist / Author" : "Artista / Autor"}
                            className="bg-[#FAF8F3]/50 border border-[#DDD9CE] rounded px-2 py-1 text-[11px] font-sans text-stone-800"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={ref.type}
                            onChange={(e) => {
                              const updated = [...editReferences];
                              updated[idx] = { ...ref, type: e.target.value as any };
                              setEditReferences(updated);
                            }}
                            className="bg-[#FAF8F3]/50 border border-[#DDD9CE] rounded px-2 py-1 text-[10px] font-mono text-stone-700"
                          >
                            <option value="textual">{locale === "en" ? "Textual" : "Texto"}</option>
                            <option value="visual">{locale === "en" ? "Visual" : "Visual"}</option>
                            <option value="auditory">{locale === "en" ? "Auditory" : "Sonoro"}</option>
                            <option value="conceptual">{locale === "en" ? "Conceptual" : "Conceitual"}</option>
                          </select>
                          <input
                            type="text"
                            value={ref.description || ""}
                            onChange={(e) => {
                              const updated = [...editReferences];
                              updated[idx] = { ...ref, description: e.target.value };
                              setEditReferences(updated);
                            }}
                            placeholder={locale === "en" ? "Contextual annotation / mapping" : "Anotação contextual / mapeamento"}
                            className="col-span-2 bg-[#FAF8F3]/50 border border-[#DDD9CE] rounded px-2 py-1 text-[11px] font-sans text-stone-800"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] font-mono text-stone-400 border border-dashed border-[#DDD9CE] p-3 rounded text-center">
                    {locale === "en" ? "No references mapped yet." : "Nenhuma referência mapeada ainda."}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E6E2D5] flex justify-end gap-3 font-mono text-xs mt-auto">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-[#DDD9CE] hover:bg-stone-50 rounded cursor-pointer text-stone-600 transition-colors"
              >
                {locale === "en" ? "Cancel" : "Cancelar"}
              </button>
              <button
                type="button"
                onClick={handleSaveConceptEdit}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-850 text-white uppercase tracking-wider font-bold rounded cursor-pointer transition-colors"
              >
                {locale === "en" ? "Save Changes" : "Salvar Alterações"}
              </button>
            </div>
          </div>
        ) : activeConcept ? (
          /* ACTIVE CONCEPT DETAIL */
          <div className="flex flex-col h-full justify-between overflow-hidden">
            <div className="space-y-5 overflow-y-auto flex-1 pr-2 custom-scrollbar animate-fadeIn">
              <div className="flex items-start justify-between border-b border-[#E6E2D5] pb-3">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-stone-950 flex items-center gap-2 tracking-tight">
                    {activeConcept.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-mono text-stone-450 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-stone-400" />
                      {locale === "en" ? "Seeded:" : "Semeado em:"} {new Date(activeConcept.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "pt-BR")}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setActiveMenuConceptId(activeMenuConceptId === activeConcept.id ? null : activeConcept.id)}
                    title="Menu"
                    className="p-1.5 rounded hover:bg-[#EFECE6] border border-transparent hover:border-[#DDD9CE] text-stone-600 hover:text-stone-900 cursor-pointer transition-all"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {activeMenuConceptId === activeConcept.id && (
                    <div className="absolute right-0 mt-1 w-32 bg-white border border-[#E6E2D5] rounded shadow-md z-10 font-mono text-[10px] uppercase tracking-wider text-left">
                      <button
                        onClick={() => handleTriggerEditConcept(activeConcept)}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#FAF8F3] text-stone-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-stone-400" />
                        <span>{locale === "en" ? "Edit" : "Editar"}</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowDeleteConfirmConcept(activeConcept);
                          setActiveMenuConceptId(null);
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

              {/* Status and Action Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FAF8F3]/50 p-4 border border-[#E6E2D5] rounded">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-stone-450 block">
                    {locale === "en" ? "Development Stage" : "Estágio de Desenvolvimento"}
                  </span>
                  <div className="flex gap-1.5">
                    {(["seed", "growing", "mature"] as const).map((stage) => {
                      const isCurrent = activeConcept.status === stage;
                      const activeStageColors = {
                        seed: "bg-[#EFECE6] border-[#DDD9CE] text-stone-800 font-bold",
                        growing: "bg-[#EFECE6] border-[#DDD9CE] text-stone-850 font-bold",
                        mature: "bg-white border-[#DDD9CE] text-stone-900 font-bold",
                      };
                      const getStageLabel = (st: "seed" | "growing" | "mature") => {
                        if (locale === "pt") {
                          if (st === "seed") return "semente";
                          if (st === "growing") return "cultivo";
                          if (st === "mature") return "maduro";
                        }
                        return st;
                      };
                      return (
                        <button
                          key={stage}
                          onClick={() => handleStatusChange(stage)}
                          className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                            isCurrent
                              ? activeStageColors[stage]
                              : "bg-white border-[#E6E2D5] text-stone-500 hover:text-stone-800 hover:border-stone-400"
                          }`}
                        >
                          {getStageLabel(stage)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col justify-center items-start md:items-end">
                  <button
                    onClick={() => triggerExplore(activeConcept)}
                    className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white font-mono text-xs font-bold rounded cursor-pointer transition-all shadow-xs"
                  >
                    <Sparkles className="w-4 h-4 text-stone-200" />
                    <span>
                      {activeConcept.questions.length === 0
                        ? (locale === "en" ? "Explore with MyArtNotes AI" : "Explorar com IA MyArtNotes")
                        : (locale === "en" ? "Re-explore Concept" : "Reexplorar Conceito")}
                    </span>
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Concepts / Description */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-stone-450 block">
                  {locale === "en" ? "Concept Frame" : "Enquadramento do Conceito"}
                </span>
                <p className="text-stone-900 font-serif leading-relaxed text-[15px] md:text-[16px] bg-white p-5 border border-[#E6E2D5] rounded tracking-wide">
                  {activeConcept.description || (locale === "en" ? "Provide an initial description to begin exploration." : "Forneça uma descrição inicial para começar a exploração.")}
                </p>
              </div>

              {/* AI Exploration Metadata */}
              {activeConcept.questions.length > 0 && (
                <div className="space-y-5 pt-1">
                  {/* Sensory Associations */}
                  {activeConcept.associations && activeConcept.associations.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-stone-450 block">
                        {locale === "en" ? "Material & Sensory Associations" : "Associações Materiais e Sensoriais"}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {activeConcept.associations.map((assoc, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#FAF8F3] border border-[#DDD9CE] text-xs font-mono text-stone-850"
                          >
                            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                            {assoc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Questions */}
                  {activeConcept.questions && activeConcept.questions.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-stone-450 block">
                        {locale === "en" ? "Open Queries for the Studio" : "Perguntas Abertas para o Ateliê"}
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeConcept.questions.map((q, idx) => (
                          <div
                            key={idx}
                            className="p-4 bg-white border border-[#E6E2D5] rounded flex gap-3 text-xs text-stone-800 leading-relaxed font-serif italic"
                          >
                            <HelpCircle className="w-4 h-4 text-stone-300 flex-shrink-0 mt-0.5" />
                            <span>{q}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* References */}
                  {activeConcept.references && activeConcept.references.length > 0 && (
                    <div className="space-y-2.5">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-stone-450 block">
                        {locale === "en" ? "Contextual Lineages & References" : "Linhagens e Referências Contextuais"}
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {activeConcept.references.map((ref, idx) => {
                          const getRefTypeLabel = (rt: string) => {
                            if (locale === "pt") {
                              if (rt.toLowerCase() === "artist") return "artista";
                              if (rt.toLowerCase() === "artwork") return "obra";
                              if (rt.toLowerCase() === "text") return "texto";
                              if (rt.toLowerCase() === "historical") return "histórico";
                            }
                            return rt;
                          };
                          return (
                            <div
                              key={idx}
                              className="p-4 bg-white border border-[#E6E2D5] rounded flex flex-col justify-between text-left"
                            >
                              <div>
                                <div className="flex justify-between items-start gap-1 mb-2">
                                  <span className="text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border border-[#DDD9CE] bg-[#FAF8F3] text-stone-500 font-bold">
                                    {getRefTypeLabel(ref.type)}
                                  </span>
                                  <Globe className="w-3.5 h-3.5 text-stone-300" />
                                </div>
                                <h4 className="text-xs font-mono font-bold text-stone-900 line-clamp-1 mb-0.5">
                                  {ref.title}
                                </h4>
                                <p className="text-[10px] font-mono text-stone-500 mb-2">
                                  {ref.artist}
                                </p>
                                <p className="text-xs text-stone-600 leading-relaxed font-sans line-clamp-3">
                                  {ref.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#E6E2D5] flex justify-between items-center text-stone-450 font-mono text-[9px] uppercase tracking-widest">
              <span>{locale === "en" ? "Concept Lineages" : "Linhagens de Conceitos"}</span>
              <span>{locale === "en" ? "MyArtNotes Companion" : "Acompanhante MyArtNotes"}</span>
            </div>
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Compass className="w-10 h-10 text-stone-400 mb-3 animate-pulse" />
            <p className="text-stone-800 font-mono text-xs font-bold uppercase tracking-wider mb-1">
              {locale === "en" ? "Notebook is quiet" : "O caderno está silencioso"}
            </p>
            <p className="text-stone-500 font-sans text-xs max-w-sm mb-3 leading-relaxed">
              {locale === "en"
                ? "A concept seed is a theoretical or aesthetic thread that anchors your work. Seeding concepts allows you to map material associations, isolate key queries, and identify artistic lineages."
                : "Uma semente conceitual é uma linha teórica ou estética que ancora o seu fazer. Semear conceitos permite que você mapeie associações materiais, isole dúvidas cruciais e identifique linhagens artísticas."}
            </p>
            <p className="text-xs text-stone-900 font-mono uppercase tracking-wider font-semibold mb-5">
              {locale === "en"
                ? "What to do next: Select a seeded concept from the left list, or click below to seed your first conceptual thread."
                : "Próximo passo: Selecione um conceito semeado na lista à esquerda, ou clique abaixo para semear sua primeira linha conceitual."}
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white font-mono text-[10px] uppercase tracking-wider font-bold rounded cursor-pointer transition-colors shadow-xs"
            >
              {locale === "en" ? "Seed First Concept" : "Semear Primeiro Conceito"}
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmConcept && (
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
                  ? `Are you sure you want to permanently delete "${showDeleteConfirmConcept.name}"? This action is irreversible.`
                  : `Tem certeza de que deseja excluir permanentemente "${showDeleteConfirmConcept.name}"? Esta ação é irreversível.`}
              </p>
            </div>

            <div className="p-6 pt-3 border-t border-[#E6E2D5]/50 flex justify-end gap-3 font-mono text-xs flex-shrink-0 bg-stone-50/50">
              <button
                onClick={() => setShowDeleteConfirmConcept(null)}
                className="px-3 py-1.5 border border-[#DDD9CE] hover:bg-white text-stone-600 rounded cursor-pointer transition-colors"
              >
                {locale === "en" ? "Cancel" : "Cancelar"}
              </button>
              <button
                onClick={() => {
                  onDeleteConcept(showDeleteConfirmConcept.id);
                  setActiveConceptId(concepts.length > 0 ? concepts.find(c => c.id !== showDeleteConfirmConcept.id)?.id || null : null);
                  setShowDeleteConfirmConcept(null);
                  setToastMessage(locale === "en" ? "Concept deleted successfully" : "Conceito excluído com sucesso");
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
