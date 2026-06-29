import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import * as admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Load Firebase configuration
const CONFIG_FILE = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig: any = {};
if (fs.existsSync(CONFIG_FILE)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  } catch (err) {
    console.error("Error reading firebase-applet-config.json:", err);
  }
}

// Initialize Firebase Admin SDK for backend auth token verification
if (firebaseConfig.projectId) {
  try {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
    console.log("Firebase Admin successfully initialized.");
  } catch (err) {
    console.error("Error initializing Firebase Admin:", err);
  }
}

// Initialize Gemini API Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Middleware to verify Firebase ID Token
const verifyFirebaseToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing authentication token." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error("Firebase Auth token verification failed:", err);
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token." });
  }
};

// ==================== LAB (CONCEPT EXPLORATION) ROUTE ====================

app.post("/api/concepts/explore", verifyFirebaseToken, async (req, res) => {
  const { conceptName, conceptDescription, existingConcepts, locale = "pt" } = req.body;

  if (!conceptName) {
    return res.status(400).json({ error: "Concept name is required." });
  }

  const otherConceptsPromptList = (existingConcepts || [])
    .map((c: any) => `- ${c.name}: ${c.description || "No description provided."}`)
    .join("\n");

  const prompt = `You are ATLAS, a minimal creative research tool for artistic process documentation and reflection.
You act as a clear, rigorous, and observant studio research assistant.
The artist wants to explore this concept:
Concept Name: "${conceptName}"
Description: "${conceptDescription || "None provided"}"

Provide an intellectual and sensory expansion of this concept.
Avoid generic business, marketing, or pseudo-scientific jargon.
Provide concrete material, physical, historical, and metaphorical associations.

If other concepts in the studio archive are listed below, identify potential direct, logical connections between the active concept ("${conceptName}") and them. Be specific and grounded in your connection rationale.
Other concepts currently in the archive:
${otherConceptsPromptList || "No other concepts in archive yet."}

CRITICAL LANGUAGE REQUIREMENT:
The user's active interface language is "${locale === "en" ? "English" : "Portuguese"}".
You MUST generate ALL text, titles, associations, descriptions, questions, and rationales in ${locale === "en" ? "English" : "Portuguese (Português)"}.
Even if the inputs are in another language, translate your generated responses to ${locale === "en" ? "English" : "Portuguese (Português)"} to match their notebook environment perfectly.

You must return a JSON response adhering exactly to the specified JSON schema.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are ATLAS, a creative research assistant for artists. You speak with a clear, observant, rigorous, and grounded tone. You avoid flowery, over-the-top, or pseudo-philosophical narrative systems. You offer concrete associations, open-ended research questions, and relevant artistic or historical references. All of your output fields MUST be entirely in ${locale === "en" ? "English" : "Portuguese (Português)"}.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["description", "associations", "questions", "references", "connections"],
          properties: {
            description: {
              type: Type.STRING,
              description: "A refined and grounded conceptual definition of this concept in relation to artistic practice (2-3 sentences)."
            },
            associations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "5-6 material, physical, sensory, or historical associations (e.g., 'pigment sedimentation', 'repetition in printmaking', 'analog noise')."
            },
            questions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 open-ended, rigorous studio research inquiries that prompt creative experimentation."
            },
            references: {
              type: Type.ARRAY,
              description: "3 real-world historical, literary, philosophical, or artistic references (artists, writers, filmmakers, compositions) that align with this concept.",
              items: {
                type: Type.OBJECT,
                required: ["title", "artist", "type", "description"],
                properties: {
                  title: { type: Type.STRING, description: "Title of the work or name of the concept." },
                  artist: { type: Type.STRING, description: "Artist, author, creator, or philosopher." },
                  type: { type: Type.STRING, description: "Medium or category (e.g., 'Sculpture', 'Performance', 'Literature')." },
                  description: { type: Type.STRING, description: "A clear description of why this reference is relevant to the active concept." }
                }
              }
            },
            connections: {
              type: Type.ARRAY,
              description: "Links to other concepts from the provided archive, if relevant. Use actual indices or names.",
              items: {
                type: Type.OBJECT,
                required: ["conceptId", "rationale"],
                properties: {
                  conceptId: { type: Type.STRING, description: "The ID or name of the connected concept from the archive." },
                  rationale: { type: Type.STRING, description: "A clear, grounded sentence explaining the relation between these two concepts." }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text from Gemini API.");
    }

    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (err) {
    console.error("Gemini Explore Concept Error:", err);
    res.status(500).json({ error: "Failed to generate AI concept reflections. Please check your Gemini API configuration." });
  }
});

// ==================== INSIGHTS ROUTE ====================

app.post("/api/insights/generate", verifyFirebaseToken, async (req, res) => {
  const { journalEntries, concepts, locale = "pt" } = req.body;

  if ((!journalEntries || journalEntries.length === 0) && (!concepts || concepts.length === 0)) {
    return res.status(400).json({ error: locale === "en" ? "Your studio archive is empty. Write a few journal entries or explore concepts first to generate insights." : "Seu arquivo de ateliê está vazio. Escreva alguns registros no diário ou explore conceitos primeiro para gerar reflexões." });
  }

  const journalText = (journalEntries || [])
    .map((j: any) => `[Entry "${j.title}" on ${j.createdAt}]:\n${j.content}\nTags: ${(j.tags || []).join(", ")}`)
    .join("\n\n");

  const conceptsText = (concepts || [])
    .map((c: any) => `[Concept "${c.name}"]: ${c.description}\nAssociations: ${(c.associations || []).join(", ")}`)
    .join("\n\n");

  const prompt = `You are ATLAS, a minimal creative research tool for artistic process documentation and reflection.
Analyze the user's ongoing studio journal logs and concepts to identify patterns, associations, and questions.

Review the journal entries:
${journalText || "No entries."}

And the concepts list:
${conceptsText || "No concepts."}

Task requirements for AI analysis:
1. Detect patterns: Identify 2-3 prominent thematic or process-oriented patterns running through the entries and concepts. Give each a clear, grounded name and support it with direct quotes/references as evidence.
2. Generate associations: Provide 5-6 practical material, sensory, or conceptual associations sparked by this material.
3. Suggest questions: Provide 4 open-ended, rigorous studio research questions that prompt further creative exploration.
4. Optionally suggest references: Suggest 2-3 relevant real-world artistic, historical, or literary references that support these detected patterns.

Provide a strict, clear, and objective report. Avoid poetic frameworks, narrative "creative seasons", or metaphysical systems.

CRITICAL LANGUAGE REQUIREMENT:
The user's active interface language is "${locale === "en" ? "English" : "Portuguese"}".
You MUST generate ALL text, titles, associations, descriptions, questions, evidence, and references in ${locale === "en" ? "English" : "Portuguese (Português)"}.
Translate any cited evidence (like quotes from journal entries) into ${locale === "en" ? "English" : "Portuguese (Português)"} if necessary to keep the generated response cohesive in that language.

You must return a JSON response adhering exactly to the specified JSON schema.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are ATLAS, a minimal research tool for artistic process documentation. Your role is strictly pattern detection, association generation, and question/reference suggestion. Keep your reports objective, practical, and clear. Avoid pretentious or cosmic metaphors. All output fields MUST be entirely in ${locale === "en" ? "English" : "Portuguese (Português)"}.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["patterns", "associations", "questions", "suggestedReferences"],
          properties: {
            patterns: {
              type: Type.ARRAY,
              description: "2-3 detected thematic patterns running through the work.",
              items: {
                type: Type.OBJECT,
                required: ["title", "description", "evidence"],
                properties: {
                  title: { type: Type.STRING, description: "A concise, grounded name for the pattern." },
                  description: { type: Type.STRING, description: "A clear and direct explanation of how this pattern is manifested." },
                  evidence: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Specific quotes, phrases, or titles from the user's journals or concepts that prove this pattern."
                  }
                }
              }
            },
            associations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "5-6 material, sensory, or conceptual associations suggested by the user's practice."
            },
            questions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "4 rigorous and concrete inquiry questions for the studio."
            },
            suggestedReferences: {
              type: Type.ARRAY,
              description: "2-3 real-world references (art, literature, music, philosophy) relevant to these patterns.",
              items: {
                type: Type.OBJECT,
                required: ["title", "artist", "type", "description"],
                properties: {
                  title: { type: Type.STRING, description: "Title of the reference work." },
                  artist: { type: Type.STRING, description: "Artist, author, creator, or thinker." },
                  type: { type: Type.STRING, description: "Medium or category (e.g., 'Book', 'Installation', 'Film')." },
                  description: { type: Type.STRING, description: "A clear description of how this reference connects to the user's patterns." }
                }
              }
            }
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text from Gemini API.");
    }

    const parsed = JSON.parse(resultText);
    res.json(parsed);
  } catch (err) {
    console.error("Gemini Generate Insights Error:", err);
    res.status(500).json({ error: "Failed to generate AI Insights. Ensure you have enough journal logs or concepts, and that your Gemini API is active." });
  }
});

// ==================== EXPORTS GENERATION ROUTE ====================

app.post("/api/exports/generate", verifyFirebaseToken, async (req, res) => {
  const { type, language = "pt", journalEntries = [], concepts = [], insights = [] } = req.body;

  if (!type || !["memorial", "report", "summary", "pdf"].includes(type)) {
    return res.status(400).json({ error: "Invalid or missing export type." });
  }

  // PDF is compiled in the frontend using full CSS print stylesheets and responsive layout
  if (type === "pdf") {
    const isEn = language === "en";
    const title = isEn ? "Complete Research Notebook" : "Caderno de Pesquisa Completo";
    const dateStr = new Date().toLocaleDateString(isEn ? "en-US" : "pt-BR");
    const content = isEn 
      ? `COMPLETE RESEARCH NOTEBOOK\nGenerated on: ${dateStr}\n\nThis document compiles your entire studio archive including ${journalEntries.length} journal logs, ${concepts.length} concepts, and ${insights.length} synthetic reflections.`
      : `CADERNO DE PESQUISA COMPLETO\nGerado em: ${dateStr}\n\nEste documento compila todo o seu arquivo de ateliê, incluindo ${journalEntries.length} registros de diário, ${concepts.length} conceitos e ${insights.length} reflexões sintéticas.`;

    return res.json({ title, content });
  }

  // Check if there is enough material to generate Memorial Descritivo
  if (type === "memorial" && (journalEntries.length < 1 || concepts.length < 1)) {
    const isEn = language === "en";
    const errorMsg = isEn 
      ? "The current research notebook does not yet contain enough material to generate a Memorial. Please seed at least one concept and write at least one journal entry."
      : "O caderno de pesquisa atual ainda não contém material suficiente para gerar um Memorial. Por favor, semeie pelo menos um conceito e escreva pelo menos um registro de diário.";
    return res.status(400).json({ error: errorMsg, code: "INSUFFICIENT_DATA" });
  }

  const isEn = language === "en";
  const localeName = isEn ? "English" : "Portuguese (Português)";

  // Construct context for Gemini
  const journalText = journalEntries
    .map((j: any) => `[Entry "${j.title}" on ${j.createdAt}]:\n${j.content}\nTags: ${(j.tags || []).join(", ")}`)
    .join("\n\n");

  const conceptsText = concepts
    .map((c: any) => `[Concept "${c.name}"]: ${c.description}\nStage: ${c.status}\nAssociations: ${(c.associations || []).join(", ")}\nQuestions: ${(c.questions || []).join(", ")}`)
    .join("\n\n");

  const insightsText = insights
    .map((i: any) => `[Reflection of ${i.createdAt}]:\nPatterns: ${(i.patterns || []).map((p: any) => p.title).join(", ")}\nAssociations: ${(i.associations || []).join(", ")}`)
    .join("\n\n");

  let prompt = "";
  let systemInstruction = "";

  if (type === "memorial") {
    systemInstruction = `You are ATLAS, a creative research assistant for artists. You speak with a highly professional, academic, observant, and grounded tone. You compile structured 'Memorial Descritivo' documents based strictly on provided studio logs and concepts. Never fabricate, extrapolate, or invent details. If the provided context lacks sufficient information for any section, you MUST explicitly state that the notebook does not contain enough material for that section. All output must be formatted in elegant Markdown in ${localeName}.`;

    prompt = `You are ATLAS. The artist wants to compile an academic-style 'Memorial Descritivo' from their studio archive in ${localeName}.
Here is the raw studio context:
---
JOURNAL LOGS:
${journalText || "No journal logs."}

CONCEPTS:
${conceptsText || "No concepts."}

SYNTHETIC REFLECTIONS:
${insightsText || "No reflections."}
---

Structure the Memorial Descritivo strictly with the following sections. Use Markdown headings.
For each section, organize the existing content. Do not invent any outside details, facts, or projects.
If there is not enough material in the logs or concepts to write a section, explicitly declare it: e.g., "${isEn ? "The current research notebook does not yet contain enough material for this section." : "O caderno de pesquisa atual ainda não contém material suficiente para fundamentar esta seção."}"

Required Structure:
# Memorial Descritivo

## 1. Introdução / Introduction
## 2. Contexto de Pesquisa / Research Context
## 3. Objetivos / Objectives
## 4. Metodologia / Methodology
## 5. Materiais / Materials
## 6. Processo Criativo / Creative Process
## 7. Reflexões / Reflections
## 8. Estado Atual / Current State
## 9. Desenvolvimentos Futuros / Future Developments
## 10. Referências / References`;
  } else if (type === "report") {
    systemInstruction = `You are ATLAS, a technical studio assistant. You compile clear, objective, and detailed studio research reports. You strictly organize existing content. Never invent or complete missing information. All output must be in ${localeName}.`;

    prompt = `Compile a technical 'Research Report' (Relatório de Pesquisa) from the studio archive in ${localeName}.
Here is the raw studio context:
---
JOURNAL LOGS:
${journalText || "No journal logs."}

CONCEPTS:
${conceptsText || "No concepts."}

SYNTHETIC REFLECTIONS:
${insightsText || "No reflections."}
---

Structure the report strictly with the following sections. Use Markdown:
# Relatório de Pesquisa / Research Report

## 1. Visão Geral / Overview (A brief summary of the research)
## 2. Linha do Tempo da Pesquisa / Research Timeline (Chronological summary of logs and milestones)
## 3. Evolução dos Conceitos / Concept Evolution (How concepts started and grew)
## 4. Principais Descobertas / Main Discoveries
## 5. Inquirições / Questions (List of unanswered studio research questions)
## 6. Referências / References
## 7. Lista de Mídias Anexadas / Attached Media List (Specify any files, drawings, or attachments mentioned in the journals)`;
  } else {
    // summary
    systemInstruction = `You are ATLAS, a creative writing assistant for artists. You compile highly dense, concise, and professional research summaries suitable for residencies, open calls, and portfolios. Max 2 pages equivalent of text. Compile strictly from the provided archive. Do not fabricate any projects or details. All output must be in ${localeName}.`;

    prompt = `Compile a 'Research Summary' (Resumo de Pesquisa) of the artist's work in ${localeName}.
Keep it highly professional, dense, and executive. It must fit within 2 pages of equivalent printed text (keep it under 800 words, highly structured).
Here is the raw studio context:
---
JOURNAL LOGS:
${journalText || "No journal logs."}

CONCEPTS:
${conceptsText || "No concepts."}

SYNTHETIC REFLECTIONS:
${insightsText || "No reflections."}
---

Structure the summary as follows:
# Resumo de Pesquisa / Research Summary

## Foco de Pesquisa / Research Focus (Clear, compelling description of the main artistic research area)
## Conceitos Fundamentais / Core Concepts (Brief highlights of key active concepts)
## Prática de Ateliê / Studio Practice & Methodology (Brief description of materials and experiments)
## Próximos Passos / Creative Path & Next Steps`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text from Gemini API.");
    }

    const titleMap = {
      memorial: isEn ? "Memorial Descritivo" : "Memorial Descritivo",
      report: isEn ? "Research Report" : "Relatório de Pesquisa",
      summary: isEn ? "Research Summary" : "Resumo de Pesquisa"
    };

    res.json({
      title: titleMap[type as "memorial" | "report" | "summary"],
      content: resultText
    });
  } catch (err) {
    console.error("Gemini Generate Export Error:", err);
    res.status(500).json({ error: "Failed to compile document via Gemini API. Please check your connection." });
  }
});

// ==================== PORTFOLIO ASSIST ROUTE ====================

app.post("/api/portfolio/assist", verifyFirebaseToken, async (req, res) => {
  const { journalEntries = [], concepts = [], currentStatement = "", locale = "pt" } = req.body;

  const entriesText = journalEntries
    .map((j: any) => `- Log "${j.title}": ${j.content}`)
    .join("\n\n");

  const conceptsText = concepts
    .map((c: any) => `- Concept "${c.name}": ${c.description}`)
    .join("\n\n");

  const prompt = `You are ATLAS, a creative research assistant for artists.
An artist wants to write their "Artist Statement" or "Research Manifesto" for their curated Portfolio.

Current draft statement by the artist:
"${currentStatement || "None provided yet."}"

We want to enhance, structure, and polish this statement into a rigorous, poetic, and professional narrative that links their curated concepts and process logs.

Curated Concepts in this Portfolio:
${conceptsText || "None selected."}

Curated Process Logs in this Portfolio:
${entriesText || "None selected."}

Task requirements:
1. Polish the language into an academic, artistic, and deeply reflective tone.
2. Structure it into 2-3 short, powerful paragraphs:
   - Paragraph 1: Core poetic investigation, material medium, and aesthetic drives.
   - Paragraph 2: How the curated concepts manifest in physical experiments and studio practice.
   - Paragraph 3: Future projections and lineage of inquiry.
3. Keep it concrete, physical, and sensory. Avoid generic marketing puffery or hollow corporate art jargon.
4. Ensure the output matches the requested language: ${locale === "en" ? "English" : "Portuguese"}.

Generate ONLY the polished statement text directly, with no extra conversational greeting or markdown wrappers.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are ATLAS, a minimal research tool for artistic process documentation. Your role is to write a rigorous, poetic, and highly professional artist statement in ${locale === "en" ? "English" : "Portuguese (Português)"}. Provide ONLY the final text.`,
      }
    });

    res.json({ statement: response.text });
  } catch (err) {
    console.error("Gemini Portfolio Assist Error:", err);
    res.status(500).json({ error: "Failed to generate statement draft. Please check your Gemini API configuration." });
  }
});

// ==================== VITE DEVELOPMENT / PRODUCTION MIDDLEWARE ====================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ATLAS full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
