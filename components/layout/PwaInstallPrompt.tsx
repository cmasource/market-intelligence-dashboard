"use client";

import { Download, Info, MoreVertical, Share, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/useLanguage";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "cma-pwa-install-dismissed";

function isIosDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isAndroidDevice() {
  return /Android/i.test(navigator.userAgent);
}

function detectIosSafari() {
  return !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|Instagram|FBAN|FBAV|WhatsApp/i.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
}

export function PwaInstallPrompt() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [promptMode, setPromptMode] = useState<"ios" | "android" | "android-manual" | null>(null);
  const [isSafariBrowser, setIsSafariBrowser] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    }

    if (isStandalone() || sessionStorage.getItem(DISMISS_KEY) === "1") return;

    const ios = isIosDevice();
    if (ios) {
      const timer = window.setTimeout(() => {
        setIsSafariBrowser(detectIosSafari());
        setPromptMode("ios");
        setVisible(true);
      }, 900);
      return () => window.clearTimeout(timer);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptMode("android");
      setInstallEvent(event as InstallPromptEvent);
      setVisible(true);
    };
    const handleAppInstalled = () => {
      setInstallEvent(null);
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    const androidGuideTimer = isAndroidDevice()
      ? window.setTimeout(() => {
          setPromptMode((current) => {
            if (current) return current;
            setVisible(true);
            return "android-manual";
          });
        }, 1400)
      : undefined;
    return () => {
      if (androidGuideTimer) window.clearTimeout(androidGuideTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  async function install() {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") dismiss();
    setInstallEvent(null);
  }

  if (!visible) return null;

  return (
    <aside
      role="dialog"
      aria-label={isSpanish ? "Instalar CMA Markets" : "Install CMA Markets"}
      className="cma-pwa-install-panel fixed inset-x-4 bottom-4 z-[60] rounded-xl border border-cyan-300/30 bg-slate-950/95 p-4 text-slate-100 shadow-2xl shadow-black/40 sm:left-auto sm:w-[min(27rem,calc(100vw-2rem))]"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-cyan-200">
          <Smartphone size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{isSpanish ? "Lleva CMA Markets con vos" : "Take CMA Markets with you"}</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            {isSpanish ? "Instala el acceso directo para consultar mercados desde la pantalla de inicio." : "Install a shortcut to check markets from your home screen."}
          </p>
        </div>
        <button type="button" onClick={dismiss} aria-label={isSpanish ? "Cerrar" : "Close"} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white">
          <X size={17} aria-hidden="true" />
        </button>
      </div>

      {promptMode === "ios" ? (
        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-slate-300">
          <p className="flex items-start gap-2 font-medium text-white"><Info size={15} className="mt-0.5 shrink-0 text-cyan-200" aria-hidden="true" />{isSafariBrowser ? (isSpanish ? "En Safari para iPhone:" : "In Safari on iPhone:") : (isSpanish ? "Primero abre esta pagina en Safari:" : "First open this page in Safari:")}</p>
          {isSafariBrowser ? (
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li className="flex items-center gap-1.5">{isSpanish ? "Toca" : "Tap"} <Share size={13} aria-hidden="true" /> {isSpanish ? "Compartir." : "Share."}</li>
              <li>{isSpanish ? "Elige Agregar a inicio." : "Choose Add to Home Screen."}</li>
              <li>{isSpanish ? "Confirma con Agregar." : "Confirm with Add."}</li>
            </ol>
          ) : (
            <p className="mt-2">{isSpanish ? "Usa Compartir y elige Abrir en Safari. Luego toca Compartir, Agregar a inicio y confirma." : "Use Share and choose Open in Safari. Then tap Share, Add to Home Screen, and confirm."}</p>
          )}
        </div>
      ) : promptMode === "android-manual" ? (
        <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-slate-300">
          <p className="flex items-start gap-2 font-medium text-white"><Info size={15} className="mt-0.5 shrink-0 text-cyan-200" aria-hidden="true" />{isSpanish ? "En Chrome para Android:" : "In Chrome for Android:"}</p>
          <p className="mt-2">{isSpanish ? "Abre el menu de tres puntos y elige Instalar aplicacion o Agregar a pantalla de inicio." : "Open the three-dot menu and choose Install app or Add to Home screen."}</p>
          <MoreVertical size={16} className="mt-2 text-cyan-200" aria-hidden="true" />
        </div>
      ) : (
        <button type="button" onClick={() => void install()} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">
          <Download size={17} aria-hidden="true" />
          {isSpanish ? "Instalar CMA Markets" : "Install CMA Markets"}
        </button>
      )}
    </aside>
  );
}
