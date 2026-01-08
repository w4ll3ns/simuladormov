# 🧪 Como Testar com a URL Real

## 📋 Configuração para Teste

### **1. Configure a Base URL no Sistema**

Acesse `/config/rm` e configure:
- **URL Base:** `http://lares.ceuma.edu.br:8051`
- **Usuário:** (seu usuário RM)
- **Senha:** (sua senha RM)

### **2. Exemplo de Requisição**

#### **Via cURL:**
```bash
curl "http://localhost:3001/rm/consulta-sql?codSentenca=NISFOL0088&codColigada=0&codSistema=P&params={\"CODCOLIGADA\":1,\"CHAPA\":\"004071\"}"
```

#### **Via Postman/Insomnia:**
```
GET http://localhost:3001/rm/consulta-sql

Query Params:
- codSentenca: NISFOL0088
- codColigada: 0
- codSistema: P
- params: {"CODCOLIGADA":1,"CHAPA":"004071"}
```

## 🔍 O Que Acontece Internamente

### **1. Backend recebe:**
```javascript
{
  codSentenca: "NISFOL0088",
  codColigada: 0,
  codSistema: "P",
  params: {
    CODCOLIGADA: 1,
    CHAPA: "004071"
  }
}
```

### **2. Monta endpoint:**
```
/api/framework/v1/consultaSQLServer/RealizaConsulta/NISFOL0088/0/P
```

### **3. Formata parâmetros:**
```
CODCOLIGADA=1;CHAPA=004071
```

### **4. URL encode:**
```
CODCOLIGADA%3D1%3BCHAPA%3D004071
```

### **5. URL final:**
```
http://lares.ceuma.edu.br:8051/api/framework/v1/consultaSQLServer/RealizaConsulta/NISFOL0088/0/P?parameters=CODCOLIGADA%3D1%3BCHAPA%3D004071
```

## ✅ Verificação

O código atual **já está correto** e deve funcionar com essa URL. A única diferença é que:

- No navegador: URL aparece "decodificada" (mais legível)
- No HTTP: URL é enviada "encoded" (padrão correto)

Ambos funcionam corretamente!
