import React, { useState } from "react";
import { useTranslation } from "../lib/i18n";
import { BookOpen, Sparkles, Loader2, Plus, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

interface OnboardingScreenProps {
  onCreateFirstEntry: () => void;
  onLoadExample: () => Promise<void>;
}

export default function OnboardingScreen({ onCreateFirstEntry, onLoadExample }: OnboardingScreenProps) {
  const { locale } = useTranslation();
  const [isLoadingExample, setIsLoadingExample] = useState(false);

  const handleSeeExample = async () => {
    setIsLoadingExample(true);
    try {
      await onLoadExample();
    } catch (err) {
      console.error("Failed to load onboarding example:", err);
    } finally {
      setIsLoadingExample(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-stone-900 flex flex-col items-center justify-center p-6 font-sans relative">
      <div className="absolute top-6 right-6 text-[10px] font-mono text-stone-400 tracking-wider">
        MyArtNotes — ONBOARDING
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-xl w-full text-center space-y-10"
      >
        {/* Animated Brand Icon */}
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white border border-[#E6E2D5] text-stone-850 shadow-xs"
          >
            <BookOpen className="w-6 h-6 stroke-[1.5]" />
          </motion.div>
        </div>

        {/* Minimalist Core Pitch (Screen 1) */}
        <div className="space-y-4 px-4">
          <p className="text-xl md:text-2xl font-serif text-stone-950 font-normal leading-relaxed tracking-tight text-center max-w-lg mx-auto">
            {locale === "en" ? (
              <span>
                &ldquo;MyArtNotes is a digital notebook to register processes, connect ideas, and trace artistic research.&rdquo;
              </span>
            ) : (
              <span>
                &ldquo;MyArtNotes é um caderno digital para registrar processos, conectar ideias e acompanhar pesquisas artísticas.&rdquo;
              </span>
            )}
          </p>
          <div className="w-12 h-px bg-stone-300 mx-auto mt-6" />
        </div>

        {/* Action Buttons & Fictional Demo Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="space-y-12 max-w-lg mx-auto"
        >
          {/* Primary Action: Create my first entry */}
          <div className="flex justify-center">
            <button
              onClick={onCreateFirstEntry}
              disabled={isLoadingExample}
              className="px-8 py-4 bg-stone-900 hover:bg-stone-850 text-white font-mono text-xs font-bold rounded cursor-pointer transition-all shadow-xs flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>
                {locale === "en" ? "Create my first entry" : "Criar minha primeira anotação"}
              </span>
            </button>
          </div>

          {/* New Editorial Section: Myan Demo */}
          <div className="bg-white border border-[#E6E2D5] rounded-sm p-6 text-left space-y-4 shadow-2xs hover:border-stone-400 transition-colors">
            <div className="space-y-1">
              <span className="text-[8px] font-mono text-stone-450 uppercase tracking-widest font-bold block">
                {locale === "en" ? "DEMO ENVIRONMENT • MYAN" : "AMBIENTE DE DEMONSTRAÇÃO • MYAN"}
              </span>
              <h4 className="font-serif text-sm font-semibold text-stone-950 leading-snug">
                {locale === "en" 
                  ? "Want to explore how an artistic research notebook works?" 
                  : "Quer explorar como funciona um caderno de pesquisa artística?"}
              </h4>
              <p className="text-xs text-stone-600 font-serif leading-relaxed">
                {locale === "en"
                  ? "Myan can generate a temporary fictional research notebook so you can freely explore the platform."
                  : "Myan pode gerar um caderno de pesquisa ficcional temporário para que você possa explorar a plataforma livremente."}
              </p>
            </div>

            <button
              onClick={handleSeeExample}
              disabled={isLoadingExample}
              className="w-full px-5 py-3 bg-[#FCFAF7] hover:bg-[#FAF8F3] border border-[#DDD9CE] hover:border-stone-450 text-stone-800 font-mono text-xs font-bold rounded cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoadingExample ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
                  <span>
                    {locale === "en" ? "Generating demonstration..." : "Gerando demonstração..."}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>
                    {locale === "en" ? "Create Demo Notebook" : "Criar Caderno de Demonstração"}
                  </span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Non-intrusive caption to build comfort */}
        <p className="text-[10px] font-mono text-stone-400 tracking-wider">
          {locale === "en"
            ? "NO TUTORIALS • NO ACCUMULATED NOISE • UNCOMPLICATED STUDY"
            : "SEM TUTORIAIS • SEM RUÍDO ACUMULADO • ESTUDO DESCOMPLICADO"}
        </p>
      </motion.div>
    </div>
  );
}
