import express, { Express } from 'express';
import cors from 'cors';
import { config, validateEnv } from './config/env';
import rmRoutes from './routes/rmRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

/**
 * Cria e configura a aplicação Express
 */
function createApp(): Express {
  const app = express();

  // Middlewares globais
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging em desenvolvimento
  if (config.nodeEnv === 'development') {
    app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  // Rotas
  app.use('/rm', rmRoutes);

  // Health check na raiz
  app.get('/', (_req, res) => {
    res.json({
      message: 'TOTVS RM Integration API',
      version: '1.0.0',
      status: 'online',
      timestamp: new Date().toISOString(),
    });
  });

  // Middleware de erro 404
  app.use(notFoundHandler);

  // Middleware de tratamento de erros
  app.use(errorHandler);

  return app;
}

/**
 * Inicia o servidor
 */
async function startServer(): Promise<void> {
  try {
    // Valida variáveis de ambiente (não é obrigatório, pode usar banco)
    validateEnv();

    // Cria aplicação
    const app = createApp();

    // Inicia servidor
    const port = config.port;
    app.listen(port, () => {
      console.log('═══════════════════════════════════════════════════════');
      console.log('🚀 TOTVS RM Integration API');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`📍 Servidor rodando em: http://localhost:${port}`);
      console.log(`🌐 Ambiente: ${config.nodeEnv}`);
      if (config.rm.baseUrl) {
        console.log(`🔗 RM Base URL (env): ${config.rm.baseUrl}`);
      }
      if (process.env.SUPABASE_URL) {
        console.log(`📦 Supabase configurado: ${process.env.SUPABASE_URL}`);
        console.log('   Configurações do RM podem ser gerenciadas no sistema');
      } else {
        console.log('⚠️  Supabase não configurado - use variáveis de ambiente');
      }
      console.log(`✅ Health Check: http://localhost:${port}/rm/health`);
      console.log(`📡 Endpoint: GET http://localhost:${port}/rm/consulta-sql`);
      console.log('═══════════════════════════════════════════════════════');
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Inicia servidor
startServer();
