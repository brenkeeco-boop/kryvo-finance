# Meu Financeiro — Sistema de Gestão Financeira Pessoal e Compartilhada

Sistema financeiro completo, com isolamento de dados entre usuários, compartilhamento granular de despesas e dívidas, regras contábeis estritas contra duplicidade de faturas, assistente financeiro inteligente, projeções futuras, exportação em PDF real e suporte a PWA.

## 🚀 Como Executar

### 1. Instalação e Inicialização Local
O projeto já se encontra totalmente instalado e compilado na pasta raiz. Para rodar em modo de desenvolvimento:

```bash
npm run dev
```

Ou para rodar o build otimizado de produção:
```bash
npm run preview
```

---

## 🗄️ Banco de Dados e Supabase (SQL RLS)
O script SQL completo com todas as tabelas, índices de alta performance, triggers e políticas RLS (Row Level Security) está localizado em:
`supabase_schema.sql`

Para conectar ao seu projeto Supabase gerenciado:
1. Crie um projeto no Supabase (se desejado).
2. Execute o conteúdo de `supabase_schema.sql` no **SQL Editor** do Supabase.
3. Crie um arquivo `.env` com:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
   ```
*Nota: Por padrão, o sistema opera de forma resiliente tanto conectado ao Supabase quanto com armazenamento local seguro e persistente via LocalStorage + Backup JSON.*

---

## 🧪 Testes de Regras Financeiras
Para reexecutar a suíte de testes de regras contábeis (anti-duplicidade, faturas, receitas previstas e saldo disponível):

```bash
node test_runner.cjs
```
