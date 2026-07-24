type CardProps = {
  children: React.ReactNode;
  variant?: "panel" | "elevated" | "price" | "analysis" | "risk" | "news" | "argentina";
  className?: string;
};

const variantClass: Record<NonNullable<CardProps["variant"]>, string> = {
  panel: "cma-panel",
  elevated: "cma-panel-elevated",
  price: "cma-card-price",
  analysis: "cma-card-analysis",
  risk: "cma-card-risk",
  news: "cma-card-news",
  argentina: "cma-card-argentina",
};

export function Card({ children, variant = "panel", className = "" }: CardProps) {
  return <div className={`${variantClass[variant]} p-5 ${className}`}>{children}</div>;
}
