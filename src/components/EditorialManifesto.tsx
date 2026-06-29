import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "../lib/i18n";
import { ArrowRight } from "lucide-react";

interface EditorialManifestoProps {
  onCreateNotebookClick?: () => void;
}

export default function EditorialManifesto({ onCreateNotebookClick }: EditorialManifestoProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <article
      id="editorial-manifesto-card"
      className="w-full border-y border-[#E6E2D5] bg-[#FAF8F3] overflow-hidden transition-colors"
      aria-labelledby="manifesto-title"
    >
      <div className="max-w-2xl mx-auto px-6 md:px-8 py-8">
        <AnimatePresence initial={false} mode="wait">
          {!isExpanded ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-1 max-w-xl">
                <h3
                  id="manifesto-title"
                  className="font-serif text-lg font-semibold text-stone-900 tracking-wide"
                >
                  {t.manifestoCollapsedTitle}
                </h3>
                <p className="text-xs text-stone-600 font-sans leading-relaxed">
                  {t.manifestoCollapsedSub}
                </p>
              </div>
              <button
                type="button"
                id="btn-manifesto-read"
                onClick={toggleExpand}
                aria-expanded={isExpanded}
                aria-controls="manifesto-expanded-content"
                className="self-start md:self-center px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-stone-850 border border-[#DDD9CE] hover:border-stone-500 hover:bg-white rounded transition-all cursor-pointer flex-shrink-0 focus-visible:outline-2 focus-visible:outline-stone-500 focus-visible:outline-offset-2"
              >
                {t.manifestoReadLink}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
              id="manifesto-expanded-content"
              className="space-y-10"
            >
              {/* Header */}
              <div className="space-y-3 pb-6 border-b border-[#E6E2D5]/60">
                <h3 className="font-serif text-2xl font-light text-stone-950 tracking-wide">
                  {t.manifestoTitle}
                </h3>
                <p className="text-xs text-stone-500 font-sans tracking-wide">
                  {t.manifestoIntro}
                </p>
              </div>

              {/* Body Paragraphs styled like book pages */}
              <div className="space-y-8 text-stone-800 text-[13px] leading-[1.8] font-sans max-w-[70ch]">
                <div className="space-y-2">
                  <h4 className="font-serif text-sm font-semibold text-stone-900">
                    {t.manifestoPara1Title}
                  </h4>
                  <p className="whitespace-pre-line">{t.manifestoPara1Body}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-serif text-sm font-semibold text-stone-900">
                    {t.manifestoPara2Title}
                  </h4>
                  <p className="whitespace-pre-line">{t.manifestoPara2Body}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-serif text-sm font-semibold text-stone-900">
                    {t.manifestoPara3Title}
                  </h4>
                  <p className="whitespace-pre-line">{t.manifestoPara3Body}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-serif text-sm font-semibold text-stone-900">
                    {t.manifestoPara4Title}
                  </h4>
                  <p className="whitespace-pre-line">{t.manifestoPara4Body}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-serif text-sm font-semibold text-stone-900">
                    {t.manifestoPara5Title}
                  </h4>
                  <p className="whitespace-pre-line">{t.manifestoPara5Body}</p>
                </div>
              </div>

              {/* Poetic Closing Transition */}
              <div className="pt-8 border-t border-[#E6E2D5]/60 max-w-[70ch] space-y-6">
                <p className="font-serif text-[15px] leading-[1.8] text-stone-950 whitespace-pre-line">
                  {t.manifestoClosing}
                </p>

                {onCreateNotebookClick && (
                  <div className="pt-2">
                    <button
                      type="button"
                      id="manifesto-create-notebook-cta"
                      onClick={onCreateNotebookClick}
                      className="px-5 py-2.5 bg-stone-900 hover:bg-stone-850 text-white font-mono text-xs uppercase tracking-wider rounded font-bold cursor-pointer transition-colors shadow-xs inline-flex items-center gap-1.5"
                    >
                      <span>{t.manifestoCreateBtn}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Collapse Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  id="btn-manifesto-collapse"
                  onClick={toggleExpand}
                  aria-expanded={isExpanded}
                  aria-controls="manifesto-expanded-content"
                  className="px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-stone-500 hover:text-stone-850 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-stone-500 focus-visible:outline-offset-2"
                >
                  {t.manifestoCollapseLink}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
}
