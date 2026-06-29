import { JournalEntry, Concept, Insight } from "../types";
import { auth } from "./firebase";

export interface ExportGeneratorContext {
  journalEntries: JournalEntry[];
  concepts: Concept[];
  insights: Insight[];
  userProfile?: any;
  language: "en" | "pt";
  t: any;
}

export interface ExportGenerator {
  id: string;
  name: string;
  description: string;
  purpose: string;
  whenToUse: string;
  estimatedTime: string;
  generate: (context: ExportGeneratorContext) => Promise<{ title: string; content: string }>;
}

class ExportEngine {
  private generators: Map<string, ExportGenerator> = new Map();

  registerGenerator(generator: ExportGenerator) {
    this.generators.set(generator.id, generator);
  }

  getGenerator(id: string): ExportGenerator | undefined {
    return this.generators.get(id);
  }

  getGenerators(): ExportGenerator[] {
    return Array.from(this.generators.values());
  }
}

export const exportEngineInstance = new ExportEngine();

// --- PDF COMPILER GENERATOR (Local compilation of all raw data) ---
const PdfGenerator: ExportGenerator = {
  id: "pdf",
  name: "PDF",
  description: "pdfCardDesc",
  purpose: "pdfPurpose",
  whenToUse: "pdfWhenToUse",
  estimatedTime: "pdfEstTime",
  generate: async (ctx) => {
    const { journalEntries, concepts, insights, userProfile, language } = ctx;
    const isEn = language === "en";
    
    let md = "";
    
    // Cover Page
    md += `# ${isEn ? "STUDIO RESEARCH NOTEBOOK" : "CADERNO DE PESQUISA DE ATELIÊ"}\n\n`;
    md += `**${isEn ? "Artist" : "Artista"}:** ${userProfile?.name || userProfile?.displayName || userProfile?.email || "MyArtNotes Artist"}\n\n`;
    if (userProfile?.bio) md += `**${isEn ? "Artist Bio" : "Biografia"}:** ${userProfile.bio}\n\n`;
    if (userProfile?.artisticArea) md += `**${isEn ? "Practice Area" : "Área de Atuação"}:** ${userProfile.artisticArea}\n\n`;
    if (userProfile?.website) md += `**Website:** ${userProfile.website}\n\n`;
    md += `**${isEn ? "Export Date" : "Data de Exportação"}:** ${new Date().toLocaleDateString(isEn ? "en-US" : "pt-BR")}\n\n`;
    md += `---\n\n`;
    
    // Table of Contents
    md += `## ${isEn ? "Table of Contents" : "Sumário"}\n\n`;
    md += `1. ${isEn ? "Core Concepts" : "Conceitos Fundamentais"} (${concepts.length})\n`;
    md += `2. ${isEn ? "Chronological Journal" : "Diário Cronológico"} (${journalEntries.length})\n`;
    md += `3. ${isEn ? "Synthetic Reflections" : "Reflexões Sintéticas"} (${insights.length})\n\n`;
    md += `---\n\n`;
    
    // 1. Concepts Section
    md += `## 1. ${isEn ? "Core Concepts" : "Conceitos Fundamentais"}\n\n`;
    if (concepts.length === 0) {
      md += `*${isEn ? "No concepts recorded." : "Nenhum conceito registrado."}*\n\n`;
    } else {
      concepts.forEach((c) => {
        md += `### ${c.name} \`[${c.status.toUpperCase()}]\`\n`;
        md += `**${isEn ? "Description" : "Descrição"}:** ${c.description || ""}\n\n`;
        if (c.associations && c.associations.length > 0) {
          md += `**${isEn ? "Associations" : "Associações"}:** ${c.associations.join(", ")}\n\n`;
        }
        if (c.questions && c.questions.length > 0) {
          md += `**${isEn ? "Inquiries" : "Inquirições"}:**\n`;
          c.questions.forEach((q) => {
            md += `- ${q}\n`;
          });
          md += `\n`;
        }
        if (c.references && c.references.length > 0) {
          md += `**${isEn ? "Contextual References" : "Referências Contextuais"}:**\n`;
          c.references.forEach((ref) => {
            md += `- *${ref.title}* by ${ref.artist} (${ref.type}) - ${ref.description}\n`;
          });
          md += `\n`;
        }
        md += `---\n\n`;
      });
    }
    
    // 2. Journal Entries Section
    md += `## 2. ${isEn ? "Chronological Journal" : "Diário Cronológico"}\n\n`;
    if (journalEntries.length === 0) {
      md += `*${isEn ? "No journal entries recorded." : "Nenhuma entrada de diário registrada."}*\n\n`;
    } else {
      journalEntries.forEach((j) => {
        md += `### ${j.title}\n`;
        md += `**${isEn ? "Date" : "Data"}:** ${new Date(j.createdAt).toLocaleDateString(isEn ? "en-US" : "pt-BR")}\n`;
        if (j.tags && j.tags.length > 0) {
          md += `**${isEn ? "Tags" : "Palavras-chave"}:** ${j.tags.join(", ")}\n`;
        }
        md += `\n${j.content}\n\n`;
        md += `---\n\n`;
      });
    }
    
    // 3. Insights / Reflections Section
    md += `## 3. ${isEn ? "Synthetic Reflections" : "Reflexões Sintéticas"}\n\n`;
    if (insights.length === 0) {
      md += `*${isEn ? "No synthetic reflections generated." : "Nenhuma reflexão sintética gerada."}*\n\n`;
    } else {
      insights.forEach((i, idx) => {
        md += `### ${isEn ? "Reflection" : "Reflexão"} #${insights.length - idx}\n`;
        md += `**${isEn ? "Date" : "Data"}:** ${new Date(i.createdAt).toLocaleDateString(isEn ? "en-US" : "pt-BR")}\n\n`;
        if (i.patterns && i.patterns.length > 0) {
          md += `**${isEn ? "Detected Patterns" : "Padrões Detectados"}:**\n`;
          i.patterns.forEach((p) => {
            md += `- **${p.title}**: ${p.description}\n`;
            if (p.evidence && p.evidence.length > 0) {
              md += `  *${isEn ? "Evidence" : "Evidências"}:* ${p.evidence.join("; ")}\n`;
            }
          });
          md += `\n`;
        }
        if (i.associations && i.associations.length > 0) {
          md += `**${isEn ? "Sensory Associations" : "Associações Sensoriais"}:** ${i.associations.join(", ")}\n\n`;
        }
        if (i.questions && i.questions.length > 0) {
          md += `**${isEn ? "Open Inquiries" : "Inquirições em Aberto"}:**\n`;
          i.questions.forEach((q) => {
            md += `- ${q}\n`;
          });
          md += `\n`;
        }
        md += `---\n\n`;
      });
    }
    
    return {
      title: isEn ? "Complete Research Notebook" : "Caderno de Pesquisa Completo",
      content: md
    };
  }
};

// --- HELPER TO CREATE SERVER-SIDE GEMINI-POWERED DOCUMENT GENERATORS ---
const createServerSideGenerator = (
  id: string,
  name: string,
  description: string,
  purpose: string,
  whenToUse: string,
  estimatedTime: string
): ExportGenerator => ({
  id,
  name,
  description,
  purpose,
  whenToUse,
  estimatedTime,
  generate: async (ctx) => {
    const { journalEntries, concepts, insights, language } = ctx;
    
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("Unauthorized: User is not authenticated.");
    
    const res = await fetch("/api/exports/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        type: id,
        language,
        journalEntries,
        concepts,
        insights
      })
    });
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to compile ${name}.`);
    }
    
    return res.json();
  }
});

// Register strategies
exportEngineInstance.registerGenerator(PdfGenerator);
exportEngineInstance.registerGenerator(
  createServerSideGenerator(
    "memorial",
    "Memorial Descritivo",
    "memorialCardDesc",
    "memorialPurpose",
    "memorialWhenToUse",
    "memorialEstTime"
  )
);
exportEngineInstance.registerGenerator(
  createServerSideGenerator(
    "report",
    "Research Report",
    "reportCardDesc",
    "reportPurpose",
    "reportWhenToUse",
    "reportEstTime"
  )
);
exportEngineInstance.registerGenerator(
  createServerSideGenerator(
    "summary",
    "Research Summary",
    "summaryCardDesc",
    "summaryPurpose",
    "summaryWhenToUse",
    "summaryEstTime"
  )
);
