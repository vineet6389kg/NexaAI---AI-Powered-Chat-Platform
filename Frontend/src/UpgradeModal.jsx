import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { apiFetch } from "./api.js";
import { useAuth } from "./AuthContext.jsx";

// loads Razorpay's checkout script once
const loadRazorpay = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () =>
      reject(new Error("Could not load the payment window. Check your internet connection."));
    document.body.appendChild(script);
  });

function Feature({ children }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <i className="fa-solid fa-check mt-1 text-xs text-accent dark:text-ring" />
      <span>{children}</span>
    </li>
  );
}

export default function UpgradeModal({ onClose }) {
  const { user, refreshUser, logout } = useAuth();
  const [plan, setPlan] = useState(null); // { price, currency, days }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    apiFetch("/payment/plan")
      .then(setPlan)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pay = async () => {
    setError("");
    setBusy(true);
    try {
      await loadRazorpay();
      const order = await apiFetch("/payment/order", { method: "POST" });

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "NexaAI",
        description: "NexaAI Pro",
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#2141e4" },
        modal: { ondismiss: () => setBusy(false) }, // user closed the payment window
        handler: async (response) => {
          // payment done: the server checks the signature before upgrading
          try {
            await apiFetch("/payment/verify", {
              method: "POST",
              body: JSON.stringify(response),
            });
            await refreshUser();
            setDone(true);
          } catch (err) {
            setError(err.message);
          }
          setBusy(false);
        },
      });

      rzp.on("payment.failed", (r) => {
        setError(r?.error?.description || "Payment failed. Please try again.");
        setBusy(false);
      });

      rzp.open();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const proUntil = user?.proUntil
    ? new Date(user.proUntil).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Upgrade to Pro"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-bg p-6 text-fg shadow-xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Upgrade your plan</h2>
            <p className="mt-1 text-sm text-muted">Chat without daily limits.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            autoFocus
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-fg"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {done || user?.isPro ? (
          <div className="rounded-xl border border-line bg-surface p-6 text-center">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-fg">
              <i className="fa-solid fa-crown" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">You're on NexaAI Pro</h3>
            <p className="mt-1 text-sm text-muted">
              Unlimited messages{proUntil ? ` until ${proUntil}` : ""}. Thank you for the support!
            </p>
            <button
              onClick={onClose}
              className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover"
            >
              Start chatting
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* free plan */}
              <div className="rounded-xl border border-line bg-surface p-5">
                <h3 className="font-semibold">Free</h3>
                <p className="mt-2 text-2xl font-semibold">
                  ₹0 <span className="text-sm font-normal text-muted">/ forever</span>
                </p>
                <ul className="mt-4 space-y-2.5">
                  <Feature>20 messages per day</Feature>
                  <Feature>Streaming replies</Feature>
                  <Feature>Image uploads</Feature>
                  <Feature>Light and dark themes</Feature>
                </ul>
                <p className="mt-5 rounded-lg border border-line px-3 py-2 text-center text-sm text-muted">
                  Your current plan
                </p>
              </div>

              {/* pro plan */}
              <div className="rounded-xl border-2 border-accent bg-surface p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Pro</h3>
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-fg">
                    Recommended
                  </span>
                </div>
                <p className="mt-2 text-2xl font-semibold">
                  {plan ? `₹${plan.price}` : "..."}{" "}
                  <span className="text-sm font-normal text-muted">
                    / {plan?.days ?? 30} days
                  </span>
                </p>
                <ul className="mt-4 space-y-2.5">
                  <Feature>Unlimited messages</Feature>
                  <Feature>Everything in Free</Feature>
                  <Feature>Support the project</Feature>
                </ul>

                {user?.isGuest ? (
                  <button
                    onClick={logout}
                    className="mt-5 w-full rounded-lg border border-line-strong px-4 py-2.5 text-sm font-medium transition-colors hover:bg-raised"
                  >
                    Log out to create an account
                  </button>
                ) : (
                  <button
                    onClick={pay}
                    disabled={busy || !plan}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {busy && <i className="fa-solid fa-circle-notch fa-spin" />}
                    Upgrade to Pro
                  </button>
                )}
              </div>
            </div>

            {user?.isGuest && (
              <p className="mt-4 text-center text-sm text-muted">
                Demo accounts can't upgrade. Create a free account to continue.
              </p>
            )}

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2.5 text-sm text-danger"
              >
                {error}
              </p>
            )}

            <p className="mt-4 text-center text-xs text-muted">
              Payments run in Razorpay test mode, so no real money is charged.
            </p>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}