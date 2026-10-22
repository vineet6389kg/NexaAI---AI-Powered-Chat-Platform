import { useId, useState } from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

// Page shell: centered card + theme toggle in the corner
export function AuthShell({ title, subtitle, children, footerText, footerLink, footerTo }) {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center bg-bg px-4 py-10">
      <ThemeToggle className="absolute right-4 top-4" />

      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={44} />
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">{children}</div>

        <p className="mt-5 text-center text-sm text-muted">
          {footerText}{" "}
          <Link to={footerTo} className="font-medium text-accent underline-offset-2 hover:underline dark:text-ring">
            {footerLink}
          </Link>
        </p>
      </div>
    </div>
  );
}

export function ErrorBanner({ children }) {
  if (!children) return null;
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm text-danger"
    >
      <i className="fa-solid fa-circle-exclamation mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

// Labelled input with inline error + optional hint
export function Field({ label, error, hint, type = "text", ...props }) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && show ? "text" : type}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          className={`w-full rounded-lg border bg-bg px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-ring focus:ring-2 focus:ring-ring/25 ${
            error ? "border-danger" : "border-line-strong"
          } ${isPassword ? "pr-10" : ""}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted hover:text-fg"
          >
            <i className={`fa-regular ${show ? "fa-eye-slash" : "fa-eye"}`} />
          </button>
        )}
      </div>
      {(error || hint) && (
        <p id={`${id}-msg`} className={`mt-1.5 text-xs ${error ? "text-danger" : "text-muted"}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading && <i className="fa-solid fa-circle-notch fa-spin" />}
      {children}
    </button>
  );
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);