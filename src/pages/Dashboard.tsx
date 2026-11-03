import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, AlertCircle,
  Calendar, CreditCard, ChevronLeft, ChevronRight, Plus, Eye
} from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { formatCurrency, getMonthName, formatDate } from '../utils/formatters';

interface DashboardProps {
  onOpenQuickModal: (type: 'income' | 'expense' | 'debt' | 'card' | 'invoice') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenQuickModal }) => {
  const {
    metrics,
    availableBalance,
    balanceMode,
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    expenses,
    incomes,
    categories,
    updateIncome,
    updateExpense
  } = useFinance();

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Últimas movimentações
  const recentTransactions = [
    ...incomes.filter(i => !i.deleted_at).map(i => ({
      id: i.id,
      title: i.description,
      amount: i.amount,
      date: i.expected_date,
      type: 'income' as const,
      status: i.status,
      category: categories.find(c => c.id === i.category_id)?.name || 'Receita'
    })),
    ...expenses.filter(e => !e.deleted_at).map(e => ({
      id: e.id,
      title: e.description,
      amount: e.amount,
      date: e.due_date,
      type: 'expense' as const,
      status: e.status,
      category: categories.find(c => c.id === e.category_id)?.name || 'Despesa'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

  // Próximos vencimentos
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingExpenses = expenses
    .filter(e => !e.deleted_at && e.status === 'pendente' && e.due_date >= todayStr)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  // Orçamentos por categoria
  const categoriesWithBudget = categories.filter(c => c.type === 'expense' && c.monthly_budget && c.monthly_budget > 0);

  return (
    <div className="kryvo-dashboard space-y-6">
      {/* Top Header com Mês Selector */}
      <div className="kryvo-dashboard-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Visão Geral</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acompanhe a sua saúde financeira em tempo real
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold px-2 min-w-[130px] text-center">
            {getMonthName(selectedMonth)} {selectedYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 8 Cards Obrigatórios da Especificação */}
      <div className="dashboard-primary-metrics grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Saldo Disponível */}
        <div className="kryvo-metric-card kryvo-balance-card p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/20 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-indigo-100 uppercase tracking-wider">
              Saldo Disponível ({balanceMode === 'auto' ? 'Automático' : 'Manual'})
            </span>
            <DollarSign className="w-5 h-5 text-indigo-200" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold mt-3">{formatCurrency(availableBalance)}</p>
          <p className="text-xs text-indigo-100/80 mt-1">
            {balanceMode === 'auto' ? 'Total recebido líquido confirmado' : 'Valor inserido manualmente'}
          </p>
        </div>

        {/* 2. Total a Receber */}
        <div className="kryvo-metric-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">A Receber (Mês)</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-3 text-emerald-600 dark:text-emerald-400">
            {formatCurrency(metrics.totalToReceive)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Previsões ainda pendentes de confirmação</p>
        </div>

        {/* 3. Total a Pagar */}
        <div className="kryvo-metric-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">A Pagar (Mês)</span>
            <TrendingDown className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-bold mt-3 text-rose-600 dark:text-rose-400">
            {formatCurrency(metrics.totalToPay)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Despesas e dívidas que vencem neste mês</p>
        </div>

        {/* Dívidas Restantes */}
        <div className="kryvo-metric-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Dívidas Restantes</span>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold mt-3 text-amber-600 dark:text-amber-400">
            {formatCurrency(metrics.remainingDebts)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Saldo devedor total acumulado</p>
        </div>

        {/* 5. Receitas do Mês */}
        <div className="kryvo-metric-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">5. Receitas do Mês</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-3 text-slate-800 dark:text-slate-100">
            {formatCurrency(metrics.monthIncomes)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Previstas e recebidas neste mês</p>
        </div>

        {/* 6. Despesas do Mês */}
        <div className="kryvo-metric-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">6. Despesas do Mês</span>
            <TrendingDown className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-bold mt-3 text-slate-800 dark:text-slate-100">
            {formatCurrency(metrics.monthExpenses)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Pendentes e pagas do mês</p>
        </div>

        {/* 7. Previsão de Saldo no Fechamento */}
        <div className="kryvo-metric-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">7. Previsão Fechamento</span>
            <DollarSign className="w-5 h-5 text-indigo-500" />
          </div>
          <p className={`text-2xl font-bold mt-3 ${metrics.monthProjectedEndBalance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}>
            {formatCurrency(metrics.monthProjectedEndBalance)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Saldo projetado após todos os recebimentos/pagamentos</p>
        </div>

        {/* 8. Próximos Vencimentos / Alertas */}
        <div className="kryvo-metric-card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">8. Próx. Vencimentos</span>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-3 text-slate-800 dark:text-slate-100">
            {upcomingExpenses.length} contas
          </p>
          <p className="text-xs text-amber-500 font-medium mt-1">
            {metrics.overdueCount > 0 ? `${metrics.overdueCount} contas em atraso!` : 'Nenhum atraso crítico'}
          </p>
        </div>
      </div>

      {/* Gráficos e Indicadores de Orçamento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico / Comparativo Mensal */}
        <div className="kryvo-panel lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Comparativo: Receitas vs Despesas</h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">
              {getMonthName(selectedMonth)}
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-600 dark:text-slate-300">Total de Receitas</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(metrics.monthIncomes)}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.monthIncomes > 0 ? Math.min(100, (metrics.monthIncomes / (metrics.monthIncomes + metrics.monthExpenses || 1)) * 100) : 0}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-600 dark:text-slate-300">Total de Despesas</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(metrics.monthExpenses)}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.monthExpenses > 0 ? Math.min(100, (metrics.monthExpenses / (metrics.monthIncomes + metrics.monthExpenses || 1)) * 100) : 0}%`
                  }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm">
              <span className="text-slate-500">Resultado do Mês (Economia Líquida):</span>
              <span className={`font-bold ${metrics.monthIncomes - metrics.monthExpenses >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {formatCurrency(metrics.monthIncomes - metrics.monthExpenses)}
              </span>
            </div>
          </div>
        </div>

        {/* Limites e Orçamentos de Categoria */}
        <div className="kryvo-panel bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <h3 className="font-bold text-lg mb-4">Orçamento por Categoria</h3>
          {categoriesWithBudget.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs text-slate-500">Nenhum limite configurado nas categorias.</p>
              <button
                onClick={() => onOpenQuickModal('expense')}
                className="mt-3 text-xs text-indigo-500 hover:underline"
              >
                Definir limites em Configurações
              </button>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[300px] pr-1">
              {categoriesWithBudget.map(cat => {
                const spent = expenses
                  .filter(e => e.category_id === cat.id && e.status !== 'cancelado')
                  .reduce((sum, e) => sum + Number(e.amount || 0), 0);
                const limit = cat.monthly_budget || 1;
                const pct = Math.min(100, Math.round((spent / limit) * 100));
                const remaining = Math.max(0, limit - spent);

                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{cat.name}</span>
                      <span className={pct >= 90 ? 'text-rose-500 font-bold' : 'text-slate-400'}>
                        {formatCurrency(spent)} / {formatCurrency(limit)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pct >= 90 ? 'bg-rose-500' : pct >= 75 ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 text-right">Resta: {formatCurrency(remaining)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tabelas de Últimas Movimentações e Próximos Vencimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas Movimentações */}
        <div className="kryvo-panel bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-base">Últimas Movimentações</h3>
            <span className="text-xs text-slate-400">Recentes</span>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhuma movimentação cadastrada.</p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        item.type === 'income'
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}
                    >
                      {item.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.title}</p>
                      <p className="text-xs text-slate-400">
                        {item.category} • {formatDate(item.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${
                        item.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                    </p>
                    <span
                      className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                        item.status === 'recebido' || item.status === 'pago'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contas Próximas do Vencimento */}
        <div className="kryvo-panel bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-base">Próximos Vencimentos</h3>
            <span className="text-xs text-slate-400">A pagar</span>
          </div>
          {upcomingExpenses.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhuma despesa pendente nos próximos dias.</p>
          ) : (
            <div className="space-y-3">
              {upcomingExpenses.map(expense => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{expense.description}</p>
                      <p className="text-xs text-slate-400">Vencimento: {formatDate(expense.due_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{formatCurrency(expense.amount)}</p>
                    <button
                      onClick={() => updateExpense(expense.id, { status: 'pago', paid_date: new Date().toISOString().split('T')[0] })}
                      className="text-xs px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors"
                    >
                      Pagar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
