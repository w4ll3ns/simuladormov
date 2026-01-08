/**
 * Sistema de configuração TOTVS com armazenamento no Supabase
 * Todas as configurações são white label e armazenadas por usuário
 */

import { supabase } from '@/integrations/supabase/client';
import type { TotvsConfig, TotvsParametro } from './types';

const CONFIG_CATEGORY = 'totvs';
const CONFIG_KEYS = {
  BASE_URL: 'totvs_base_url',
  USERNAME: 'totvs_username',
  PASSWORD: 'totvs_password',
  CODIGO_CONSULTA: 'totvs_codigo_consulta',
  COLIGADA: 'totvs_coligada',
  SISTEMA: 'totvs_sistema',
  PARAMETROS: 'totvs_parametros',
  TIMEOUT: 'totvs_timeout',
  RETRIES: 'totvs_retries',
} as const;

/**
 * Carrega todas as configurações TOTVS do usuário logado
 */
export async function loadTotvsConfig(
  userId: string
): Promise<TotvsConfig | null> {
  try {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('chave, valor')
      .eq('user_id', userId)
      .eq('categoria', CONFIG_CATEGORY);

    if (error) {
      console.error('Erro ao carregar configurações TOTVS:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Converter array de configurações em objeto
    const configMap = new Map(
      data.map((item) => [item.chave, item.valor])
    );

    // Verificar se todas as configurações obrigatórias estão presentes
    const requiredKeys = [
      CONFIG_KEYS.BASE_URL,
      CONFIG_KEYS.USERNAME,
      CONFIG_KEYS.PASSWORD,
      CONFIG_KEYS.CODIGO_CONSULTA,
      CONFIG_KEYS.COLIGADA,
      CONFIG_KEYS.SISTEMA,
    ];

    const missingKeys = requiredKeys.filter((key) => !configMap.has(key));
    if (missingKeys.length > 0) {
      console.warn('Configurações obrigatórias faltando:', missingKeys);
      return null;
    }

    // Construir objeto de configuração
    const config: TotvsConfig = {
      baseUrl: configMap.get(CONFIG_KEYS.BASE_URL) || '',
      username: configMap.get(CONFIG_KEYS.USERNAME) || '',
      password: configMap.get(CONFIG_KEYS.PASSWORD) || '',
      codigoConsulta: configMap.get(CONFIG_KEYS.CODIGO_CONSULTA) || '',
      coligada: configMap.get(CONFIG_KEYS.COLIGADA) || '',
      sistema: configMap.get(CONFIG_KEYS.SISTEMA) || '',
    };

    // Adicionar parâmetros se existirem (JSON string)
    const parametros = configMap.get(CONFIG_KEYS.PARAMETROS);
    if (parametros) {
      try {
        // Validar se é JSON válido
        JSON.parse(parametros);
        config.parametros = parametros;
      } catch {
        // Se não for JSON válido, manter como string (compatibilidade)
        config.parametros = parametros;
      }
    }

    // Adicionar configurações opcionais
    const timeout = configMap.get(CONFIG_KEYS.TIMEOUT);
    if (timeout) {
      config.timeout = parseInt(timeout, 10);
    }

    const retries = configMap.get(CONFIG_KEYS.RETRIES);
    if (retries) {
      config.retries = parseInt(retries, 10);
    }

    return config;
  } catch (error) {
    console.error('Erro ao carregar configurações TOTVS:', error);
    return null;
  }
}

/**
 * Salva ou atualiza as configurações TOTVS do usuário
 */
export async function saveTotvsConfig(
  userId: string,
  config: TotvsConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    // Preparar configurações para salvar
    const configsToSave = [
      {
        user_id: userId,
        categoria: CONFIG_CATEGORY,
        chave: CONFIG_KEYS.BASE_URL,
        valor: config.baseUrl,
        descricao: 'URL base do servidor TOTVS',
      },
      {
        user_id: userId,
        categoria: CONFIG_CATEGORY,
        chave: CONFIG_KEYS.USERNAME,
        valor: config.username,
        descricao: 'Usuário para autenticação TOTVS',
      },
      {
        user_id: userId,
        categoria: CONFIG_CATEGORY,
        chave: CONFIG_KEYS.PASSWORD,
        valor: config.password,
        descricao: 'Senha para autenticação TOTVS',
      },
      {
        user_id: userId,
        categoria: CONFIG_CATEGORY,
        chave: CONFIG_KEYS.CODIGO_CONSULTA,
        valor: config.codigoConsulta,
        descricao: 'Código da consulta SQL no TOTVS',
      },
      {
        user_id: userId,
        categoria: CONFIG_CATEGORY,
        chave: CONFIG_KEYS.COLIGADA,
        valor: String(config.coligada),
        descricao: 'Código da coligada',
      },
      {
        user_id: userId,
        categoria: CONFIG_CATEGORY,
        chave: CONFIG_KEYS.SISTEMA,
        valor: config.sistema,
        descricao: 'Código do sistema',
      },
    ];

    // Adicionar parâmetros se fornecidos
    if (config.parametros !== undefined && config.parametros && config.parametros.trim() !== '') {
      configsToSave.push({
        user_id: userId,
        categoria: CONFIG_CATEGORY,
        chave: CONFIG_KEYS.PARAMETROS,
        valor: config.parametros,
        descricao: 'Parâmetros SQL da consulta (JSON array)',
      });
    } else {
      // Remover parâmetros se não fornecidos
      await supabase
        .from('configuracoes')
        .delete()
        .eq('user_id', userId)
        .eq('categoria', CONFIG_CATEGORY)
        .eq('chave', CONFIG_KEYS.PARAMETROS);
    }

    // Adicionar configurações opcionais se fornecidas
    if (config.timeout !== undefined) {
      configsToSave.push({
        user_id: userId,
        categoria: CONFIG_CATEGORY,
        chave: CONFIG_KEYS.TIMEOUT,
        valor: String(config.timeout),
        descricao: 'Timeout em milissegundos',
      });
    }

    if (config.retries !== undefined) {
      configsToSave.push({
        user_id: userId,
        categoria: CONFIG_CATEGORY,
        chave: CONFIG_KEYS.RETRIES,
        valor: String(config.retries),
        descricao: 'Número de tentativas em caso de erro',
      });
    }

    // Usar upsert para salvar ou atualizar
    // A constraint UNIQUE é (user_id, chave), então usamos apenas essas colunas
    const { error } = await supabase.from('configuracoes').upsert(
      configsToSave,
      {
        onConflict: 'user_id,chave',
      }
    );

    if (error) {
      console.error('Erro ao salvar configurações TOTVS:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao salvar configurações TOTVS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Valida se uma configuração TOTVS está completa
 */
export function validateTotvsConfig(config: Partial<TotvsConfig>): {
  valid: boolean;
  missingFields: string[];
} {
  const requiredFields: (keyof TotvsConfig)[] = [
    'baseUrl',
    'username',
    'password',
    'codigoConsulta',
    'coligada',
    'sistema',
  ];

  const missingFields = requiredFields.filter(
    (field) => !config[field] || String(config[field]).trim() === ''
  );

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

