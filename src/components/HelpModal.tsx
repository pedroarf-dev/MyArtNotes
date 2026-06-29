import React from "react";
import { X, HelpCircle } from "lucide-react";
import { useTranslation } from "../lib/i18n";

/**
 * PRODUCT LANGUAGE GUIDELINE (UX Principle):
 * 
 * - Interface Language: Uses verbs in navigation labels (Registrar, Investigar, Conectar, Acompanhar, Refletir)
 *   to make actions direct and intuitive.
 * - Methodology Language: Uses rich artistic research terminology in help and module views 
 *   (Diário de Ateliê, Laboratório, Mapa de Conceitos, Linha do Tempo, Reflexões)
 *   to teach and preserve the artistic methodology.
 * 
 * Future contributors must maintain this clear distinction.
 */

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: "journal" | "lab" | "concept" | "map" | "timeline" | "insights" | "admin";
}

const helpContent = {
  pt: {
    journal: {
      title: "Diário de Ateliê",
      what: "O Diário é onde você documenta o seu processo artístico de maneira livre e contínua.",
      why: "Registre experimentos, descobertas, observações, dúvidas, testes, falhas e avanços. O objetivo não é produzir textos acadêmicos ou finais, mas capturar a jornada crua do ateliê.",
      when: "Sempre que estiver no ateliê, iniciando ou concluindo uma sessão de trabalho, ou ao vivenciar acidentes materiais e insights práticos durante o fazer.",
      example: "“Hoje testei a oxidação por ferrugem em chamas de metal e percebi variações cromáticas inesperadas com a umidade da noite.”"
    },
    lab: {
      title: "Laboratório de Conceitos",
      what: "O Laboratório é o espaço para semear, germinar e refinar seus conceitos e inquirições estéticas.",
      why: "Diferente do Diário, que registra acontecimentos cronológicos, o Lab estrutura sua investigação conceitual. Use-o para documentar o núcleo temático de sua pesquisa.",
      when: "Ao identificar ideias recorrentes, linhagens históricas ou questões poéticas que guiam sua produção e precisam de contorno conceitual sustentado.",
      example: "Conceito: Estética da Impermanência\nInquirição: Como documentar a mudança sem congelá-la?"
    },
    concept: {
      title: "O que é um Conceito?",
      what: "Um conceito é uma ideia aglutinadora fundamental que se repete e ganha corpo ao longo da sua produção.",
      why: "Conceitos servem para organizar sua reflexão crítica e encontrar conexões inesperadas entre materiais e poéticas distintas.",
      when: "Quando um fenômeno, material ou indagação persistente exigir um nome e um espaço dedicado de germinação em sua pesquisa.",
      example: "Exemplos comuns: Ruína urbana, Tempo entópico, Memória vegetal, Corpo-arquivo."
    },
    map: {
      title: "Mapa de Conceitos",
      what: "O Mapa visualiza espacialmente as interconexões lógicas e poéticas entre seus conceitos ativos.",
      why: "Ao traçar fios entre ideias isoladas, você revela padrões subterrâneos, contradições produtivas e novos caminhos de pesquisa.",
      when: "Para enxergar constelações de sentido, compreender como suas frentes de trabalho se cruzam e revelar afinidades formais invisíveis a olho nu.",
      example: "Conectar 'Impermanência' ao conceito de 'Pátina' justificando: “A pátina é a manifestação física visível da impermanência material.”"
    },
    timeline: {
      title: "Linha do Tempo",
      what: "A Linha do Tempo organiza cronologicamente toda a memória da sua pesquisa.",
      why: "Ela agrupa seus diários e sementes conceituais em uma esteira temporal contínua, permitindo-lhe ver como seus interesses amadureceram ou mudaram de direção.",
      when: "Para rever o ritmo do seu fazer, mapear a evolução cronológica de seus conceitos e reatar fios perdidos de práticas passadas.",
      example: "Visualizar que seus experimentos com argila começaram exatamente após a conceituação da 'Morfologia da Terra' em março."
    },
    insights: {
      title: "Reflexões",
      what: "Reflexões analisam todo o seu arquivo de pesquisa para identificar afinidades e provocar novos pontos de vista.",
      why: "O assistente de IA cruza os dados do seu diário com seus conceitos para sugerir padrões de materiais, leituras contextuais e inquirições abertas.",
      when: "Em momentos de pausa no fazer físico ou na escrita, quando precisar de um interlocutor crítico para provocar novos desdobramentos de ateliê.",
      example: "Identificar que você usa a palavra 'oxidação' e sugerir referências de Land Art que trabalham com a deterioração natural."
    },
    admin: {
      title: "Área Administrativa",
      what: "Ambiente reservado para gestão técnica e controle de acesso da plataforma MyArtNotes.",
      why: "Utilizado pelos administradores para acompanhar as métricas de uso anonimizadas e atribuir privilégios de administrador a outros artistas.",
      when: "Sempre que for necessário auditar métricas de engajamento dos artistas na plataforma ou gerenciar acessos de administrador.",
      example: "Conceder a função de administrador a um novo endereço de e-mail institucional."
    }
  },
  en: {
    journal: {
      title: "Studio Journal",
      what: "The Journal is where you document your artistic process in a freeform, continuous manner.",
      why: "Record experiments, discoveries, observations, doubts, tests, failures, and breakthroughs. The goal is not to produce final academic papers, but to capture the raw daily workflow.",
      when: "Whenever you are in the studio, starting or concluding a work session, or experiencing material accidents and practical insights during the process.",
      example: "“Today I tested rust oxidation on metal sheets and noticed unexpected chromatic variations due to overnight humidity.”"
    },
    lab: {
      title: "Concept Laboratory",
      what: "The Lab is where you seed, germinate, and refine your aesthetic concepts and research inquiries.",
      why: "Unlike the Journal, which tracks chronological events, the Lab structures your conceptual inquiry. Use it to document the core thematic focus of your practice.",
      when: "When you identify recurring ideas, historical lineages, or poetic questions that guide your production and require sustained conceptual contouring.",
      example: "Concept: Aesthetics of Impermanence\nInquiry: How to document change without freezing it?"
    },
    concept: {
      title: "What is a Concept?",
      what: "A concept is a fundamental organizing idea that recurs and gains depth throughout your artistic practice.",
      why: "Concepts help organize critical reflection and reveal unexpected links between different materials and poetics.",
      when: "When a persistent phenomenon, material, or inquiry demands a name and a dedicated space for germination in your research.",
      example: "Common examples: Urban ruins, Entropic time, Plant memory, Archive-body."
    },
    map: {
      title: "Concept Map",
      what: "The Concept Map spatially visualizes the logical and poetic interconnections between your active concepts.",
      why: "By tracing links between isolated thoughts, you uncover underlying patterns, productive tensions, and new paths of research.",
      when: "To see constellations of meaning, understand how your different workflows intersect, and reveal formal affinities invisible to the naked eye.",
      example: "Connecting 'Impermanence' to 'Patina' with the rationale: “Patina is the visible physical manifestation of material impermanence.”"
    },
    timeline: {
      title: "Timeline",
      what: "The Timeline chronologically organizes the entire memory of your research.",
      why: "It layers your journal entries and concept seeds onto a single continuous calendar track, allowing you to observe how your studio interests matured.",
      when: "To review the rhythm of your making, map the chronological evolution of your concepts, and reconnect lost threads of past practices.",
      example: "Reviewing that your clay experiments began exactly after conceptualizing 'Earth Morphology' back in March."
    },
    insights: {
      title: "Reflections",
      what: "Reflections analyze your research archive to discover hidden affinities and prompt new perspectives.",
      why: "The AI assistant synthesizes your journal logs and concepts to suggest material patterns, contextual reading links, and open-ended studio inquiries.",
      when: "During pauses in physical making or writing, when you need a critical interlocutor to provoke new studio developments.",
      example: "Detecting frequent mentions of 'oxidation' and suggesting references to Land Art pieces that employ natural decay."
    },
    admin: {
      title: "Admin Area",
      what: "An environment reserved for technical management and access control of the MyArtNotes platform.",
      why: "Used by administrators to monitor anonymous usage metrics and grant administrative access to other artists.",
      when: "Whenever it is necessary to audit artist engagement metrics on the platform or manage administrator access.",
      example: "Granting administrator privileges to a new artist email address."
    }
  }
};

export default function HelpModal({ isOpen, onClose, moduleId }: HelpModalProps) {
  const { locale } = useTranslation();
  if (!isOpen) return null;

  const content = helpContent[locale]?.[moduleId] || helpContent["en"][moduleId];

  return (
    <div className="fixed inset-0 bg-stone-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fadeIn">
      <div className="bg-[#FAF8F3] border border-[#E6E2D5] max-w-md w-full max-h-[90vh] rounded flex flex-col shadow-xl relative animate-scaleUp overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 transition-colors p-1 cursor-pointer z-10"
          aria-label="Close help"
          id="close-help-btn"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="p-6 pb-3 border-b border-[#E6E2D5] flex items-center gap-2.5 flex-shrink-0 pr-12 bg-stone-50/30">
          <div className="p-1.5 bg-stone-100 rounded text-stone-800 flex-shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-serif font-bold text-stone-900 uppercase tracking-wider">
              {content.title}
            </h3>
            <p className="text-[9px] font-mono text-stone-400 uppercase tracking-widest mt-0.5">
              {locale === "en" ? "Contextual Guide" : "Guia de Contexto"}
            </p>
          </div>
        </div>

        {/* Content body - Scrollable */}
        <div className="p-6 pt-3 pb-3 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs leading-relaxed text-stone-700 custom-scrollbar">
          {/* Section 1: What is it */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-mono font-bold text-stone-900 uppercase tracking-wider">
              {locale === "en" ? "What is it?" : "O que é?"}
            </h4>
            <p className="font-sans text-stone-600">{content.what}</p>
          </div>

          {/* Section 2: Why use it */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-mono font-bold text-stone-900 uppercase tracking-wider">
              {locale === "en" ? "Why use it?" : "Por que usar?"}
            </h4>
            <p className="font-sans text-stone-600">{content.why}</p>
          </div>

          {/* Section 3: When should I use it */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-mono font-bold text-stone-900 uppercase tracking-wider">
              {locale === "en" ? "When should I use it?" : "Quando usar?"}
            </h4>
            <p className="font-sans text-stone-600">{content.when}</p>
          </div>

          {/* Section 4: Practical example */}
          <div className="space-y-1.5 p-3 bg-stone-100/50 rounded border border-stone-200/60 font-mono text-[11px] text-stone-600 whitespace-pre-line leading-relaxed">
            <span className="text-[9px] font-bold text-stone-400 uppercase block tracking-wider mb-0.5">
              {locale === "en" ? "Example" : "Exemplo"}
            </span>
            {content.example}
          </div>
        </div>

        {/* Footer - Sticky */}
        <div className="p-6 pt-3 border-t border-[#E6E2D5] flex justify-end flex-shrink-0 bg-stone-50/50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-900 hover:bg-stone-850 text-white font-mono text-[10px] uppercase tracking-wider rounded transition-colors cursor-pointer font-bold"
          >
            {locale === "en" ? "Got it" : "Entendido"}
          </button>
        </div>
      </div>
    </div>
  );
}
