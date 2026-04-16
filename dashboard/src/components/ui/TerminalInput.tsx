import React, { forwardRef } from "react";

interface BaseProps {
  label?: string;
  prefix?: string;
}

type InputElementProps = React.InputHTMLAttributes<HTMLInputElement> & BaseProps & { multiline?: false };
type TextareaElementProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & BaseProps & { multiline: true };

export type TerminalInputProps = InputElementProps | TextareaElementProps;

export const TerminalInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, TerminalInputProps>(
  (props, ref) => {
    const { multiline, label, prefix = ">", className = "", ...rest } = props;
    const baseClasses =
      "bg-transparent border-b-2 border-terminal-green border-dashed focus:border-solid focus:outline-none text-terminal-green text-shadow-glow placeholder:text-terminal-greenDim w-full p-2 font-mono";

    return (
      <div className={`flex flex-col mb-4 ${className}`}>
        {label && (
          <label className="mb-1 text-terminal-greenDim uppercase tracking-wide text-shadow-glow">
            {label}
          </label>
        )}
        <div className="flex items-start">
          <span className="text-terminal-green mr-2 mt-2 select-none">{prefix}</span>
          {multiline ? (
            <textarea
              className={`${baseClasses} resize-none h-32`}
              spellCheck={false}
              ref={ref as React.Ref<HTMLTextAreaElement>}
              {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              className={baseClasses}
              spellCheck={false}
              ref={ref as React.Ref<HTMLInputElement>}
              {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
            />
          )}
        </div>
      </div>
    );
  }
);
TerminalInput.displayName = "TerminalInput";
