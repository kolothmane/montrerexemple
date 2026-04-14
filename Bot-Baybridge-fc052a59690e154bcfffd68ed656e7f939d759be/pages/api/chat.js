import { scorePharmacies } from "../../lib/pharmacies";

// ─── Constants ────────────────────────────────────────────────────────────────
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_MESSAGES = 10;

const WELCOME_MESSAGE = `Bonjour, je suis votre assistant dédié aux délégués médicaux. Je peux vous aider à :

• **Gérer une annulation** de rendez-vous en pharmacie (alternatives proposées automatiquement)
• **Recommander des pharmacies alternatives** à proximité avec brief de visite
• **Préparer une visite** avec un brief structuré
• **Résumer une transcription** et extraire les prochaines actions
• **Transcrire un fichier audio** (utilisez le bouton 📎 pour joindre votre fichier MP3/WAV/M4A)
• **Terminer une session** et générer un résumé + log CRM

Comment puis-je vous aider aujourd'hui ?`;

// ─── Intent router ────────────────────────────────────────────────────────────
function detectIntent(message) {
  const text = message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const patterns = {
    transcription_audio: [
      "transcri", "audio", "enregistrement", "dictee", "dicter",
      "mp3", "wav", "fichier son", "ecoute", "vocal",
    ],
    annulation_rdv: [
      "annul", "rdv", "rendez-vous", "rendez vous", "reporter",
      "reprogrammer", "decaler", "deplacer", "changer le creneau",
      "changer l'heure", "annulation", "c'est annule",
    ],
    recommandation_alternative: [
      "alternative", "autre pharmacie", "pharmacie proche", "remplacer",
      "remplacement", "recommand", "suggestion", "proximite",
      "a la place", "autres options",
    ],
    preparation_visite: [
      "preparer", "preparation", "brief", "visite", "prochaine visite",
      "preparez", "contexte", "objectif", "smart", "dossier",
    ],
    suivi_transcription: [
      "resum", "synthese", "transcription", "compte rendu", "actions",
      "prochaines etapes", "extraire", "analyser", "suivre", "suivi",
    ],
    crm_logging: [
      "crm", "log", "enregistrer", "sauvegarder", "historique", "noter", "interaction",
    ],
  };

  for (const [intent, keywords] of Object.entries(patterns)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return intent;
    }
  }

  return "hors_sujet";
}

// ─── Helper: format pharmacy for prompt ───────────────────────────────────────
function formatPharmacyForPrompt(p) {
  if (!p) return { info: "Aucune pharmacie disponible dans le dataset." };
  const creneaux =
    p.creneauxDisponibles && p.creneauxDisponibles.length > 0
      ? p.creneauxDisponibles.join(", ")
      : "Aucun créneau disponible";
  return {
    nom: p.name,
    adresse: p.address,
    ville: p.city,
    distanceKm: p.distanceKm + " km",
    score: p.score,
    disponibilite: p.disponibilite ? "Disponible ✅" : "Non disponible ❌",
    creneauxDisponibles: creneaux,
    contact: p.contact,
    responsable: p.responsable,
    derniereVisite: p.derniereVisite,
    notes: p.notes,
  };
}

// ─── System prompt builder ─────────────────────────────────────────────────────
function buildSystemPrompt(intent, context) {
  const base = `Tu es "Visit Planning Service", un assistant IA professionnel pour délégués médicaux BayBridge.
RÈGLES ABSOLUES :
- Réponds UNIQUEMENT en français.
- Structure toujours tes réponses avec des sections claires (utilise **Titre :** ou des puces).
- Si une donnée est manquante, écris exactement : **Donnée manquante.**
- Ton professionnel, concis, orienté action.
- Ne jamais inventer des faits : si incertain, le dire explicitement.
- Termine toujours par une section **Prochaines étapes :** avec des actions concrètes.
- Ne jamais exposer de données techniques, d'erreurs système ou de stack traces à l'utilisateur.`;

  const intentInstructions = {
    transcription_audio: `
CONTEXTE : L'utilisateur veut transcrire un fichier audio ou dicter un contenu.
- Explique qu'il peut utiliser le bouton 📎 (pièce jointe) pour envoyer directement son fichier audio (MP3, WAV, M4A, OGG) — il sera automatiquement transcrit et analysé.
- Alternativement, il peut copier-coller le texte de sa transcription dans le chat.
- Si du texte est fourni, traite-le comme une transcription et propose les prochaines étapes.
- Structure : **Statut** | **Comment joindre un audio** | **Contenu fourni** | **Résultat** | **Prochaines étapes**`,

    annulation_rdv: `
CONTEXTE : L'utilisateur signale une annulation ou modification de rendez-vous.
- Détecte si c'est une annulation, un report ou une modification.
- Extrait : nom de la pharmacie, date/heure, motif.
- Si un champ manque, indique **Donnée manquante.** pour ce champ.

PHARMACIE RECOMMANDÉE EN PRIORITÉ (meilleur score disponibilité + distance) :
${JSON.stringify(formatPharmacyForPrompt(context.topPharmacy), null, 2)}

PHARMACIES ALTERNATIVES DE SECOURS :
${JSON.stringify((context.alternatives || []).map(formatPharmacyForPrompt), null, 2)}

INSTRUCTIONS CRITIQUES — à respecter IMPÉRATIVEMENT :
1. Confirme l'annulation détectée.
2. SANS ATTENDRE de question de l'utilisateur, propose IMMÉDIATEMENT la pharmacie recommandée avec un brief de visite complet (contexte, points de discussion clés, opportunités, objectifs SMART).
3. Vérifie et affiche les créneaux disponibles de la pharmacie recommandée.
4. Liste ensuite les 2 pharmacies alternatives avec leurs créneaux, au cas où.
5. L'agent doit proposer les alternatives de sa propre initiative — ne pas attendre l'input utilisateur.

- Structure : **Annulation confirmée** | **✅ Pharmacie recommandée + Brief de visite** | **📅 Créneaux disponibles** | **🔀 2 Pharmacies alternatives** | **Prochaines étapes**`,

    recommandation_alternative: `
CONTEXTE : L'utilisateur cherche des pharmacies alternatives.

PHARMACIE RECOMMANDÉE EN PRIORITÉ (meilleur score disponibilité + distance) :
${JSON.stringify(formatPharmacyForPrompt(context.topPharmacy), null, 2)}

PHARMACIES ALTERNATIVES DE SECOURS :
${JSON.stringify((context.alternatives || []).map(formatPharmacyForPrompt), null, 2)}

- Méthodologie de scoring : Distance 30%, Demande locale 20%, Historique interactions 15%, Disponibilité 35%.
- Présente d'abord la pharmacie recommandée avec score et créneaux disponibles.
- Génère un brief de visite rapide pour la pharmacie recommandée.
- Liste ensuite les 2 alternatives avec leurs créneaux.
- L'agent propose les alternatives sans attendre l'input utilisateur.
- Structure : **Méthodologie** | **✅ Pharmacie recommandée + Brief** | **📅 Créneaux** | **🔀 2 Alternatives** | **Prochaines étapes**`,

    preparation_visite: `
CONTEXTE : L'utilisateur veut préparer une visite en pharmacie.
- Génère un brief de visite structuré.
- Si l'identifiant ou le nom de la pharmacie n'est pas fourni, demande-le explicitement.
- Inclure : contexte, points de discussion clés, opportunités, risques potentiels, objectifs SMART.
- Signale toutes les données manquantes.
- Structure : **Contexte** | **Points de discussion** | **Opportunités** | **Risques** | **Objectifs SMART** | **Prochaines étapes**`,

    suivi_transcription: `
CONTEXTE : L'utilisateur veut résumer une transcription et extraire les prochaines actions.
- Si aucune transcription n'est fournie, demande à l'utilisateur de la coller dans le chat ou d'utiliser le bouton 📎 pour joindre un fichier audio.
- Si du texte est fourni, résume-le et extrais les actions.
- Structure : **Résumé exécutif** | **Décisions prises** | **Objections soulevées** | **Engagements** | **Prochaines actions** (avec échéances si mentionnées)`,

    crm_logging: `
CONTEXTE : L'utilisateur veut créer un log CRM.
- Valide les champs obligatoires : type interaction, date/heure, pharmacie, participants.
- Utilise [À COMPLÉTER] pour les données manquantes.
- Confirme ce qui sera enregistré avant de procéder.
- Structure : **Validation** | **Données à enregistrer** | **Champs manquants** | **Prochaines étapes**`,

    fin_visite: `
CONTEXTE : La session de visite est terminée. Tu dois générer un résumé complet de la session ET simuler la création d'un log CRM.

SECTION 1 — RÉSUMÉ DE LA VISITE :
- Synthèse des échanges clés de la conversation
- Pharmacies mentionnées ou visitées
- Décisions prises et engagements
- Points d'attention identifiés

SECTION 2 — SIMULATION LOG CRM :
- Génère une référence CRM unique : format CRM-YYYYMMDD-XXXX (utilise la date du jour et 4 chiffres)
- Extrais les données de la conversation pour remplir le log
- Affiche un message de confirmation clair : ✅ Log CRM enregistré avec succès
- Champs du log : Référence, Date/Heure, Durée estimée, Type d'interaction, Pharmacie(s), Responsable(s), Statut, Résumé, Actions suivantes

Structure :
**📋 Résumé de la visite**
[synthèse]

**✅ Log CRM créé avec succès**
| Champ | Valeur |
|-------|--------|
| Référence | CRM-... |
| Date/Heure | ... |
[etc.]

**Prochaines étapes :**
[actions concrètes post-visite]`,

    hors_sujet: `
CONTEXTE : La demande est hors du périmètre de l'assistant.
- Réponds poliment que tu ne peux pas traiter cette demande.
- Redirige vers les services disponibles : annulation RDV, recommandation alternative, préparation visite, résumé transcription, transcription audio (via bouton 📎), log CRM, fin de session.
- Ne réponds pas à des questions sans lien avec la visite médicale ou la pharmacie.`,
  };

  return base + "\n" + (intentInstructions[intent] || intentInstructions.hors_sujet);
}

// ─── Gemini API call ──────────────────────────────────────────────────────────
async function callGemini(systemPrompt, conversationHistory) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const contents = conversationHistory.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1500,
        topP: 0.8,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Gemini API error:", response.status, errorBody);
    throw new Error("Gemini API responded with status " + response.status);
  }

  const data = await response.json();

  const candidate = data?.candidates?.[0];
  if (!candidate || candidate.finishReason === "SAFETY") {
    throw new Error("Response blocked or empty from Gemini.");
  }

  return candidate.content?.parts?.[0]?.text || "";
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message, history = [] } = req.body;

  // Input validation
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message invalide." });
  }
  if (message.trim().length === 0) {
    return res.status(400).json({ error: "Le message ne peut pas être vide." });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      error: "Message trop long. Maximum " + MAX_MESSAGE_LENGTH + " caractères.",
    });
  }
  if (!Array.isArray(history)) {
    return res.status(400).json({ error: "Historique invalide." });
  }

  // Welcome message shortcut (no Gemini call needed)
  if (message.trim() === "__WELCOME__") {
    return res.status(200).json({ reply: WELCOME_MESSAGE, intent: "welcome" });
  }

  // End-chat: generate visit summary + CRM log simulation
  if (message.trim() === "__END_CHAT__") {
    const conversationHistory = history.slice(-MAX_HISTORY_MESSAGES);
    const systemPrompt = buildSystemPrompt("fin_visite", {});
    try {
      const reply = await callGemini(systemPrompt, conversationHistory);
      return res.status(200).json({ reply, intent: "fin_visite" });
    } catch (err) {
      console.error("End-chat handler error:", err.message);
      return res.status(200).json({
        reply:
          "⚠️ **Impossible de générer le résumé de session.**\n\nVeuillez réessayer ou contacter le support BayBridge.\n\n**Prochaines étapes :** Notez manuellement les points clés de la visite dans votre CRM.",
        intent: "fin_visite",
      });
    }
  }

  // Detect intent
  const intent = detectIntent(message);

  // Build context — pharmacies for RDV-related intents
  const context = {};
  if (intent === "annulation_rdv" || intent === "recommandation_alternative") {
    const top3 = scorePharmacies({ limit: 3 });
    const topPharmacy = top3.find((p) => p.disponibilite) || top3[0];
    const alternatives = top3.filter((p) => p.id !== topPharmacy.id).slice(0, 2);
    context.topPharmacy = topPharmacy;
    context.alternatives = alternatives;
  }

  // Build conversation with new user message appended
  const conversationHistory = [
    ...history.slice(-MAX_HISTORY_MESSAGES),
    { role: "user", content: message },
  ];

  const systemPrompt = buildSystemPrompt(intent, context);

  try {
    const reply = await callGemini(systemPrompt, conversationHistory);

    if (!reply || reply.trim() === "") {
      return res.status(200).json({
        reply: "Je suis désolé, je n'ai pas pu générer une réponse. Veuillez réessayer.",
        intent,
      });
    }

    return res.status(200).json({ reply, intent });
  } catch (err) {
    console.error("Chat handler error:", err.message);

    return res.status(200).json({
      reply:
        "⚠️ **Service temporairement indisponible.**\n\nJe rencontre une difficulté technique. Veuillez réessayer dans quelques instants.\n\n**Prochaines étapes :** Si le problème persiste, contactez le support BayBridge.",
      intent: "error",
    });
  }
}
