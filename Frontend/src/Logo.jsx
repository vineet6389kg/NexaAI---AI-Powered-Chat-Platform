// Simple NexaAI mark: rounded square + sparkle.
export default function Logo({ size = 32 }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg bg-accent text-accent-fg"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" width={size * 0.58} height={size * 0.58} fill="currentColor">
        <path d="M12 2l1.9 5.6a4 4 0 0 0 2.5 2.5L22 12l-5.6 1.9a4 4 0 0 0-2.5 2.5L12 22l-1.9-5.6a4 4 0 0 0-2.5-2.5L2 12l5.6-1.9a4 4 0 0 0 2.5-2.5L12 2z" />
      </svg>
    </span>
  );
}