import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Database, Json } from '@/integrations/supabase/types';

type TipoEvento = Database['public']['Enums']['tipo_evento'];
type TipoMovimentacao = Database['public']['Enums']['tipo_movimentacao'];
type StatusSimulacao = Database['public']['Enums']['status_simulacao'];
type MotivoSaida = Database['public']['Enums']['motivo_saida'];

export interface Movimentacao {
  id: string;
  simulacao_id: string;
  ordem: number;
  tipo_evento: TipoEvento;
  colaborador_origem_id: string | null;
  colaborador_origem_snapshot: Json | null;
  colaborador_destino_id: string | null;
  colaborador_destino_snapshot: Json | null;
  nova_funcao: string | null;
  novo_salario: number | null;
  tipo_movimentacao: TipoMovimentacao | null;
  funcao_nova_vaga: string | null;
  salario_nova_vaga: number | null;
  motivo_saida: MotivoSaida | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Simulacao {
  id: string;
  user_id: string;
  nome: string;
  descricao: string | null;
  status: StatusSimulacao;
  created_at: string;
  updated_at: string;
  movimentacoes?: Movimentacao[];
}

export interface SimulacaoWithStats extends Simulacao {
  totalMovimentacoes: number;
  impactoTotal: number;
}

export function useSimulacoes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const simulacoesQuery = useQuery({
    queryKey: ['simulacoes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulacoes')
        .select(`
          *,
          movimentacoes (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate stats for each simulation
      const simulacoesWithStats: SimulacaoWithStats[] = (data ?? []).map((sim) => {
        const movs = sim.movimentacoes || [];
        let impactoTotal = 0;

        movs.forEach((mov) => {
          if (mov.tipo_evento === 'substituicao_interna' && mov.novo_salario && mov.colaborador_destino_snapshot) {
            const snapshot = mov.colaborador_destino_snapshot as { salario?: number };
            const salarioAnterior = snapshot?.salario || 0;
            impactoTotal += mov.novo_salario - salarioAnterior;
          }
          if (mov.tipo_evento === 'nova_contratacao' && mov.salario_nova_vaga) {
            impactoTotal += mov.salario_nova_vaga;
          }
          if (mov.tipo_evento === 'saida_inicial' && mov.colaborador_origem_snapshot) {
            const snapshot = mov.colaborador_origem_snapshot as { salario?: number };
            const salarioSaida = snapshot?.salario || 0;
            impactoTotal -= salarioSaida;
          }
        });

        return {
          ...sim,
          totalMovimentacoes: movs.length,
          impactoTotal,
        } as SimulacaoWithStats;
      });

      return simulacoesWithStats;
    },
    enabled: !!user,
  });

  const createSimulacao = useMutation({
    mutationFn: async (data: { nome: string; descricao?: string }) => {
      const { data: simulacao, error } = await supabase
        .from('simulacoes')
        .insert([{ ...data, user_id: user!.id }])
        .select()
        .single();

      if (error) throw error;
      return simulacao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulacoes'] });
    },
    onError: () => {
      toast.error('Erro ao criar simulação');
    },
  });

  const updateSimulacao = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; nome?: string; descricao?: string; status?: StatusSimulacao }) => {
      const { data, error } = await supabase
        .from('simulacoes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulacoes'] });
    },
    onError: () => {
      toast.error('Erro ao atualizar simulação');
    },
  });

  const deleteSimulacao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('simulacoes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulacoes'] });
      toast.success('Simulação excluída!');
    },
    onError: () => {
      toast.error('Erro ao excluir simulação');
    },
  });

  const duplicateSimulacao = useMutation({
    mutationFn: async (simulacaoId: string) => {
      // Get the original simulation with movements
      const { data: original, error: fetchError } = await supabase
        .from('simulacoes')
        .select(`*, movimentacoes (*)`)
        .eq('id', simulacaoId)
        .single();

      if (fetchError) throw fetchError;

      // Create new simulation
      const { data: newSim, error: createError } = await supabase
        .from('simulacoes')
        .insert([{
          nome: `${original.nome} (cópia)`,
          descricao: original.descricao,
          user_id: user!.id,
          status: 'rascunho' as StatusSimulacao,
        }])
        .select()
        .single();

      if (createError) throw createError;

      // Copy movements
      if (original.movimentacoes && original.movimentacoes.length > 0) {
        const newMovs: Database['public']['Tables']['movimentacoes']['Insert'][] = original.movimentacoes.map((mov) => ({
          simulacao_id: newSim.id,
          ordem: mov.ordem,
          tipo_evento: mov.tipo_evento,
          colaborador_origem_id: mov.colaborador_origem_id || null,
          colaborador_origem_snapshot: mov.colaborador_origem_snapshot || null,
          colaborador_destino_id: mov.colaborador_destino_id || null,
          colaborador_destino_snapshot: mov.colaborador_destino_snapshot || null,
          nova_funcao: mov.nova_funcao || null,
          novo_salario: mov.novo_salario !== null && mov.novo_salario !== undefined 
            ? Number(mov.novo_salario) 
            : null,
          tipo_movimentacao: mov.tipo_movimentacao || null,
          funcao_nova_vaga: mov.funcao_nova_vaga || null,
          salario_nova_vaga: mov.salario_nova_vaga !== null && mov.salario_nova_vaga !== undefined 
            ? Number(mov.salario_nova_vaga) 
            : null,
          motivo_saida: mov.motivo_saida || null,
          observacoes: mov.observacoes || null,
        }));

        const { error: movsError } = await supabase
          .from('movimentacoes')
          .insert(newMovs)
          .select();

        if (movsError) {
          console.error('Erro ao duplicar movimentações:', movsError);
          console.error('Dados enviados:', JSON.stringify(newMovs, null, 2));
          throw movsError;
        }
      }

      return newSim;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulacoes'] });
      toast.success('Simulação duplicada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao duplicar simulação');
    },
  });

  return {
    simulacoes: simulacoesQuery.data ?? [],
    isLoading: simulacoesQuery.isLoading,
    error: simulacoesQuery.error,
    createSimulacao,
    updateSimulacao,
    deleteSimulacao,
    duplicateSimulacao,
  };
}

export function useSimulacao(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['simulacao', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('simulacoes')
        .select(`
          *,
          movimentacoes (*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // Sort movements by order
        data.movimentacoes = (data.movimentacoes || []).sort((a, b) => a.ordem - b.ordem);
      }
      
      return data as Simulacao | null;
    },
    enabled: !!user && !!id,
  });
}

export function useMovimentacoes(simulacaoId: string | undefined) {
  const queryClient = useQueryClient();

  const addMovimentacao = useMutation({
    mutationFn: async (data: Omit<Movimentacao, 'id' | 'created_at' | 'updated_at'>) => {
      // Preparar dados para inserção, garantindo tipos corretos
      const insertData: Database['public']['Tables']['movimentacoes']['Insert'] = {
        simulacao_id: data.simulacao_id,
        ordem: data.ordem,
        tipo_evento: data.tipo_evento,
        colaborador_origem_id: data.colaborador_origem_id || null,
        colaborador_origem_snapshot: data.colaborador_origem_snapshot || null,
        colaborador_destino_id: data.colaborador_destino_id || null,
        colaborador_destino_snapshot: data.colaborador_destino_snapshot || null,
        nova_funcao: data.nova_funcao || null,
        novo_salario: data.novo_salario !== null && data.novo_salario !== undefined 
          ? Number(data.novo_salario) 
          : null,
        tipo_movimentacao: data.tipo_movimentacao || null,
        funcao_nova_vaga: data.funcao_nova_vaga || null,
        salario_nova_vaga: data.salario_nova_vaga !== null && data.salario_nova_vaga !== undefined 
          ? Number(data.salario_nova_vaga) 
          : null,
        motivo_saida: data.motivo_saida || null,
        observacoes: data.observacoes || null,
      };

      const { data: mov, error } = await supabase
        .from('movimentacoes')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao inserir movimentação:', error);
        console.error('Dados enviados:', JSON.stringify(insertData, null, 2));
        throw error;
      }
      return mov;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulacao', simulacaoId] });
      queryClient.invalidateQueries({ queryKey: ['simulacoes'] });
    },
    onError: (error: any) => {
      console.error('Erro detalhado ao adicionar movimentação:', error);
      const errorMessage = error?.message || 'Erro ao adicionar movimentação';
      const errorDetails = error?.details || '';
      toast.error(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`);
    },
  });

  const updateMovimentacao = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Movimentacao> & { id: string }) => {
      const { data, error } = await supabase
        .from('movimentacoes')
        .update(updates as Database['public']['Tables']['movimentacoes']['Update'])
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulacao', simulacaoId] });
      queryClient.invalidateQueries({ queryKey: ['simulacoes'] });
    },
    onError: () => {
      toast.error('Erro ao atualizar movimentação');
    },
  });

  const deleteMovimentacao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('movimentacoes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulacao', simulacaoId] });
      queryClient.invalidateQueries({ queryKey: ['simulacoes'] });
    },
    onError: () => {
      toast.error('Erro ao remover movimentação');
    },
  });

  const clearMovimentacoes = useMutation({
    mutationFn: async () => {
      if (!simulacaoId) return;
      const { error } = await supabase
        .from('movimentacoes')
        .delete()
        .eq('simulacao_id', simulacaoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulacao', simulacaoId] });
      queryClient.invalidateQueries({ queryKey: ['simulacoes'] });
    },
  });

  return {
    addMovimentacao,
    updateMovimentacao,
    deleteMovimentacao,
    clearMovimentacoes,
  };
}
