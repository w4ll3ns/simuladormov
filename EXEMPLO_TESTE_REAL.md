# 🧪 Exemplo de Teste com URL Real

## ✅ URL que Funciona

```
http://lares.ceuma.edu.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/NISFOL0088/0/P?parameters=CODCOLIGADA=1;CHAPA=004071
```

## 📋 Parâmetros da Consulta

- **Base URL:** `http://lares.ceuma.edu.br:8051`
- **codSentenca:** `NISFOL0088` (alfanumérico)
- **codColigada:** `0` (zero)
- **codSistema:** `P` (letra maiúscula)
- **Parâmetros SQL:**
  - `CODCOLIGADA=1`
  - `CHAPA=004071` (⚠️ importante: zeros à esquerda preservados)

## 🧪 Como Testar

### **1. Configure no Sistema**

Acesse `/config/rm` e configure:
- **URL Base:** `http://lares.ceuma.edu.br:8051`
- **Usuário:** (seu usuário RM)
- **Senha:** (sua senha RM)

### **2. Teste via Backend**

```bash
curl "http://localhost:3001/rm/consulta-sql?codSentenca=NISFOL0088&codColigada=0&codSistema=P&params={\"CODCOLIGADA\":1,\"CHAPA\":\"004071\"}"
```

### **3. O Que Acontece Internamente**

#### **Entrada:**
```javascript
{
  codSentenca: "NISFOL0088",
  codColigada: 0,
  codSistema: "P",
  params: {
    CODCOLIGADA: 1,
    CHAPA: "004071"  // String preserva zeros à esquerda
  }
}
```

#### **Processamento:**

1. **Endpoint:**
   ```
   /api/framework/v1/consultaSQLServer/RealizaConsulta/NISFOL0088/0/P
   ```

2. **Formatação dos Parâmetros:**
   ```javascript
   formatRmParameters({ CODCOLIGADA: 1, CHAPA: "004071" })
   // → "CODCOLIGADA=1;CHAPA=004071"
   ```
   ⚠️ **Importante:** Zeros à esquerda são preservados (não faz trim no valor)

3. **URL Encoding:**
   ```javascript
   encodeURIComponent("CODCOLIGADA=1;CHAPA=004071")
   // → "CODCOLIGADA%3D1%3BCHAPA%3D004071"
   ```

4. **Query String:**
   ```
   ?parameters=CODCOLIGADA%3D1%3BCHAPA%3D004071
   ```

5. **URL Final:**
   ```
   http://lares.ceuma.edu.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/NISFOL0088/0/P?parameters=CODCOLIGADA%3D1%3BCHAPA%3D004071
   ```

## ✅ Correção Aplicada

**Arquivo:** `server/src/utils/params.ts`

**Antes:**
```typescript
const stringValue = String(value).trim(); // ❌ Remove espaços e pode afetar zeros
```

**Depois:**
```typescript
const stringValue = String(value); // ✅ Preserva zeros à esquerda (ex: "004071")
```

## 📊 Comparação

### **URL no Navegador (decodificada para leitura):**
```
http://lares.ceuma.edu.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/NISFOL0088/0/P?parameters=CODCOLIGADA=1;CHAPA=004071
```

### **URL Enviada via HTTP (encoded):**
```
http://lares.ceuma.edu.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/NISFOL0088/0/P?parameters=CODCOLIGADA%3D1%3BCHAPA%3D004071
```

**Ambas funcionam!** O navegador apenas mostra a versão "legível", mas o HTTP usa a versão encoded.

## 🎯 Validação

O código agora:
- ✅ Preserva zeros à esquerda em valores (ex: `CHAPA=004071`)
- ✅ Suporta `codSentenca` alfanumérico (ex: `NISFOL0088`)
- ✅ Suporta `codColigada=0`
- ✅ Suporta qualquer `codSistema` (ex: `P`)
- ✅ Faz URL encoding correto dos parâmetros

## 🚀 Pronto para Usar!

O backend está configurado corretamente para trabalhar com essa URL real.
