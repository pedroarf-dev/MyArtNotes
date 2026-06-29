import React, { useState, useMemo } from "react";
import { Concept } from "../types";
import { GitBranch, Link as LinkIcon, Plus, Eye, Check, AlertCircle, Edit3, Trash2 } from "lucide-react";
import { useTranslation } from "../lib/i18n";

interface MapModuleProps {
  concepts: Concept[];
  onUpdateConcept: (id: string, updatedFields: Partial<Concept>) => void;
}

export default function MapModule({ concepts, onUpdateConcept }: MapModuleProps) {
  const { t, locale } = useTranslation();
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    concepts.length > 0 ? concepts[0].id : null
  );

  // Connection form state
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [rationale, setRationale] = useState("");
  const [weaveError, setWeaveError] = useState("");
  const [weaveSuccess, setWeaveSuccess] = useState(false);

  // Connection editing state
  const [editingConnIndex, setEditingConnIndex] = useState<number | null>(null);
  const [editRationaleText, setEditRationaleText] = useState("");

  // Stage dimensions
  const width = 600;
  const height = 400;

  // Group concepts by status
  const seeds = useMemo(() => concepts.filter((c) => c.status === "seed"), [concepts]);
  const growing = useMemo(() => concepts.filter((c) => c.status === "growing"), [concepts]);
  const mature = useMemo(() => concepts.filter((c) => c.status === "mature"), [concepts]);

  // Compute neat coordinates for each concept based on its stage column and index
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    
    const computeColumnY = (count: number, idx: number) => {
      if (count <= 1) return height / 2;
      return 60 + (idx * (height - 120)) / (count - 1);
    };

    seeds.forEach((c, idx) => {
      positions[c.id] = { x: 100, y: computeColumnY(seeds.length, idx) };
    });

    growing.forEach((c, idx) => {
      positions[c.id] = { x: 300, y: computeColumnY(growing.length, idx) };
    });

    mature.forEach((c, idx) => {
      positions[c.id] = { x: 500, y: computeColumnY(mature.length, idx) };
    });

    return positions;
  }, [seeds, growing, mature, height]);

  // Extract links
  const links = useMemo(() => {
    const list: {
      sourceId: string;
      sourceName: string;
      targetId: string;
      targetName: string;
      rationale: string;
    }[] = [];

    concepts.forEach((concept) => {
      if (concept.connections) {
        concept.connections.forEach((conn) => {
          const target = concepts.find((c) => c.id === conn.conceptId);
          if (target) {
            list.push({
              sourceId: concept.id,
              sourceName: concept.name,
              targetId: conn.conceptId,
              targetName: target.name,
              rationale: conn.rationale,
            });
          }
        });
      }
    });
    return list;
  }, [concepts]);

  const handleWeave = (e: React.FormEvent) => {
    e.preventDefault();
    setWeaveError("");
    setWeaveSuccess(false);

    if (!sourceId || !targetId) {
      setWeaveError(locale === "en" ? "Select both concepts to link." : "Selecione ambos os conceitos para conectar.");
      return;
    }
    if (sourceId === targetId) {
      setWeaveError(locale === "en" ? "Cannot connect a concept to itself." : "Não é possível conectar um conceito a si mesmo.");
      return;
    }
    if (!rationale.trim()) {
      setWeaveError(locale === "en" ? "A connection description is required." : "Uma descrição de conexão é obrigatória.");
      return;
    }

    const sourceConcept = concepts.find((c) => c.id === sourceId);
    if (!sourceConcept) return;

    const alreadyConnected = sourceConcept.connections?.some((c) => c.conceptId === targetId);
    if (alreadyConnected) {
      setWeaveError(locale === "en" ? "These concepts are already connected." : "Estes conceitos já estão conectados.");
      return;
    }

    const updatedConnections = [
      ...(sourceConcept.connections || []),
      { conceptId: targetId, rationale },
    ];

    onUpdateConcept(sourceId, { connections: updatedConnections });

    setWeaveSuccess(true);
    setRationale("");
    setSourceId("");
    setTargetId("");

    setTimeout(() => {
      setWeaveSuccess(false);
    }, 3000);
  };

  const selectedConcept = concepts.find((c) => c.id === selectedNodeId);
  const highlightConceptId = hoveredNodeId || selectedNodeId;

  const connectedConceptIds = useMemo(() => {
    if (!highlightConceptId) return [];
    const active = concepts.find((c) => c.id === highlightConceptId);
    if (!active) return [];

    const ids = (active.connections || []).map((conn) => conn.conceptId);
    concepts.forEach((c) => {
      if (c.connections?.some((conn) => conn.conceptId === highlightConceptId)) {
        ids.push(c.id);
      }
    });

    return ids;
  }, [highlightConceptId, concepts]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-100px)] overflow-hidden">
      {/* Concept Map Canvas */}
      <div className="lg:col-span-7 flex flex-col h-full bg-[#FCFAF6] rounded border border-[#E6E2D5] p-5 relative overflow-hidden">
        <div className="flex justify-between items-center mb-4 z-10">
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-850">
              {locale === "en" ? "Concept Map" : "Mapa de Conceitos"}
            </h2>
            <p className="text-[10px] font-mono text-stone-500">
              {locale === "en"
                ? "Left click nodes to inspect. Highlight displays linked lineages."
                : "Clique com o botão esquerdo nos nós para inspecionar. O destaque exibe linhagens conectadas."}
            </p>
          </div>
          {concepts.length > 0 && (
            <div className="text-[9px] font-mono text-stone-500 bg-[#EFECE6] px-2 py-0.5 rounded border border-[#DDD9CE]">
              {concepts.length} {locale === "en" ? "Nodes" : "Nós"} • {links.length} {locale === "en" ? "Links" : "Conexões"}
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 w-full flex items-center justify-center relative bg-[#FAF8F3]/40 rounded border border-[#E6E2D5] p-2">
          {concepts.length === 0 ? (
            <div className="text-center py-16 font-mono text-xs text-stone-400">
              {locale === "en"
                ? "Create concepts in the Laboratory first to view map."
                : "Crie conceitos no Laboratório primeiro para visualizar o mapa."}
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full max-w-[550px] aspect-[4/3] select-none overflow-visible"
            >
              {/* Distinct Soft Columns */}
              {/* Seeds Column */}
              <rect x="15" y="35" width="170" height="345" rx="2" className="fill-[#FAF8F3]/30 stroke-[#E6E2D5]" />
              {/* Growing Column */}
              <rect x="215" y="35" width="170" height="345" rx="2" className="fill-[#FAF8F3]/50 stroke-[#E6E2D5]" />
              {/* Mature Column */}
              <rect x="415" y="35" width="170" height="345" rx="2" className="fill-white/30 stroke-[#E6E2D5]" />

              {/* Column labels */}
              <text x="100" y="24" textAnchor="middle" className="fill-stone-500 font-mono text-[10px] uppercase tracking-wider font-bold">
                {locale === "en" ? "1. Seeds" : "1. Sementes"}
              </text>
              <text x="300" y="24" textAnchor="middle" className="fill-stone-600 font-mono text-[10px] uppercase tracking-wider font-bold">
                {locale === "en" ? "2. Growing" : "2. Cultivo"}
              </text>
              <text x="500" y="24" textAnchor="middle" className="fill-stone-750 font-mono text-[10px] uppercase tracking-wider font-bold">
                {locale === "en" ? "3. Mature" : "3. Maduro"}
              </text>

              {/* Draw Connections */}
              {links.map((link, idx) => {
                const start = nodePositions[link.sourceId];
                const end = nodePositions[link.targetId];
                if (!start || !end) return null;

                const isHighlighted =
                  highlightConceptId === link.sourceId || highlightConceptId === link.targetId;

                return (
                  <g key={idx}>
                    {/* Shadow/Glow line for active connections */}
                    {isHighlighted && (
                      <line
                        x1={start.x}
                        y1={start.y}
                        x2={end.x}
                        y2={end.y}
                        stroke="#78716c"
                        strokeWidth="3"
                        strokeOpacity="0.1"
                      />
                    )}
                    <line
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke={isHighlighted ? "#44403c" : "#b0aba4"}
                      strokeWidth={isHighlighted ? 1.5 : 1}
                      strokeDasharray={isHighlighted ? "none" : "2,3"}
                      className="transition-all duration-200"
                    />
                  </g>
                );
              })}

              {/* Draw Nodes */}
              {concepts.map((concept) => {
                const pos = nodePositions[concept.id];
                if (!pos) return null;

                const isSelected = selectedNodeId === concept.id;
                const isHovered = hoveredNodeId === concept.id;
                const isConnected = connectedConceptIds.includes(concept.id);

                let nodeColor = "fill-white stroke-stone-400";
                if (isSelected) nodeColor = "fill-stone-900 stroke-stone-900";
                else if (isHovered) nodeColor = "fill-stone-700 stroke-stone-700";
                else if (isConnected) nodeColor = "fill-[#EFECE6] stroke-stone-500";

                return (
                  <g
                    key={concept.id}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredNodeId(concept.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    onClick={() => setSelectedNodeId(concept.id)}
                  >
                    {/* Ripple/Glow Circle behind selected node */}
                    {isSelected && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="12"
                        className="fill-stone-500/10 animate-pulse"
                      />
                    )}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isSelected ? 6 : isHovered ? 5.5 : 4.5}
                      className={`${nodeColor} transition-all duration-150 stroke-1`}
                    />
                    <text
                      x={pos.x}
                      y={pos.y - 11}
                      textAnchor="middle"
                      className={`font-mono text-[9px] uppercase tracking-wider select-none ${
                        isSelected
                          ? "fill-stone-950 font-bold"
                          : isHovered
                          ? "fill-stone-800"
                          : isConnected
                          ? "fill-stone-700"
                          : "fill-stone-450"
                      } transition-colors duration-150`}
                    >
                      {concept.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>

      {/* Connection Tool & Details Panel */}
      <div className="lg:col-span-5 flex flex-col h-full overflow-hidden space-y-4">
        
        {/* Link creation tool */}
        <div className="bg-[#FCFAF6] p-5 border border-[#E6E2D5] rounded">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-850 mb-2 flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-stone-500" />
            <span>{locale === "en" ? "Connect Concepts" : "Conectar Conceitos"}</span>
          </h3>
          <p className="text-[10px] font-sans text-stone-500 mb-3 leading-relaxed">
            {locale === "en"
              ? "Specify a relational bridge or lineage between two research vectors."
              : "Especifique uma ponte relacional ou linhagem entre dois vetores de pesquisa."}
          </p>

          <form onSubmit={handleWeave} className="space-y-3">
            {weaveError && (
              <div className="p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-[10px] font-sans text-red-700">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <span>{weaveError}</span>
              </div>
            )}

            {weaveSuccess && (
              <div className="p-2 bg-[#FAF8F3] border border-[#DDD9CE] rounded flex items-center gap-2 text-[10px] font-mono text-stone-700">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>{locale === "en" ? "Connection registered" : "Conexão registrada"}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-mono text-stone-450 block mb-1">
                  {locale === "en" ? "SOURCE CONCEPT" : "CONCEITO DE ORIGEM"}
                </label>
                <select
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full bg-white border border-[#DDD9CE] rounded px-2.5 py-1.5 text-xs font-sans text-stone-800 focus:outline-none focus:border-stone-500"
                >
                  <option value="">{locale === "en" ? "Select..." : "Selecionar..."}</option>
                  {concepts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-mono text-stone-450 block mb-1">
                  {locale === "en" ? "TARGET CONCEPT" : "CONCEITO DE DESTINO"}
                </label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full bg-white border border-[#DDD9CE] rounded px-2.5 py-1.5 text-xs font-sans text-stone-800 focus:outline-none focus:border-stone-500"
                >
                  <option value="">{locale === "en" ? "Select..." : "Selecionar..."}</option>
                  {concepts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-mono text-stone-450 block mb-1">
                {locale === "en" ? "CONNECTION RATIONALE" : "JUSTIFICATIVA DA CONEXÃO"}
              </label>
              <input
                type="text"
                placeholder={locale === "en" ? "e.g., Shares physical pigments / Overlaps in time..." : "ex: Compartilha pigmentos físicos / Se sobrepõe no tempo..."}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                className="w-full bg-white border border-[#DDD9CE] rounded px-3.5 py-1.5 text-xs font-sans text-stone-800 focus:outline-none focus:border-stone-500 placeholder-stone-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-stone-900 hover:bg-stone-850 text-white font-mono text-xs font-bold rounded cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{locale === "en" ? "Establish Link" : "Estabelecer Conexão"}</span>
            </button>
          </form>
        </div>

        {/* Selected node info */}
        <div className="flex-1 bg-[#FCFAF6] p-5 border border-[#E6E2D5] rounded overflow-y-auto custom-scrollbar">
          {selectedConcept ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-[#E6E2D5] pb-2">
                <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400">
                  {locale === "en" ? "Concept Information" : "Informações do Conceito"}
                </span>
                <h3 className="text-base font-serif font-bold text-stone-950 mt-0.5 tracking-tight">
                  {selectedConcept.name}
                </h3>
              </div>

              {selectedConcept.description && (
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-stone-450 uppercase tracking-widest block">
                    {locale === "en" ? "Description" : "Descrição"}
                  </span>
                  <p className="text-xs text-stone-850 font-serif leading-relaxed text-[13px]">
                    {selectedConcept.description}
                  </p>
                </div>
              )}

              {/* Connections list */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono text-stone-450 uppercase tracking-widest block">
                  {locale === "en" ? "Connections" : "Conexões"} ({selectedConcept.connections?.length || 0})
                </span>

                {selectedConcept.connections && selectedConcept.connections.length > 0 ? (
                  <div className="space-y-2">
                    {selectedConcept.connections.map((conn, index) => {
                      const target = concepts.find((c) => c.id === conn.conceptId);
                      const isEditingThis = editingConnIndex === index;

                      return target ? (
                        <div
                          key={index}
                          className="p-3 bg-white border border-[#E6E2D5] rounded text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-stone-800 font-mono text-[10px] font-bold">
                              <Eye className="w-3 h-3 text-stone-400" />
                              <span>{selectedConcept.name}</span>
                              <span className="text-stone-400 font-normal">➔</span>
                              <span>{target.name}</span>
                            </div>

                            {/* Connection Actions */}
                            {!isEditingThis && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingConnIndex(index);
                                    setEditRationaleText(conn.rationale);
                                  }}
                                  className="text-stone-400 hover:text-stone-800 transition-colors p-0.5 cursor-pointer"
                                  title={locale === "en" ? "Edit rationale" : "Editar justificativa"}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(locale === "en" ? "Delete this connection?" : "Excluir esta conexão?")) {
                                      const updatedConnections = selectedConcept.connections.filter((_, idx) => idx !== index);
                                      onUpdateConcept(selectedConcept.id, { connections: updatedConnections });
                                    }
                                  }}
                                  className="text-stone-400 hover:text-red-700 transition-colors p-0.5 cursor-pointer"
                                  title={locale === "en" ? "Delete connection" : "Excluir conexão"}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>

                          {isEditingThis ? (
                            <div className="space-y-1.5 pt-1">
                              <textarea
                                value={editRationaleText}
                                onChange={(e) => setEditRationaleText(e.target.value)}
                                rows={2}
                                className="w-full bg-stone-50 border border-[#DDD9CE] rounded p-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-500 font-sans"
                                placeholder={locale === "en" ? "Describe connection rationale..." : "Descreva a justificativa da conexão..."}
                              />
                              <div className="flex justify-end gap-1.5 font-mono text-[9px] uppercase">
                                <button
                                  onClick={() => setEditingConnIndex(null)}
                                  className="px-2 py-1 border border-[#DDD9CE] bg-white text-stone-500 rounded hover:text-stone-800 cursor-pointer"
                                >
                                  {locale === "en" ? "Cancel" : "Cancelar"}
                                </button>
                                <button
                                  onClick={() => {
                                    const updatedConnections = selectedConcept.connections.map((c, idx) =>
                                      idx === index ? { ...c, rationale: editRationaleText } : c
                                    );
                                    onUpdateConcept(selectedConcept.id, { connections: updatedConnections });
                                    setEditingConnIndex(null);
                                  }}
                                  className="px-2 py-1 bg-stone-900 text-white font-bold rounded hover:bg-stone-850 cursor-pointer"
                                >
                                  {locale === "en" ? "Save" : "Salvar"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-stone-600 leading-relaxed font-sans text-[11px]">
                              {conn.rationale}
                            </p>
                          )}
                        </div>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] font-mono text-stone-400 italic">
                    {locale === "en"
                      ? "No connected lineages specified yet. Use the connection tool above."
                      : "Nenhuma linhagem conectada especificada ainda. Use a ferramenta de conexão acima."}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <GitBranch className="w-8 h-8 text-stone-300 mb-2" />
              <p className="text-[11px] font-mono text-stone-440 uppercase tracking-widest">
                {locale === "en" ? "Select a concept node" : "Selecione um nó de conceito"}
              </p>
              <p className="text-[10px] text-stone-500 max-w-xs mt-1 leading-relaxed">
                {locale === "en"
                  ? "Click any circle on the concept stage to view active details and manage linkages."
                  : "Clique em qualquer círculo no campo de conceitos para ver detalhes ativos e gerenciar conexões."}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
