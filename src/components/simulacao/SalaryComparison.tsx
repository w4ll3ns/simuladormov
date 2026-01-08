import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrencyWithSign } from '@/lib/currency';

interface SalaryComparisonProps {
  salarioAnterior: number;
  novoSalario: number;
}

export function SalaryComparison({
  salarioAnterior,
  novoSalario,
}: SalaryComparisonProps) {
  const diff = novoSalario - salarioAnterior;
  const percentual = salarioAnterior > 0 ? ((novoSalario / salarioAnterior) - 1) * 100 : 0;
  const isPositive = diff >= 0;

  return (
    <div className={cn(
      'p-3 rounded-lg flex items-center justify-between',
      isPositive ? 'bg-success/10' : 'bg-destructive/10'
    )}>
      <div className="flex items-center gap-2">
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-success" />
        ) : (
          <TrendingDown className="h-4 w-4 text-destructive" />
        )}
        <span className="text-sm">Diferença salarial:</span>
      </div>
      <div className="text-right">
        <p className={cn('font-medium', isPositive ? 'text-success' : 'text-destructive')}>
          {formatCurrencyWithSign(diff)}
        </p>
        <p className="text-xs text-muted-foreground">
          {isPositive ? '+' : ''}{percentual.toFixed(1)}%
        </p>
      </div>
    </div>
  );
}
