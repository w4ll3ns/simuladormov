# 🔗 Código de Montagem da URL - TOTVS RM

## 📍 Localização dos Arquivos

### **1. Rota que Recebe a Requisição**
`server/src/routes/rmRoutes.ts` (linhas 30-100)

### **2. Serviço que Monta a URL**
`server/src/services/rmService.ts` (linhas 149-162)

### **3. Utilitários de Formatação**
`server/src/utils/params.ts` (linhas 16-48)

---

## 🔍 Código Completo da Montagem

### **Passo 1: Recepção no Backend**

```typescript
// server/src/routes/rmRoutes.ts
router.get('/consulta-sql', async (req: Request, res: Response) => {
  // Extrai parâmetros da query string
  const { codSentenca, codColigada, codSistema, params } = req.query;
  
  // Exemplo de entrada:
  // codSentenca = "1.01"
  // codColigada = "1" (ou 1)
  // codSistema = "A"
  // params = '{"CODCOLIGADA":1,"IDPS":25}' (string JSON)
  
  // Converte params de string para objeto
  let paramsObject: Record<string, string | number> | undefined;
  if (params) {
    if (typeof params === 'string') {
      paramsObject = JSON.parse(params);
      // Resultado: { CODCOLIGADA: 1, IDPS: 25 }
    }
  }
  
  // Prepara objeto final
  const queryParams: RmQueryParams = {
    codSentenca: "1.01",
    codColigada: 1,
    codSistema: "A",
    params: { CODCOLIGADA: 1, IDPS: 25 }
  };
  
  // Chama o serviço
  const result = await rmService.executeQuery(queryParams, userId, testConfig);
});
```

---

### **Passo 2: Montagem da URL no Serviço**

```typescript
// server/src/services/rmService.ts
async executeQuery(queryParams: RmQueryParams) {
  // 1. Valida parâmetros
  validateQueryParams(
    queryParams.codSentenca,  // "1.01"
    queryParams.codColigada,  // 1
    queryParams.codSistema    // "A"
  );

  // 2. MONTAGEM DO ENDPOINT BASE
  // Formato: /api/framework/v1/consultaSQLServer/RealizaConsulta/{codSentenca}/{codColigada}/{codSistema}
  const endpoint = `/api/framework/v1/consultaSQLServer/RealizaConsulta/${queryParams.codSentenca}/${queryParams.codColigada}/${queryParams.codSistema}`;
  
  // Resultado: "/api/framework/v1/consultaSQLServer/RealizaConsulta/1.01/1/A"
  
  // 3. MONTAGEM DA QUERY STRING (se houver parâmetros SQL)
  const queryString = queryParams.params 
    ? buildRmQueryString(queryParams.params)  // Chama função de formatação
    : '';
  
  // Resultado: "?parameters=CODCOLIGADA%3D1%3BIDPS%3D25"
  
  // 4. MONTAGEM DA URL COMPLETA
  const fullUrl = `${endpoint}${queryString}`;
  
  // Resultado: "/api/framework/v1/consultaSQLServer/RealizaConsulta/1.01/1/A?parameters=CODCOLIGADA%3D1%3BIDPS%3D25"
  
  // 5. EXECUÇÃO DA REQUISIÇÃO HTTP
  // O Axios já tem a baseURL configurada (ex: https://rm.empresa.com.br:8051)
  const response = await this.client.get(fullUrl);
  
  // URL final completa enviada ao RM:
  // https://rm.empresa.com.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/1.01/1/A?parameters=CODCOLIGADA%3D1%3BIDPS%3D25
}
```

---

### **Passo 3: Formatação dos Parâmetros SQL**

```typescript
// server/src/utils/params.ts

// Função 1: Converte objeto para string formatada
function formatRmParameters(params: { CODCOLIGADA: 1, IDPS: 25 }): string {
  // Entrada: { CODCOLIGADA: 1, IDPS: 25 }
  
  // 1. Converte objeto para array de pares [chave, valor]
  const pairs = Object.entries(params);
  // Resultado: [["CODCOLIGADA", 1], ["IDPS", 25]]
  
  // 2. Formata cada par como "CHAVE=VALOR"
  const formatted = pairs.map(([key, value]) => {
    const stringValue = String(value).trim();
    return `${key}=${stringValue}`;
  });
  // Resultado: ["CODCOLIGADA=1", "IDPS=25"]
  
  // 3. Junta todos com ponto e vírgula
  return formatted.join(';');
  // Resultado: "CODCOLIGADA=1;IDPS=25"
}

// Função 2: Monta query string completa
function buildRmQueryString(params: { CODCOLIGADA: 1, IDPS: 25 }): string {
  // 1. Formata parâmetros
  const formattedParams = formatRmParameters(params);
  // Resultado: "CODCOLIGADA=1;IDPS=25"
  
  // 2. URL encode o resultado
  const encoded = encodeURIComponent(formattedParams);
  // Resultado: "CODCOLIGADA%3D1%3BIDPS%3D25"
  // Onde: %3D = "=" e %3B = ";"
  
  // 3. Adiciona prefixo "?parameters="
  return `?parameters=${encoded}`;
  // Resultado: "?parameters=CODCOLIGADA%3D1%3BIDPS%3D25"
}
```

---

## 📊 Fluxo Visual Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ENTRADA NO BACKEND                                       │
│ GET /rm/consulta-sql?codSentenca=1.01&codColigada=1&...    │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. EXTRAÇÃO E VALIDAÇÃO                                     │
│ codSentenca: "1.01"                                         │
│ codColigada: 1                                              │
│ codSistema: "A"                                             │
│ params: { CODCOLIGADA: 1, IDPS: 25 }                        │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. MONTAGEM DO ENDPOINT                                     │
│ endpoint = `/api/framework/v1/consultaSQLServer/           │
│            RealizaConsulta/1.01/1/A`                        │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. FORMATAÇÃO DOS PARÂMETROS SQL                            │
│ formatRmParameters({ CODCOLIGADA: 1, IDPS: 25 })          │
│ → "CODCOLIGADA=1;IDPS=25"                                   │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. URL ENCODING                                             │
│ encodeURIComponent("CODCOLIGADA=1;IDPS=25")                  │
│ → "CODCOLIGADA%3D1%3BIDPS%3D25"                             │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. MONTAGEM DA QUERY STRING                                 │
│ buildRmQueryString()                                        │
│ → "?parameters=CODCOLIGADA%3D1%3BIDPS%3D25"                 │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. CONCATENAÇÃO FINAL                                       │
│ fullUrl = endpoint + queryString                            │
│ → "/api/.../1.01/1/A?parameters=CODCOLIGADA%3D1%3BIDPS%3D25"│
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. REQUISIÇÃO HTTP                                          │
│ GET https://rm.empresa.com.br:8051/api/.../1.01/1/A?       │
│    parameters=CODCOLIGADA%3D1%3BIDPS%3D25                   │
│ Headers:                                                    │
│   Authorization: Basic {base64(username:password)}          │
│   Accept: application/json                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Código Fonte Completo

### **Arquivo: `server/src/services/rmService.ts`**

```typescript
// Linhas 149-162
// Monta a URL do endpoint oficial do RM
const endpoint = `/api/framework/v1/consultaSQLServer/RealizaConsulta/${queryParams.codSentenca}/${queryParams.codColigada}/${queryParams.codSistema}`;

// Monta query string com parâmetros SQL (se houver)
const queryString = queryParams.params ? buildRmQueryString(queryParams.params) : '';
const fullUrl = `${endpoint}${queryString}`;

// Executa a requisição HTTP
const response = await this.client.get(fullUrl);
```

### **Arquivo: `server/src/utils/params.ts`**

```typescript
// Linhas 16-31
export function formatRmParameters(params: Record<string, string | number>): string {
  const pairs = Object.entries(params).map(([key, value]) => {
    const stringValue = String(value).trim();
    return `${key}=${stringValue}`;
  });
  return pairs.join(';');
}

// Linhas 39-48
export function buildRmQueryString(params: Record<string, string | number>): string {
  const formattedParams = formatRmParameters(params);
  return `?parameters=${encodeURIComponent(formattedParams)}`;
}
```

---

## 🎯 Exemplo Prático

### **Entrada:**
```javascript
{
  codSentenca: "1.01",
  codColigada: 1,
  codSistema: "A",
  params: {
    CODCOLIGADA: 1,
    IDPS: 25
  }
}
```

### **Processamento:**
```javascript
// 1. Endpoint
endpoint = "/api/framework/v1/consultaSQLServer/RealizaConsulta/1.01/1/A"

// 2. Formatação
formatRmParameters({ CODCOLIGADA: 1, IDPS: 25 })
// → "CODCOLIGADA=1;IDPS=25"

// 3. URL Encoding
encodeURIComponent("CODCOLIGADA=1;IDPS=25")
// → "CODCOLIGADA%3D1%3BIDPS%3D25"

// 4. Query String
buildRmQueryString({ CODCOLIGADA: 1, IDPS: 25 })
// → "?parameters=CODCOLIGADA%3D1%3BIDPS%3D25"

// 5. URL Completa
fullUrl = "/api/framework/v1/consultaSQLServer/RealizaConsulta/1.01/1/A?parameters=CODCOLIGADA%3D1%3BIDPS%3D25"
```

### **URL Final Enviada ao RM:**
```
https://rm.empresa.com.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/1.01/1/A?parameters=CODCOLIGADA%3D1%3BIDPS%3D25
```

---

## 🔑 Pontos Importantes

1. **Base URL:** Vem de `RM_BASE_URL` (env) ou banco de dados
2. **Endpoint:** Formato fixo da TOTVS RM
3. **Parâmetros SQL:** Formato `PARAM1=VALOR1;PARAM2=VALOR2`
4. **URL Encoding:** Aplicado na string completa dos parâmetros
5. **Query String:** Prefixo `?parameters=` é obrigatório
