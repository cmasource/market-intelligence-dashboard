type BadgeProps = {
  children: React.ReactNode;
  tone?: "neutral" | "positive" | "negative" | "warning" | "accent";
  className?: string;
};

const toneClass: Record<NonNullable<BadgeProps["tone"]>, string> = {
  neutral: "border-[var(--cma-border-soft)] text-[var(--cma-text-secondary)]",
  positive: "border-emerald-800/40 text-emerald-400",
  negative: "border-rose-800/40 text-rose-400",
  warning: "border-amber-800/40 text-amber-400",
  accent: "border-[var(--cma-border-strong)] text-[var(--cma-accent-cyan)]",
};

export function Badge({ children, tone = "neutral", className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-md border bg-[var(--cma-bg-panel)] px-2 py-0.5 text-xs font-medium ${toneClass[tone]} ${className}`}>
      {children}
    </span>
  );
}
