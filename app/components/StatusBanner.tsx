type Props = {
  source?: string;
  message?: string;
  keyConfigured?: boolean;
};

export function StatusBanner({ source, message, keyConfigured }: Props) {
  const live = source === "live";
  return (
    <div
      className={`rounded-xl border px-3 py-2 text-sm ${
        live
          ? "border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-[var(--accent-soft)] text-[var(--accent)]"
          : "border-[var(--border)] bg-[var(--bg)] text-[var(--muted)]"
      }`}
      role="status"
    >
      <span className={`chip mr-2 ${live ? "chip-live" : "chip-illust"}`}>
        {live ? "Live data" : source === "unavailable" ? "API unavailable" : "Illustrative"}
      </span>
      {message ||
        (keyConfigured
          ? "API key present — check message for upstream status."
          : "Set DITCHCARBON_API_KEY in .env.local for live scores and SBTi.")}
    </div>
  );
}
