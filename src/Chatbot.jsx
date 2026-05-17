// src/Chatbot.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from './theme';

const API_URL = import.meta.env.VITE_CHATBOT_API_URL;

const SUGGESTED_PROMPTS = [
  "What did Rosa learn from her mother?",
  "Tell me about a story involving a refugee camp",
  "Whose grandson runs his deli now?",
  "Are there stories about brothers helping each other?",
];

// Turn "s3://bucket/rosa-mendez.txt" or "rosa-mendez.txt" into "Rosa Mendez"
function formatSourceName(raw) {
  if (!raw) return 'Archive story';
  const filename = String(raw).split('/').pop().replace(/\.txt$/i, '');
  if (!filename) return 'Archive story';
  return filename
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export default function Chatbot() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    if (!API_URL) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content:
            "Chatbot isn't configured. Set VITE_CHATBOT_API_URL in .env.local and restart the dev server.",
          error: true,
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: 'assistant',
            content: data.error,
            error: true,
          },
        ]);
      } else {
        const sources = Array.isArray(data.sources)
          ? data.sources.map((s) => ({ name: formatSourceName(s), raw: s }))
          : [];
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: 'assistant',
            content: data.answer || "I couldn't find an answer in the archive.",
            sources,
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: "I couldn't reach the archive just now. Please try again in a moment.",
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    sendMessage(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: theme.colors.bgPrimary,
        color: theme.colors.textPrimary,
        fontFamily: theme.fonts.body,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          padding: '1.25rem 2rem',
          borderBottom: `1px solid ${theme.colors.bgSecondary}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '3rem 2rem',
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.body,
            fontSize: '0.95rem',
            cursor: 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          ← Roots
        </button>
        <h1
          style={{
            fontFamily: theme.fonts.heading,
            color: theme.colors.textPrimary,
            fontSize: '2.5rem',
            margin: 0,
            fontWeight: 500,
            letterSpacing: '0.01em',
          }}
        >
          Ask the Archive
        </h1>
        <button
          onClick={() => navigate('/archive')}
          style={{
            padding: '0.6rem 1.2rem',
            fontSize: '0.9rem',
            backgroundColor: 'transparent',
            color: theme.colors.warmSand,
            border: `1px solid ${theme.colors.warmSand}`,
            borderRadius: '999px',
            cursor: 'pointer',
            fontFamily: theme.fonts.body,
            whiteSpace: 'nowrap',
          }}
        >
          Browse stories
        </button>
      </header>

      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem',
          maxWidth: '760px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '4rem' }}>
            <h2
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: '2rem',
                fontWeight: 500,
                marginBottom: '0.75rem',
                letterSpacing: '0.01em',
              }}
            >
              What would you like to remember?
            </h2>
            <p
              style={{
                color: theme.colors.textMuted,
                marginBottom: '2.5rem',
                fontSize: '1rem',
                lineHeight: 1.6,
              }}
            >
              Ask anything. The archive will draw from stories the community has shared.
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                maxWidth: '480px',
                margin: '0 auto',
              }}
            >
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  style={{
                    textAlign: 'left',
                    background: theme.colors.bgSecondary,
                    border: '1px solid transparent',
                    color: theme.colors.textPrimary,
                    padding: '0.85rem 1.1rem',
                    borderRadius: '10px',
                    fontFamily: theme.fonts.body,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'border-color 150ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = theme.colors.warmSand)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {loading && <TypingIndicator />}
        <div ref={endRef} />
      </main>

      <footer
        style={{
          padding: '1.25rem 2rem 1.75rem',
          borderTop: `1px solid ${theme.colors.bgSecondary}`,
          background: theme.colors.bgPrimary,
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            gap: '0.75rem',
            maxWidth: '760px',
            margin: '0 auto',
            alignItems: 'flex-end',
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the archive…"
            rows={1}
            style={{
              flex: 1,
              background: theme.colors.bgSecondary,
              border: `1px solid ${theme.colors.bgSecondary}`,
              color: theme.colors.textPrimary,
              padding: '0.85rem 1.1rem',
              borderRadius: '12px',
              fontFamily: theme.fonts.body,
              fontSize: '1rem',
              resize: 'none',
              outline: 'none',
              minHeight: '48px',
              maxHeight: '160px',
              lineHeight: 1.5,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = theme.colors.warmSand)}
            onBlur={(e) => (e.currentTarget.style.borderColor = theme.colors.bgSecondary)}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            style={{
              background:
                input.trim() && !loading ? theme.colors.forestGreen : theme.colors.bgSecondary,
              color: theme.colors.textPrimary,
              border: 'none',
              padding: '0 1.4rem',
              height: '48px',
              borderRadius: '12px',
              fontFamily: theme.fonts.body,
              fontSize: '0.95rem',
              fontWeight: 500,
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              opacity: input.trim() && !loading ? 1 : 0.5,
              letterSpacing: '0.02em',
              transition: 'background 150ms ease',
            }}
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '1.25rem',
      }}
    >
      <div style={{ maxWidth: '85%' }}>
        <div
          style={{
            background: isUser ? theme.colors.warmSand : theme.colors.bgSecondary,
            color: isUser ? theme.colors.bgPrimary : theme.colors.textPrimary,
            padding: '0.85rem 1.15rem',
            borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            fontFamily: theme.fonts.body,
            fontSize: '1rem',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}
        >
          {message.content}
        </div>

        {message.sources?.length > 0 && (
          <div
            style={{
              marginTop: '0.6rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div
              style={{
                fontSize: '0.72rem',
                color: theme.colors.textMuted,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              From the archive
            </div>
            {message.sources.map((s, i) => (
              <div
                key={i}
                style={{
                  border: `1px solid ${theme.colors.bgSecondary}`,
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  color: theme.colors.textPrimary,
                  fontStyle: 'italic',
                }}
              >
                {s.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1.25rem' }}>
      <div
        style={{
          background: theme.colors.bgSecondary,
          padding: '0.95rem 1.15rem',
          borderRadius: '16px 16px 16px 4px',
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: theme.colors.warmSand,
              animation: 'roots-pulse 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
              display: 'inline-block',
            }}
          />
        ))}
        <style>{`
          @keyframes roots-pulse {
            0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}
