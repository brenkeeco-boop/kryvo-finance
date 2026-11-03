# KRYVO — Luxury Finance

Atualização visual baseada nas escolhas do usuário:
- Fundo grafite escuro, superfícies de vidro discretas e verde esmeralda.
- Sidebar recolhida por padrão no desktop, expansível e com navegação por ícones.
- Navegação inferior simplificada no celular.
- Dashboard equilibrado com saldo, receitas, despesas, dívidas, comparativo e vencimentos.
- Tipografia com espaçamento e altura de linha consistentes.
- Animações suaves com respeito a `prefers-reduced-motion`.

## Nova área: Reservas

A rota `/reservas` permite criar objetivos de reserva, registrar aportes e retiradas e acompanhar o progresso e o histórico.

Regra financeira: aportes reduzem o saldo disponível e aumentam o valor reservado; retiradas fazem o inverso. Movimentações entre saldo livre e reserva **não são despesas nem receitas**, evitando duplicidade nos relatórios. O saldo reservado também é descontado do saldo livre no modo manual.

Os dados desta versão seguem o mecanismo local de armazenamento que o projeto já utilizava. O schema SQL ganhou as tabelas `reserves` e `reserve_movements` com RLS para uma futura integração Supabase; isso não ativa sincronização remota por si só.

## Executar localmente

```bash
npm install
npm run dev
```

## Observação

A atualização preserva os módulos e a lógica existente e adiciona a funcionalidade de reservas. O build TypeScript (`tsc --noEmit`) foi validado. A compilação Vite de produção não pôde ser confirmada neste ambiente por ausência do pacote opcional Rollup para Linux na pasta `node_modules` copiada do ambiente Windows. No computador do usuário, execute `npm install` antes de `npm run dev` ou `npm run build`.
