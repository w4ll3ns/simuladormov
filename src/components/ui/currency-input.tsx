import * as React from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  id?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function CurrencyInput({
  id,
  value,
  onChange,
  placeholder = "R$ 0,00",
  disabled = false,
  error,
  className,
}: CurrencyInputProps) {
  const formatCurrency = (val: number | null): string => {
    if (val === null || val === 0) return "";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const [displayValue, setDisplayValue] = React.useState(() =>
    formatCurrency(value)
  );

  React.useEffect(() => {
    setDisplayValue(formatCurrency(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Remove tudo que não é dígito
    const digitsOnly = rawValue.replace(/\D/g, "");
    
    if (digitsOnly === "") {
      setDisplayValue("");
      onChange(null);
      return;
    }

    // Converte para centavos e depois para reais
    const cents = parseInt(digitsOnly, 10);
    const reais = cents / 100;

    // Limita a 9.999.999,99
    if (reais > 9999999.99) return;

    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(reais);

    setDisplayValue(formatted);
    onChange(reais);
  };

  const handleBlur = () => {
    if (value !== null && value > 0) {
      setDisplayValue(formatCurrency(value));
    }
  };

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
