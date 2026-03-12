import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", type = "text", ...props }: InputProps) {
  return (
    <input
      className={[
        "fantasy min-w-0 bg-center bg-cover bg-no-repeat p-3 text-base text-white outline-none transition-[filter,box-shadow] placeholder:text-[#8f97a8] md:text-sm",
        "border-solid border-[6px] [border-image-repeat:stretch] [border-image-slice:16_fill]",
        "wc-input-border",
        "focus:brightness-110",
        className
      ].join(" ")}
      type={type}
      {...props}
    />
  );
}
