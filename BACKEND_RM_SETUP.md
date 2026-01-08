# 🚀 Backend REST - Integração TOTVS RM - Configuração

## ✅ Estrutura Criada

O backend REST foi criado com sucesso! Segue a estrutura:

```
server/
├── src/
│   ├── config/
│   │   └── env.ts              # Configuração de variáveis de ambiente
│   ├── middleware/
│   │   └── errorHandler.ts    # Middlewares de tratamento de erros
│   ├── routes/
│   │   └── rmRoutes.ts        # Rotas da API (/rm/consulta-sql)
│   ├── services/
│   │   └── rmService.ts       # Serviço de integração com RM
│   ├── utils/
│   │   ├── auth.ts            # Utilitários de autenticação Basic Auth
│   │   └── params.ts          # Utilitários de formatação de parâmetros
│   └── index.ts               # Arquivo principal do servidor
├── .env.example               # Exemplo de variáveis de ambiente
├── .gitignore                 # Arquivos ignorados pelo Git
├── nodemon.json               # Configuração do Nodemon (hot reload)
├── package.json               # Dependências do servidor
├── tsconfig.json              # Configuração do TypeScript
└── README.md                  # Documentação completa
```

## 📋 Próximos Passos

### 1. Configure as Variáveis de Ambiente

Crie o arquivo `.env` na pasta `server/`:

```bash
cd server
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais reais:

```env
# Configurações do Servidor
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080

# Configurações do TOTVS RM (OBRIGATÓRIAS)
RM_BASE_URL=https://rm.seudominio.com.br:8051
RM_USERNAME=seu_usuario_rm
RM_PASSWORD=sua_senha_rm
```

### 2. Inicie o Servidor

#### Desenvolvimento (com hot reload):
```bash
npm run server:dev
```

O servidor estará disponível em: `http://localhost:3001`

### 3. Teste o Endpoint

#### Health Check:
```bash
curl http://localhost:3001/rm/health
```

#### Consulta SQL (exemplo):
```bash
curl "http://localhost:3001/rm/consulta-sql?codSentenca=1.01&codColigada=1&codSistema=A&params={\"CODCOLIGADA\":1,\"IDPS\":25}"
```

## 📡 Endpoints Disponíveis

### GET /rm/consulta-sql
Executa uma consulta SQL no TOTVS RM.

**Query Parameters:**
- `codSentenca` (string, obrigatório)
- `codColigada` (string | number, obrigatório)
- `codSistema` (string, obrigatório)
- `params` (object, opcional)

### GET /rm/health
Verifica se o serviço está funcionando.

### GET /
Health check na raiz do servidor.

## 🔐 Autenticação

O backend utiliza **Basic Authentication** automático com o RM usando as variáveis de ambiente `RM_USERNAME` e `RM_PASSWORD`.

O header `Authorization: Basic {base64}` é gerado automaticamente.

## 📚 Documentação Completa

Consulte `server/README.md` para documentação completa, exemplos e referências.

## ⚠️ Importante

- ⚠️ Nunca commite o arquivo `.env` no Git
- ⚠️ Mantenha as credenciais seguras
- ⚠️ Use HTTPS em produção
- ⚠️ Configure CORS adequadamente para produção

## 🎯 Funcionalidades Implementadas

✅ Autenticação Basic Auth segura  
✅ Execução de consultas SQL cadastradas no RM  
✅ Parâmetros dinâmicos via query string  
✅ Tratamento completo de erros  
✅ Respostas padronizadas em JSON  
✅ Validação de entrada com Zod  
✅ Logging e métricas de performance  
✅ Hot reload em desenvolvimento  
✅ TypeScript com type safety  

---

**Status:** ✅ Backend criado e pronto para uso!
