# 🔗 Exemplo Real de URL Funcionando - TOTVS RM

## ✅ URL que Funciona no Navegador

```
http://lares.ceuma.edu.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/NISFOL0088/0/P?parameters=CODCOLIGADA=1;CHAPA=004071
```

## 📋 Análise da URL

### **Componentes:**

1. **Base URL:**
   ```
   http://lares.ceuma.edu.br:8051
   ```
   - Protocolo: `http` (não https)
   - Host: `lares.ceuma.edu.br`
   - Porta: `8051`

2. **Endpoint:**
   ```
   /api/framework/v1/consultaSQLServer/RealizaConsulta/NISFOL0088/0/P
   ```
   - `codSentenca`: `NISFOL0088` (código alfanumérico, não numérico)
   - `codColigada`: `0` (zero)
   - `codSistema`: `P` (letra maiúscula)

3. **Query String:**
   ```
   ?parameters=CODCOLIGADA=1;CHAPA=004071
   ```
   - Parâmetro 1: `CODCOLIGADA=1`
   - Parâmetro 2: `CHAPA=004071`
   - Separador: `;` (ponto e vírgula)

## 🔍 Observações Importantes

1. **codSentenca pode ser alfanumérico:**
   - Exemplo: `NISFOL0088` (não apenas números como "1.01")
   - O código atual já suporta isso (é string)

2. **codColigada pode ser zero:**
   - Exemplo: `0` (não apenas números positivos)
   - O código atual já suporta isso

3. **codSistema pode ser qualquer letra:**
   - Exemplo: `P` (não apenas "A", "S", "G")
   - O código atual já suporta isso

4. **Parâmetros podem ter valores com zeros à esquerda:**
   - Exemplo: `CHAPA=004071` (não `CHAPA=4071`)
   - O código atual preserva isso (usa `String(value).trim()`)

5. **URL Encoding:**
   - No navegador, a URL pode aparecer sem encoding visível
   - Mas quando enviada via HTTP, o `=` e `;` devem ser encoded
   - O código atual faz isso corretamente com `encodeURIComponent()`

## 📝 Exemplo de Uso no Backend

### **Requisição ao Backend:**
```http
GET http://localhost:3001/rm/consulta-sql?codSentenca=NISFOL0088&codColigada=0&codSistema=P&params={"CODCOLIGADA":1,"CHAPA":"004071"}
```

### **Processamento Interno:**

1. **Endpoint montado:**
   ```
   /api/framework/v1/consultaSQLServer/RealizaConsulta/NISFOL0088/0/P
   ```

2. **Parâmetros formatados:**
   ```javascript
   formatRmParameters({ CODCOLIGADA: 1, CHAPA: "004071" })
   // → "CODCOLIGADA=1;CHAPA=004071"
   ```

3. **URL encoded:**
   ```javascript
   encodeURIComponent("CODCOLIGADA=1;CHAPA=004071")
   // → "CODCOLIGADA%3D1%3BCHAPA%3D004071"
   ```

4. **Query string:**
   ```
   ?parameters=CODCOLIGADA%3D1%3BCHAPA%3D004071
   ```

5. **URL final:**
   ```
   http://lares.ceuma.edu.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/NISFOL0088/0/P?parameters=CODCOLIGADA%3D1%3BCHAPA%3D004071
   ```

## ✅ Validação do Código Atual

O código atual **já suporta** todos esses casos:

- ✅ `codSentenca` alfanumérico (já é string)
- ✅ `codColigada` = 0 (já aceita qualquer número)
- ✅ `codSistema` = "P" (já aceita qualquer string)
- ✅ Parâmetros com zeros à esquerda (preservados como string)
- ✅ URL encoding correto (usando `encodeURIComponent`)

## 🧪 Teste com URL Real

### **Via cURL:**
```bash
curl "http://localhost:3001/rm/consulta-sql?codSentenca=NISFOL0088&codColigada=0&codSistema=P&params={\"CODCOLIGADA\":1,\"CHAPA\":\"004071\"}"
```

### **Via Frontend (se implementado):**
```typescript
const response = await fetch('http://localhost:3001/rm/consulta-sql?codSentenca=NISFOL0088&codColigada=0&codSistema=P&params={"CODCOLIGADA":1,"CHAPA":"004071"}');
```

## 📊 Comparação: Navegador vs Backend

### **No Navegador (URL visível):**
```
http://lares.ceuma.edu.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/NISFOL0088/0/P?parameters=CODCOLIGADA=1;CHAPA=004071
```

### **No Backend (URL encoded):**
```
http://lares.ceuma.edu.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/NISFOL0088/0/P?parameters=CODCOLIGADA%3D1%3BCHAPA%3D004071
```

**Diferença:** O navegador mostra a URL "decodificada" para facilitar leitura, mas internamente o HTTP usa a versão encoded.

## ⚠️ Importante

- O código atual está **correto** e já suporta esse formato
- A URL encoding é feita automaticamente
- O formato dos parâmetros está correto (`PARAM=VALOR;PARAM2=VALOR2`)
- O endpoint segue o padrão oficial da TOTVS
