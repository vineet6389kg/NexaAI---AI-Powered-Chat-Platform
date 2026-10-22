import { useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { AuthShell, ErrorBanner, Field, SubmitButton, isEmail } from "./AuthUI.jsx";

export default function Login() {
  const { login, guestLogin } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!isEmail(form.email.trim())) next.email = "Enter a valid email address.";
    if (!form.password) next.password = "Enter your password.";
    return next;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      // GuestOnly route redirects to "/" automatically
    } catch (err) {
      setServerError(err.message);
      setLoading(false);
    }
  };

  const onGuest = async () => {
    setServerError("");
    setGuestLoading(true);
    try {
      await guestLogin();
    } catch (err) {
      setServerError(err.message);
      setGuestLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue to NexaAI"
      footerText="New to NexaAI?"
      footerLink="Create an account"
      footerTo="/signup"
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <ErrorBanner>{serverError}</ErrorBanner>
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={update}
          error={errors.email}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={form.password}
          onChange={update}
          error={errors.password}
        />
        <SubmitButton loading={loading}>Log in</SubmitButton>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        onClick={onGuest}
        disabled={guestLoading || loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-line-strong px-4 py-2.5 text-sm font-medium transition-colors hover:bg-raised disabled:cursor-not-allowed disabled:opacity-70"
      >
        {guestLoading && <i className="fa-solid fa-circle-notch fa-spin" />}
        Try the demo (no signup)
      </button>
    </AuthShell>
  );
}