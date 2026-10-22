import { useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { AuthShell, ErrorBanner, Field, SubmitButton, isEmail } from "./AuthUI.jsx";

export default function Signup() {
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = "Please enter your name.";
    if (!isEmail(form.email.trim())) next.email = "Enter a valid email address.";
    if (form.password.length < 8) next.password = "Use at least 8 characters.";
    if (form.confirm !== form.password) next.confirm = "Passwords do not match.";
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
      await signup(form.name.trim(), form.email.trim(), form.password);
    } catch (err) {
      setServerError(err.message);
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start chatting with NexaAI"
      footerText="Already have an account?"
      footerLink="Log in"
      footerTo="/login"
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <ErrorBanner>{serverError}</ErrorBanner>
        <Field
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Vineet Kumar"
          value={form.name}
          onChange={update}
          error={errors.name}
        />
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={update}
          error={errors.password}
          hint="Use 8 or more characters."
        />
        <Field
          label="Confirm password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={form.confirm}
          onChange={update}
          error={errors.confirm}
        />
        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>
    </AuthShell>
  );
}