import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useRmConfig } from './useRmConfig';
import { toast } from 'sonner';
import { useErrorHandler } from './useErrorHandler';

export interface RmColaborador {
  // Campos retornados pela consulta NISFOL0088 do RM
  CHAPA?: string;
  NOME?: string;
  CARGO?: string;
  SALARIO?: number;
  // Adicione outros campos conforme necessário
  [key: string]: any;
}

export interface RmConsultaParams {
  codSentenca: string;
  codColigada: number;
  codSistema: string;
  params?: Record<string, string | number>;
}

/**
 * Hook para buscar colaboradores do TOTVS RM
 */
export function useRmColaboradores() {
  const { user } = useAuth();
  const { config: rmConfig } = useRmConfig();
  const { handleError } = useErrorHandler();

  /**
   * Busca colaboradores do RM usando a consulta SQL
   */
  const buscarColaboradoresRm = useQuery({
    queryKey: ['rm-colaboradores', user?.id, rmConfig?.rm_base_url],
    queryFn: async () => {
      if (!rmConfig?.rm_base_url || !rmConfig?.rm_username || !rmConfig?.rm_password) {
        throw new Error('Configure as credenciais do RM antes de buscar colaboradores');
      }

      // Parâmetros da consulta NISFOL0088
      const consultaParams: RmConsultaParams = {
        codSentenca: 'NISFOL0088',
        codColigada: 0,
        codSistema: 'P',
        params: {
          CODCOLIGADA: 1,
          // Se quiser buscar um colaborador específico, adicione: CHAPA: '004071'
        },
      };

      // Monta URL da requisição
      const params = new URLSearchParams({
        codSentenca: consultaParams.codSentenca,
        codColigada: consultaParams.codColigada.toString(),
        codSistema: consultaParams.codSistema,
      });

      if (consultaParams.params) {
        params.append('params', JSON.stringify(consultaParams.params));
      }

      // Faz requisição ao backend
      const response = await fetch(`/rm/consulta-sql?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user!.id,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro ao buscar colaboradores no RM' }));
        throw new Error(error.message || 'Erro ao buscar colaboradores no RM');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Erro ao buscar colaboradores no RM');
      }

      // Retorna os dados da consulta
      return (result.data || []) as RmColaborador[];
    },
    enabled: !!user && !!rmConfig?.rm_base_url && !!rmConfig?.rm_username && !!rmConfig?.rm_password,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });

  /**
   * Busca um colaborador específico do RM por CHAPA
   */
  const buscarColaboradorPorChapa = useMutation({
    mutationFn: async (chapa: string) => {
      if (!rmConfig?.rm_base_url || !rmConfig?.rm_username || !rmConfig?.rm_password) {
        throw new Error('Configure as credenciais do RM antes de buscar colaboradores');
      }

      const consultaParams: RmConsultaParams = {
        codSentenca: 'NISFOL0088',
        codColigada: 0,
        codSistema: 'P',
        params: {
          CODCOLIGADA: 1,
          CHAPA: chapa,
        },
      };

      const params = new URLSearchParams({
        codSentenca: consultaParams.codSentenca,
        codColigada: consultaParams.codColigada.toString(),
        codSistema: consultaParams.codSistema,
        params: JSON.stringify(consultaParams.params || {}),
      });

      const response = await fetch(`/rm/consulta-sql?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user!.id,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro ao buscar colaborador no RM' }));
        throw new Error(error.message || 'Erro ao buscar colaborador no RM');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Erro ao buscar colaborador no RM');
      }

      const colaboradores = (result.data || []) as RmColaborador[];
      return colaboradores.length > 0 ? colaboradores[0] : null;
    },
    onError: (error) => {
      handleError(error, 'Erro ao buscar colaborador no RM');
    },
  });

  return {
    colaboradoresRm: buscarColaboradoresRm.data || [],
    isLoading: buscarColaboradoresRm.isLoading,
    error: buscarColaboradoresRm.error,
    refetch: buscarColaboradoresRm.refetch,
    buscarColaboradorPorChapa,
  };
}
