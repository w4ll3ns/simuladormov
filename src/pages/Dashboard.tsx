import { useSimulacoes } from '@/hooks/useSimulacoes';
import { useColaboradores } from '@/hooks/useColaboradores';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/currency';
import {
  Users,
  FileBarChart,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowRight,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

export default function Dashboard() {
  const { simulacoes, isLoading: loadingSimulacoes } = useSimulacoes();
  const { colaboradores, isLoading: loadingColaboradores } = useColaboradores();

  const isLoading = loadingSimulacoes || loadingColaboradores;

  // Calculate metrics
  const totalColaboradores = colaboradores.length;
  const colaboradoresAtivos = colaboradores.filter((c) => c.ativo).length;
  const totalSimulacoes = simulacoes.length;
  const simulacoesFinalizadas = simulacoes.filter((s) => s.status === 'finalizada').length;

  const impactoTotal = simulacoes.reduce((acc, s) => acc + s.impactoTotal, 0);
  const impactoMedio = simulacoes.length > 0 ? impactoTotal / simulacoes.length : 0;

  const ultimasSimulacoes = simulacoes.slice(0, 5);

  // Chart data
  const statusData = [
    { name: 'Rascunho', value: simulacoes.filter((s) => s.status === 'rascunho').length },
    { name: 'Finalizadas', value: simulacoesFinalizadas },
  ];

  const impactoData = simulacoes.slice(0, 6).map((s) => ({
    nome: s.nome.length > 15 ? s.nome.substring(0, 15) + '...' : s.nome,
    impacto: s.impactoTotal,
  }));

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema</p>
        </div>
        <Button asChild>
          <Link to="/simulacoes">
            <Plus className="h-4 w-4 mr-2" />
            Nova Simulação
          </Link>
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Colaboradores Ativos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{colaboradoresAtivos}</div>
            <p className="text-xs text-muted-foreground">
              de {totalColaboradores} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Simulações
            </CardTitle>
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSimulacoes}</div>
            <p className="text-xs text-muted-foreground">
              {simulacoesFinalizadas} finalizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Impacto Total
            </CardTitle>
            {impactoTotal >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${impactoTotal >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(impactoTotal)}
            </div>
            <p className="text-xs text-muted-foreground">por mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Impacto Médio
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(impactoMedio)}</div>
            <p className="text-xs text-muted-foreground">por simulação</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Simulações</CardTitle>
            <CardDescription>Distribuição por status</CardDescription>
          </CardHeader>
          <CardContent>
            {totalSimulacoes === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Nenhuma simulação criada
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Impact Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Impacto por Simulação</CardTitle>
            <CardDescription>Últimas simulações</CardDescription>
          </CardHeader>
          <CardContent>
            {impactoData.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Nenhuma simulação criada
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={impactoData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="nome" tick={{ fontSize: 10 }} />
                  <YAxis
                    tickFormatter={(value) =>
                      new Intl.NumberFormat('pt-BR', {
                        notation: 'compact',
                        compactDisplay: 'short',
                      }).format(value)
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Simulação: ${label}`}
                  />
                  <Bar dataKey="impacto" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Simulations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Últimas Simulações</CardTitle>
            <CardDescription>Suas simulações mais recentes</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/simulacoes">
              Ver todas
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {ultimasSimulacoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileBarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma simulação criada ainda</p>
              <Button variant="link" className="mt-2" asChild>
                <Link to="/simulacoes">Criar sua primeira simulação</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {ultimasSimulacoes.map((sim) => (
                <Link
                  key={sim.id}
                  to={`/simulacoes/${sim.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{sim.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(sim.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                      {' • '}
                      {sim.totalMovimentacoes} movimentações
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <Badge variant={sim.status === 'finalizada' ? 'default' : 'secondary'}>
                      {sim.status === 'finalizada' ? 'Finalizada' : 'Rascunho'}
                    </Badge>
                    <span
                      className={`text-sm font-medium ${
                        sim.impactoTotal >= 0 ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {sim.impactoTotal >= 0 ? '+' : ''}
                      {formatCurrency(sim.impactoTotal)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
