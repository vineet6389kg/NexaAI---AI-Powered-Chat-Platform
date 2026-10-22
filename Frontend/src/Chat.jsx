import { useContext, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { MyContext } from "./MyContext.jsx";
import { useAuth } from "./AuthContext.jsx";
import Logo from "./Logo.jsx";

function AssistantMessage({ children }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 shrink-0">
        <Logo size={28} />
      </div>
      <div className="markdown min-w-0 flex-1">
        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{children}</ReactMarkdown>
      </div>
    </div>
  );
}

function Chat() {
  const { newChat, prevChats, reply } = useContext(MyContext);
  const { user } = useAuth();
  const [latestReply, setLatestReply] = useState(null);
  const bottomRef = useRef(null);

  // word-by-word typing effect (unchanged logic)
  useEffect(() => {
    if (reply === null) {
      setLatestReply(null);
      return;
    }
    if (!prevChats?.length) return;

    const content = reply.split(" ");
    let idx = 0;
    const interval = setInterval(() => {
      setLatestReply(content.slice(0, idx + 1).join(" "));
      idx++;
      if (idx >= content.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [prevChats, reply]);

  // keep the newest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [prevChats, latestReply]);

  const firstName = user?.name?.split(" ")[0];
  const history = prevChats ?? [];

  return (
    <div className="flex-1 overflow-y-auto">
      {newChat && history.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center px-4 text-center">
          <Logo size={44} />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            {firstName ? `Hi ${firstName}, how can I help?` : "How can I help you today?"}
          </h1>
          <p className="mt-2 text-sm text-muted">Ask anything to start a new chat.</p>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6">
          {history.slice(0, -1).map((chat, idx) =>
            chat.role === "user" ? (
              <div key={idx} className="flex justify-end">
                <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-raised px-4 py-2.5 text-[0.95rem] leading-relaxed sm:max-w-[75%]">
                  {chat.content}
                </p>
              </div>
            ) : (
              <AssistantMessage key={idx}>{chat.content}</AssistantMessage>
            ),
          )}

          {history.length > 0 && (
            <AssistantMessage key={latestReply === null ? "static" : "typing"}>
              {latestReply === null ? history[history.length - 1].content : latestReply}
            </AssistantMessage>
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

export default Chat;