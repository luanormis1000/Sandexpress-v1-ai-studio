# 🎯 Guia: Preparando o Banco de Dados SandExpress

Documentação completa para criar e popular o banco de dados com 500 quiosques.

---

## 📋 Resumo do que foi criado

| Arquivo | Descrição |
|---------|-----------|
| `infra/seed-data.sql` | Script SQL direto (⭐ RECOMENDADO - mais rápido) |
| `src/lib/seed-data.ts` | Helper TypeScript (alternativa mais lenta) |
| `ANALISE_ERROS.md` | Análise de erros encontrados no código |

---

## 🚀 OPÇÃO 1: Usar SQL Direto (RECOMENDADO ⭐)

**Tempo estimado:** 2-5 minutos  
**Performance:** Ótima

### Passos:

#### 1️⃣ Copiar o arquivo SQL
```bash
cat infra/seed-data.sql
```

#### 2️⃣ Acessar Supabase Dashboard
- Vá para [https://app.supabase.com](https://app.supabase.com)
- Selecione seu projeto
- Vá em **SQL Editor** → **New Query**

#### 3️⃣ Colar e executar
- Cole todo o conteúdo de `infra/seed-data.sql`
- Clique em **Run** ou pressione `Ctrl+Enter`
- ⏳ Aguarde a execução (pode levar alguns minutos com 500 quiosques)

#### 4️⃣ Verificar resultado
Após a execução bem-sucedida, você deve ver:
```sql
✓ 500 quiosques inseridos
✓ 25.000 guarda-sóis inseridos (50 por quiosque)
✓ 7.500 produtos de cardápio inseridos (15 por quiosque)
```

---

## 🔧 OPÇÃO 2: Usar TypeScript Programaticamente

**Tempo estimado:** 4-10 minutos  
**Performance:** Mais lenta (requisições HTTP individuais)

### Setup:

#### 1️⃣ Install dependências (se necessário)
```bash
npm install @supabase/supabase-js
```

#### 2️⃣ Configurar variáveis de ambiente
Crie um arquivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

⚠️ **Cuidado:** SERVICE_ROLE_KEY é sensível! Nunca commit em Git!

#### 3️⃣ Adicionar script ao package.json
```json
{
  "scripts": {
    "seed-data": "tsx src/lib/seed-data.ts"
  }
}
```

#### 4️⃣ Executar
```bash
# Check: Ver status do banco
npm run seed-data check

# Seed: Criar 500 quiosques
npm run seed-data seed 500

# Seed menor (teste)
npm run seed-data seed 100

# Clear: Limpar tudo (CUIDADO!)
npm run seed-data clear
```

---

## 📊 Dados Criados

### Por quiosque, teremos:

```
Teste 1
├── 50 guarda-sóis
│   ├── Guarda-sol 1
│   ├── Guarda-sol 2
│   └── ... até 50
│
└── 15 produtos (cardápio)
    ├── 5 Bebidas
    │   ├── Água (R$ 3.00)
    │   ├── Refrigerante (R$ 5.00)
    │   ├── Suco Natural (R$ 8.00)
    │   ├── Chopp Gelado (R$ 25.00)
    │   └── Água de Coco (R$ 6.00)
    │
    ├── 5 Comidas
    │   ├── Pastel (R$ 8.00)
    │   ├── Coxinha (R$ 6.00)
    │   ├── Cachorro Quente (R$ 12.00)
    │   ├── Acarajé (R$ 10.00)
    │   └── Moqueca (R$ 35.00)
    │
    ├── 3 Combos
    │   ├── Combo Praia (R$ 35.00)
    │   ├── Combo Festa (R$ 42.00)
    │   └── Combo Família (R$ 65.00)
    │
    └── 2 Lanches
        ├── Queijo Quente (R$ 7.00)
        └── Biscoito Polvilho (R$ 5.00)
```

### Totais:
- ✅ **500 quiosques**
- ✅ **25.000 guarda-sóis** (50 cada)
- ✅ **7.500 produtos** (15 cada)

---

## 🔍 Consultas SQL para Verificar

Depois de popular, use estas queries para validar:

### Ver todos os quiosques
```sql
SELECT name, owner_name, owner_phone, subscription_status 
FROM vendors 
LIMIT 10;
```

### Contar dados
```sql
SELECT 
  (SELECT COUNT(*) FROM vendors) as total_quiosques,
  (SELECT COUNT(*) FROM umbrellas) as total_guarda_sois,
  (SELECT COUNT(*) FROM products) as total_produtos;
```

### Ver um quiosque inteiro
```sql
SELECT 
  v.name,
  v.owner_name,
  COUNT(DISTINCT u.id) as umbrellas,
  COUNT(DISTINCT p.id) as products,
  GROUP_CONCAT(DISTINCT p.category) as categories
FROM vendors v
LEFT JOIN umbrellas u ON v.id = u.vendor_id
LEFT JOIN products p ON v.id = p.vendor_id
WHERE v.name = 'Teste 1'
GROUP BY v.id, v.name, v.owner_name;
```

### Ver cardápio de um quiosque
```sql
SELECT category, name, price, is_combo 
FROM products 
WHERE vendor_id = (SELECT id FROM vendors WHERE name = 'Teste 1')
ORDER BY category, price;
```

---

## ⚡ Troubleshooting

### ❌ "UNIQUE constraint failed: vendors.name"
**Causa:** Já existem quiosques com esses nomes  
**Solução:** Executar `npm run seed-data clear` primeiro (SQL)

### ❌ "SUPABASE_SERVICE_ROLE_KEY não encontrada"
**Causa:** Variável de ambiente não configurada  
**Solução:** Adicionar ao `.env.local` e reiniciar Next.js

### ❌ "HTTP Error 429 (Too Many Requests)"
**Causa:** Muitas requisições simultâneas (problema do TypeScript seed)  
**Solução:** Usar SQL direto em vez disso!

### ❌ SQL execution timeout
**Causa:** Muitos dados sendo inseridos  
**Solução:** Aumentar timeout do Supabase ou reduzir quantidade

---

## 🛡️ Segurança

### ⚠️ Antes de ir para PRODUÇÃO:

1. **Habilitar RLS (Row Level Security) correctamente:**
```sql
-- Substituir políticas permissivas por:
CREATE POLICY pol_vendors_select ON vendors 
  FOR SELECT USING (auth.uid() = owner_id);
```

2. **Hash de senhas:**
Usar `bcrypt` em vez de texto plano

3. **Validação de entrada:**
Adicionar regex para email, telefone, CNPJ, CPF

4. **Nunca expor:**
- SERVICE_ROLE_KEY em código público
- DATABASE_URL em ambiente cliente

Veja `ANALISE_ERROS.md` para mais detalhes!

---

## 📈 Performance

| Operação | Tempo | Método |
|----------|-------|--------|
| Criar 500 quiosques | ~2-5 min | SQL (paralelo) |
| Criar 500 guarda-sóis cada | ~3-8 min | SQL (paralelo) |
| Criar 500 cardápios | ~2-5 min | SQL (paralelo) |
| **Total SQL** | **~7-18 min** | **SQL Direto** ⭐ |
| **Total TypeScript** | **~30+ min** | JavaScript (sequencial) |

---

## 🎓 Como customizar

### Adicionar mais produtos ao cardápio:
Edite `PRODUCTS_TEMPLATE` em `src/lib/seed-data.ts` ou modifique a lista no SQL.

### Mudar quantidade de guarda-sóis:
Procure por `FOR j IN 1..50 LOOP` e mude o `50` para sua quantidade.

### Criar quiosques com dados aleatórios:
Use bibliotecas como:
- `@faker-js/faker` (gera dados fake realistas)
- `nanoid` (gera IDs únicos)

---

## 📚 Referências

- [Documentação Supabase](https://supabase.com/docs)
- [SQL Editor Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres#connecting-with-ssl)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Seed Data Best Practices](https://www.prisma.io/docs/concepts/components/prisma-migrate/seed)

---

**Última atualização:** 2026-04-10  
**Status:** ✅ Pronto para usar
