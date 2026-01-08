import { Router, Request, Response } from 'express';
import { rmService, RmQueryParams } from '../services/rmService';
import { configService } from '../services/configService';
import { z } from 'zod';

const router = Router();

/**
 * Schema de validação para os parâmetros da requisição
 */
const querySchema = z.object({
  codSentenca: z.string().min(1, 'codSentenca é obrigatório'),
  codColigada: z.number(), // Já validado manualmente antes
  codSistema: z.string().min(1, 'codSistema é obrigatório'),
  params: z.record(z.union([z.string(), z.number()])).optional(),
});

/**
 * Endpoint: GET /rm/consulta-sql
 * 
 * Executa uma consulta SQL no TOTVS RM
 * 
 * Query Params esperados:
 * - codSentenca (string): Código da sentença SQL cadastrada no RM
 * - codColigada (string | number): Código da coligada
 * - codSistema (string): Sistema do RM (A, S, G)
 * - params (object, opcional): Parâmetros SQL no formato { PARAM1: valor1, PARAM2: valor2 }
 * 
 * @example
 * GET /rm/consulta-sql?codSentenca=1.01&codColigada=1&codSistema=A&params[CODCOLIGADA]=1&params[IDPS]=25
 */
router.get('/consulta-sql', async (req: Request, res: Response) => {
  try {
    // Extrai e valida parâmetros da query string
    const { codSentenca, codColigada, codSistema, params } = req.query;
    
    // Debug: log dos parâmetros recebidos
    console.log('[RM Route] Parâmetros recebidos:', { 
      codSentenca, 
      codColigada, 
      codSistema, 
      params,
      codColigadaType: typeof codColigada,
      codColigadaValue: codColigada,
      queryString: req.url,
      allQuery: req.query,
    });

    // Converte params de string para objeto se necessário
    let paramsObject: Record<string, string | number> | undefined;
    
    if (params) {
      // Se params é uma string (JSON), parseia
      if (typeof params === 'string') {
        try {
          paramsObject = JSON.parse(params);
        } catch {
          // Se não for JSON válido, tenta extrair do formato URL
          paramsObject = {};
          const pairs = params.split('&');
          pairs.forEach((pair) => {
            const [key, value] = pair.split('=');
            if (key && value) {
              paramsObject![decodeURIComponent(key)] = decodeURIComponent(value);
            }
          });
        }
      } else if (typeof params === 'object') {
        // Se já é um objeto, usa diretamente
        paramsObject = params as Record<string, string | number>;
      }
    }

    // Valida manualmente codColigada primeiro (pode ser 0)
    if (codColigada === undefined || codColigada === null || codColigada === '') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'codColigada é obrigatório',
          status: 400,
          code: 'VALIDATION_ERROR',
        },
      });
    }
    
    // Converte codColigada para número (incluindo 0)
    const codColigadaNum = typeof codColigada === 'string' ? parseInt(codColigada, 10) : codColigada;
    if (isNaN(codColigadaNum)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'codColigada deve ser um número',
          status: 400,
          code: 'VALIDATION_ERROR',
        },
      });
    }
    
    // Valida usando Zod (agora codColigada já é número)
    const validated = querySchema.parse({
      codSentenca,
      codColigada: codColigadaNum,
      codSistema,
      params: paramsObject,
    });

    // Prepara parâmetros para o serviço
    const queryParams: RmQueryParams = {
      codSentenca: validated.codSentenca,
      codColigada: validated.codColigada,
      codSistema: validated.codSistema,
      params: validated.params,
    };

    // Extrai userId do header se disponível (vem do frontend autenticado)
    const userId = req.headers['x-user-id'] as string | undefined;

    // Extrai configuração de teste se disponível (para testar conexão)
    let testConfig: { baseUrl: string; username: string; password: string } | undefined;
    const testConfigHeader = req.headers['x-rm-test-config'];
    if (testConfigHeader) {
      try {
        testConfig = JSON.parse(testConfigHeader as string);
      } catch {
        // Ignora se não for JSON válido
      }
    }

    // Executa a consulta
    const result = await rmService.executeQuery(queryParams, userId, testConfig);

    // Retorna resposta com status HTTP apropriado
    if (result.success) {
      return res.status(200).json(result);
    } else {
      const statusCode = result.error?.status || 500;
      return res.status(statusCode).json(result);
    }
  } catch (error) {
    // Erro de validação do Zod
    if (error instanceof z.ZodError) {
      console.error('[RM Route] Erro de validação Zod:', error.errors);
      return res.status(400).json({
        success: false,
        error: {
          message: error.errors[0]?.message || 'Parâmetros inválidos',
          status: 400,
          code: 'VALIDATION_ERROR',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
    }

    // Erro inesperado
    console.error('[RM Route] Erro inesperado:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor',
        status: 500,
        code: 'INTERNAL_ERROR',
      },
    });
  }
});

/**
 * Endpoint: GET /rm/health
 * 
 * Verifica se o serviço está funcionando e se consegue conectar ao RM
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Tenta usar configuração de teste se disponível
    const testConfigHeader = req.headers['x-rm-test-config'];
    let testConfig: { baseUrl: string; username: string; password: string } | undefined;
    
    if (testConfigHeader) {
      try {
        testConfig = JSON.parse(testConfigHeader as string);
        
        // Tenta fazer uma requisição simples ao RM para validar conexão
        // (implementar teste real se necessário)
      } catch {
        // Ignora se não for JSON válido
      }
    }

    res.status(200).json({
      status: 'ok',
      service: 'TOTVS RM Integration',
      timestamp: new Date().toISOString(),
      configServiceAvailable: configService.isConfigured(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'TOTVS RM Integration',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
});

export default router;
