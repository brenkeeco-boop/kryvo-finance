import React, { useState } from 'react';
import { TrendingUp, Calendar, AlertTriangle, ArrowRight } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { formatCurrency } from '../utils/formatters';

export const PlanningPage: React.FC = () => {
  const { incomes, expenses, debts, debtInstallments, availableBalance } = useFinance();
  const [period, setPeriod] = useState<number>(30); // 7, 30, 90, 180, 365 dias

  const now = new Date();
  const targetDate = new Date();
  targetDate.setDate(now.getDate() + period);

  const targetDateStr = targetDate.toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  // Receitas previstas no período
  const projectedIncomes = incomes
    .filter(i => !i.deleted_at && i.status !== 'cancelado' && i.expected_date >= todayStr && i.expected_date <= targetDateStr)
    .reduce((sum, i) => sum + Number(i.amount), 0);

  // Despesas futuras no período
  const projectedExpenses = expenses
    .filter(e => !e.deleted_at && e.status !== 'cancelado' && !e.is_invoice_payment && e.due_date >= todayStr && e.due_date <= targetDateStr)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Parcelas de dívidas no período
  const projectedDebtInstallments = debtInstallments
    .filter(di => !di.deleted_at && di.status === 'pending' && di.due_date >= todayStr && di.due_date <= targetDateStr)
    .reduce((sum, di) => sum + Number(di.amount), 0);

  const totalFutureOutflows = projectedExpenses + projectedDebtInstallments;
  const projectedFutureBalance = availableBalance + projectedIncomes - totalFutureOutflows;
  const isDeficit = totalFutureOutflows > projectedIncomes;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Planejamento e Projeções Futuras</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Simulação de fluxo de caixa baseada em previsões, parcelamentos e recorrências
          </p>
        </div>

        {/* Seletor de Períodos Obrigatórios da Especificação */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl">
          {[
            { label: '7 Dias', value: 7 },
            { label: '30 Dias', value: 30 },
            { label: '3 Meses', value: 90 },
            { label: '6 Meses', value: 180 },
            { label: '12 Meses', value: 365 },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setPeriod(item.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === item.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerta de Déficit se as despesas superarem as receitas */}
      {isDeficit && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">Atenção ao Fluxo de Caixa!</p>
            <p className="mt-0.5">
              Neste intervalo selecionado ({period} dias), as saídas previstas ({formatCurrency(totalFutureOutflows)}) superam as entradas ({formatCurrency(projectedIncomes)}).
            </p>
          </div>
        </div>
      )}

      {/* Cards de Projeção */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-400 uppercase">Saldo Inicial Atual</span>
          <p className="text-2xl font-bold mt-1 text-slate-800 dark:text-slate-100">{formatCurrency(availableBalance)}</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-400 uppercase">(+) Entradas Futuras</span>
          <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">+{formatCurrency(projectedIncomes)}</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-400 uppercase">(-) Saídas Futuras Totais</span>
          <p className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">-{formatCurrency(totalFutureOutflows)}</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-900 to-indigo-950 text-white border border-indigo-800 shadow-lg">
          <span className="text-xs font-medium text-indigo-200 uppercase">(=) Saldo Final Projetado</span>
          <p className={`text-2xl font-extrabold mt-1 ${projectedFutureBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {formatCurrency(projectedFutureBalance)}
          </p>
        </div>
      </div>
    </div>
  );
};
