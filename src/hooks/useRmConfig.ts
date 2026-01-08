import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useErrorHandler } from './useErrorHandler';

export interface RmConfig {
  id: string;
  user_id: string;
  chave: string;
  valor: string;
  descricao?: string | null;
  categoria: string;
  created_at: string;
  updated_at: string;
}

export interface RmConfigFormData {
  rm_base_url: string;
  rm_username: string;
  rm_password: string;
}

const DEFAULT_RM_CONFIG_KEYS = [
  'rm_base_url',
  'rm_username',
  'rm_password',
] as const;

/**
 * Hook para gerenciar configurações do TOTVS RM
 */
export function useRmConfig() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  // Query para buscar configurações do RM
  const configQuery = useQuery({
    queryKey: ['rm-config', user?.id],
    queryFn: async () => {
      if (!user) {
        return {
          rm_base_url: '',
          rm_username: '',
          rm_password: '',
        } as RmConfigFormData;
      }

      const { data, error } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('user_id', user.id)
        .in('chave', DEFAULT_RM_CONFIG_KEYS)
        .order('chave', { ascending: true });

      // Se não houver dados (tabela vazia ou erro), retorna valores vazios
      if (error) {
        // Se for erro 42P01 (tabela não existe), apenas loga e retorna vazios
        if (error.code === '42P01' || error.message?.includes('relation "configuracoes" does not exist')) {
          console.warn('[useRmConfig] Tabela configuracoes não existe. Execute a migration.');
          return {
            rm_base_url: '',
            rm_username: '',
            rm_password: '',
          } as RmConfigFormData;
        }
        throw error;
      }

      // Converte array de configurações para objeto
      const configMap: Partial<RmConfigFormData> = {};
      const configs = (data || []) as RmConfig[];

      configs.forEach((config) => {
        if (config.chave === 'rm_base_url') {
          configMap.rm_base_url = config.valor;
        } else if (config.chave === 'rm_username') {
          configMap.rm_username = config.valor;
        } else if (config.chave === 'rm_password') {
          configMap.rm_password = config.valor;
        }
      });

      // Retorna com valores padrão se não existirem
      return {
        rm_base_url: configMap.rm_base_url || '',
        rm_username: configMap.rm_username || '',
        rm_password: configMap.rm_password || '',
      } as RmConfigFormData;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos - evita refetch constante
    retry: 1, // Tenta apenas 1 vez em caso de erro
  });

  // Mutation para salvar configurações
  const saveConfig = useMutation({
    mutationFn: async (config: RmConfigFormData) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Prepara dados para upsert (inserir ou atualizar)
      const configsToUpsert = [
        {
          user_id: user.id,
          chave: 'rm_base_url',
          valor: config.rm_base_url.trim(),
          descricao: 'URL base do servidor TOTVS RM',
          categoria: 'rm',
        },
        {
          user_id: user.id,
          chave: 'rm_username',
          valor: config.rm_username.trim(),
          descricao: 'Usuário para autenticação no TOTVS RM',
          categoria: 'rm',
        },
        {
          user_id: user.id,
          chave: 'rm_password',
          valor: config.rm_password, // Não fazer trim na senha
          descricao: 'Senha para autenticação no TOTVS RM (criptografada)',
          categoria: 'rm',
        },
      ];

      // Executa upsert para cada configuração
      const { data, error } = await supabase
        .from('configuracoes')
        .upsert(configsToUpsert, {
          onConflict: 'user_id,chave',
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rm-config'] });
      toast.success('Configurações do RM salvas com sucesso!');
    },
    onError: (error) => {
      handleError(error, 'Erro ao salvar configurações do RM');
    },
  });

  // Mutation para testar conexão
  const testConnection = useMutation({
    mutationFn: async (config?: Partial<RmConfigFormData>) => {
      const configToTest = config || configQuery.data;
      
      if (!configToTest || !configToTest.rm_base_url || !configToTest.rm_username || !configToTest.rm_password) {
        throw new Error('Configure todos os campos antes de testar');
      }

      // Faz uma requisição de teste para o backend
      // Usa proxy do Vite em desenvolvimento ou URL direta em produção
      const backendUrl = import.meta.env.VITE_API_URL || '';
      const healthEndpoint = backendUrl ? `${backendUrl}/rm/health` : '/rm/health';
      
      const response = await fetch(healthEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Envia credenciais temporárias para teste
          'X-RM-Test-Config': JSON.stringify({
            baseUrl: configToTest.rm_base_url,
            username: configToTest.rm_username,
            password: configToTest.rm_password,
          }),
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro ao testar conexão' }));
        throw new Error(error.message || 'Erro ao testar conexão com o RM');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success('Conexão com o RM testada com sucesso!');
    },
    onError: (error) => {
      handleError(error, 'Erro ao testar conexão com o RM');
    },
  });

  return {
    config: configQuery.data || {
      rm_base_url: '',
      rm_username: '',
      rm_password: '',
    },
    isLoading: configQuery.isLoading,
    error: configQuery.error,
    saveConfig,
    testConnection,
  };
}
