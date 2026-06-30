import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, HelpCircle } from "lucide-react";
import { useTranslation } from "../lib/i18n";

export type PopoverModuleId =
  | "home"
  | "journal"
  | "lab"
  | "concept"
  | "map"
  | "timeline"
  | "insights"
  | "export"
  | "productions"
  | "portfolio"
  | "admin";

interface InfoPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: PopoverModuleId;
  triggerEl: HTMLButtonElement | null;
}

const helpContent = {
  pt: {
    home: {
      title: "Caderno de Ateliê",
      what: "O Caderno de Ateliê (Início) é o seu espaço central para visualizar seus cadernos ativos, acompanhar atividades recentes e gerenciar sua pesquisa artística.",
      why: "Ele fornece uma visão holística de seu processo criativo e permite alternar facilmente entre diferentes projetos de pesquisa.",
      next: "Selecione um caderno existente para continuar seu processo, ou crie um novo para iniciar uma nova linha de pesquisa."
    },
    journal: {
      title: "Diário de Ateliê",
      what: "O Diário é onde você documenta o seu processo artístico de maneira livre e contínua.",
      why: "Registre experimentos, descobertas, observações, dúvidas, testes, falhas e avanços. O objetivo não é produzir textos acadêmicos ou finais, mas capturar a jornada do ateliê.",
      next: "Sempre que estiver no ateliê, iniciando ou concluindo uma sessão de trabalho, faça um novo registro de sua prática."
    },
    lab: {
      title: "Laboratório de Conceitos",
      what: "O Laboratório é o espaço para semear, germinar e refinar seus conceitos e inquirições estéticas.",
      why: "Diferente do Diário, que registra acontecimentos cronológicos, o Lab estrutura sua investigação conceitual. Use-o para documentar o núcleo temático de sua pesquisa.",
      next: "Crie um conceito para nomear um tema ou indagação persistente, em seguida liste perguntas abertas e referências."
    },
    concept: {
      title: "O que é um Conceito?",
      what: "Um conceito é uma ideia aglutinadora fundamental que se repete e ganha corpo ao longo da sua produção.",
      why: "Conceitos servem para organizar sua reflexão crítica e encontrar conexões inesperadas entre materiais e poéticas distintas.",
      next: "Quando um fenômeno, material ou indagação persistente exigir um nome, crie um espaço dedicado para sua germinação."
    },
    map: {
      title: "Mapa de Conceitos",
      what: "O Mapa visualiza espacialmente as interconexões lógicas e poéticas entre seus conceitos ativos.",
      why: "Ao traçar fios entre ideias isoladas, você revela padrões subterrâneos, contradições produtivas e novos caminhos de pesquisa.",
      next: "Estabeleça linhas de conexão entre os conceitos do seu mapa e formule uma justificativa poética para cada ligação."
    },
    timeline: {
      title: "Linha do Tempo",
      what: "A Linha do Tempo organiza cronologicamente toda a memória da sua pesquisa.",
      why: "Ela agrupa seus diários e sementes conceituais em uma esteira temporal contínua, permitindo-lhe ver como seus interesses amadureceram ou mudaram de direção.",
      next: "Reveja sua linha do tempo histórica periodicamente para reatar fios perdidos de práticas passadas."
    },
    insights: {
      title: "Reflexões",
      what: "Reflexões analisam todo o seu arquivo de pesquisa para identificar afinidades e provocar novos pontos de vista.",
      why: "O assistente de IA cruza os dados do seu diário com seus conceitos para sugerir padrões de materiais, leituras contextuais e inquirições abertas.",
      next: "Gere reflexões profundas baseadas em seus registros mais recentes para provocar novos desdobramentos de ateliê."
    },
    export: {
      title: "Módulo de Exportação",
      what: "Este módulo transforma sua pesquisa artística em documentos organizados que podem ser arquivados, apresentados, compartilhados ou submetidos a exposições, bolsas e contextos acadêmicos.",
      why: "A pesquisa torna-se mais valiosa quando também pode ser comunicada claramente. A exportação permite que seu processo criativo se torne parte de sua documentação profissional.",
      next: "Continue documentando seu caderno de pesquisa. Quando tiver material suficiente, escolha um formato de exportação e gere seu documento."
    },
    portfolio: {
      title: "Portfolio Builder",
      what: "O Portfolio Builder ajuda a transformar sua pesquisa artística em um portfólio selecionado. Em vez de começar do zero, ele permite que seu portfólio surja naturalmente do processo criativo já documentado dentro do MyArtNotes.",
      why: "Um portfólio forte é mais do que uma coleção de trabalhos concluídos. Ele revela o pensamento, a experimentação e a pesquisa por trás de sua prática artística.",
      next: "Selecione registros de diário, conceitos e materiais de pesquisa de seu caderno e comece a curadoria de seu portfólio."
    },
    productions: {
      title: "Catálogo de Obras",
      what: "O Catálogo de Obras (Produções) é onde você registra os trabalhos finalizados ou em andamento criados a partir do seu caderno de pesquisa.",
      why: "A obra de arte finalizada não está separada da pesquisa artística; ela é uma das manifestações físicas e poéticas dessa investigação contínua.",
      next: "Registre os trabalhos concluídos ou em andamento, detalhando o título, imagem, técnica, suporte, dimensões e notas críticas."
    },
    admin: {
      title: "Área Administrativa",
      what: "Ambiente reservado para gestão técnica e controle de acesso da plataforma MyArtNotes.",
      why: "Utilizado pelos administradores para acompanhar as métricas de uso anonimizadas e atribuir privilégios de administrador a outros artistas.",
      next: "Gerencie acessos de administrador ou revise as métricas de uso anônimas com segurança."
    }
  },
  en: {
    home: {
      title: "Atelier Notebook",
      what: "The Atelier Notebook (Home) is your central space to view your active notebooks, track recent activity, and manage your artistic research.",
      why: "It provides a holistic overview of your creative process and allows you to easily switch between different research projects.",
      next: "Select an existing notebook to continue your process, or create a new one to begin a new line of research."
    },
    journal: {
      title: "Studio Journal",
      what: "The Journal is where you document your artistic process in a freeform, continuous manner.",
      why: "Record experiments, discoveries, observations, doubts, tests, failures, and breakthroughs. The goal is not to produce final academic papers, but to capture the raw daily workflow.",
      next: "Whenever you are in the studio, starting or concluding a work session, make a new log of your practice."
    },
    lab: {
      title: "Concept Laboratory",
      what: "The Lab is where you seed, germinate, and refine your aesthetic concepts and research inquiries.",
      why: "Unlike the Journal, which tracks chronological events, the Lab structures your conceptual inquiry. Use it to document the core thematic focus of your practice.",
      next: "Create a concept to name a persistent theme or question, then list open questions and references."
    },
    concept: {
      title: "What is a Concept?",
      what: "A concept is a fundamental organizing idea that recurs and gains depth throughout your artistic practice.",
      why: "Concepts help organize critical reflection and reveal unexpected links between different materials and poetics.",
      next: "When a persistent phenomenon, material, or inquiry demands a name, create a dedicated space for its germination."
    },
    map: {
      title: "Concept Map",
      what: "The Concept Map spatially visualizes the logical and poetic interconnections between your active concepts.",
      why: "By tracing links between isolated thoughts, you uncover underlying patterns, productive tensions, and new paths of research.",
      next: "Establish connection lines between concepts in your map and formulate a poetic rationale for each connection."
    },
    timeline: {
      title: "Timeline",
      what: "The Timeline chronologically organizes the entire memory of your research.",
      why: "It layers your journal entries and concept seeds onto a single continuous calendar track, allowing you to observe how your studio interests matured.",
      next: "Review your historical timeline periodically to reconnect lost threads of past practices."
    },
    insights: {
      title: "Reflections",
      what: "Reflections analyze your research archive to discover hidden affinities and prompt new perspectives.",
      why: "The AI assistant synthesizes your journal logs and concepts to suggest material patterns, contextual reading links, and open-ended studio inquiries.",
      next: "Generate deep reflections based on your latest records to provoke new studio developments."
    },
    export: {
      title: "Export Module",
      what: "This module transforms your artistic research into organized documents that can be archived, presented, shared or submitted to exhibitions, grants and academic contexts.",
      why: "Research becomes more valuable when it can also be communicated clearly. Exporting allows your creative process to become part of your professional documentation.",
      next: "Continue documenting your research notebook. When you have enough material, choose an export format and generate your document."
    },
    portfolio: {
      title: "Portfolio Builder",
      what: "Portfolio Builder helps transform your artistic research into a curated portfolio. Instead of starting from scratch, it allows your portfolio to emerge naturally from the creative process already documented inside MyArtNotes.",
      why: "A strong portfolio is more than a collection of finished works. It reveals the thinking, experimentation and research behind your artistic practice.",
      next: "Select journal entries, concepts and research materials from your notebook and begin curating your portfolio."
    },
    productions: {
      title: "Artwork Catalog",
      what: "The Artwork Catalog (Productions) is where you register the finished or in-progress works created as a manifestation of your research.",
      why: "The finished artwork is not separate from the artistic research; it is one of the physical and poetic manifestations of this ongoing investigation.",
      next: "Register the finished or evolving works, detailing the title, image, technique, support, dimensions, and critical notes."
    },
    admin: {
      title: "Admin Area",
      what: "An environment reserved for technical management and access control of the MyArtNotes platform.",
      why: "Used by administrators to monitor anonymous usage metrics and grant administrative access to other artists.",
      next: "Manage administrative access or review anonymous usage metrics safely."
    }
  }
};

export default function InfoPopover({ isOpen, onClose, moduleId, triggerEl }: InfoPopoverProps) {
  const { locale } = useTranslation();
  const [coords, setCoords] = React.useState<{ top: number; left: number; placement: "top" | "bottom" }>({
    top: 0,
    left: 0,
    placement: "bottom"
  });

  // Dynamically calculate coordinate positions relative to the trigger element
  React.useEffect(() => {
    if (!isOpen || !triggerEl) return;

    const updatePosition = () => {
      const rect = triggerEl.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const popoverWidth = 320; // Exact identical width limits
      const padding = 12;

      // Calculate horizontal center
      const centerX = rect.left + rect.width / 2;
      let left = centerX - popoverWidth / 2;

      // Ensure popover does not bleed past viewport edges
      if (left < padding) {
        left = padding;
      } else if (left + popoverWidth > viewportWidth - padding) {
        left = viewportWidth - padding - popoverWidth;
      }

      // Check vertical space
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      let placement: "top" | "bottom" = "bottom";
      if (spaceBelow < 280 && spaceAbove > spaceBelow) {
        placement = "top";
      }

      let top = 0;
      if (placement === "bottom") {
        top = rect.bottom + window.scrollY + 8;
      } else {
        top = rect.top + window.scrollY - 8;
      }

      setCoords({ top, left, placement });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [isOpen, triggerEl]);

  // Keyboard accessibility and click-outside handler
  React.useEffect(() => {
    if (!isOpen || !triggerEl) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleOutsideClick = (e: MouseEvent) => {
      const popoverEl = document.getElementById("info-popover-card");
      if (
        popoverEl &&
        !popoverEl.contains(e.target as Node) &&
        !triggerEl.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleOutsideClick);

    // Track active element to restore focus after popover closes
    const previousActiveEl = document.activeElement as HTMLElement;

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleOutsideClick);
      if (previousActiveEl && typeof previousActiveEl.focus === "function") {
        previousActiveEl.focus();
      }
    };
  }, [isOpen, onClose, triggerEl]);

  if (!isOpen) return null;

  const content = helpContent[locale]?.[moduleId] || helpContent["en"][moduleId];

  const popoverElement = (
    <AnimatePresence>
      <div className="absolute inset-0 pointer-events-none z-[99999]" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        <motion.div
          id="info-popover-card"
          initial={{ opacity: 0, scale: 0.95, y: coords.placement === "bottom" ? -8 : 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            top: coords.top,
            left: coords.left,
            position: "absolute",
            transform: coords.placement === "top" ? "translateY(-100%)" : "none"
          }}
          className="bg-[#FAF8F3] border border-[#E6E2D5] rounded shadow-xl p-5 text-stone-750 font-sans z-[99999] w-80 pointer-events-auto flex flex-col gap-4 text-xs leading-relaxed"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#E6E2D5] pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-stone-100 rounded text-stone-800 shrink-0">
                <HelpCircle className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-serif font-bold text-stone-900 uppercase tracking-wider leading-none">
                  {content.title}
                </h3>
                <p className="text-[8px] font-mono text-stone-400 uppercase tracking-widest mt-1 leading-none">
                  {locale === "en" ? "Contextual Guide" : "Guia de Contexto"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-900 transition-colors p-0.5 cursor-pointer"
              aria-label="Close help popover"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex flex-col gap-4 text-stone-700">
            {/* Section 1: What is this? */}
            <div className="space-y-1">
              <h4 className="text-[9px] font-mono font-bold text-stone-900 uppercase tracking-wider">
                {locale === "en" ? "What is this?" : "O que é isso?"}
              </h4>
              <p className="font-sans text-stone-600">{content.what}</p>
            </div>

            {/* Section 2: Why does it matter? */}
            <div className="space-y-1">
              <h4 className="text-[9px] font-mono font-bold text-stone-900 uppercase tracking-wider">
                {locale === "en" ? "Why does it matter?" : "Por que isso importa?"}
              </h4>
              <p className="font-sans text-stone-600">{content.why}</p>
            </div>

            {/* Section 3: Next step */}
            <div className="space-y-1">
              <h4 className="text-[9px] font-mono font-bold text-stone-900 uppercase tracking-wider">
                {locale === "en" ? "Next step" : "Próximo passo"}
              </h4>
              <p className="font-sans text-stone-600 font-medium italic">{content.next}</p>
            </div>
          </div>

          {/* Got it footer button */}
          <div className="border-t border-[#E6E2D5] pt-3 flex justify-end">
            <button
              onClick={onClose}
              className="px-3.5 py-1 bg-stone-900 hover:bg-stone-850 text-white font-mono text-[9px] uppercase tracking-wider rounded transition-colors cursor-pointer font-bold"
            >
              {locale === "en" ? "Got it" : "Entendido"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(popoverElement, document.body);
}
