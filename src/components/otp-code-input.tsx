"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

export function OtpCodeInput({
  value,
  onChange,
  disabled = false,
  label,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  label: string;
}) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  function pasteCode(event: ClipboardEvent<HTMLInputElement>) {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    event.preventDefault();
    onChange(Array.from({ length: 6 }, (_, index) => digits[index] ?? ""));
    inputs.current[Math.min(digits.length, 5)]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < 5) {
      event.preventDefault();
      inputs.current[index + 1]?.focus();
    }
    if (event.key === "Backspace" && !value[index] && index > 0) inputs.current[index - 1]?.focus();
  }

  return (
    <div className="otp-code-input" role="group" aria-label={label}>
      {Array.from({ length: 6 }, (_, index) => (
        <input
          key={index}
          ref={(element) => { inputs.current[index] = element; }}
          aria-label={`${label}, digit ${index + 1} of 6`}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[index] ?? ""}
          disabled={disabled}
          onPaste={pasteCode}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "");
            if (digits.length > 1) {
              const next = Array.from({ length: 6 }, (_, slot) => digits[slot] ?? "");
              onChange(next);
              inputs.current[Math.min(digits.length - 1, 5)]?.focus();
              return;
            }
            const next = Array.from({ length: 6 }, (_, slot) => value[slot] ?? "");
            next[index] = digits;
            onChange(next);
            if (digits && index < 5) inputs.current[index + 1]?.focus();
          }}
        />
      ))}
    </div>
  );
}
