// ─── Constants ────────────────────────────────────────────────────────────────
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// Increase body size limit to 20 MB for base64-encoded audio files
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

const SYSTEM_PROMPT = `Tu es "Visit Planning Service", un assistant IA professionnel pour délégués médicaux BayBridge.
RÈGLES ABSOLUES :
- Réponds UNIQUEMENT en français.
- Structure toujours tes réponses avec des sections claires (utilise **Titre :** ou des puces).
- Ton professionnel, concis, orienté action.
- Ne jamais inventer des faits : si incertain, le dire explicitement.
- Termine toujours par une section **Prochaines étapes :** avec des actions concrètes.

CONTEXTE : Tu viens de recevoir un fichier audio d'un délégué médical (appel téléphonique, dictée ou enregistrement terrain).
Ta mission est en deux étapes :

1. **Transcrire** intégralement le contenu audio en français.
2. **Analyser** automatiquement la transcription et produire un résumé structuré de la visite.

Structure de ta réponse :

**🎙️ Transcription :**
[transcription complète et fidèle du contenu audio]

**📋 Résumé de la visite :**
[résumé exécutif en 3-5 phrases]

**✅ Décisions prises :**
[liste des décisions ou engagements mentionnés]

**📌 Objections / points de friction :**
[liste des objections ou difficultés soulevées, ou "Aucune mentionnée"]

**🔜 Actions à suivre :**
[liste numérotée des actions avec responsable si mentionné]

**Prochaines étapes :**
[2-3 actions concrètes immédiates]`;

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fileName, mimeType, audioBase64 } = req.body;

  if (!audioBase64 || typeof audioBase64 !== "string") {
    return res.status(400).json({ error: "Données audio manquantes." });
  }
  if (!mimeType || typeof mimeType !== "string") {
    return res.status(400).json({ error: "Type MIME manquant." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not configured.");
    return res.status(500).json({
      reply:
        "⚠️ **Service de transcription non configuré.** Contactez le support BayBridge.",
    });
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: audioBase64,
                },
              },
              {
                text: `Transcris et analyse cet enregistrement audio${fileName ? ` ("${fileName}")` : ""}. Fournis la transcription complète suivie du résumé structuré de la visite.`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
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
      console.error("Gemini transcribe error:", response.status, errorBody);
      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];

    if (!candidate || candidate.finishReason === "SAFETY") {
      throw new Error("Response blocked or empty from Gemini.");
    }

    const reply = candidate.content?.parts?.[0]?.text || "";

    if (!reply.trim()) {
      throw new Error("Empty reply from Gemini.");
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Transcribe handler error:", err.message);
    return res.status(200).json({
      reply:
        "⚠️ **Transcription impossible.**\n\nLe fichier audio n'a pas pu être traité. Vérifiez le format (MP3, WAV, M4A, OGG) et la taille (< 20 Mo).\n\n**Prochaines étapes :** Vous pouvez copier-coller directement le texte de votre transcription dans le chat.",
    });
  }
}
