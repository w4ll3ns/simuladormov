/**
 * Hook para buscar colaboradores do TOTVS RM
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { TotvsRestClient } from '@/integrations/totvs/client';
import { loadTotvsConfig } from '@/integrations/totvs/config';
import { parseParametrosArray, parseParametrosString, type TotvsParametro } from '@/integrations/totvs/types';
import type { TotvsColaboradorResponse } from '@/integrations/totvs/types';
import type { Colaborador } from './useColaboradores';

/**
 * Transforma resposta do TOTVS para formato Colaborador
 */
function transformTotvsResponse(
  response: TotvsColaboradorResponse
): Omit<Colaborador, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
  return {
    chapa: response.CHAPA_FUNC || '',
    nome: response.NOME_FUNC || '',
    cargo: response.FUNCAO_FUNC || '',
    salario: response.SALARIO_FUNC || 0,
    ativo: true, // Padrão para colaboradores do TOTVS
  };
}

/**
 * Hook para buscar colaboradores do TOTVS
 */
export function useColaboradoresTotvs(enabled: boolean = true) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['colaboradores-totvs', user?.id],
    queryFn: async () => {
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Carregar configurações TOTVS
      const config = await loadTotvsConfig(user.id);
      if (!config) {
        throw new Error(
          'Configurações TOTVS não encontradas. Configure primeiro.'
        );
      }

      // Criar cliente TOTVS
      const client = new TotvsRestClient(config);

      // Converter parâmetros para objeto
      let parametros: Record<string, string | number> = {};
      if (config.parametros && config.parametros.trim() !== '') {
        try {
          // Tentar parsear como JSON (array de TotvsParametro)
          const parametrosArray = JSON.parse(config.parametros) as TotvsParametro[];
          if (Array.isArray(parametrosArray) && parametrosArray.length > 0) {
            parametros = parseParametrosArray(parametrosArray);
          } else {
            // Fallback para formato string antigo
            parametros = parseParametrosString(config.parametros);
          }
        } catch {
          // Se não for JSON, usar formato string antigo
          parametros = parseParametrosString(config.parametros);
        }
      }

      // Executar consulta com parâmetros
      const response = await client.realizaConsulta<TotvsColaboradorResponse>(
        Object.keys(parametros).length > 0 ? parametros : undefined
      );

      // Validar campos obrigatórios
      const validRecords = response.filter((record) => {
        return (
          record.CHAPA_FUNC &&
          record.NOME_FUNC &&
          record.FUNCAO_FUNC &&
          record.SALARIO_FUNC !== undefined
        );
      });

      if (validRecords.length === 0) {
        console.warn('Nenhum registro válido retornado do TOTVS');
        return [];
      }

      // Transformar para formato Colaborador
      return validRecords.map(transformTotvsResponse);
    },
    enabled: enabled && !!user,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Função auxiliar para buscar colaboradores do TOTVS (para sincronização)
 */
export async function fetchColaboradoresFromTotvs(
  userId: string
): Promise<Omit<Colaborador, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]> {
  // Carregar configurações TOTVS
  const config = await loadTotvsConfig(userId);
  if (!config) {
    throw new Error('Configurações TOTVS não encontradas');
  }

  // Criar cliente TOTVS
  const client = new TotvsRestClient(config);

  // Converter parâmetros para objeto
  let parametros: Record<string, string | number> = {};
  if (config.parametros && config.parametros.trim() !== '') {
    try {
      // Tentar parsear como JSON (array de TotvsParametro)
      const parametrosArray = JSON.parse(config.parametros) as TotvsParametro[];
      if (Array.isArray(parametrosArray) && parametrosArray.length > 0) {
        parametros = parseParametrosArray(parametrosArray);
      } else {
        // Fallback para formato string antigo
        parametros = parseParametrosString(config.parametros);
      }
    } catch {
      // Se não for JSON, usar formato string antigo
      parametros = parseParametrosString(config.parametros);
    }
  }

  // Executar consulta com parâmetros
  const response = await client.realizaConsulta<TotvsColaboradorResponse>(
    Object.keys(parametros).length > 0 ? parametros : undefined
  );

  // Validar e transformar
  const validRecords = response.filter((record) => {
    return (
      record.CHAPA_FUNC &&
      record.NOME_FUNC &&
      record.FUNCAO_FUNC &&
      record.SALARIO_FUNC !== undefined
    );
  });

  return validRecords.map(transformTotvsResponse);
}

