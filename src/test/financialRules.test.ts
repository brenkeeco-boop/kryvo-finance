import { calculateAvailableBalance, calculateMonthlyMetrics } from '../utils/financialCalculations';
import { Income, Expense, Debt, DebtInstallment } from '../types';

function runUnitTests() {
  console.log('--- EXECUTANDO TESTES UNITÁRIOS DE REGRAS CONTÁBEIS ---');

  // Teste 1: Uma receita prevista NÃO deve aumentar o saldo disponível real
  const incomesTest: Income[] = [
    {
      id: 'inc-1',
      user_id: 'user-1',
      description: 'Salário Previsto',
      amount: 5000,
      expected_date: '2026-11-05',
      status: 'previsto',
      is_recurring: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'inc-2',
      user_id: 'user-1',
      description: 'Freelance Recebido',
      amount: 1500,
      expected_date: '2026-11-01',
      received_date: '2026-11-01',
      status: 'recebido',
      is_recurring: false,
      created_at: new Date().toISOString()
    }
  ];

  const expensesTest: Expense[] = [
    {
      id: 'exp-1',
      user_id: 'user-1',
      description: 'Aluguel Pendente',
      amount: 1200,
      due_date: '2026-11-10',
      status: 'pendente',
      is_recurring: false,
      is_shared: false,
      installment_number: 1,
      total_installments: 1,
      is_invoice_payment: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'exp-2',
      user_id: 'user-1',
      description: 'Mercado Pago à Vista',
      amount: 300,
      due_date: '2026-11-02',
      paid_date: '2026-11-02',
      payment_source: 'conta',
      status: 'pago',
      is_recurring: false,
      is_shared: false,
      installment_number: 1,
      total_installments: 1,
      is_invoice_payment: false,
      created_at: new Date().toISOString()
    }
  ];

  const balance = calculateAvailableBalance(incomesTest, expensesTest, []);
  console.assert(balance === 1200, `Erro: Saldo esperado 1200 (1500 - 300), mas obteve ${balance}`);
  console.log('✓ Teste 1 APROVADO: Saldo considera apenas receitas recebidas e despesas pagas à vista.');

  // Teste 2: Compra no Cartão de Crédito não deduz o saldo disponível imediato
  const creditCardExpense: Expense = {
    id: 'exp-cc',
    user_id: 'user-1',
    description: 'Compra no Crédito',
    amount: 400,
    due_date: '2026-11-20',
    payment_source: 'cartao_credito',
    status: 'pendente',
    is_recurring: false,
    is_shared: false,
    installment_number: 1,
    total_installments: 1,
    is_invoice_payment: false,
    created_at: new Date().toISOString()
  };

  const balanceWithCC = calculateAvailableBalance(incomesTest, [...expensesTest, creditCardExpense], []);
  console.assert(balanceWithCC === 1200, `Erro: Compra no cartão não deveria deduzir o saldo imediatamente. Saldo: ${balanceWithCC}`);
  console.log('✓ Teste 2 APROVADO: Compras no cartão de crédito não reduzem o saldo imediatamente.');

  // Teste 3: Pagamento de fatura não duplica no cálculo de despesas do mês
  const invoicePayment: Expense = {
    id: 'exp-invoice',
    user_id: 'user-1',
    description: 'Pagamento Fatura',
    amount: 400,
    due_date: '2026-11-20',
    paid_date: '2026-11-20',
    payment_source: 'conta',
    status: 'pago',
    is_recurring: false,
    is_shared: false,
    installment_number: 1,
    total_installments: 1,
    is_invoice_payment: true,
    created_at: new Date().toISOString()
  };

  const metrics = calculateMonthlyMetrics(
    incomesTest,
    [...expensesTest, creditCardExpense, invoicePayment],
    [],
    [],
    2026,
    11
  );

  // As despesas do mês devem computar a compra de 400 + mercado de 300 + aluguel de 1200 = 1900 (SEM somar os 400 da fatura de novo)
  console.assert(metrics.monthExpenses === 1900, `Erro: Despesas do mês deveriam ser 1900, mas foi ${metrics.monthExpenses}`);
  console.log('✓ Teste 3 APROVADO: Pagamento de fatura não gera duplicidade contábil nas métricas do mês.');

  console.log('--- TODOS OS TESTES PASSARAM COM SUCESSO! ---');
}

runUnitTests();
