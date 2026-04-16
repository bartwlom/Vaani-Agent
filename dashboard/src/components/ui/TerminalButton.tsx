import React from "react";
import { GlowingText } from "./GlowingText";

interface TerminalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "danger" | "ghost";
  isLoading?: boolean;
}

export function TerminalButton({
  children,
  variant = "primary",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: TerminalButtonProps) {
  const baseClasses =
    "border-2 uppercase font-bold tracking-widest px-4 py-2 transition-colors duration-150 rounded-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-terminal-green";
  
  const getVariants = () => {
    switch (variant) {
      case "primary":
        return "border-terminal-green text-terminal-green hover:bg-terminal-green hover:text-terminal-bg active:bg-terminal-greenDim";
      case "danger":
        return "border-red-500 text-red-500 hover:bg-red-500 hover:text-terminal-bg active:bg-red-700";
      case "ghost":
        return "border-transparent text-terminal-green hover:bg-terminal-green hover:text-terminal-bg";
      default:
        return "";
    }
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      className={`${baseClasses} ${getVariants()} ${
        isDisabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      disabled={isDisabled}
      {...props}
    >
      <GlowingText className={variant === "danger" ? "text-red-500" : ""}>
        {isLoading ? "[ PROCESSING... ]" : `[ ${children} ]`}
      </GlowingText>
    </button>
  );
}
