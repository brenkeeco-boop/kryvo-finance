import { Income, Expense, Debt, CreditCard, DebtInstallment } from '../types';

/**
 * REGRAS CONTÁBEIS ESTRITAS DO SISTEMA MEU FINANCEIRO:
 *
 * 1. Saldo Disponível no Modo Automático:
 *    - Soma de todas as Receitas com status = 'recebido' (recebimento confirmado)
 *    - MENOS todas as Despesas com status = 'pago' pagas à vista (dinheiro ou conta bancária)
 *    - MENOS pagamentos diretos de faturas de cartão (is_invoice_payment = true e status = 'pago')
 *    - MENOS pagamentos efetuados de parcelas de dívidas
 *    - COMPRAS FEITAS NO CARTÃO DE CRÉDITO NÃO DEDUZEM O SALDO DISPONÍVEL IMEDIATAMENTE (pois pertencem à fatura futura do cartão).
 *    - PAGAMENTO DA FATURA deduz o saldo, mas NÃO duplica a despesa das compras já realizadas.
 *    - RECEITAS PREVISTAS NÃO SOMAM no saldo real.
 *    - DESPESAS PENDENTES NÃO DEDUZEM do saldo real.
 */

export interface FinancialSummary {
  availableBalance: number;
  totalToReceive: number;
  totalToPay: number;
  remainingDebts: number;
  monthIncomes: number;
  monthExpenses: number;
  monthProjectedEndBalance: number;
  overdueCount: number;
}

export function calculateAvailableBalance(
  incomes: Income[],
  expenses: Expense[],
  debtInstallments: DebtInstallment[]
): number {
  // Apenas receitas confirmadas recebidas
  const totalReceived = incomes
    .filter(i => !i.deleted_at && i.status === 'recebido')
    .reduce((acc, i) => acc + Number(i.amount || 0), 0);

  // Apenas despesas pagas que saíram do dinheiro/conta diretamente (não cartão de crédito a prazo)
  // Ou que sejam explicitamente pagamento de fatura
  const totalPaidExpenses = expenses
    .filter(e => !e.deleted_at && e.status === 'pago')
    .filter(e => e.payment_source !== 'cartao_credito' || e.is_invoice_payment)
    .reduce((acc, e) => acc + Number(e.amount || 0), 0);

  // Pagamentos de parcelas de dívidas realizadas
  const totalPaidDebtInstallments = debtInstallments
    .filter(di => !di.deleted_at && di.status === 'paid')
    .reduce((acc, di) => acc + Number(di.paid_amount || di.amount || 0), 0);

  return totalReceived - totalPaidExpenses - totalPaidDebtInstallments;
}

export function calculateMonthlyMetrics(
  incomes: Income[],
  expenses: Expense[],
  debts: Debt[],
  debtInstallments: DebtInstallment[],
  year: number,
  month: number // 1-12
): FinancialSummary {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  // 1. Receitas do mês
  const currentMonthIncomes = incomes.filter(i => !i.deleted_at && i.expected_date.startsWith(monthStr));
  const monthIncomesTotal = currentMonthIncomes
    .filter(i => i.status !== 'cancelado')
    .reduce((acc, i) => acc + Number(i.amount || 0), 0);

  // 2. Despesas do mês (excluindo faturas duplicadas se houver compras já listadas no cartão)
  const currentMonthExpenses = expenses.filter(e => !e.deleted_at && e.due_date.startsWith(monthStr));
  const monthExpensesTotal = currentMonthExpenses
    .filter(e => e.status !== 'cancelado' && !e.is_invoice_payment)
    .reduce((acc, e) => acc + Number(e.amount || 0), 0);

  // 3. Total a receber (mês ou geral pendente)
  const totalToReceive = currentMonthIncomes
    .filter(i => i.status === 'previsto' || i.status === 'atrasado')
    .reduce((acc, i) => acc + Number(i.amount || 0), 0);

  // 4. Total a pagar pendente no mês
  const pendingExpenses = currentMonthExpenses
    .filter(e => e.status === 'pendente' || e.status === 'atrasado')
    .reduce((acc, e) => acc + Number(e.amount || 0), 0);

  const pendingDebtInst = debtInstallments
    .filter(di => !di.deleted_at && (di.status === 'pending' || di.status === 'overdue') && di.due_date.startsWith(monthStr))
    .reduce((acc, di) => acc + Number(di.amount || 0), 0);

  const totalToPay = pendingExpenses + pendingDebtInst;

  // 5. Total de dívidas restantes
  const remainingDebts = debts
    .filter(d => !d.deleted_at)
    .reduce((acc, d) => acc + Number(d.remaining_balance || 0), 0);

  // 6. Contas atrasadas
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount =
    expenses.filter(e => !e.deleted_at && e.status === 'pendente' && e.due_date < todayStr).length +
    debtInstallments.filter(di => !di.deleted_at && di.status === 'pending' && di.due_date < todayStr).length;

  const currentAvailable = calculateAvailableBalance(incomes, expenses, debtInstallments);

  // Previsão de saldo no fechamento do mês: Saldo atual + total a receber pendente - total a pagar pendente
  const monthProjectedEndBalance = currentAvailable + totalToReceive - totalToPay;

  return {
    availableBalance: currentAvailable,
    totalToReceive,
    totalToPay,
    remainingDebts,
    monthIncomes: monthIncomesTotal,
    monthExpenses: monthExpensesTotal,
    monthProjectedEndBalance,
    overdueCount
  };
}
