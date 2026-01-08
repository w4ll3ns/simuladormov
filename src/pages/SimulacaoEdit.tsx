import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSimulacao, useMovimentacoes, useSimulacoes } from '@/hooks/useSimulacoes';
import { useColaboradores, Colaborador } from '@/hooks/useColaboradores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  UserMinus,
  UserPlus,
  Users,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  X,
  Download,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SimulacaoResumo from '@/components/simulacao/SimulacaoResumo';
import { Database, Json } from '@/integrations/supabase/types';
import { formatCurrency } from '@/lib/currency';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ChainStepCard } from '@/components/simulacao/ChainStepCard';
import { SalaryComparison } from '@/components/simulacao/SalaryComparison';

type TipoEvento = Database['public']['Enums']['tipo_evento'];
type TipoMovimentacao = Database['public']['Enums']['tipo_movimentacao'];
type MotivoSaida = Database['public']['Enums']['motivo_saida'];

interface PendingVaga {
  colaboradorId: string;
  colaboradorNome: string;
  cargo: string;
  salario: number;
}

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

export default function SimulacaoEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: simulacao, isLoading } = useSimulacao(id);
  const { colaboradoresAtivos } = useColaboradores();
  const { updateSimulacao } = useSimulacoes();
  const { addMovimentacao, clearMovimentacoes } = useMovimentacoes(id);
  const { handleError } = useErrorHandler();

  // Wizard state
  const [step, setStep] = useState(1);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  // Step 2: Exit employee
  const [colaboradorSaidaId, setColaboradorSaidaId] = useState('');
  const [motivoSaida, setMotivoSaida] = useState<MotivoSaida>('demissao');

  // Step 3: Chain of substitutions
  const [pendingVagas, setPendingVagas] = useState<PendingVaga[]>([]);
  const [currentVagaIndex, setCurrentVagaIndex] = useState(0);
  const [substituicaoTipo, setSubstituicaoTipo] = useState<'interno' | 'contratacao' | 'fim'>('interno');
  const [colaboradorDestinoId, setColaboradorDestinoId] = useState('');
  const [novaFuncao, setNovaFuncao] = useState('');
  const [novoSalario, setNovoSalario] = useState('');
  const [tipoMovimentacao, setTipoMovimentacao] = useState<TipoMovimentacao>('promocao');
  const [funcaoNovaVaga, setFuncaoNovaVaga] = useState('');
  const [salarioNovaVaga, setSalarioNovaVaga] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Dialog for adding substitution
  const [dialogOpen, setDialogOpen] = useState(false);

  // Chain visualization
  const [chainSteps, setChainSteps] = useState<Array<{
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
  }>>([]);

  // Load existing data
  useEffect(() => {
    if (simulacao) {
      setNome(simulacao.nome);
      setDescricao(simulacao.descricao || '');

      // Reconstruct chain from existing movements
      if (simulacao.movimentacoes && simulacao.movimentacoes.length > 0) {
        const existingChain = simulacao.movimentacoes.map((mov) => {
          const origemSnapshot = mov.colaborador_origem_snapshot as { id: string; chapa: string; nome: string; cargo: string; salario: number } | null;
          const destinoSnapshot = mov.colaborador_destino_snapshot as { id: string; chapa: string; nome: string; cargo: string; salario: number } | null;

          return {
            tipo: mov.tipo_evento,
            colaboradorOrigem: origemSnapshot ? {
              id: origemSnapshot.id,
              chapa: origemSnapshot.chapa,
              nome: origemSnapshot.nome,
              cargo: origemSnapshot.cargo,
              salario: origemSnapshot.salario,
            } as Colaborador : undefined,
            colaboradorDestino: destinoSnapshot ? {
              id: destinoSnapshot.id,
              chapa: destinoSnapshot.chapa,
              nome: destinoSnapshot.nome,
              cargo: destinoSnapshot.cargo,
              salario: destinoSnapshot.salario,
            } as Colaborador : undefined,
            novaFuncao: mov.nova_funcao || undefined,
            novoSalario: mov.novo_salario || undefined,
            funcaoNovaVaga: mov.funcao_nova_vaga || undefined,
            salarioNovaVaga: mov.salario_nova_vaga || undefined,
            tipoMovimentacao: mov.tipo_movimentacao || undefined,
            motivoSaida: mov.motivo_saida || undefined,
            observacoes: mov.observacoes || undefined,
          };
        });
        setChainSteps(existingChain);
        setStep(4); // Go to resume if already has movements
      }
    }
  }, [simulacao]);

  const colaboradorSaida = useMemo(() => {
    return colaboradoresAtivos.find((c) => c.id === colaboradorSaidaId);
  }, [colaboradoresAtivos, colaboradorSaidaId]);

  const colaboradorDestino = useMemo(() => {
    return colaboradoresAtivos.find((c) => c.id === colaboradorDestinoId);
  }, [colaboradoresAtivos, colaboradorDestinoId]);

  // Filter out already used collaborators
  const availableColaboradores = useMemo(() => {
    const usedIds = new Set<string>();
    chainSteps.forEach((step) => {
      if (step.colaboradorOrigem) usedIds.add(step.colaboradorOrigem.id);
      if (step.colaboradorDestino) usedIds.add(step.colaboradorDestino.id);
    });
    if (colaboradorSaidaId) usedIds.add(colaboradorSaidaId);
    return colaboradoresAtivos.filter((c) => !usedIds.has(c.id));
  }, [colaboradoresAtivos, chainSteps, colaboradorSaidaId]);

  const currentVaga = pendingVagas[currentVagaIndex];

  const handleStep1Next = () => {
    if (!nome.trim()) {
      toast.error('Informe o nome da simulação');
      return;
    }
    setStep(2);
  };

  const handleStep2Next = () => {
    if (!colaboradorSaidaId) {
      toast.error('Selecione o colaborador que está saindo');
      return;
    }
    if (!colaboradorSaida) return;

    // Add initial exit to chain
    setChainSteps([{
      tipo: 'saida_inicial',
      colaboradorOrigem: colaboradorSaida,
      motivoSaida,
    }]);

    // Create first pending vacancy
    setPendingVagas([{
      colaboradorId: colaboradorSaida.id,
      colaboradorNome: colaboradorSaida.nome,
      cargo: colaboradorSaida.cargo,
      salario: colaboradorSaida.salario,
    }]);
    setCurrentVagaIndex(0);
    setDialogOpen(true);
    setStep(3);
  };

  const handleAddSubstituicao = () => {
    if (substituicaoTipo === 'interno') {
      if (!colaboradorDestinoId) {
        toast.error('Selecione o colaborador que vai ocupar a vaga');
        return;
      }
      if (!novaFuncao.trim()) {
        toast.error('Informe a nova função');
        return;
      }
      const salarioNum = parseFloat(novoSalario.replace(',', '.'));
      if (isNaN(salarioNum) || salarioNum <= 0) {
        toast.error('Informe um salário válido');
        return;
      }
      if (!colaboradorDestino) return;

      // Add substitution step
      setChainSteps((prev) => [
        ...prev,
        {
          tipo: 'substituicao_interna',
          colaboradorOrigem: {
            id: currentVaga.colaboradorId,
            nome: currentVaga.colaboradorNome,
            cargo: currentVaga.cargo,
            salario: currentVaga.salario,
          } as Colaborador,
          colaboradorDestino,
          novaFuncao,
          novoSalario: salarioNum,
          tipoMovimentacao,
          observacoes: observacoes || undefined,
        },
      ]);

      // Add new pending vacancy (the position left by the promoted employee)
      const newVagas = [...pendingVagas];
      newVagas.splice(currentVagaIndex, 1); // Remove current
      newVagas.push({
        colaboradorId: colaboradorDestino.id,
        colaboradorNome: colaboradorDestino.nome,
        cargo: colaboradorDestino.cargo,
        salario: colaboradorDestino.salario,
      });
      setPendingVagas(newVagas);

      // Reset form
      resetSubstituicaoForm();

      if (newVagas.length > 0) {
        setCurrentVagaIndex(0);
      } else {
        setDialogOpen(false);
      }
    } else if (substituicaoTipo === 'contratacao') {
      if (!funcaoNovaVaga.trim()) {
        toast.error('Informe a função da nova contratação');
        return;
      }
      const salarioNum = parseFloat(salarioNovaVaga.replace(',', '.'));
      if (isNaN(salarioNum) || salarioNum <= 0) {
        toast.error('Informe um salário válido para a nova contratação');
        return;
      }

      // Add new hire step
      setChainSteps((prev) => [
        ...prev,
        {
          tipo: 'nova_contratacao',
          funcaoNovaVaga,
          salarioNovaVaga: salarioNum,
          observacoes: observacoes || undefined,
        },
      ]);

      // Remove current vacancy
      const newVagas = [...pendingVagas];
      newVagas.splice(currentVagaIndex, 1);
      setPendingVagas(newVagas);

      resetSubstituicaoForm();

      if (newVagas.length > 0) {
        setCurrentVagaIndex(0);
      } else {
        setDialogOpen(false);
      }
    } else {
      // End without replacement
      setChainSteps((prev) => [
        ...prev,
        {
          tipo: 'fim_sem_reposicao',
          colaboradorOrigem: {
            id: currentVaga.colaboradorId,
            nome: currentVaga.colaboradorNome,
            cargo: currentVaga.cargo,
            salario: currentVaga.salario,
          } as Colaborador,
          observacoes: observacoes || undefined,
        },
      ]);

      const newVagas = [...pendingVagas];
      newVagas.splice(currentVagaIndex, 1);
      setPendingVagas(newVagas);

      resetSubstituicaoForm();

      if (newVagas.length > 0) {
        setCurrentVagaIndex(0);
      } else {
        setDialogOpen(false);
      }
    }
  };

  const resetSubstituicaoForm = () => {
    setSubstituicaoTipo('interno');
    setColaboradorDestinoId('');
    setNovaFuncao('');
    setNovoSalario('');
    setTipoMovimentacao('promocao');
    setFuncaoNovaVaga('');
    setSalarioNovaVaga('');
    setObservacoes('');
  };

  const handleSaveSimulacao = async () => {
    if (!id) return;

    try {
      // Update simulation info
      await updateSimulacao.mutateAsync({
        id,
        nome,
        descricao: descricao || undefined,
      });

      // Clear existing movements and add new ones
      await clearMovimentacoes.mutateAsync();

      // Add all chain steps as movements
      for (let i = 0; i < chainSteps.length; i++) {
        const step = chainSteps[i];
        
        const origemSnapshot: Json | null = step.colaboradorOrigem ? {
          id: step.colaboradorOrigem.id,
          chapa: step.colaboradorOrigem.chapa,
          nome: step.colaboradorOrigem.nome,
          cargo: step.colaboradorOrigem.cargo,
          salario: step.colaboradorOrigem.salario,
        } : null;

        const destinoSnapshot: Json | null = step.colaboradorDestino ? {
          id: step.colaboradorDestino.id,
          chapa: step.colaboradorDestino.chapa,
          nome: step.colaboradorDestino.nome,
          cargo: step.colaboradorDestino.cargo,
          salario: step.colaboradorDestino.salario,
        } : null;

        await addMovimentacao.mutateAsync({
          simulacao_id: id,
          ordem: i + 1,
          tipo_evento: step.tipo,
          colaborador_origem_id: step.colaboradorOrigem?.id || null,
          colaborador_origem_snapshot: origemSnapshot,
          colaborador_destino_id: step.colaboradorDestino?.id || null,
          colaborador_destino_snapshot: destinoSnapshot,
          nova_funcao: step.novaFuncao || null,
          novo_salario: step.novoSalario || null,
          tipo_movimentacao: step.tipoMovimentacao || null,
          funcao_nova_vaga: step.funcaoNovaVaga || null,
          salario_nova_vaga: step.salarioNovaVaga || null,
          motivo_saida: step.motivoSaida || null,
          observacoes: step.observacoes || null,
        });
      }

      toast.success('Simulação salva com sucesso!');
      setStep(4);
    } catch (error) {
      handleError(error, 'Erro ao salvar simulação');
    }
  };

  const handleFinalize = async () => {
    if (!id) return;
    await updateSimulacao.mutateAsync({ id, status: 'finalizada' });
    toast.success('Simulação finalizada!');
    navigate('/simulacoes');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!simulacao) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Simulação não encontrada</p>
        <Button variant="link" asChild>
          <Link to="/simulacoes">Voltar para lista</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/simulacoes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {step === 4 ? 'Resumo da Simulação' : 'Editar Simulação'}
          </h1>
          <p className="text-muted-foreground">
            {step < 4 ? `Passo ${step} de 3` : nome}
          </p>
        </div>
        {step < 4 && (
          <Badge variant="secondary">{simulacao.status === 'finalizada' ? 'Finalizada' : 'Rascunho'}</Badge>
        )}
      </div>

      {/* Step Indicator */}
      {step < 4 && (
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'flex items-center gap-2',
                s <= step ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  s < step
                    ? 'bg-primary text-primary-foreground'
                    : s === step
                    ? 'border-2 border-primary text-primary'
                    : 'border-2 border-muted text-muted-foreground'
                )}
              >
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && <div className={cn('w-12 h-0.5', s < step ? 'bg-primary' : 'bg-muted')} />}
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Dados da Simulação</CardTitle>
            <CardDescription>Defina um nome e descrição para identificar esta simulação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da simulação *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Mudanças equipe Comercial - Janeiro/2026"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o objetivo desta simulação..."
                rows={3}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleStep1Next}>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Exit Employee */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5" />
              Colaborador que está saindo
            </CardTitle>
            <CardDescription>
              Selecione o colaborador que está se desligando e o motivo da saída
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Colaborador *</Label>
              <Select value={colaboradorSaidaId} onValueChange={setColaboradorSaidaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {colaboradoresAtivos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.chapa} - {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {colaboradorSaida && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">CHAPA:</span>{' '}
                    <span className="font-medium">{colaboradorSaida.chapa}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nome:</span>{' '}
                    <span className="font-medium">{colaboradorSaida.nome}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cargo:</span>{' '}
                    <span className="font-medium">{colaboradorSaida.cargo}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Salário:</span>{' '}
                    <span className="font-medium">{formatCurrency(colaboradorSaida.salario)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Motivo da saída *</Label>
              <Select value={motivoSaida} onValueChange={(v) => setMotivoSaida(v as MotivoSaida)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_SAIDA.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={handleStep2Next}>
                Definir substituições
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Chain of Substitutions */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Chain Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Cadeia de Substituições</CardTitle>
              <CardDescription>
                Visualize e continue adicionando movimentações à cadeia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chainSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center',
                          step.tipo === 'saida_inicial'
                            ? 'bg-destructive/10 text-destructive'
                            : step.tipo === 'nova_contratacao'
                            ? 'bg-success/10 text-success'
                            : step.tipo === 'fim_sem_reposicao'
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-primary/10 text-primary'
                        )}
                      >
                        {step.tipo === 'saida_inicial' && <UserMinus className="h-5 w-5" />}
                        {step.tipo === 'substituicao_interna' && <Users className="h-5 w-5" />}
                        {step.tipo === 'nova_contratacao' && <UserPlus className="h-5 w-5" />}
                        {step.tipo === 'fim_sem_reposicao' && <X className="h-5 w-5" />}
                      </div>
                      {index < chainSteps.length - 1 && (
                        <div className="w-0.5 h-8 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <ChainStepCard step={step} />
                    </div>
                  </div>
                ))}

                {/* Pending Vacancies */}
                {pendingVagas.length > 0 && (
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-warning/10 text-warning border-2 border-dashed border-warning">
                        <ArrowDown className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <Card className="border-dashed border-warning">
                        <CardContent className="pt-4">
                          <p className="text-sm font-medium text-warning mb-2">
                            Vagas em aberto ({pendingVagas.length})
                          </p>
                          <div className="space-y-2">
                            {pendingVagas.map((vaga, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between p-2 rounded bg-muted/50"
                              >
                                <span className="text-sm">
                                  {vaga.cargo} (ex: {vaga.colaboradorNome})
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {formatCurrency(vaga.salario)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <Button className="mt-4 w-full" onClick={() => setDialogOpen(true)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Definir próxima substituição
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  onClick={handleSaveSimulacao}
                  disabled={chainSteps.length === 0 || pendingVagas.length > 0}
                >
                  {addMovimentacao.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Salvar e ver resumo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Substitution Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Quem vai ocupar esta vaga?</DialogTitle>
                <DialogDescription>
                  Vaga de <strong>{currentVaga?.cargo}</strong> (ex: {currentVaga?.colaboradorNome})
                  <br />
                  Salário atual: <strong>{currentVaga && formatCurrency(currentVaga.salario)}</strong>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de substituição</Label>
                  <Select
                    value={substituicaoTipo}
                    onValueChange={(v) => setSubstituicaoTipo(v as 'interno' | 'contratacao' | 'fim')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interno">Colaborador interno</SelectItem>
                      <SelectItem value="contratacao">Nova contratação</SelectItem>
                      <SelectItem value="fim">Encerrar sem reposição</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {substituicaoTipo === 'interno' && (
                  <>
                    <div className="space-y-2">
                      <Label>Colaborador *</Label>
                      <Select value={colaboradorDestinoId} onValueChange={setColaboradorDestinoId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableColaboradores.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.chapa} - {c.nome} ({c.cargo})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {colaboradorDestino && (
                      <div className="p-3 rounded-lg bg-muted/50 text-sm">
                        <p>
                          <strong>Salário atual:</strong> {formatCurrency(colaboradorDestino.salario)}
                        </p>
                        <p>
                          <strong>Cargo atual:</strong> {colaboradorDestino.cargo}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nova função *</Label>
                        <Input
                          value={novaFuncao}
                          onChange={(e) => setNovaFuncao(e.target.value)}
                          placeholder="Ex: Gerente"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Novo salário *</Label>
                        <Input
                          value={novoSalario}
                          onChange={(e) => setNovoSalario(e.target.value)}
                          placeholder="Ex: 8000.00"
                        />
                      </div>
                    </div>

                    {colaboradorDestino && novoSalario && (
                      <SalaryComparison
                        salarioAnterior={colaboradorDestino.salario}
                        novoSalario={parseFloat(novoSalario.replace(',', '.')) || 0}
                      />
                    )}

                    <div className="space-y-2">
                      <Label>Tipo de movimentação</Label>
                      <Select
                        value={tipoMovimentacao}
                        onValueChange={(v) => setTipoMovimentacao(v as TipoMovimentacao)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_MOVIMENTACAO.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {substituicaoTipo === 'contratacao' && (
                  <>
                    <div className="space-y-2">
                      <Label>Função da nova vaga *</Label>
                      <Input
                        value={funcaoNovaVaga}
                        onChange={(e) => setFuncaoNovaVaga(e.target.value)}
                        placeholder="Ex: Analista Jr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Salário proposto *</Label>
                      <Input
                        value={salarioNovaVaga}
                        onChange={(e) => setSalarioNovaVaga(e.target.value)}
                        placeholder="Ex: 4000.00"
                      />
                    </div>
                  </>
                )}

                {substituicaoTipo === 'fim' && (
                  <div className="p-4 rounded-lg bg-muted text-center">
                    <X className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      A vaga será extinta e não haverá nova contratação para esta posição.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Observações (opcional)</Label>
                  <Textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Notas adicionais sobre esta movimentação..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddSubstituicao}>
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Step 4: Resume */}
      {step === 4 && simulacao && (
        <SimulacaoResumo
          simulacao={simulacao}
          chainSteps={chainSteps}
          onEdit={() => setStep(3)}
          onFinalize={handleFinalize}
        />
      )}
    </div>
  );
}

