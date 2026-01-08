# 🔧 Configuração do TOTVS RM - Sistema de Configuração

## ✅ Implementação Completa

Foi criado um sistema completo de configuração personalizável para as credenciais do TOTVS RM, permitindo que cada usuário configure suas próprias credenciais através da interface do sistema.

---

## 📋 O Que Foi Criado

### 1. **Migration do Banco de Dados** ✅

**Arquivo:** `supabase/migrations/20260108141551_rm_config.sql`

Cria tabela `configuracoes` para armazenar:
- `rm_base_url` - URL base do servidor RM
- `rm_username` - Usuário para autenticação
- `rm_password` - Senha para autenticação

**Características:**
- Armazenamento por usuário (cada usuário tem suas próprias configurações)
- RLS (Row Level Security) ativado
- Políticas de segurança implementadas

### 2. **Hook de Configuração no Frontend** ✅

**Arquivo:** `src/hooks/useRmConfig.ts`

Hook `useRmConfig()` que fornece:
- ✅ Busca configurações do banco de dados
- ✅ Salva configurações
- ✅ Testa conexão com o RM
- ✅ Validação de dados
- ✅ Tratamento de erros

### 3. **Página de Configurações** ✅

**Arquivo:** `src/pages/RmConfig.tsx`

Interface completa para:
- ✅ Editar URL base do RM
- ✅ Editar usuário
- ✅ Editar senha (com opção de mostrar/ocultar)
- ✅ Validação de formulário
- ✅ Botão para testar conexão
- ✅ Feedback visual de sucesso/erro

**Rota:** `/config/rm`

**Menu:** Adicionado "Configurações RM" no menu lateral

### 4. **Serviço de Configuração no Backend** ✅

**Arquivo:** `server/src/services/configService.ts`

Serviço para:
- ✅ Buscar configurações do Supabase
- ✅ Integração com banco de dados
- ✅ Fallback para variáveis de ambiente

### 5. **Atualização do Serviço RM** ✅

**Arquivo:** `server/src/services/rmService.ts`

Agora suporta:
- ✅ Configurações do banco de dados (prioritário)
- ✅ Configurações de teste (via header)
- ✅ Fallback para variáveis de ambiente
- ✅ Configuração dinâmica por usuário

### 6. **Atualização das Rotas** ✅

**Arquivo:** `server/src/routes/rmRoutes.ts`

Endpoints agora:
- ✅ Recebem `userId` via header `X-User-Id`
- ✅ Recebem configuração de teste via header `X-RM-Test-Config`
- ✅ Usam configurações do banco quando disponíveis

---

## 🚀 Como Usar

### **1. Executar Migration**

Execute a migration no Supabase para criar a tabela:

```sql
-- Arquivo: supabase/migrations/20260108141551_rm_config.sql
-- Execute no Supabase SQL Editor ou via CLI
```

### **2. Configurar Variáveis de Ambiente do Backend**

No arquivo `server/.env`:

```env
# Configurações do Supabase (OBRIGATÓRIAS para usar banco)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Configurações do RM (opcionais - podem vir do banco)
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080

# RM_BASE_URL, RM_USERNAME, RM_PASSWORD são opcionais
# se você for usar as configurações do banco
```

### **3. Acessar Página de Configurações**

1. Faça login no sistema
2. No menu lateral, clique em **"Configurações RM"**
3. Preencha os campos:
   - **URL Base do Servidor RM** (ex: `https://rm.empresa.com.br:8051`)
   - **Usuário RM**
   - **Senha RM**
4. Clique em **"Testar Conexão"** para validar
5. Clique em **"Salvar Configurações"**

### **4. Usar as Configurações**

As configurações são carregadas automaticamente pelo backend quando:
- Um usuário autenticado faz uma requisição ao endpoint `/rm/consulta-sql`
- O header `X-User-Id` é enviado (o frontend faz isso automaticamente)

---

## 🔐 Segurança

### **Armazenamento**
- ✅ Configurações são armazenadas por usuário (isolamento)
- ✅ RLS garante que usuários só vejam suas próprias configurações
- ⚠️ **Senhas são armazenadas em texto plano** (criptografar em produção)

### **Transmissão**
- ✅ Credenciais nunca são logadas
- ✅ Headers de teste são apenas para validação temporária
- ✅ Configurações são transmitidas via HTTPS em produção

### **Recomendações para Produção**
1. **Criptografar senhas** antes de salvar no banco
2. **Usar HTTPS** em todas as comunicações
3. **Implementar rate limiting** nos endpoints
4. **Monitorar logs** de acesso
5. **Rotacionar credenciais** periodicamente

---

## 📊 Fluxo de Funcionamento

```
1. Usuário configura credenciais no frontend (/config/rm)
   ↓
2. Frontend salva no Supabase (tabela configuracoes)
   ↓
3. Usuário faz requisição ao backend (/rm/consulta-sql)
   ↓
4. Backend recebe userId via header X-User-Id
   ↓
5. Backend busca configurações no Supabase
   ↓
6. Backend usa configurações para autenticar no RM
   ↓
7. Backend executa consulta SQL e retorna dados
```

---

## 🔄 Fallback

O sistema usa a seguinte ordem de prioridade:

1. **Configuração de teste** (header `X-RM-Test-Config`) - para validar antes de salvar
2. **Configurações do banco** (tabela `configuracoes`) - quando userId está disponível
3. **Variáveis de ambiente** (`.env`) - fallback se não houver no banco

---

## 🧪 Testar

### **1. Via Interface**
- Acesse `/config/rm`
- Preencha os campos
- Clique em "Testar Conexão"

### **2. Via API**
```bash
# Teste com configurações do banco
curl -H "X-User-Id: SEU_USER_ID" \
     "http://localhost:3001/rm/consulta-sql?codSentenca=1.01&codColigada=1&codSistema=A"

# Teste com configurações temporárias
curl -H "X-RM-Test-Config: {\"baseUrl\":\"...\",\"username\":\"...\",\"password\":\"...\"}" \
     "http://localhost:3001/rm/consulta-sql?codSentenca=1.01&codColigada=1&codSistema=A"
```

---

## ✅ Próximos Passos Recomendados

1. **Criptografar senhas** antes de salvar
2. **Adicionar histórico** de mudanças de configuração
3. **Implementar backup** de configurações
4. **Adicionar logs** de acesso ao RM
5. **Criar dashboard** de monitoramento
6. **Implementar notificações** de falha de conexão

---

## 📝 Notas

- As configurações são **específicas por usuário**
- Cada usuário pode ter suas próprias credenciais do RM
- O sistema **não valida** se as credenciais estão corretas ao salvar
- Use o botão **"Testar Conexão"** antes de salvar
- As senhas são armazenadas em **texto plano** (criptografar em produção!)

---

**Status:** ✅ Sistema de configuração completo e funcional!
