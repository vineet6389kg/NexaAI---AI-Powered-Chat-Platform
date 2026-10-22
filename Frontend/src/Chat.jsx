import { useContext, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { MyContext } from "./MyContext.jsx";
import { useAuth } from "./AuthContext.jsx";
import Logo from "./Logo.jsx";

// small helper: copy text and show "Copied" for 1.5 seconds
function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };
  return [copied, copy];
}

// code block with a Copy button
function CodeBlock({ children }) {
  const ref = useRef(null);
  const [copied, copy] = useCopy();
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => copy(ref.current?.innerText || "")}
        aria-label="Copy code"
        className="absolute right-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-xs text-gray-200 transition-colors hover:bg-white/20"
      >
        <i className={`fa-regular ${copied ? "fa-circle-check" : "fa-copy"}`} />
        {copied ? "Copied" : "Copy"}
      </button>
      <pre ref={ref}>{children}</pre>
    </div>
  );
}

const mdComponents = { pre: CodeBlock };

function AssistantMessage({ content, showRegenerate, onRegenerate }) {
  const [copied, copy] = useCopy();
  if (!content) return null; // still waiting for the first words

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 shrink-0">
        <Logo size={28} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="markdown">
          <ReactMarkdown rehypePlugins={[rehypeHighlight]} components={mdComponents}>
            {content}
          </ReactMarkdown>
        </div>
        <div className="mt-2 flex items-center gap-1 text-muted">
          <button
            type="button"
            onClick={() => copy(content)}
            aria-label="Copy answer"
            title="Copy answer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs transition-colors hover:bg-raised hover:text-fg"
          >
            <i className={`fa-regular ${copied ? "fa-circle-check" : "fa-copy"}`} />
            {copied ? "Copied" : "Copy"}
          </button>
          {showRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              aria-label="Regenerate answer"
              title="Regenerate answer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs transition-colors hover:bg-raised hover:text-fg"
            >
              <i className="fa-solid fa-rotate-right" />
              Regenerate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Chat({ onRegenerate, busy }) {
  const { newChat, prevChats } = useContext(MyContext);
  const { user } = useAuth();
  const scrollRef = useRef(null);
  const stick = useRef(true); // true = user is at the bottom, keep following
  const lastLen = useRef(0);

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  // follow new messages and streaming text, unless the user scrolled up
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (prevChats.length > lastLen.current) stick.current = true; // new message
    lastLen.current = prevChats.length;
    if (stick.current) el.scrollTop = el.scrollHeight;
  }, [prevChats]);

  const firstName = user?.name?.split(" ")[0];
  const history = prevChats ?? [];

  return (
    <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto">
      {newChat && history.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center px-4 text-center">
          <Logo size={44} />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            {firstName ? `Hi ${firstName}, how can I help?` : "How can I help you today?"}
          </h1>
          <p className="mt-2 text-sm text-muted">Ask anything, or attach an image.</p>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
          {history.map((chat, idx) =>
            chat.role === "user" ? (
              <div key={idx} className="flex justify-end">
                <div className="flex max-w-[85%] flex-col items-end gap-2 sm:max-w-[75%]">
                  {chat.image?.data && (
                    <img
                      src={`data:${chat.image.mimeType};base64,${chat.image.data}`}
                      alt="Attached"
                      className="max-h-64 rounded-xl border border-line object-cover"
                    />
                  )}
                  <p className="whitespace-pre-wrap rounded-2xl bg-raised px-4 py-2.5 text-[0.95rem] leading-relaxed">
                    {chat.content}
                  </p>
                </div>
              </div>
            ) : (
              <AssistantMessage
                key={idx}
                content={chat.content}
                showRegenerate={idx === history.length - 1 && !busy}
                onRegenerate={onRegenerate}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}

export default Chat;