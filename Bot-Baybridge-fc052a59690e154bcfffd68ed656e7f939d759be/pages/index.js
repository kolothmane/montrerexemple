import dynamic from "next/dynamic";
import Head from "next/head";
import { useState } from "react";

// Load ChatWidget client-side only (uses browser APIs)
const ChatWidget = dynamic(() => import("../components/ChatWidget"), {
  ssr: false,
});

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, description }) {
  return (
    <div className="flex flex-col items-start gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 text-base mb-1">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ─── Step card ────────────────────────────────────────────────────────────────
function StepCard({ number, title, description }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 text-sm mb-1">{title}</h4>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);

  const handleStartChat = () => {
    setChatOpen(true);
  };

  return (
    <>
      <Head>
        <title>BayBridge — Assistant Visit Planning</title>
        <meta
          name="description"
          content="L'assistant intelligent pour délégués médicaux BayBridge. Gérez vos visites pharmacies, annulations et transcriptions en quelques secondes."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50 font-sans">
        {/* ── Navigation ── */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="font-bold text-gray-900 text-lg tracking-tight">BayBridge</span>
            </div>
            <button
              onClick={handleStartChat}
              className="hidden sm:flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Démarrer l&apos;assistant
            </button>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
            <span className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block" />
              Assistant IA • Délégués médicaux
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
              Optimisez chaque
              <br />
              <span className="text-teal-600">visite pharmacie</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-10">
              Gérez annulations, recommandations alternatives et préparations de
              visite en quelques secondes grâce à votre assistant intelligent
              dédié.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleStartChat}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-md shadow-teal-200 text-base"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Démarrer avec l&apos;assistant
              </button>
              <a
                href="#comment-ca-marche"
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-gray-600 hover:text-teal-600 font-medium px-8 py-3.5 rounded-xl border border-gray-200 hover:border-teal-200 transition-colors text-base"
              >
                En savoir plus
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* ── Value proposition ── */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Tout ce dont vous avez besoin sur le terrain
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Un assistant conçu pour les contraintes réelles des délégués
                médicaux.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
                title="Gestion d'annulations"
                description="Analysez instantanément une annulation de rendez-vous, extrayez la pharmacie, la date et le motif, et recevez des prochaines étapes claires."
              />
              <FeatureCard
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
                title="Recommandations alternatives"
                description="Obtenez instantanément le Top 3 des pharmacies proches avec un scoring pondéré : distance, demande, historique et disponibilité."
              />
              <FeatureCard
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                title="Préparation de visite"
                description="Générez un brief structuré avec contexte, points de discussion, opportunités, risques et objectifs SMART avant chaque visite."
              />
              <FeatureCard
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                }
                title="Transcription & résumé"
                description="Collez ou dictez le contenu d'un appel pour obtenir un résumé exécutif, les décisions prises et les actions à suivre."
              />
              <FeatureCard
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                }
                title="Log CRM automatique"
                description="Créez automatiquement un log CRM structuré avec toutes les informations de l'interaction, prêt à être importé."
              />
              <FeatureCard
                icon={
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
                title="Sécurisé & confidentiel"
                description="Clé API uniquement côté serveur, aucune donnée exposée au frontend. Session en mémoire, aucune persistance sans votre accord."
              />
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="comment-ca-marche" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Comment ça marche ?
                </h2>
                <p className="text-gray-500 mb-10 leading-relaxed">
                  L&apos;assistant analyse votre message, détecte votre intention et
                  orchestre la réponse la plus pertinente via Gemini AI.
                </p>
                <div className="space-y-8">
                  <StepCard
                    number="1"
                    title="Décrivez votre besoin"
                    description="Tapez votre message en langage naturel : annulation, recherche de pharmacie, préparation de visite…"
                  />
                  <StepCard
                    number="2"
                    title="Détection d'intention automatique"
                    description="L'assistant analyse votre message côté serveur et route vers le module approprié (annulation, recommandation, brief…)."
                  />
                  <StepCard
                    number="3"
                    title="Réponse structurée & actions"
                    description="Vous recevez une réponse claire avec sections, données manquantes signalées et prochaines étapes concrètes."
                  />
                </div>
              </div>

              {/* Preview mockup */}
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                  {/* Chat header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center text-white text-xs font-bold">VP</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Visit Planning Service</p>
                      <p className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        En ligne
                      </p>
                    </div>
                    <div className="ml-auto">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {/* Sample messages */}
                  <div className="px-4 py-5 space-y-4 bg-gray-50/50">
                    <div className="flex items-end gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">VP</div>
                      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-gray-800 max-w-[80%] leading-relaxed">
                        Bonjour, je suis votre assistant Visit Planning. Comment puis-je vous aider ?
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-teal-600 text-white rounded-2xl rounded-br-sm px-3 py-2 text-xs max-w-[80%] leading-relaxed">
                        La pharmacie des Arts a annulé notre RDV de demain matin.
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">VP</div>
                      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2 text-xs text-gray-800 max-w-[80%] leading-relaxed">
                        <strong>Annulation détectée ✓</strong><br />
                        Pharmacie : Pharmacie des Arts<br />
                        Date : Demain matin<br />
                        Motif : <span className="text-amber-600">Donnée manquante.</span>
                      </div>
                    </div>
                  </div>
                  {/* Input */}
                  <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
                    <div className="flex-1 text-xs text-gray-400 border border-gray-200 rounded-xl px-3 py-2">
                      Tapez votre message...
                    </div>
                    <div className="w-8 h-8 bg-teal-600 rounded-xl flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 bg-teal-600">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Prêt à optimiser vos visites ?
            </h2>
            <p className="text-teal-100 mb-8 max-w-lg mx-auto">
              Démarrez immédiatement, sans inscription. L&apos;assistant est
              disponible en bas à droite de l&apos;écran.
            </p>
            <button
              onClick={handleStartChat}
              className="inline-flex items-center gap-2 bg-white text-teal-700 hover:bg-teal-50 active:scale-95 font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg text-base"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Démarrer avec l&apos;assistant
            </button>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="bg-gray-900 text-gray-400 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-teal-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-white">BayBridge</span>
            </div>
            <p className="text-xs text-center">
              © {new Date().getFullYear()} BayBridge Visit Planning Service. Solution de démonstration.
            </p>
            <p className="text-xs">Propulsé par Gemini AI</p>
          </div>
        </footer>
      </div>

      {/* ── Chat widget (floating) ── */}
      <ChatWidget initialOpen={chatOpen} onOpenChange={(v) => !v && setChatOpen(false)} />
    </>
  );
}
