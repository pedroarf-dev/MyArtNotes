import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../lib/firebase";
import { BookOpen, AlertCircle, Loader2 } from "lucide-react";
import { useTranslation } from "../lib/i18n";

interface AuthAndOnboardingProps {
  onAuthSuccess: (user: any) => void;
}

export default function AuthAndOnboarding({ onAuthSuccess }: AuthAndOnboardingProps) {
  const { t, locale } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGoogleSignIn = async () => {
    console.log("[AUTH] login button clicked");
    setErrorMsg("");
    setIsLoading(true);
    console.log("[AUTH] popup opened - Initiating Google Sign-In popup flow...");
    
    const provider = new GoogleAuthProvider();
    // Custom parameters to force account selection if desired
    provider.setCustomParameters({
      prompt: "select_account"
    });

    try {
      const result = await signInWithPopup(auth, provider);
      console.log(`[AUTH] firebase user returned: ${result.user.uid} (${result.user.email})`);
      onAuthSuccess(result.user);
    } catch (err: any) {
      console.error("[AUTH] Google Sign-In error:", err);
      if (err.code === "auth/popup-blocked") {
        setErrorMsg(
          locale === "en"
            ? "The Google sign-in window was blocked by your browser. Please check your browser's address bar settings to allow popups, or try opening this application in a new tab."
            : "A janela de login do Google foi bloqueada pelo seu navegador. Por favor, verifique suas configurações de pop-up ou tente abrir este aplicativo em uma nova aba."
        );
      } else if (err.code === "auth/popup-closed-by-user") {
        setErrorMsg(
          locale === "en"
            ? "The sign-in window was closed before completing the authentication process. Please try again."
            : "A janela de login foi fechada antes da conclusão do processo de autenticação. Por favor, tente novamente."
        );
      } else if (err.code === "auth/cancelled-popup-request") {
        setErrorMsg(
          locale === "en"
            ? "Another popup request was initiated. Please wait or try refreshing."
            : "Outra solicitação de login foi iniciada. Por favor, aguarde ou recarregue a página."
        );
      } else if (err.code === "auth/operation-not-allowed") {
        setErrorMsg(
          locale === "en"
            ? "Google Sign-In is not enabled in your Firebase Auth configuration. Please enable Google provider in the Firebase Console."
            : "O login do Google não está ativado na sua configuração do Firebase Auth. Por favor, ative o provedor Google no Console do Firebase."
        );
      } else {
        setErrorMsg(err.message || (locale === "en" ? "An unexpected error occurred during Google Sign-In." : "Ocorreu um erro inesperado durante o login com o Google."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] text-stone-900 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-8 animate-fadeIn">
        {/* Logo Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#EFECE6] border border-[#DDD9CE] text-stone-700">
            <BookOpen className="w-5 h-5 text-stone-650" />
          </div>
          <div>
            <h1 className="text-2xl font-mono tracking-tight text-stone-900 font-bold">
              {t.welcomeTitle}
            </h1>
            <p className="text-xs font-mono uppercase tracking-widest text-stone-500 mt-1">
              {t.welcomeSubtitle}
            </p>
          </div>
        </div>

        {/* Central Card */}
        <div className="bg-[#FAF8F3] border border-[#E6E2D5] rounded-lg p-8 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-6 text-left">
          <div className="space-y-2">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-stone-800">
              {locale === "en" ? "Access Your Studio Notebook" : "Acessar seu Caderno de Ateliê"}
            </h2>
            <p className="text-xs text-stone-650 leading-relaxed font-sans">
              {t.welcomeDesc1} {t.welcomeDesc2}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-50/50 border border-red-200 rounded flex items-start gap-2.5 text-xs font-sans text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold block mb-0.5">
                  {locale === "en" ? "Authentication Failed" : "Falha na Autenticação"}
                </span>
                {errorMsg}
              </div>
            </div>
          )}

          {/* Single Unified Sign-In Action */}
          <div className="pt-2">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-850 text-white font-mono text-xs font-bold rounded cursor-pointer transition-all shadow-xs flex items-center justify-center gap-3 disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-stone-300" />
                  <span>
                    {locale === "en" ? "Connecting Secure Session..." : "Conectando Sessão Segura..."}
                  </span>
                </>
              ) : (
                <>
                  {/* Embedded Custom Google Icon SVG */}
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{t.signInGoogle}</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-3.5 border-t border-[#EFECE6] text-[10px] text-stone-550 font-sans leading-relaxed text-center">
            {locale === "en"
              ? "Google authentication provides single-click, zero-password entry to secure your private research data across devices."
              : "A autenticação do Google oferece acesso com um clique, sem senha, para proteger seus dados de pesquisa privados em qualquer dispositivo."}
          </div>
        </div>

        {/* Minimal aesthetic label */}
        <div className="text-[10px] font-mono text-stone-400 tracking-wider">
          {locale === "en"
            ? "MyArtNotes — STUDIO COMPANION"
            : "MyArtNotes — ACOMPANHANTE DE ATELIÊ"}
        </div>
      </div>
    </div>
  );
}
