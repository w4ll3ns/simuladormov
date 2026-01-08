import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Serviço para buscar configurações do RM do banco de dados Supabase
 */
export class ConfigService {
  private supabase: SupabaseClient | null = null;

  constructor() {
    // Inicializa cliente Supabase se as variáveis estiverem disponíveis
    const supabaseUrl = process.env.SUPABASE_URL;
    // Prioriza SERVICE_ROLE_KEY para ter acesso completo (backend)
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    } else {
      console.warn('[Config Service] Supabase não configurado. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para usar configurações do banco.');
    }
  }

  /**
   * Busca configurações do RM para um usuário específico
   * 
   * @param userId - ID do usuário
   * @returns Configurações do RM ou null se não encontradas
   */
  async getRmConfig(userId: string): Promise<{
    rm_base_url: string;
    rm_username: string;
    rm_password: string;
  } | null> {
    if (!this.supabase) {
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('configuracoes')
        .select('chave, valor')
        .eq('user_id', userId)
        .in('chave', ['rm_base_url', 'rm_username', 'rm_password']);

      if (error) {
        console.error('[Config Service] Erro ao buscar configurações:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      // Converte array para objeto
      const config: Record<string, string> = {};
      data.forEach((item: { chave: string; valor: string }) => {
        config[item.chave] = item.valor;
      });

      // Verifica se todas as configurações estão presentes
      if (!config.rm_base_url || !config.rm_username || !config.rm_password) {
        return null;
      }

      return {
        rm_base_url: config.rm_base_url,
        rm_username: config.rm_username,
        rm_password: config.rm_password,
      };
    } catch (error) {
      console.error('[Config Service] Erro ao buscar configurações:', error);
      return null;
    }
  }

  /**
   * Verifica se o serviço está configurado
   */
  isConfigured(): boolean {
    return this.supabase !== null;
  }
}

export const configService = new ConfigService();
