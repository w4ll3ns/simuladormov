import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { formatCurrency, formatCurrencyWithSign } from '@/lib/currency';
import { Colaborador } from '@/hooks/useColaboradores';
import { Database } from '@/integrations/supabase/types';

type TipoEvento = Database['public']['Enums']['tipo_evento'];
type TipoMovimentacao = Database['public']['Enums']['tipo_movimentacao'];
type MotivoSaida = Database['public']['Enums']['motivo_saida'];

const MOTIVOS_SAIDA: { value: MotivoSaida; label: string }[] = [
  { value: 'demissao', label: 'Demissão voluntária' },
  { value: 'desligamento', label: 'Desligamento' },
  { value: 'aposentadoria', label: 'Aposentadoria' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'outro', label: 'Outro' },
];

const TIPOS_MOVIMENTACAO: { value: TipoMovimentacao; label: string }[] = [
  { value: 'promocao', label: 'Promoção' },
  { value: 'lateral', label: 'Movimentação lateral' },
  { value: 'reajuste', label: 'Reajuste salarial' },
];

interface ChainStepCardProps {
  step: {
    tipo: TipoEvento;
    colaboradorOrigem?: Colaborador;
    colaboradorDestino?: Colaborador;
    novaFuncao?: string;
    novoSalario?: number;
    funcaoNovaVaga?: string;
    salarioNovaVaga?: number;
    tipoMovimentacao?: TipoMovimentacao;
    motivoSaida?: MotivoSaida;
  };
}

export function ChainStepCard({ step }: ChainStepCardProps) {
  if (step.tipo === 'saida_inicial' && step.colaboradorOrigem) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="destructive">Saída</Badge>
            <span className="text-sm text-muted-foreground">
              {MOTIVOS_SAIDA.find((m) => m.value === step.motivoSaida)?.label}
            </span>
          </div>
          <p className="font-medium">{step.colaboradorOrigem.nome}</p>
          <p className="text-sm text-muted-foreground">
            {step.colaboradorOrigem.cargo} • {formatCurrency(step.colaboradorOrigem.salario)}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (step.tipo === 'substituicao_interna' && step.colaboradorDestino) {
    const diff = (step.novoSalario || 0) - step.colaboradorDestino.salario;
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge>Substituição</Badge>
            <Badge variant="secondary">
              {TIPOS_MOVIMENTACAO.find((t) => t.value === step.tipoMovimentacao)?.label}
            </Badge>
          </div>
          <p className="font-medium">{step.colaboradorDestino.nome}</p>
          <p className="text-sm text-muted-foreground mb-2">
            {step.colaboradorDestino.cargo} → {step.novaFuncao}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span>{formatCurrency(step.colaboradorDestino.salario)}</span>
            <ArrowRight className="h-4 w-4" />
            <span className="font-medium">{formatCurrency(step.novoSalario || 0)}</span>
            <span className={diff >= 0 ? 'text-success' : 'text-destructive'}>
              ({formatCurrencyWithSign(diff)})
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step.tipo === 'nova_contratacao') {
    return (
      <Card>
        <CardContent className="pt-4">
          <Badge className="bg-success hover:bg-success/90 mb-2">Nova Contratação</Badge>
          <p className="font-medium">{step.funcaoNovaVaga}</p>
          <p className="text-sm text-muted-foreground">
            Salário proposto: {formatCurrency(step.salarioNovaVaga || 0)}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (step.tipo === 'fim_sem_reposicao' && step.colaboradorOrigem) {
    return (
      <Card>
        <CardContent className="pt-4">
          <Badge variant="secondary" className="mb-2">Vaga Extinta</Badge>
          <p className="font-medium">{step.colaboradorOrigem.cargo}</p>
          <p className="text-sm text-muted-foreground">
            Economia: {formatCurrency(step.colaboradorOrigem.salario)}/mês
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
}
