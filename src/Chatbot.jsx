// src/Chatbot.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from './theme';

const SUGGESTED_PROMPTS = [
  "What stories did grandma tell about her childhood?",
  "Tell me about family recipes passed down",
  "What did our elders say about hard times?",
  "Share a memory about a family gathering",
];

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

    try {
      // TODO: swap mock for real Bedrock RAG endpoint via API Gateway
      // const res = await fetch(import.meta.env.VITE_RAG_ENDPOINT, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ query: text }),
      // });
      // const data = await res.json();
      // setMessages((prev) => [...prev, {
      //   id: Date.now() + 1,
      //   role: 'assistant',
      //   content: data.answer,
      //   sources: data.sources, // [{ title, storyteller, year }]
      // }]);

      await new Promise((r) => setTimeout(r, 1100));
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content:
            "Your grandmother Esperanza spoke often about summers in her village, when the family would gather under the lemon tree after supper. She remembered her own grandmother humming old songs while shelling beans, and said those evenings taught her what 'home' really meant.",
          sources: [
            { title: "Summers in the village", storyteller: 'Esperanza Morales', year: 1998 },
            { title: 'Songs from the old country', storyteller: 'Esperanza Morales', year: 2001 },
          ],
        },
      ]);
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
            fontSize: '1.4rem',
            fontWeight: 500,
            margin: 0,
            letterSpacing: '0.01em',
          }}
        >
          Ask the Archive
        </h1>
        <button
          onClick={() => navigate('/archive')}
          style={{
            background: 'none',
            border: `1px solid ${theme.colors.bgSecondary}`,
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.body,
            fontSize: '0.85rem',
            padding: '0.45rem 0.9rem',
            borderRadius: '999px',
            cursor: 'pointer',
            letterSpacing: '0.02em',
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
              Ask anything. The archive will draw from stories your family has shared.
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
                  color: theme.colors.textMuted,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <span style={{ color: theme.colors.textPrimary, fontStyle: 'italic' }}>
                  "{s.title}"
                </span>
                <span>
                  {s.storyteller} · {s.year}
                </span>
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