# 🔗 Como é Montada a URL para o TOTVS RM

## 📋 Fluxo Completo de Montagem da URL

### **1. Entrada no Backend (Endpoint `/rm/consulta-sql`)**

**Requisição do Frontend:**
```http
GET /rm/consulta-sql?codSentenca=1.01&codColigada=1&codSistema=A&params={"CODCOLIGADA":1,"IDPS":25}
```

**Arquivo:** `server/src/routes/rmRoutes.ts`

```typescript
// Extrai parâmetros da query string
const { codSentenca, codColigada, codSistema, params } = req.query;

// Converte params de string JSON para objeto
let paramsObject: Record<string, string | number> | undefined;
if (params) {
  if (typeof params === 'string') {
    paramsObject = JSON.parse(params);
  }
}

// Prepara objeto final
const queryParams: RmQueryParams = {
  codSentenca: "1.01",
  codColigada: 1,
  codSistema: "A",
  params: { CODCOLIGADA: 1, IDPS: 25 }
};
```

---

### **2. Processamento no Serviço RM**

**Arquivo:** `server/src/services/rmService.ts`

```typescript
async executeQuery(queryParams: RmQueryParams) {
  // 1. Valida parâmetros obrigatórios
  validateQueryParams(
    queryParams.codSentenca,  // "1.01"
    queryParams.codColigada,  // 1
    queryParams.codSistema    // "A"
  );

  // 2. Monta o endpoint base (sem query string)
  const endpoint = `/api/framework/v1/consultaSQLServer/RealizaConsulta/${codSentenca}/${codColigada}/${codSistema}`;
  // Resultado: "/api/framework/v1/consultaSQLServer/RealizaConsulta/1.01/1/A"

  // 3. Monta query string com parâmetros SQL (se houver)
  const queryString = queryParams.params 
    ? buildRmQueryString(queryParams.params) 
    : '';
  // Resultado: "?parameters=CODCOLIGADA=1;IDPS=25"

  // 4. Monta URL completa
  const fullUrl = `${endpoint}${queryString}`;
  // Resultado: "/api/framework/v1/consultaSQLServer/RealizaConsulta/1.01/1/A?parameters=CODCOLIGADA=1;IDPS=25"

  // 5. Executa requisição HTTP
  const response = await this.client.get(fullUrl);
}
```

---

### **3. Formatação dos Parâmetros SQL**

**Arquivo:** `server/src/utils/params.ts`

#### **Passo 1: Formatação dos Parâmetros**

```typescript
function formatRmParameters(params: { CODCOLIGADA: 1, IDPS: 25 }): string {
  // Converte objeto para array de pares [chave, valor]
  const pairs = [
    ["CODCOLIGADA", "1"],
    ["IDPS", "25"]
  ];

  // Formata cada par como "CHAVE=VALOR"
  const formatted = pairs.map(([key, value]) => `${key}=${value}`);
  // Resultado: ["CODCOLIGADA=1", "IDPS=25"]

  // Junta com ponto e vírgula
  return formatted.join(';');
  // Resultado: "CODCOLIGADA=1;IDPS=25"
}
```

#### **Passo 2: Montagem da Query String**

```typescript
function buildRmQueryString(params: { CODCOLIGADA: 1, IDPS: 25 }): string {
  // 1. Formata parâmetros
  const formattedParams = formatRmParameters(params);
  // Resultado: "CODCOLIGADA=1;IDPS=25"

  // 2. URL encode o resultado
  const encoded = encodeURIComponent(formattedParams);
  // Resultado: "CODCOLIGADA%3D1%3BIDPS%3D25"

  // 3. Adiciona prefixo "?parameters="
  return `?parameters=${encoded}`;
  // Resultado: "?parameters=CODCOLIGADA%3D1%3BIDPS%3D25"
}
```

---

### **4. URL Final Montada**

**Base URL (do .env ou banco):**
```
https://rm.seudominio.com.br:8051
```

**Endpoint:**
```
/api/framework/v1/consultaSQLServer/RealizaConsulta/1.01/1/A
```

**Query String:**
```
?parameters=CODCOLIGADA%3D1%3BIDPS%3D25
```

**URL Final Completa:**
```
https://rm.seudominio.com.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/1.01/1/A?parameters=CODCOLIGADA%3D1%3BIDPS%3D25
```

---

## 🔍 Exemplo Detalhado Passo a Passo

### **Entrada:**
```json
{
  "codSentenca": "1.01",
  "codColigada": 1,
  "codSistema": "A",
  "params": {
    "CODCOLIGADA": 1,
    "IDPS": 25,
    "DATA_INICIO": "2026-01-01"
  }
}
```

### **Processamento:**

1. **Validação:**
   - ✅ codSentenca: "1.01" (válido)
   - ✅ codColigada: 1 (válido)
   - ✅ codSistema: "A" (válido)

2. **Montagem do Endpoint:**
   ```
   /api/framework/v1/consultaSQLServer/RealizaConsulta/1.01/1/A
   ```

3. **Formatação dos Parâmetros:**
   ```typescript
   params = { CODCOLIGADA: 1, IDPS: 25, DATA_INICIO: "2026-01-01" }
   
   // Passo 1: Converter para pares
   pairs = [
     ["CODCOLIGADA", "1"],
     ["IDPS", "25"],
     ["DATA_INICIO", "2026-01-01"]
   ]
   
   // Passo 2: Formatar como "CHAVE=VALOR"
   formatted = [
     "CODCOLIGADA=1",
     "IDPS=25",
     "DATA_INICIO=2026-01-01"
   ]
   
   // Passo 3: Juntar com ";"
   joined = "CODCOLIGADA=1;IDPS=25;DATA_INICIO=2026-01-01"
   
   // Passo 4: URL encode
   encoded = "CODCOLIGADA%3D1%3BIDPS%3D25%3BDATA_INICIO%3D2026-01-01"
   
   // Passo 5: Adicionar prefixo
   queryString = "?parameters=CODCOLIGADA%3D1%3BIDPS%3D25%3BDATA_INICIO%3D2026-01-01"
   ```

4. **URL Final:**
   ```
   https://rm.seudominio.com.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/1.01/1/A?parameters=CODCOLIGADA%3D1%3BIDPS%3D25%3BDATA_INICIO%3D2026-01-01
   ```

---

## 📝 Código Relevante

### **Arquivo: `server/src/services/rmService.ts`**

```149:154:server/src/services/rmService.ts
      // Monta a URL do endpoint oficial do RM
      const endpoint = `/api/framework/v1/consultaSQLServer/RealizaConsulta/${queryParams.codSentenca}/${queryParams.codColigada}/${queryParams.codSistema}`;
      
      // Monta query string com parâmetros SQL (se houver)
      const queryString = queryParams.params ? buildRmQueryString(queryParams.params) : '';
      const fullUrl = `${endpoint}${queryString}`;
```

### **Arquivo: `server/src/utils/params.ts`**

```16:31:server/src/utils/params.ts
export function formatRmParameters(params: Record<string, string | number>): string {
  if (!params || Object.keys(params).length === 0) {
    return '';
  }

  const pairs = Object.entries(params).map(([key, value]) => {
    // Garante que o valor seja uma string e faz trim
    const stringValue = String(value).trim();
    
    // Formata como PARAM=VALOR
    return `${key}=${stringValue}`;
  });

  // Junta todos os pares com ponto e vírgula
  return pairs.join(';');
}
```

```39:48:server/src/utils/params.ts
export function buildRmQueryString(params: Record<string, string | number>): string {
  if (!params || Object.keys(params).length === 0) {
    return '';
  }

  const formattedParams = formatRmParameters(params);
  
  // URL encode o resultado final
  return `?parameters=${encodeURIComponent(formattedParams)}`;
}
```

---

## 🎯 Resumo do Fluxo

```
1. Frontend envia: GET /rm/consulta-sql?codSentenca=1.01&codColigada=1&codSistema=A&params={"CODCOLIGADA":1,"IDPS":25}
   ↓
2. Backend extrai e valida parâmetros
   ↓
3. Monta endpoint: /api/framework/v1/consultaSQLServer/RealizaConsulta/1.01/1/A
   ↓
4. Formata params: CODCOLIGADA=1;IDPS=25
   ↓
5. URL encode: CODCOLIGADA%3D1%3BIDPS%3D25
   ↓
6. Adiciona prefixo: ?parameters=CODCOLIGADA%3D1%3BIDPS%3D25
   ↓
7. Concatena: endpoint + queryString
   ↓
8. URL final: {baseUrl}/api/framework/v1/consultaSQLServer/RealizaConsulta/1.01/1/A?parameters=CODCOLIGADA%3D1%3BIDPS%3D25
   ↓
9. Executa requisição HTTP GET com Basic Auth
```

---

## ⚠️ Pontos Importantes

1. **Formato dos Parâmetros:**
   - O RM exige: `PARAM1=VALOR1;PARAM2=VALOR2`
   - Separador: `;` (ponto e vírgula)
   - Formato: `CHAVE=VALOR`

2. **URL Encoding:**
   - A string completa é URL encoded
   - `=` vira `%3D`
   - `;` vira `%3B`
   - Espaços viram `%20`

3. **Base URL:**
   - Vem de `RM_BASE_URL` (env) ou do banco de dados
   - Não deve ter barra no final
   - Exemplo: `https://rm.empresa.com.br:8051`

4. **Endpoint Oficial:**
   - Formato fixo da TOTVS
   - `/api/framework/v1/consultaSQLServer/RealizaConsulta/{codSentenca}/{codColigada}/{codSistema}`

---

## 🧪 Exemplo de Teste

```bash
# Requisição ao backend
curl "http://localhost:3001/rm/consulta-sql?codSentenca=1.01&codColigada=1&codSistema=A&params={\"CODCOLIGADA\":1,\"IDPS\":25}"

# URL final gerada (internamente)
# https://rm.empresa.com.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/1.01/1/A?parameters=CODCOLIGADA%3D1%3BIDPS%3D25
```
