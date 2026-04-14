import { useState, useRef, useEffect, useCallback } from "react";

const MAX_HISTORY_MESSAGES = 10;
const MIN_TYPING_MS = 1500; // minimum time to show typing indicator for first message
const JOIN_NOTICE_DELAY_MS = 2000; // delay before showing "agent joined" notice

/** Polyfill for crypto.randomUUID in environments that don't support it */
function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(date) {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date) {
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  return isToday ? "Aujourd'hui" : date.toLocaleDateString("fr-FR");
}

/** Convert simple markdown bold/bullets to JSX */
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={j} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
    return (
      <span key={i}>
        {parts}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}


// ─── File helpers ──────────────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // result is "data:<mime>;base64,<data>" — strip the prefix
      const result = reader.result;
      const commaIndex = result.indexOf(",");
      if (commaIndex === -1) {
        reject(new Error("Unexpected FileReader result format."));
        return;
      }
      resolve(result.slice(commaIndex + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getAudioMimeType(file) {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop().toLowerCase();
  const mimeMap = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    ogg: "audio/ogg",
    aac: "audio/aac",
    flac: "audio/flac",
    webm: "audio/webm",
  };
  return mimeMap[ext] || "audio/mpeg";
}

const AUDIO_EXTENSIONS = /\.(mp3|wav|m4a|ogg|aac|flac|webm)$/i;

function isAudioFile(file) {
  return file.type.startsWith("audio/") || AUDIO_EXTENSIONS.test(file.name);
}

// ─── VP Avatar ────────────────────────────────────────────────────────────────
function Avatar({ small = false }) {
  const size = small ? "w-7 h-7 text-xs" : "w-8 h-8 text-xs";
  return (
    <div
      className={`${size} rounded-full bg-slate-500 text-white flex items-center justify-center font-semibold shrink-0`}
    >
      VP
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator({ label = "Visit Planning Service" }) {
  return (
    <div className="flex items-end gap-2 mb-4">
      <Avatar />
      <div className="flex flex-col gap-1">
        <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
        <span className="text-[11px] text-gray-400 ml-1">{label}</span>
      </div>
    </div>
  );
}

// ─── Single message bubble ────────────────────────────────────────────────────
function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const timeStr = formatTime(new Date(message.timestamp));

  if (isUser) {
    return (
      <div className="flex flex-col items-end mb-4">
        <div className="bg-teal-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[78%] text-sm leading-relaxed">
          {message.content}
        </div>
        <span className="text-[11px] text-gray-400 mt-1 mr-1">
          Vous • {timeStr}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 mb-4">
      <Avatar />
      <div className="flex flex-col gap-1 max-w-[78%]">
        <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed">
          {renderMarkdown(message.content)}
        </div>
        <span className="text-[11px] text-gray-400 ml-1">
          Visit Planning Service • {timeStr}
        </span>
      </div>
    </div>
  );
}

// ─── Date separator ──────────────────────────────────────────────────────────
function DateSeparator({ date }) {
  return (
    <div className="flex items-center gap-2 my-4">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-[11px] text-gray-400 whitespace-nowrap">
        {formatDate(new Date(date))} • {formatTime(new Date(date))}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

// ─── Main ChatWidget ──────────────────────────────────────────────────────────
export default function ChatWidget({ initialOpen = false, onOpenChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingLabel, setTypingLabel] = useState("Visit Planning Service");
  const [sessionStart] = useState(() => new Date().toISOString());
  const [hasWelcomed, setHasWelcomed] = useState(false);
  const [error, setError] = useState(null);
  const [showJoinNotice, setShowJoinNotice] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isChatEnded, setIsChatEnded] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, isMinimized]);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    if (!showMenu) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  // Fetch welcome message when first opened
  const fetchWelcome = useCallback(async () => {
    if (hasWelcomed) return;
    setHasWelcomed(true);

    // Show "agent joined" notice after a 2-second delay
    setTimeout(() => setShowJoinNotice(true), JOIN_NOTICE_DELAY_MS);

    const startTime = Date.now();
    setTypingLabel("Visit Planning Service");
    setIsTyping(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "__WELCOME__", history: [] }),
      });
      const data = await res.json();

      // Ensure typing indicator is visible for at least MIN_TYPING_MS
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_TYPING_MS) {
        await new Promise((r) => setTimeout(r, MIN_TYPING_MS - elapsed));
      }

      setMessages([
        {
          id: generateId(),
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_TYPING_MS) {
        await new Promise((r) => setTimeout(r, MIN_TYPING_MS - elapsed));
      }
      setMessages([
        {
          id: generateId(),
          role: "assistant",
          content:
            "Bonjour, je suis votre assistant Visit Planning. Comment puis-je vous aider ?",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [hasWelcomed]);

  // Open handler (floating button)
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    fetchWelcome();
  }, [fetchWelcome]);

  // Sync external open trigger from CTA buttons on landing page
  useEffect(() => {
    if (initialOpen && !isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
      fetchWelcome();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (onOpenChange) onOpenChange(false);
  }, [onOpenChange]);

  // End chat: request summary + CRM log then mark session as ended
  const handleEndChat = useCallback(async () => {
    setShowMenu(false);
    if (isTyping || isChatEnded) return;
    setIsChatEnded(true);
    setTypingLabel("Génération du résumé et log CRM...");
    setIsTyping(true);

    const history = messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "__END_CHAT__", history }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content:
            "⚠️ **Impossible de générer le résumé.** Veuillez réessayer ou contacter le support BayBridge.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
      setTypingLabel("Visit Planning Service");
    }
  }, [isTyping, isChatEnded, messages]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping || isChatEnded) return;
    setError(null);

    const userMessage = {
      id: generateId(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTypingLabel("Visit Planning Service");
    setIsTyping(true);

    // Build history for API (last 10 messages)
    const history = messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur réseau");
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      setError("Impossible de contacter l'assistant. Vérifiez votre connexion.");
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content:
            "⚠️ **Service temporairement indisponible.**\n\nJe rencontre une difficulté technique. Veuillez réessayer dans quelques instants.\n\n**Prochaines étapes :** Si le problème persiste, contactez le support BayBridge.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, isChatEnded, messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // File attachment handler — audio files are transcribed via Gemini
  const handleFileChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = ""; // reset so the same file can be re-selected

      if (isAudioFile(file)) {
        // Show attachment notice from user
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "user",
            content: `🎙️ Fichier audio joint : ${file.name}`,
            timestamp: new Date().toISOString(),
          },
        ]);

        setTypingLabel("Transcription audio en cours...");
        setIsTyping(true);

        try {
          const base64 = await fileToBase64(file);
          const mimeType = getAudioMimeType(file);

          const res = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileName: file.name, mimeType, audioBase64: base64 }),
          });

          if (!res.ok) throw new Error("Transcription failed");
          const data = await res.json();

          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: "assistant",
              content: data.reply,
              timestamp: new Date().toISOString(),
            },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              role: "assistant",
              content:
                "⚠️ **Transcription impossible.**\n\nLe fichier audio n'a pas pu être traité. Vérifiez le format (MP3, WAV, M4A, OGG) et la taille (< 20 Mo).\n\n**Prochaines étapes :** Vous pouvez copier-coller directement le texte de votre transcription dans le chat.",
              timestamp: new Date().toISOString(),
            },
          ]);
        } finally {
          setIsTyping(false);
          setTypingLabel("Visit Planning Service");
        }
      } else {
        // Non-audio file: just display as an attachment message
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "user",
            content: `📎 Fichier joint : ${file.name}`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    },
    // isTyping / isChatEnded are guarded via the disabled prop on the button
    []
  );

  // ── Floating button (chat closed) ────────────────────────────────────────────
  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200"
        aria-label="Ouvrir l'assistant Visit Planning"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>
    );
  }

  // ── Chat panel ────────────────────────────────────────────────────────────────
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 ease-in-out
        ${isMinimized ? "h-14 w-80" : "h-[600px]"}
        w-[380px] sm:w-[380px] max-w-[calc(100vw-24px)]`}
      style={{ maxHeight: "calc(100vh - 48px)" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 rounded-t-2xl bg-white shrink-0">
        {/* 3-dots menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Menu"
            aria-haspopup="true"
            aria-expanded={showMenu}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={handleEndChat}
                disabled={isChatEnded}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                </svg>
                {isChatEnded ? "Session terminée" : "Terminer la session"}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">
            Visit Planning Service
          </p>
          {!isMinimized && (
            <p className={`text-[11px] font-medium flex items-center gap-1 ${isChatEnded ? "text-gray-400" : "text-emerald-500"}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${isChatEnded ? "bg-gray-400" : "bg-emerald-500"}`} />
              {isChatEnded ? "Session terminée" : "En ligne"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized((v) => !v)}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label={isMinimized ? "Agrandir" : "Réduire"}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isMinimized ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Fermer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* ── Messages area ── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth">
            {/* Session start separator */}
            <DateSeparator date={sessionStart} />

            {/* Agent joined notice — appears after JOIN_NOTICE_DELAY_MS */}
            {showJoinNotice && (
              <div className="flex items-center gap-2 mb-4 text-[11px] text-gray-400">
                <Avatar small />
                <span>
                  Visit Planning Service a rejoint •{" "}
                  {formatTime(new Date(sessionStart))}
                </span>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isTyping && <TypingIndicator label={typingLabel} />}

            {error && (
              <div className="text-[11px] text-red-500 text-center my-2 px-2">
                {error}
              </div>
            )}

            {isChatEnded && !isTyping && (
              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-400 whitespace-nowrap">Session terminée</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Input area ── */}
          <div className="px-4 py-3 border-t border-gray-200 shrink-0 bg-white rounded-b-2xl">
            <div className="flex items-center gap-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac,.flac,.webm"
                className="hidden"
                onChange={handleFileChange}
                disabled={isTyping || isChatEnded}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isTyping || isChatEnded}
                className="p-2 text-gray-400 hover:text-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                aria-label="Joindre un fichier ou audio"
                title="Joindre un fichier (audio automatiquement transcrit)"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isChatEnded ? "Session terminée" : "Tapez votre message..."}
                maxLength={2000}
                disabled={isTyping || isChatEnded}
                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping || isChatEnded}
                className="p-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0"
                aria-label="Envoyer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Propulsé par BayBridge Visit Planning Service
            </p>
          </div>
        </>
      )}
    </div>
  );
}
