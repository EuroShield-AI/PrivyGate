"use client";

import { useRef, useState, KeyboardEvent, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function OTPInput({ length = 6, value, onChange, disabled }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(value.split("").slice(0, length));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, newValue: string) => {
    if (newValue.length > 1) {
      // Handle paste - extract only digits
      const digits = newValue.replace(/\D/g, "").slice(0, length);
      const newOtp = Array(length).fill("");
      
      // Fill all fields with pasted digits
      digits.split("").forEach((digit, i) => {
        if (i < length) {
          newOtp[i] = digit;
        }
      });
      
      setOtp(newOtp);
      onChange(newOtp.join(""));
      
      // Focus the last filled input or the last input
      const focusIndex = Math.min(digits.length - 1, length - 1);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    if (!/^\d$/.test(newValue) && newValue !== "") return;

    const newOtp = [...otp];
    newOtp[index] = newValue;
    setOtp(newOtp);
    onChange(newOtp.join(""));

    if (newValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digits = pastedData.replace(/\D/g, "").slice(0, length);
    const newOtp = Array(length).fill("");
    
    // Fill all fields with pasted digits
    digits.split("").forEach((digit, i) => {
      if (i < length) {
        newOtp[i] = digit;
      }
    });
    
    setOtp(newOtp);
    onChange(newOtp.join(""));
    
    // Focus the last filled input or the last input
    const focusIndex = Math.min(digits.length - 1, length - 1);
    setTimeout(() => {
      inputRefs.current[focusIndex]?.focus();
    }, 0);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, index) => (
        <Input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otp[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => handleKeyDown(index, e)}
          disabled={disabled}
          className="w-12 h-12 text-center text-lg font-semibold"
        />
      ))}
    </div>
  );
}
