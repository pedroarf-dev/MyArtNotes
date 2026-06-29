import React, { useState } from "react";
import { BookOpen, Shield, HelpCircle, ArrowRight, Check, AlertCircle, Globe } from "lucide-react";
import { updateUserProfile, logAnalyticsEvent } from "../lib/dbService";

interface ConsentFlowProps {
  userId: string;
  userEmail: string;
  initialLocale: "en" | "pt";
  onConsentComplete: () => void;
}

export default function ConsentFlow({ userId, userEmail, initialLocale, onConsentComplete }: ConsentFlowProps) {
  const [locale, setLocale] = useState<"en" | "pt">(initialLocale);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [analyticsAccepted, setAnalyticsAccepted] = useState(false);
  const [productUpdatesConsent, setProductUpdatesConsent] = useState(false);
  const [creativeEcosystemConsent, setCreativeEcosystemConsent] = useState(false);
  const [partnersConsent, setPartnersConsent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const toggleLocale = () => {
    setLocale((prev) => (prev === "en" ? "pt" : "en"));
  };

  const handleConfirm = async () => {
    if (!privacyAccepted) {
      setErrorMsg(
        locale === "en"
          ? "You must accept the mandatory data processing consent to use MyArtNotes."
          : "Você deve aceitar o consentimento obrigatório de processamento de dados para usar o MyArtNotes."
      );
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    try {
      const now = new Date().toISOString();
      const version = "v1.0-2026";
      
      const consentRecord = {
        privacyConsentAccepted: true,
        analyticsConsentAccepted: analyticsAccepted,
        anonymousResearchConsent: analyticsAccepted,
        anonymousResearchConsentAt: analyticsAccepted ? now : null,
        productUpdatesConsent,
        productUpdatesConsentAt: productUpdatesConsent ? now : null,
        creativeEcosystemConsent,
        creativeEcosystemConsentAt: creativeEcosystemConsent ? now : null,
        partnersConsent,
        partnersConsentAt: partnersConsent ? now : null,
        consentAcceptedAt: now,
        consentHistory: [
          {
            privacyConsentAccepted: true,
            analyticsConsentAccepted: analyticsAccepted,
            anonymousResearchConsent: analyticsAccepted,
            productUpdatesConsent,
            creativeEcosystemConsent,
            partnersConsent,
            timestamp: now,
            version: version,
          }
        ]
      };

      await updateUserProfile(userId, consentRecord);
      
      // Log event
      await logAnalyticsEvent(userId, "privacy_consent_updated", {
        privacyConsentAccepted: true,
        analyticsConsentAccepted: analyticsAccepted,
        anonymousResearchConsent: analyticsAccepted,
        productUpdatesConsent,
        creativeEcosystemConsent,
        partnersConsent,
        version: version,
        email: userEmail
      });

      onConsentComplete();
    } catch (err: any) {
      console.error("Failed to save consent:", err);
      setErrorMsg(
        locale === "en"
          ? "Failed to save consents. Please check your network connection and try again."
          : "Falha ao salvar consentimentos. Verifique sua conexão e tente novamente."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-stone-900 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      <div className="max-w-2xl w-full bg-white border border-[#E6E2D5] rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="p-6 border-b border-[#E6E2D5] flex items-center justify-between bg-[#FAF8F3]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EFECE6] border border-[#DDD9CE] flex items-center justify-center">
              <Shield className="w-5 h-5 text-stone-700 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-mono font-bold uppercase tracking-widest text-stone-900">
                {locale === "en" ? "Privacy & Consent" : "Privacidade e Consentimento"}
              </h1>
              <p className="text-[9px] font-mono text-stone-400 uppercase tracking-wider mt-0.5">
                GDPR / LGPD Compliance Layer
              </p>
            </div>
          </div>
          
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1.5 px-2.5 py-1 border border-[#DDD9CE] hover:bg-stone-50 text-stone-600 font-mono text-[10px] uppercase tracking-wider rounded transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{locale === "en" ? "Português" : "English"}</span>
          </button>
        </div>

        {/* Legal Text Area */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[40vh] border-b border-[#E6E2D5] text-stone-800 leading-relaxed text-xs font-sans">
          
          {/* Welcome Intro */}
          <div className="space-y-2">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900">
              {locale === "en" ? "Welcome to MyArtNotes" : "Boas-vindas ao MyArtNotes"}
            </h2>
            <p className="text-stone-650">
              {locale === "en"
                ? "Before entering your creative workspace, we need your consent regarding how we handle your personal and research data in compliance with the General Data Protection Regulation (GDPR) and the Brazilian General Data Protection Law (LGPD). At MyArtNotes, we respect artistic autonomy and authorship: your research belongs entirely to you."
                : "Antes de entrar em seu espaço de trabalho criativo, precisamos do seu consentimento sobre como lidamos com seus dados de pesquisa e pessoais em conformidade com o Regulamento Geral de Proteção de Dados (GDPR) e a Lei Geral de Proteção de Dados (LGPD). No MyArtNotes, respeitamos a autonomia e a autoria artística: sua pesquisa pertence inteiramente a você."}
            </p>
          </div>

          {/* Terms of Use */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-900" />
              <span>{locale === "en" ? "1. Terms of Use" : "1. Termos de Uso"}</span>
            </h3>
            <div className="bg-[#FAF8F3] border border-[#E6E2D5] rounded p-4 space-y-2 text-[11px] text-stone-650 max-h-[150px] overflow-y-auto">
              {locale === "en" ? (
                <>
                  <p className="font-bold">Last Updated: June 2026</p>
                  <p><strong>Artistic Authorship & Ownership:</strong> Artists own 100% of their inputs, concepts, logs, and any structured maps generated in MyArtNotes. MyArtNotes merely safeguards and structures your research; we lay no claim to your intellectual property or authorship.</p>
                  <p><strong>Platform Usage:</strong> By using MyArtNotes, you agree to engage with the tool in a secure, respectful manner. Any automated attempts to scrap other users' notebooks or interfere with platform performance are strictly prohibited.</p>
                  <p><strong>AI Assistance:</strong> AI assists you in expanding concepts and detecting hidden patterns, but never replaces human authorship. You remain the sole author of your artistic research.</p>
                </>
              ) : (
                <>
                  <p className="font-bold">Última Atualização: Junho de 2026</p>
                  <p><strong>Autoria e Propriedade Artística:</strong> Os artistas possuem 100% de seus registros, conceitos, diários e mapas gerados no MyArtNotes. O MyArtNotes apenas protege e organiza sua pesquisa; não reivindicamos propriedade intelectual ou autoria sobre seus dados.</p>
                  <p><strong>Uso da Plataforma:</strong> Ao utilizar o MyArtNotes, você concorda em usar a ferramenta de maneira segura e ética. Qualquer tentativa automatizada de minerar cadernos de outros usuários ou interferir na plataforma é estritamente proibida.</p>
                  <p><strong>Assistência de IA:</strong> A IA auxilia na expansão de conceitos e detecção de padrões, mas nunca substitui a autoria humana. Você continua sendo o único autor de sua pesquisa artística.</p>
                </>
              )}
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-900" />
              <span>{locale === "en" ? "2. Privacy Policy" : "2. Política de Privacidade"}</span>
            </h3>
            <div className="bg-[#FAF8F3] border border-[#E6E2D5] rounded p-4 space-y-3 text-[11px] text-stone-650 max-h-[180px] overflow-y-auto">
              {locale === "en" ? (
                <>
                  <p className="font-bold">Last Updated: June 2026</p>
                  <p><strong>What Personal Data We Store:</strong> We securely collect and store your basic Google Auth details (Email, Display Name, Photo URL), and the data you actively compose inside the app (Research Notebooks, Journal Entries, Concepts, Timeline, and Insights).</p>
                  <p><strong>Purposes of Processing:</strong> We process your data solely to deliver the core features of the platform (saving your logs, running AI-powered semantic maps, and organizing your portfolios). We never sell or share your personal data with third parties.</p>
                  <p><strong>Data Retention & Deletion:</strong> Your data is stored securely in our cloud database for as long as your account is active. You have the permanent right to export all your research data in structured JSON format or permanently delete your account and all associated resources at any time via your Profile Settings.</p>
                  <p><strong>AI & Third-Party APIs:</strong> Requests processed through ATLAS AI follow the platform privacy policy. No user-owned notebook content is used to train public foundational models.</p>
                </>
              ) : (
                <>
                  <p className="font-bold">Última Atualização: Junho de 2026</p>
                  <p><strong>Quais Dados Pessoais Armazenamos:</strong> Coletamos com segurança seus dados básicos de autenticação do Google (E-mail, Nome de exibição, Foto) e os dados que você cria ativamente no aplicativo (Cadernos, Diários, Conceitos, Linha do Tempo e Insights).</p>
                  <p><strong>Finalidade do Tratamento:</strong> Processamos seus dados exclusivamente para fornecer as funcionalidades da plataforma (salvar seus registros, gerar mapas semânticos por IA e organizar portfólios). Nunca vendemos ou compartilhamos seus dados com terceiros.</p>
                  <p><strong>Retenção e Exclusão de Dados:</strong> Seus dados são armazenados de forma segura em nossa nuvem enquanto sua conta estiver ativa. Você tem o direito permanente de exportar todos os seus dados de pesquisa em formato JSON ou excluir permanentemente sua conta e todos os recursos associados a qualquer momento pelas configurações de Perfil.</p>
                  <p><strong>IA e APIs de Terceiros:</strong> As solicitações processadas pela IA ATLAS seguem a política de privacidade da plataforma. Nenhum conteúdo de caderno do usuário é usado para treinar modelos públicos fundamentais.</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Consent Form Options */}
        <div className="p-6 md:p-8 space-y-5 bg-[#FAF8F3]/30 border-b border-[#E6E2D5]">
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-stone-500">
            {locale === "en" ? "Configure Your Consents" : "Configure seus Consentimentos"}
          </h3>

          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Mandatory Consent */}
            <label className="flex items-start gap-3.5 p-3 bg-white border border-[#E6E2D5] hover:border-stone-400 rounded cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => {
                  setPrivacyAccepted(e.target.checked);
                  if (e.target.checked) setErrorMsg("");
                }}
                className="mt-1 accent-stone-900 rounded cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-bold text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
                  <span>{locale === "en" ? "Mandatory Data Processing" : "Tratamento de Dados Obrigatório"}</span>
                  <span className="text-[8px] bg-red-100 text-red-700 px-1 rounded uppercase tracking-widest font-mono">
                    {locale === "en" ? "Required" : "Obrigatório"}
                  </span>
                </span>
                <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                  {locale === "en"
                    ? "I consent to the collection and processing of my personal and research data as detailed in the Privacy Policy to enable the features of MyArtNotes."
                    : "Consinto com a coleta e processamento de meus dados pessoais e de pesquisa, conforme detalhado na Política de Privacidade, para viabilizar o uso do MyArtNotes."}
                </p>
              </div>
            </label>

            {/* Optional Analytics Consent */}
            <label className="flex items-start gap-3.5 p-3 bg-white border border-[#E6E2D5] hover:border-stone-400 rounded cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={analyticsAccepted}
                onChange={(e) => setAnalyticsAccepted(e.target.checked)}
                className="mt-1 accent-stone-900 rounded cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-bold text-stone-955 uppercase tracking-wide flex items-center gap-1.5">
                  <span>{locale === "en" ? "Anonymous Usage Analytics" : "Análise de Uso Anônima"}</span>
                  <span className="text-[8px] bg-[#EFECE6] text-stone-600 px-1 rounded uppercase tracking-widest font-mono font-bold">
                    {locale === "en" ? "Optional" : "Opcional"}
                  </span>
                </span>
                <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                  {locale === "en"
                    ? "I consent to sharing anonymous telemetry to help improve MyArtNotes' performance, user interface layouts, and AI capabilities."
                    : "Consinto com o compartilhamento de telemetria de uso anônima para ajudar a aprimorar o desempenho, layouts e capacidades de IA do MyArtNotes."}
                </p>
              </div>
            </label>

            {/* Optional Product Updates */}
            <label className="flex items-start gap-3.5 p-3 bg-white border border-[#E6E2D5] hover:border-stone-400 rounded cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={productUpdatesConsent}
                onChange={(e) => setProductUpdatesConsent(e.target.checked)}
                className="mt-1 accent-stone-900 rounded cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-bold text-stone-955 uppercase tracking-wide flex items-center gap-1.5">
                  <span>{locale === "en" ? "Product Updates" : "Atualizações do Produto"}</span>
                  <span className="text-[8px] bg-[#EFECE6] text-stone-600 px-1 rounded uppercase tracking-widest font-mono font-bold">
                    {locale === "en" ? "Optional" : "Opcional"}
                  </span>
                </span>
                <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                  {locale === "en"
                    ? "Receive emails about MyArtNotes improvements, new features, beta invitations and release notes."
                    : "Receber e-mails sobre melhorias, novas funcionalidades, convites de beta e notas de lançamento do MyArtNotes."}
                </p>
              </div>
            </label>

            {/* Optional Creative Ecosystem */}
            <label className="flex items-start gap-3.5 p-3 bg-white border border-[#E6E2D5] hover:border-stone-400 rounded cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={creativeEcosystemConsent}
                onChange={(e) => setCreativeEcosystemConsent(e.target.checked)}
                className="mt-1 accent-stone-900 rounded cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-bold text-stone-955 uppercase tracking-wide flex items-center gap-1.5">
                  <span>{locale === "en" ? "Creative Ecosystem" : "Ecossistema Criativo"}</span>
                  <span className="text-[8px] bg-[#EFECE6] text-stone-600 px-1 rounded uppercase tracking-widest font-mono font-bold">
                    {locale === "en" ? "Optional" : "Opcional"}
                  </span>
                </span>
                <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                  {locale === "en"
                    ? "Receive information about other products created by the same company (for example Creative Care, Atelier Digital, Creative Challenge and future creative tools)."
                    : "Receber informações sobre outros produtos criados pela mesma empresa (por exemplo, Creative Care, Atelier Digital, Creative Challenge e futuras ferramentas criativas)."}
                </p>
              </div>
            </label>

            {/* Optional Partners */}
            <label className="flex items-start gap-3.5 p-3 bg-white border border-[#E6E2D5] hover:border-stone-400 rounded cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={partnersConsent}
                onChange={(e) => setPartnersConsent(e.target.checked)}
                className="mt-1 accent-stone-900 rounded cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-bold text-stone-955 uppercase tracking-wide flex items-center gap-1.5">
                  <span>{locale === "en" ? "Partners" : "Parceiros"}</span>
                  <span className="text-[8px] bg-[#EFECE6] text-stone-600 px-1 rounded uppercase tracking-widest font-mono font-bold">
                    {locale === "en" ? "Optional" : "Opcional"}
                  </span>
                </span>
                <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                  {locale === "en"
                    ? "Receive occasional information about carefully selected partners relevant to artistic practice, including materials, exhibitions, grants, courses and creative opportunities."
                    : "Receber informações ocasionais sobre parceiros cuidadosamente selecionados e relevantes para a prática artística, incluindo materiais, exposições, bolsas, cursos e oportunidades criativas."}
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-6 bg-[#FAF8F3]/50 flex items-center justify-between">
          <p className="text-[10px] text-stone-500 font-mono">
            {locale === "en" ? "Your consents are stored securely." : "Seus consentimentos são salvos com segurança."}
          </p>
          
          <button
            onClick={handleConfirm}
            disabled={isSaving}
            className="px-6 py-2.5 bg-stone-900 hover:bg-stone-850 disabled:opacity-50 text-white font-mono text-xs uppercase font-bold tracking-wider rounded transition-all cursor-pointer flex items-center gap-2"
          >
            {isSaving ? (
              <span>{locale === "en" ? "Saving..." : "Salvando..."}</span>
            ) : (
              <>
                <span>{locale === "en" ? "Accept & Open Notebook" : "Aceitar e Abrir Caderno"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
