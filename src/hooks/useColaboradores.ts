import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

export function useColaboradores() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const colaboradoresQuery = useQuery({
    queryKey: ['colaboradores', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('colaboradores')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      return data as Colaborador[];
    },
    enabled: !!user,
  });

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
    onError: (error: Error) => {
      toast.error(error.message);
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
    onError: (error: Error) => {
      toast.error(error.message);
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
    onError: (error: Error) => {
      toast.error(`Erro na importação: ${error.message}`);
    },
  });

  return {
    colaboradores: colaboradoresQuery.data ?? [],
    colaboradoresAtivos: (colaboradoresQuery.data ?? []).filter((c) => c.ativo),
    isLoading: colaboradoresQuery.isLoading,
    error: colaboradoresQuery.error,
    createColaborador,
    updateColaborador,
    toggleColaboradorStatus,
    importColaboradores,
  };
}
