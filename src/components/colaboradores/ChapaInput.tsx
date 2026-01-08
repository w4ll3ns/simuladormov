import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isChapaDuplicate } from '@/lib/validation';

interface ChapaInputProps {
  value: string;
  onChange: (value: string) => void;
  existingChapas: string[];
  excludeChapa?: string; // Para edição, excluir a CHAPA atual da validação
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

/**
 * Componente de input para CHAPA com validação em tempo real
 * Mostra feedback visual se a CHAPA está duplicada
 */
export function ChapaInput({
  value,
  onChange,
  existingChapas,
  excludeChapa,
  id = 'chapa',
  placeholder = 'Ex: 12345',
  disabled = false,
  required = true,
  className,
}: ChapaInputProps) {
  const [touched, setTouched] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);

  // Valida se a CHAPA está duplicada
  useEffect(() => {
    if (!value || !touched) {
      setIsDuplicate(false);
      return;
    }

    // Se estamos editando e a CHAPA é a mesma, não é duplicata
    if (excludeChapa && value.trim().toUpperCase() === excludeChapa.trim().toUpperCase()) {
      setIsDuplicate(false);
      return;
    }

    const duplicate = isChapaDuplicate(value, existingChapas);
    setIsDuplicate(duplicate);
  }, [value, existingChapas, excludeChapa, touched]);

  const handleBlur = () => {
    setTouched(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (!touched) {
      setTouched(true);
    }
  };

  const showError = touched && isDuplicate;
  const showSuccess = touched && value && !isDuplicate;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        CHAPA {required && '*'}
      </Label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={cn(
            'font-mono',
            showError && 'border-destructive focus-visible:ring-destructive',
            showSuccess && 'border-green-500 focus-visible:ring-green-500',
            className
          )}
        />
        {showError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
        )}
        {showSuccess && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>
      {showError && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Esta CHAPA já está cadastrada
        </p>
      )}
      {showSuccess && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          CHAPA disponível
        </p>
      )}
    </div>
  );
}
