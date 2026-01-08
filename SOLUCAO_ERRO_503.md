# 🔧 Solução para Erro 503 - Service Unavailable

## ❌ Problema

Ao tentar buscar colaboradores do RM, você recebe o erro:

```
GET http://localhost:8080/rm/consulta-sql?... 503 (Service Unavailable)
```

## 🔍 Causa

O erro 503 indica que:
1. ✅ A validação dos parâmetros passou (não é mais erro de `codColigada`)
2. ❌ O backend não consegue conectar ao servidor RM
3. ❌ As credenciais do RM não estão configuradas ou não estão sendo carregadas

## ✅ Solução

### **Opção 1: Configurar no Sistema (Recomendado)**

1. **Execute a migration no Supabase:**
   - Acesse: https://app.supabase.com
   - SQL Editor → New query
   - Execute o arquivo: `EXECUTAR_MIGRATION_CONFIGURACOES.sql`

2. **Configure as credenciais no sistema:**
   - Acesse: `/config/rm` no navegador
   - Preencha:
     - **URL Base:** `http://lares.ceuma.edu.br:8051`
     - **Usuário:** (seu usuário RM)
     - **Senha:** (sua senha RM)
   - Clique em "Salvar Configurações"

3. **Configure o Supabase no backend:**
   - Edite `server/.env`:
     ```env
     SUPABASE_URL=https://seu-projeto.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
     ```

4. **Reinicie o servidor backend:**
   ```bash
   npm run server:dev
   ```

### **Opção 2: Usar Variáveis de Ambiente (Temporário)**

Se não quiser usar o banco de dados, configure diretamente no `.env`:

1. **Edite `server/.env`:**
   ```env
   RM_BASE_URL=http://lares.ceuma.edu.br:8051
   RM_USERNAME=seu_usuario_rm
   RM_PASSWORD=sua_senha_rm
   ```

2. **Reinicie o servidor backend:**
   ```bash
   npm run server:dev
   ```

## 🧪 Verificar se Está Funcionando

Após configurar, teste:

```bash
curl "http://localhost:3001/rm/consulta-sql?codSentenca=NISFOL0088&codColigada=0&codSistema=P&params={\"CODCOLIGADA\":1}" \
  -H "X-User-Id: SEU_USER_ID"
```

Se funcionar, você verá os dados retornados. Se ainda der erro, verifique:

1. ✅ As credenciais estão corretas?
2. ✅ O servidor RM está acessível?
3. ✅ A URL está correta?
4. ✅ O Supabase está configurado (se usando banco)?

## 📋 Ordem de Prioridade das Configurações

O sistema usa a seguinte ordem:

1. **Configuração de teste** (header `X-RM-Test-Config`) - para validar antes de salvar
2. **Configurações do banco** (tabela `configuracoes`) - quando userId está disponível
3. **Variáveis de ambiente** (`.env`) - fallback se não houver no banco

## ⚠️ Importante

- As credenciais são **específicas por usuário** quando usando banco
- Cada usuário precisa configurar suas próprias credenciais
- As variáveis de ambiente são **globais** para todos os usuários
