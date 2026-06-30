import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Paperclip, 
  Check, 
  Loader2, 
  Trash2, 
  Image, 
  Sparkles, 
  AlertCircle, 
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { User } from "firebase/auth";
import { BetaFeedback } from "../types";
import { addFeedback, getFeedbacksForUser } from "../lib/dbService";

interface MyanCommunicationCenterProps {
  currentUser: User | null;
  locale: "en" | "pt";
  activeTab: string;
  currentNotebookId?: string | null;
}

export default function MyanCommunicationCenter({
  currentUser,
  locale,
  activeTab,
  currentNotebookId = null
}: MyanCommunicationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"typing" | "category" | "success">("typing");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [emailConsent, setEmailConsent] = useState(false);
  const [category, setCategory] = useState<"bug" | "suggestion" | "question" | "idea" | "other">("suggestion");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; msg: string } | null>(null);
  
  // Feedback history states
  const [feedbacks, setFeedbacks] = useState<BetaFeedback[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTimeout, setSuccessTimeout] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isEn = locale === "en";

  // Auto scroll to bottom of feedback list
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, feedbacks, step]);

  // Load feedback history
  const loadHistory = async () => {
    if (!currentUser?.uid) return;
    setLoadingHistory(true);
    try {
      const history = await getFeedbacksForUser(currentUser.uid);
      setFeedbacks(history);
    } catch (err) {
      console.error("[Myan] Failed to load feedback history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      loadHistory();
    }
  }, [isOpen, currentUser]);

  // Handle file selection (Base64 conversion)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFeedbackError(isEn ? "Attachment must be less than 2MB." : "O anexo deve ter menos de 2MB.");
        return;
      }
      setFeedbackError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment(reader.result as string);
        setAttachmentName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentName(null);
    setFeedbackError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Click Send (moves to category selector step)
  const handleSendClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setFeedbackError(null);
    setStep("category");
  };

  // Submit Feedback
  const handleSubmitFeedback = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    setFeedbackError(null);
    try {
      // Get browser and OS details
      const ua = navigator.userAgent;
      let browser = "Unknown";
      if (ua.includes("Firefox")) browser = "Firefox";
      else if (ua.includes("Chrome")) browser = "Chrome";
      else if (ua.includes("Safari")) browser = "Safari";
      else if (ua.includes("Edge")) browser = "Edge";

      let os = "Unknown";
      if (ua.includes("Windows")) os = "Windows";
      else if (ua.includes("Macintosh")) os = "macOS";
      else if (ua.includes("Linux")) os = "Linux";
      else if (ua.includes("Android")) os = "Android";
      else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

      const title = message.trim().substring(0, 45) + (message.trim().length > 45 ? "..." : "");

      const newFeedback = await addFeedback({
        userId: currentUser.uid,
        userEmail: currentUser.email || "anonymous@myartnotes.com",
        category,
        title,
        description: message.trim(),
        attachment: attachment || undefined,
        emailReplyConsent: emailConsent,
        browser,
        os,
        language: locale,
        appVersion: "1.2.0-beta",
        notebookId: currentNotebookId,
        module: activeTab
      });

      // Clear fields and load updated history
      setMessage("");
      setAttachment(null);
      setAttachmentName(null);
      setEmailConsent(false);
      setCategory("suggestion");
      setStep("success");
      setFeedbackError(null);

      // Optimistically append the newly created feedback to the user's conversation history immediately
      setFeedbacks((prev) => [newFeedback, ...prev]);

      // Show localized success toast immediately
      setToast({
        show: true,
        msg: isEn 
          ? "Thank you! Feedback sent successfully." 
          : "Obrigado! Feedback enviado com sucesso."
      });
      setTimeout(() => {
        setToast(null);
      }, 4000);

      // Auto load history
      await loadHistory();

      // Automatically dismiss success state after 3.5 seconds and go back to typing
      if (successTimeout) clearTimeout(successTimeout);
      const timer = setTimeout(() => {
        setStep("typing");
      }, 4000);
      setSuccessTimeout(timer);

    } catch (err) {
      console.error("[Myan] Submission failed:", err);
      setFeedbackError(isEn ? "Failed to send feedback. Please try again." : "Falha ao enviar o feedback. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Category Selector View
  const renderCategoryStep = () => {
    const categories: { key: typeof category; labelEn: string; labelPt: string }[] = [
      { key: "suggestion", labelEn: "Suggestion", labelPt: "Sugestão" },
      { key: "bug", labelEn: "Bug / Error", labelPt: "Bug / Erro" },
      { key: "question", labelEn: "Question", labelPt: "Dúvida" },
      { key: "idea", labelEn: "New Idea", labelPt: "Nova Ideia" },
      { key: "other", labelEn: "Other", labelPt: "Outro" }
    ];

    return (
      <div className="space-y-4 p-5 bg-[#FAF8F3] border-t border-[#E6E2D5]">
        {feedbackError && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-[11px] font-sans text-red-700 rounded flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
            <span className="leading-normal">{feedbackError}</span>
          </div>
        )}

        <div className="space-y-1">
          <h4 className="font-serif font-medium text-stone-900 text-sm">
            {isEn ? "What best describes this message?" : "O que melhor descreve esta mensagem?"}
          </h4>
          <p className="text-[10px] text-stone-500 font-sans">
            {isEn 
              ? "Categorization helps our creative development team organize responses." 
              : "A categorização ajuda nossa equipe de desenvolvimento criativo a se organizar."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategory(cat.key)}
              className={`px-3 py-2 text-left text-xs font-mono rounded border transition-all flex items-center justify-between cursor-pointer ${
                category === cat.key
                  ? "bg-stone-900 border-stone-900 text-white"
                  : "bg-white border-[#E6E2D5] text-stone-700 hover:border-stone-400"
              }`}
            >
              <span>{isEn ? cat.labelEn : cat.labelPt}</span>
              {category === cat.key && <Check className="w-3.5 h-3.5 text-white" />}
            </button>
          ))}
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => setStep("typing")}
            className="flex-1 py-2 border border-[#DDD9CE] hover:border-stone-400 text-stone-600 hover:text-stone-900 text-[10px] font-mono uppercase tracking-wider rounded transition-all cursor-pointer"
          >
            {isEn ? "Back" : "Voltar"}
          </button>
          <button
            type="button"
            onClick={handleSubmitFeedback}
            disabled={isSubmitting}
            className="flex-1 py-2 bg-stone-900 hover:bg-stone-850 text-white text-[10px] font-mono uppercase tracking-wider rounded font-bold transition-all cursor-pointer inline-flex justify-center items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isEn ? "Sending..." : "Enviando..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isEn ? "Confirm & Send" : "Confirmar e Enviar"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  // Render typing input view
  const renderTypingStep = () => {
    return (
      <form onSubmit={handleSendClick} className="p-4 bg-white border-t border-[#E6E2D5] space-y-3">
        {feedbackError && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-[11px] font-sans text-red-700 rounded flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
            <span className="leading-normal">{feedbackError}</span>
          </div>
        )}

        {/* Attachment preview */}
        {attachment && (
          <div className="flex items-center justify-between bg-[#FCFAF7] border border-[#E6E2D5] rounded px-3 py-1.5 text-xs">
            <div className="flex items-center gap-2 text-stone-600 truncate max-w-[80%]">
              <Image className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
              <span className="truncate text-[11px] font-mono">{attachmentName}</span>
            </div>
            <button
              type="button"
              onClick={removeAttachment}
              className="p-1 hover:bg-[#F0EDE6] rounded text-red-600 hover:text-red-800 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              isEn 
                ? "Write your thoughts, suggestions, or notes..." 
                : "Escreva suas reflexões, sugestões ou notas..."
            }
            className="w-full h-20 p-3 bg-[#FCFAF7] border border-[#E6E2D5] rounded text-xs text-stone-850 placeholder-stone-400 font-sans focus:outline-none focus:border-stone-400 focus:bg-white resize-none transition-all custom-scrollbar leading-relaxed"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 border border-[#E6E2D5] hover:border-stone-400 bg-white text-stone-500 hover:text-stone-850 rounded transition-all cursor-pointer flex items-center justify-center"
              title={isEn ? "Attach screenshot image" : "Anexar imagem de tela"}
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={emailConsent}
                onChange={(e) => setEmailConsent(e.target.checked)}
                className="rounded border-[#E6E2D5] text-stone-900 focus:ring-0 w-3.5 h-3.5 bg-[#FCFAF7] cursor-pointer"
              />
              <span className="text-[10px] text-stone-500 leading-none">
                {isEn ? "Allow reply by email" : "Permitir resposta por e-mail"}
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!message.trim()}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-850 disabled:opacity-40 text-white text-[10px] font-mono uppercase tracking-wider rounded font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>{isEn ? "Send" : "Enviar"}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    );
  };

  // Render feedback history items
  const renderFeedbackHistoryItems = () => {
    if (loadingHistory) {
      return (
        <div className="flex flex-col items-center justify-center py-6 space-y-2">
          <Loader2 className="w-5 h-5 text-stone-400 animate-spin" />
          <span className="text-[10px] font-mono text-stone-400">
            {isEn ? "Connecting to archive..." : "Conectando ao arquivo..."}
          </span>
        </div>
      );
    }

    if (feedbacks.length === 0) return null;

    return (
      <div className="space-y-5 pt-4 border-t border-[#E6E2D5]/60">
        <h4 className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-widest px-1">
          {isEn ? "Your past logs with Myan" : "Seus registros anteriores com a Myan"}
        </h4>

        <div className="space-y-4">
          {feedbacks.map((item) => {
            // Category badges
            const catMap: Record<string, string> = {
              bug: isEn ? "Bug" : "Bug",
              suggestion: isEn ? "Suggestion" : "Sugestão",
              question: isEn ? "Question" : "Dúvida",
              idea: isEn ? "Idea" : "Ideia",
              other: isEn ? "Other" : "Outro"
            };

            const statusMap: Record<string, { label: string, color: string }> = {
              new: { label: isEn ? "Received" : "Recebido", color: "text-amber-700 bg-amber-50 border-amber-100" },
              review: { label: isEn ? "Under Review" : "Em Análise", color: "text-blue-700 bg-blue-50 border-blue-100" },
              resolved: { label: isEn ? "Resolved" : "Resolvido", color: "text-green-700 bg-green-50 border-green-100" },
              archived: { label: isEn ? "Archived" : "Arquivado", color: "text-stone-500 bg-stone-50 border-stone-200" }
            };

            const currentStatus = statusMap[item.status] || { label: item.status, color: "text-stone-500 bg-stone-50 border-stone-100" };

            return (
              <div key={item.id} className="bg-white border border-[#E6E2D5]/70 rounded p-4 space-y-3 shadow-xs text-xs">
                {/* Feedback Header */}
                <div className="flex items-center justify-between">
                  <span className="px-1.5 py-0.5 bg-stone-100 text-stone-600 text-[8px] font-mono uppercase tracking-wider rounded border border-[#E6E2D5]/40">
                    {catMap[item.category] || item.category}
                  </span>
                  <span className="text-[9px] text-stone-400 font-mono">
                    {new Date(item.createdAt).toLocaleDateString(isEn ? "en-US" : "pt-BR")}
                  </span>
                </div>

                {/* Feedback Body */}
                <p className="text-stone-800 font-sans leading-relaxed whitespace-pre-wrap text-[11px]">
                  {item.description}
                </p>

                {/* Feedback Attachment */}
                {item.attachment && (
                  <div className="pt-1.5">
                    <img 
                      src={item.attachment} 
                      alt="Attachment Preview" 
                      className="max-h-24 rounded border border-[#E6E2D5] object-contain bg-[#FCFAF7]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Status Indicator */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-stone-400 font-mono">Status:</span>
                    <span className={`px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider rounded border ${currentStatus.color}`}>
                      {currentStatus.label}
                    </span>
                  </div>
                </div>

                {/* Admin Reply (Team) */}
                {item.adminNotes && (
                  <div className="mt-3 pt-3 border-t border-dashed border-stone-200 bg-[#FCFAF7] p-3 rounded space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-semibold text-stone-950 text-[10px] tracking-wide">
                        {isEn ? "Team Response" : "Resposta da Equipe"}
                      </span>
                      <span className="text-[8px] font-mono text-stone-450 uppercase tracking-widest">
                        MyArtNotes
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-650 font-sans leading-relaxed italic">
                      "{item.adminNotes}"
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. FLOATING CIRCULAR LAUNCHER BUTTON */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4.5 py-3 rounded-full bg-[#FCFAF7] border border-[#DDD9CE] hover:border-stone-400 hover:bg-white text-stone-850 hover:text-stone-950 shadow-md cursor-pointer transition-all focus:outline-none"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <span className="text-amber-500 font-serif">✦</span>
          <span className="font-serif text-xs font-semibold tracking-wide">Myan</span>
          
          {/* Subtle pulse if closed and logged in */}
          {!isOpen && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
          )}
        </motion.button>
      </div>

      {/* 2. FLOATING CHAT WINDOW CONTAINER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-22 right-6 w-[360px] md:w-[400px] h-[520px] md:h-[580px] bg-[#FCFAF7] border border-[#DDD9CE] rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-white border-b border-[#E6E2D5] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#FAF8F3] border border-[#E6E2D5] flex items-center justify-center text-amber-500 text-xs font-serif font-bold">
                  My
                </div>
                <div>
                  <h3 className="font-serif font-light text-stone-950 text-base leading-none tracking-wide">
                    Myan
                  </h3>
                  <span className="text-[9px] font-mono text-stone-450 uppercase tracking-widest mt-1 block">
                    {isEn ? "Ecosystem Companion" : "Companheira de Ecossistema"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[#F0EDE6] rounded transition-colors text-stone-400 hover:text-stone-850 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Conversation Flow area */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
              {/* Introduction Greeting from Myan */}
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-[#FAF8F3] border border-[#E6E2D5] flex items-center justify-center text-stone-500 text-[10px] font-serif flex-shrink-0 mt-0.5">
                    M
                  </div>
                  <div className="bg-white border border-[#E6E2D5] p-4.5 rounded-sm space-y-3 leading-relaxed max-w-[85%]">
                    <p className="font-serif italic text-stone-900 text-xs font-medium">
                      {isEn ? "Hello." : "Olá."}
                    </p>
                    <p className="font-serif text-[12px] text-stone-750 font-light whitespace-pre-line leading-relaxed">
                      {isEn 
                        ? `I'm Myan.\n\nI'm accompanying the development of MyArtNotes together with artists like you.\n\nIf you notice something unusual...\nhave an idea...\nwant to suggest an improvement...\nor simply want to share your experience...\n\nI'm here to listen. Every message helps improve MyArtNotes.`
                        : `Sou a Myan.\n\nEstou acompanhando o desenvolvimento do MyArtNotes junto com artistas como você.\n\nSe você notar algo incomum...\ntiver uma ideia...\nquiser sugerir uma melhoria...\nou simplesmente quiser compartilhar sua experiência...\n\nestou aqui para ouvir. Cada mensagem ajuda a melhorar o MyArtNotes.`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Stored Conversation History */}
              {renderFeedbackHistoryItems()}

              <div ref={chatEndRef} />
            </div>

            {/* Step-based User Input/Selector areas */}
            {step === "typing" && renderTypingStep()}
            {step === "category" && renderCategoryStep()}
            
            {step === "success" && (
              <motion.div 
                className="p-5 bg-stone-900 text-[#FAF8F3] border-t border-stone-800 text-center space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-stone-800 border border-stone-700 text-amber-300 mb-1">
                  <Check className="w-4.5 h-4.5" />
                </div>
                <h4 className="font-serif font-light text-base text-white tracking-wide">
                  {isEn ? "Message Saved" : "Mensagem Salva"}
                </h4>
                <p className="text-[11px] font-sans text-stone-300 leading-relaxed max-w-[85%] mx-auto">
                  {isEn 
                    ? "Thank you for helping improve MyArtNotes. I have safely cataloged your message." 
                    : "Obrigado por ajudar a melhorar o MyArtNotes. Cataloguei com sucesso sua mensagem."}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Localized Success Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 bg-[#1C1917] border border-[#2E2A24] text-[#FAF8F3] px-4 py-3 rounded shadow-xl flex items-center gap-3 max-w-sm"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Check className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xs font-bold tracking-wide">
                {isEn ? "Success" : "Sucesso"}
              </span>
              <span className="text-[10px] text-stone-300 font-sans mt-0.5">
                {toast.msg}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
