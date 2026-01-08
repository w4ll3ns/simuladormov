# Backend REST - Integração TOTVS RM

Backend REST responsável por integrar com o TOTVS RM (Linha RM – Backoffice) utilizando a API oficial de Consulta SQL.

## 🚀 Funcionalidades

- ✅ Autenticação Basic Auth segura
- ✅ Execução de consultas SQL cadastradas no RM
- ✅ Parâmetros dinâmicos via query string
- ✅ Tratamento completo de erros
- ✅ Respostas padronizadas em JSON
- ✅ Validação de entrada com Zod
- ✅ Logging e métricas de performance

## 📋 Pré-requisitos

- Node.js >= 18
- npm ou yarn
- Acesso ao servidor TOTVS RM
- Credenciais válidas do RM

## ⚙️ Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na pasta `server/` baseado no `.env.example`:

```bash
cp server/.env.example server/.env
```

Edite o arquivo `.env` com suas credenciais:

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

⚠️ **IMPORTANTE:**
- Nunca commite o arquivo `.env` no Git
- Mantenha as credenciais seguras
- Use variáveis de ambiente em produção

### 3. Iniciar servidor

#### Desenvolvimento (com hot reload):
```bash
npm run server:dev
```

#### Produção:
```bash
npm run server:build
npm run server:start
```

O servidor estará disponível em: `http://localhost:3001`

## 📡 Endpoints

### GET /rm/consulta-sql

Executa uma consulta SQL no TOTVS RM.

**Query Parameters:**
- `codSentenca` (string, obrigatório): Código da sentença SQL cadastrada no RM (ex: "1.01")
- `codColigada` (string | number, obrigatório): Código da coligada (ex: 1)
- `codSistema` (string, obrigatório): Sistema do RM (ex: "A", "S", "G")
- `params` (object, opcional): Parâmetros SQL no formato `{ PARAM1: valor1, PARAM2: valor2 }`

**Exemplos de Uso:**

1. **Sem parâmetros SQL:**
```bash
GET /rm/consulta-sql?codSentenca=1.01&codColigada=1&codSistema=A
```

2. **Com parâmetros SQL (via JSON):**
```bash
GET /rm/consulta-sql?codSentenca=1.01&codColigada=1&codSistema=A&params={"CODCOLIGADA":1,"IDPS":25}
```

3. **Com parâmetros SQL (via query string):**
```bash
GET /rm/consulta-sql?codSentenca=1.01&codColigada=1&codSistema=A&params[CODCOLIGADA]=1&params[IDPS]=25
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "data": [...],
  "executionTimeMs": 123
}
```

**Resposta de Erro:**
```json
{
  "success": false,
  "error": {
    "message": "Erro ao executar consulta SQL",
    "status": 401,
    "code": "UNAUTHORIZED"
  }
}
```

### GET /rm/health

Verifica se o serviço está funcionando.

**Resposta:**
```json
{
  "status": "ok",
  "service": "TOTVS RM Integration",
  "timestamp": "2025-01-08T12:00:00.000Z"
}
```

### GET /

Health check na raiz do servidor.

## 🔐 Autenticação

O backend utiliza **Basic Authentication** para autenticar com o TOTVS RM.

O header `Authorization: Basic {base64(username:password)}` é gerado automaticamente usando as variáveis de ambiente `RM_USERNAME` e `RM_PASSWORD`.

⚠️ **Nunca logar ou expor credenciais.**

## 🌐 Endpoint Oficial TOTVS RM

O backend utiliza o endpoint oficial da TOTVS RM:

```
GET {RM_BASE_URL}/api/framework/v1/consultaSQLServer/RealizaConsulta/{codSentenca}/{codColigada}/{codSistema}
```

Os parâmetros SQL são enviados via query string no formato:
```
?parameters=PARAM1=VALOR1;PARAM2=VALOR2
```

## 📝 Formato de Parâmetros SQL

Os parâmetros devem ser enviados como um objeto e são convertidos automaticamente para o formato exigido pelo RM:

**Input (no endpoint do backend):**
```json
{
  "params": {
    "CODCOLIGADA": 1,
    "IDPS": 25
  }
}
```

**Output (para o RM):**
```
?parameters=CODCOLIGADA=1;IDPS=25
```

Os parâmetros são automaticamente URL encoded antes de serem enviados.

## 🚨 Tratamento de Erros

O backend trata os seguintes tipos de erro:

- **401 Unauthorized**: Credenciais inválidas ou ausentes
- **403 Forbidden**: Sem permissão para executar a consulta
- **404 Not Found**: Consulta SQL não encontrada no RM
- **400 Bad Request**: Parâmetros inválidos
- **500+ Server Error**: Erro interno no servidor RM
- **408 Timeout**: Timeout ao conectar com o RM
- **503 Connection Error**: Não foi possível conectar ao servidor RM
- **Validation Error**: Erro de validação dos parâmetros de entrada

Todos os erros retornam uma resposta padronizada com:
- `success: false`
- `error.message`: Mensagem descritiva do erro
- `error.status`: Código HTTP do erro
- `error.code`: Código interno do erro

## 🏗️ Estrutura do Projeto

```
server/
├── src/
│   ├── config/
│   │   └── env.ts           # Configuração de variáveis de ambiente
│   ├── middleware/
│   │   └── errorHandler.ts  # Middlewares de tratamento de erros
│   ├── routes/
│   │   └── rmRoutes.ts      # Rotas da API
│   ├── services/
│   │   └── rmService.ts     # Serviço de integração com RM
│   ├── utils/
│   │   ├── auth.ts          # Utilitários de autenticação
│   │   └── params.ts        # Utilitários de formatação de parâmetros
│   └── index.ts             # Arquivo principal do servidor
├── .env.example             # Exemplo de variáveis de ambiente
├── .gitignore               # Arquivos ignorados pelo Git
├── nodemon.json             # Configuração do Nodemon
├── tsconfig.json            # Configuração do TypeScript
└── README.md                # Esta documentação
```

## 🧪 Testando

### Usando cURL:

```bash
# Health check
curl http://localhost:3001/rm/health

# Consulta SQL sem parâmetros
curl "http://localhost:3001/rm/consulta-sql?codSentenca=1.01&codColigada=1&codSistema=A"

# Consulta SQL com parâmetros
curl "http://localhost:3001/rm/consulta-sql?codSentenca=1.01&codColigada=1&codSistema=A&params={\"CODCOLIGADA\":1,\"IDPS\":25}"
```

### Usando Postman ou Insomnia:

1. Configure o método como `GET`
2. URL: `http://localhost:3001/rm/consulta-sql`
3. Query Params:
   - `codSentenca`: "1.01"
   - `codColigada`: 1
   - `codSistema`: "A"
   - `params`: `{"CODCOLIGADA":1,"IDPS":25}` (opcional)

## 📚 Referências

- [Documentação TOTVS RM API](https://tdn.totvs.com/)
- [Express.js](https://expressjs.com/)
- [Axios](https://axios-http.com/)
- [Zod](https://zod.dev/)

## ⚠️ Segurança

- ⚠️ Nunca exponha credenciais em logs
- ⚠️ Use HTTPS em produção
- ⚠️ Configure CORS adequadamente
- ⚠️ Valide e sanitize todas as entradas
- ⚠️ Implemente rate limiting em produção
- ⚠️ Monitore e logue erros adequadamente

## 📝 Licença

Este projeto é privado e confidencial.
