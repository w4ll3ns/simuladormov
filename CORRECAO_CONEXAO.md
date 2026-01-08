# ✅ Correção do Erro de Conexão

## 🔴 Problema Identificado

O frontend estava tentando conectar ao backend em `http://localhost:3001/rm/health`, mas o servidor backend não estava rodando, causando o erro:

```
GET http://localhost:3001/rm/health net::ERR_CONNECTION_REFUSED
```

## ✅ Correções Aplicadas

### **1. Configuração de Proxy no Vite**

**Arquivo:** `vite.config.ts`

Adicionado proxy para redirecionar requisições `/rm` para o backend:

```typescript
server: {
  host: "::",
  port: 8080,
  proxy: {
    '/rm': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      secure: false,
    },
  },
},
```

**Benefícios:**
- Frontend faz requisições para `/rm/*` (mesmo domínio)
- Vite redireciona automaticamente para `http://localhost:3001`
- Evita problemas de CORS
- Funciona em desenvolvimento sem configuração adicional

### **2. Atualização do Hook useRmConfig**

**Arquivo:** `src/hooks/useRmConfig.ts`

Atualizado para usar o proxy em desenvolvimento:

```typescript
// Antes:
const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const response = await fetch(`${backendUrl}/rm/health`, ...);

// Depois:
const backendUrl = import.meta.env.VITE_API_URL || '';
const healthEndpoint = backendUrl ? `${backendUrl}/rm/health` : '/rm/health';
const response = await fetch(healthEndpoint, ...);
```

**Como funciona:**
- Se `VITE_API_URL` estiver definido (produção), usa URL completa
- Se não estiver (desenvolvimento), usa `/rm/health` (proxy do Vite)

### **3. Servidor Backend Iniciado**

O servidor backend está rodando na porta 3001 e respondendo corretamente:

```bash
curl http://localhost:3001/rm/health
# Resposta: {"status":"ok","service":"TOTVS RM Integration",...}
```

## 🚀 Como Usar Agora

### **1. Certifique-se de que o Backend está Rodando**

```bash
# Iniciar backend
npm run server:dev

# Verificar se está rodando
curl http://localhost:3001/rm/health
```

### **2. Certifique-se de que o Frontend está Rodando**

```bash
# Iniciar frontend (se ainda não estiver)
npm run dev
```

### **3. Testar Conexão**

1. Acesse `/config/rm` no navegador
2. Preencha os campos:
   - URL Base: `http://lares.ceuma.edu.br:8051`
   - Usuário: (seu usuário RM)
   - Senha: (sua senha RM)
3. Clique em "Testar Conexão"

**O que acontece:**
- Frontend faz requisição para `/rm/health` (mesmo domínio)
- Vite proxy redireciona para `http://localhost:3001/rm/health`
- Backend processa e retorna resposta
- Frontend recebe resposta com sucesso

## 📋 Fluxo de Requisição

```
1. Frontend: fetch('/rm/health')
   ↓
2. Vite Proxy: redireciona para http://localhost:3001/rm/health
   ↓
3. Backend: processa requisição
   ↓
4. Backend: retorna resposta JSON
   ↓
5. Frontend: recebe resposta
```

## ⚠️ Importante

- **Desenvolvimento:** Usa proxy do Vite (não precisa configurar CORS)
- **Produção:** Configure `VITE_API_URL` com a URL completa do backend
- **Backend:** Deve estar rodando na porta 3001 (ou configure outra porta)

## ✅ Status

- ✅ Proxy configurado no Vite
- ✅ Hook atualizado para usar proxy
- ✅ Backend rodando e respondendo
- ✅ Pronto para testar conexão!
