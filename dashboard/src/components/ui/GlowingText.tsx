import React from "react";

interface GlowingTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
}

export function GlowingText({
  children,
  as: Component = "span",
  className = "",
  ...props
}: GlowingTextProps) {
  return (
    <Component
      className={`text-shadow-glow text-terminal-green ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
