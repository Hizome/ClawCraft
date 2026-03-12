import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={[
        "fantasy flex flex-col overflow-hidden text-sm text-[var(--text-main)]",
        "border-solid border-[24px] px-6 [border-image-repeat:stretch] [border-image-slice:24_fill]",
        "wc-card-border",
        className
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }: CardProps) {
  return (
    <div className={["grid auto-rows-min gap-1 px-4 pt-14", className].join(" ")} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", ...props }: CardProps) {
  return (
    <div className={["text-base leading-snug font-medium", className].join(" ")} {...props}>
      {children}
    </div>
  );
}

export function CardDescription({ children, className = "", ...props }: CardProps) {
  return (
    <div className={["text-sm text-[var(--text-dim)]", className].join(" ")} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "", ...props }: CardProps) {
  return (
    <div className={["px-4 pb-6", className].join(" ")} {...props}>
      {children}
    </div>
  );
}
