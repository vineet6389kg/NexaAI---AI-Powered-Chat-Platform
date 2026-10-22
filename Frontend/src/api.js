export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
const TOKEN_KEY = "nexa-token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// fetch wrapper: adds JSON headers + the login token
export async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong");
    err.status = res.status;
    throw err;
  }
  return data;
}

// Streams the reply and calls onText(text) for each piece.
// regenerate: true = answer the last question again.
export async function streamChat({ message, threadId, image, regenerate, signal, onText }) {
  const token = getToken();
  const res = await fetch(`${API_URL}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, threadId, image, regenerate }),
    signal,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Something went wrong");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop();
    for (const ev of events) {
      if (!ev.startsWith("data:")) continue;
      const data = JSON.parse(ev.slice(5).trim());
      if (data.error) throw new Error(data.error);
      if (data.text) onText(data.text);
    }
  }
}