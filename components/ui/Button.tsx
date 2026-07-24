import Link from "next/link";

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary";
  className?: string;
  onClick?: () => void;
};

const base = "inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition border";
const variantClass: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "border-[var(--cma-accent-cyan)] bg-[var(--cma-accent-cyan)] text-[#0b0f14] hover:opacity-90",
  secondary: "border-[var(--cma-border-soft)] text-[var(--cma-text-secondary)] hover:border-[var(--cma-border-strong)] hover:text-[var(--cma-text-primary)]",
};

export function Button({ children, href, variant = "secondary", className = "", onClick }: ButtonProps) {
  const classes = `${base} ${variantClass[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
