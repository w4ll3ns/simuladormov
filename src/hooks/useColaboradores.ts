import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useColaboradoresTotvs, fetchColaboradoresFromTotvs } from './useColaboradoresTotvs';

export interface Colaborador {
  id: string;
  user_id: string;
  chapa: string;
  nome: string;
  cargo: string;
  salario: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export type ColaboradorInsert = Omit<Colaborador, 'id' | 'created_at' | 'updated_at'>;
export type ColaboradorUpdate = Partial<Omit<Colaborador, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type FonteDados = 'supabase' | 'totvs';

export function useColaboradores(fonteDados: FonteDados = 'totvs') {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Hook para buscar do TOTVS
  const totvsQuery = useColaboradoresTotvs(fonteDados === 'totvs');

  // Query para buscar do Supabase
  const supabaseQuery = useQuery({
    queryKey: ['colaboradores', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      return data as Colaborador[];
    },
    enabled: !!user && fonteDados === 'supabase',
  });

  // Determinar qual query usar baseado na fonte de dados
  const colaboradoresQuery = fonteDados === 'totvs' ? totvsQuery : supabaseQuery;

  const createColaborador = useMutation({
    mutationFn: async (colaborador: Omit<ColaboradorInsert, 'user_id'>) => {
      const { data, error } = await supabase
        .from('colaboradores')
        .insert([{ ...colaborador, user_id: user!.id }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Já existe um colaborador com esta CHAPA');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast.success('Colaborador cadastrado com sucesso!');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao cadastrar colaborador';
      if (errorMessage.includes('23505') || errorMessage.includes('CHAPA')) {
        toast.error('Já existe um colaborador com esta CHAPA');
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const updateColaborador = useMutation({
    mutationFn: async ({ id, ...updates }: ColaboradorUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('colaboradores')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Já existe um colaborador com esta CHAPA');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast.success('Colaborador atualizado com sucesso!');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar colaborador';
      if (errorMessage.includes('23505') || errorMessage.includes('CHAPA')) {
        toast.error('Já existe um colaborador com esta CHAPA');
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const toggleColaboradorStatus = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { data, error } = await supabase
        .from('colaboradores')
        .update({ ativo })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast.success(data.ativo ? 'Colaborador reativado!' : 'Colaborador desativado!');
    },
    onError: () => {
      toast.error('Erro ao alterar status do colaborador');
    },
  });

  const importColaboradores = useMutation({
    mutationFn: async (colaboradores: Array<{ chapa: string; nome: string; cargo: string; salario: number }>) => {
      const toInsert = colaboradores.map((c) => ({
        ...c,
        user_id: user!.id,
        ativo: true,
      }));

      const { data, error } = await supabase
        .from('colaboradores')
        .insert(toInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast.success(`${data.length} colaboradores importados com sucesso!`);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Erro na importação';
      toast.error(`Erro na importação: ${errorMessage}`);
    },
  });

  // Função de sincronização TOTVS → Supabase
  const syncFromTotvs = useMutation({
    mutationFn: async (options?: { replace?: boolean }) => {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar colaboradores do TOTVS
      const colaboradoresTotvs = await fetchColaboradoresFromTotvs(user.id);

      if (colaboradoresTotvs.length === 0) {
        throw new Error('Nenhum colaborador encontrado no TOTVS');
      }

      // Preparar dados para inserção
      const toInsert = colaboradoresTotvs.map((c) => ({
        ...c,
        user_id: user.id,
      }));

      if (options?.replace) {
        // Substituir todos os colaboradores existentes
        // Primeiro, desativar todos os existentes
        await supabase
          .from('colaboradores')
          .update({ ativo: false })
          .eq('user_id', user.id);

        // Depois, inserir os novos (ou atualizar se já existirem)
        const { data, error } = await supabase
          .from('colaboradores')
          .upsert(toInsert, {
            onConflict: 'user_id,chapa',
            ignoreDuplicates: false,
          })
          .select();

        if (error) throw error;
        return data;
      } else {
        // Apenas inserir novos (ignorar duplicados)
        const { data, error } = await supabase
          .from('colaboradores')
          .insert(toInsert)
          .select();

        if (error) {
          // Se houver erro de duplicata, tentar atualizar
          if (error.code === '23505') {
            // Atualizar colaboradores existentes
            const updates = await Promise.all(
              colaboradoresTotvs.map(async (c) => {
                const { data: updated, error: updateError } = await supabase
                  .from('colaboradores')
                  .update({
                    nome: c.nome,
                    cargo: c.cargo,
                    salario: c.salario,
                    ativo: true,
                  })
                  .eq('user_id', user.id)
                  .eq('chapa', c.chapa)
                  .select()
                  .single();

                if (updateError) throw updateError;
                return updated;
              })
            );
            return updates;
          }
          throw error;
        }
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast.success(`${data.length} colaboradores sincronizados com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro na sincronização: ${error.message}`);
    },
  });

  // Converter dados do TOTVS para formato Colaborador (se necessário)
  const colaboradoresData = fonteDados === 'totvs' 
    ? (colaboradoresQuery.data?.map((c, index) => ({
        id: `totvs-${index}`,
        user_id: user?.id || '',
        ...c,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) as Colaborador[] | undefined) ?? []
    : (colaboradoresQuery.data as Colaborador[] | undefined) ?? [];

  return {
    colaboradores: colaboradoresData,
    colaboradoresAtivos: colaboradoresData.filter((c) => c.ativo),
    isLoading: colaboradoresQuery.isLoading,
    error: colaboradoresQuery.error,
    fonteDados,
    createColaborador,
    updateColaborador,
    toggleColaboradorStatus,
    importColaboradores,
    syncFromTotvs,
  };
}
