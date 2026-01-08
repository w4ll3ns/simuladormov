import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pencil,
  Check,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Simulacao } from '@/hooks/useSimulacoes';
import { Colaborador } from '@/hooks/useColaboradores';
import { Database } from '@/integrations/supabase/types';
import { formatCurrency, formatCurrencyWithSign } from '@/lib/currency';

type TipoEvento = Database['public']['Enums']['tipo_evento'];
type TipoMovimentacao = Database['public']['Enums']['tipo_movimentacao'];
type MotivoSaida = Database['public']['Enums']['motivo_saida'];

interface ChainStep {
  tipo: TipoEvento;
  colaboradorOrigem?: Colaborador;
  colaboradorDestino?: Colaborador;
  novaFuncao?: string;
  novoSalario?: number;
  funcaoNovaVaga?: string;
  salarioNovaVaga?: number;
  tipoMovimentacao?: TipoMovimentacao;
  motivoSaida?: MotivoSaida;
  observacoes?: string;
}

interface SimulacaoResumoProps {
  simulacao: Simulacao;
  chainSteps: ChainStep[];
  onEdit: () => void;
  onFinalize: () => void;
}

export default function SimulacaoResumo({
  simulacao,
  chainSteps,
  onEdit,
  onFinalize,
}: SimulacaoResumoProps) {

  // Calculate summary data
  const summaryData = useMemo(() => {
    const colaboradoresAfetados: Array<{
      chapa: string;
      nome: string;
      cargoAnterior: string;
      cargoNovo: string;
      salarioAnterior: number;
      salarioNovo: number;
      diferenca: number;
      percentual: number;
      tipo: string;
    }> = [];

    let totalAntes = 0;
    let totalDepois = 0;
    let custoNovasContratacoes = 0;

    chainSteps.forEach((step) => {
      if (step.tipo === 'saida_inicial' && step.colaboradorOrigem) {
        totalAntes += step.colaboradorOrigem.salario;
        colaboradoresAfetados.push({
          chapa: step.colaboradorOrigem.chapa,
          nome: step.colaboradorOrigem.nome,
          cargoAnterior: step.colaboradorOrigem.cargo,
          cargoNovo: '(Saída)',
          salarioAnterior: step.colaboradorOrigem.salario,
          salarioNovo: 0,
          diferenca: -step.colaboradorOrigem.salario,
          percentual: -100,
          tipo: 'Saída',
        });
      }

      if (step.tipo === 'substituicao_interna' && step.colaboradorDestino) {
        const salarioAnterior = step.colaboradorDestino.salario;
        const salarioNovo = step.novoSalario || 0;
        const diferenca = salarioNovo - salarioAnterior;
        const percentual = salarioAnterior > 0 ? ((salarioNovo / salarioAnterior) - 1) * 100 : 0;

        totalAntes += salarioAnterior;
        totalDepois += salarioNovo;

        colaboradoresAfetados.push({
          chapa: step.colaboradorDestino.chapa,
          nome: step.colaboradorDestino.nome,
          cargoAnterior: step.colaboradorDestino.cargo,
          cargoNovo: step.novaFuncao || '',
          salarioAnterior,
          salarioNovo,
          diferenca,
          percentual,
          tipo: step.tipoMovimentacao === 'promocao' ? 'Promoção' : 
                step.tipoMovimentacao === 'lateral' ? 'Lateral' : 'Reajuste',
        });
      }

      if (step.tipo === 'nova_contratacao') {
        const salario = step.salarioNovaVaga || 0;
        totalDepois += salario;
        custoNovasContratacoes += salario;

        colaboradoresAfetados.push({
          chapa: '(Nova)',
          nome: 'Nova contratação',
          cargoAnterior: '-',
          cargoNovo: step.funcaoNovaVaga || '',
          salarioAnterior: 0,
          salarioNovo: salario,
          diferenca: salario,
          percentual: 100,
          tipo: 'Contratação',
        });
      }

      if (step.tipo === 'fim_sem_reposicao' && step.colaboradorOrigem) {
        // No addition to totalDepois - savings
      }
    });

    const impactoTotal = totalDepois - totalAntes;
    const impactoPercentual = totalAntes > 0 ? ((totalDepois / totalAntes) - 1) * 100 : 0;

    return {
      colaboradoresAfetados,
      totalAntes,
      totalDepois,
      impactoTotal,
      impactoPercentual,
      custoNovasContratacoes,
    };
  }, [chainSteps]);

  // Chart data
  const chartData = [
    { name: 'Antes', valor: summaryData.totalAntes },
    { name: 'Depois', valor: summaryData.totalDepois },
  ];

  const pieData = useMemo(() => {
    const data: { name: string; value: number }[] = [];
    
    const saidas = chainSteps.filter(s => s.tipo === 'saida_inicial').length;
    const substituicoes = chainSteps.filter(s => s.tipo === 'substituicao_interna').length;
    const contratacoes = chainSteps.filter(s => s.tipo === 'nova_contratacao').length;
    const extintas = chainSteps.filter(s => s.tipo === 'fim_sem_reposicao').length;

    if (saidas > 0) data.push({ name: 'Saídas', value: saidas });
    if (substituicoes > 0) data.push({ name: 'Substituições', value: substituicoes });
    if (contratacoes > 0) data.push({ name: 'Contratações', value: contratacoes });
    if (extintas > 0) data.push({ name: 'Vagas extintas', value: extintas });

    return data;
  }, [chainSteps]);

  const COLORS = ['hsl(var(--chart-5))', 'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-4))'];

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['CHAPA', 'Nome', 'Cargo Anterior', 'Cargo Novo', 'Salário Anterior', 'Salário Novo', 'Diferença R$', 'Diferença %', 'Tipo'];
    const rows = summaryData.colaboradoresAfetados.map((c) => [
      c.chapa,
      c.nome,
      c.cargoAnterior,
      c.cargoNovo,
      c.salarioAnterior.toFixed(2),
      c.salarioNovo.toFixed(2),
      c.diferenca.toFixed(2),
      c.percentual.toFixed(1) + '%',
      c.tipo,
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map((r) => r.join(';')),
      '',
      `Total Antes;${summaryData.totalAntes.toFixed(2)}`,
      `Total Depois;${summaryData.totalDepois.toFixed(2)}`,
      `Impacto Total;${summaryData.impactoTotal.toFixed(2)}`,
      `Impacto %;${summaryData.impactoPercentual.toFixed(1)}%`,
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `simulacao_${simulacao.nome.replace(/\s+/g, '_')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Folha Antes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryData.totalAntes)}</div>
            <p className="text-xs text-muted-foreground">por mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Folha Depois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryData.totalDepois)}</div>
            <p className="text-xs text-muted-foreground">por mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Impacto Total
              {summaryData.impactoTotal >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summaryData.impactoTotal >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrencyWithSign(summaryData.impactoTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryData.impactoPercentual >= 0 ? '+' : ''}{summaryData.impactoPercentual.toFixed(1)}% por mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Novas Contratações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryData.custoNovasContratacoes)}</div>
            <p className="text-xs text-muted-foreground">custo adicional/mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Comparativo de Folha</CardTitle>
            <CardDescription>Antes vs Depois da simulação</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" />
                <YAxis
                  tickFormatter={(value) =>
                    new Intl.NumberFormat('pt-BR', {
                      notation: 'compact',
                      compactDisplay: 'short',
                    }).format(value)
                  }
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="valor" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipos de Movimentação</CardTitle>
            <CardDescription>Distribuição por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Detalhamento por Colaborador</CardTitle>
            <CardDescription>Todos os colaboradores afetados pela simulação</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CHAPA</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo Anterior</TableHead>
                  <TableHead>Cargo Novo</TableHead>
                  <TableHead className="text-right">Salário Anterior</TableHead>
                  <TableHead className="text-right">Salário Novo</TableHead>
                  <TableHead className="text-right">Diferença</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryData.colaboradoresAfetados.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono">{c.chapa}</TableCell>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>{c.cargoAnterior}</TableCell>
                    <TableCell>{c.cargoNovo}</TableCell>
                    <TableCell className="text-right">{formatCurrency(c.salarioAnterior)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(c.salarioNovo)}</TableCell>
                    <TableCell className="text-right">
                      <div className={c.diferenca >= 0 ? 'text-success' : 'text-destructive'}>
                        {formatCurrencyWithSign(c.diferenca)}
                        <span className="block text-xs">
                          ({c.percentual >= 0 ? '+' : ''}{c.percentual.toFixed(1)}%)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.tipo === 'Saída' ? 'destructive' :
                          c.tipo === 'Contratação' ? 'default' :
                          c.percentual > 20 ? 'default' : 'secondary'
                        }
                      >
                        {c.tipo}
                        {c.tipo === 'Promoção' && c.percentual > 20 && ' (+20%)'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar simulação
        </Button>
        {simulacao.status !== 'finalizada' && (
          <Button onClick={onFinalize}>
            <Check className="h-4 w-4 mr-2" />
            Finalizar simulação
          </Button>
        )}
      </div>
    </div>
  );
}
