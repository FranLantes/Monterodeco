import { useState, useRef, useEffect } from "react";
import { MonterodecoLogo } from "@/components/MonterodecoLogo";

// PIN code — change this to update the access code
const VALID_PIN = "0461";

interface PinLockProps {
  onUnlock: () => void;
}

export function PinLock({ onUnlock }: PinLockProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError(false);

    // Auto-advance to next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check PIN when all digits are filled
    const pin = newDigits.join("");
    if (pin.length === 4 && newDigits.every(d => d !== "")) {
      if (pin === VALID_PIN) {
        onUnlock();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setDigits(["", "", "", ""]);
          inputRefs.current[0]?.focus();
        }, 600);
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      const newDigits = pasted.split("");
      setDigits(newDigits);
      if (pasted === VALID_PIN) {
        onUnlock();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setDigits(["", "", "", ""]);
          inputRefs.current[0]?.focus();
        }, 600);
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-xs flex flex-col items-center gap-8">
        {/* Logo and title */}
        <div className="flex flex-col items-center gap-3">
          <MonterodecoLogo size={48} />
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Monterodeco</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">Presupuestos</p>
          </div>
        </div>

        {/* PIN entry */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">Introduce el PIN de acceso</p>
          
          <div
            className={`flex gap-3 ${shake ? "animate-shake" : ""}`}
            onPaste={handlePaste}
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={el => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                data-testid={`pin-digit-${idx}`}
                className={`
                  w-14 h-16 text-center text-2xl font-semibold rounded-lg
                  border-2 bg-card text-foreground
                  outline-none transition-all duration-200
                  focus:border-primary focus:ring-2 focus:ring-primary/20
                  ${error ? "border-destructive" : "border-border"}
                `}
                autoComplete="off"
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-destructive font-medium">PIN incorrecto</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-xs text-muted-foreground">
        <a
          href="https://www.perplexity.ai/computer"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          Created with Perplexity Computer
        </a>
      </div>

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
