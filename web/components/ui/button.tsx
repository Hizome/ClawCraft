import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "default" | "frame";
};

export function Button({ children, className = "", variant = "default", ...props }: ButtonProps) {
  const borderImageClass = variant === "frame" ? "wc-btn-border-frame" : "wc-btn-border";

  return (
    <button
      className={[
        "fantasy inline-flex shrink-0 items-center justify-center whitespace-nowrap text-sm font-medium text-white outline-none transition-all duration-100",
        "bg-center bg-cover bg-no-repeat hover:brightness-110 active:scale-95 active:brightness-75",
        "border-solid border-[5px] [border-image-repeat:stretch] [border-image-slice:16_fill]",
        borderImageClass,
        className
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
