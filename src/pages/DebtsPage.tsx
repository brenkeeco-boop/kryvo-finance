import React, { useState } from 'react';
import { Plus, AlertOctagon, CheckCircle2, ChevronRight, DollarSign } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';

interface DebtsPageProps {
  onOpenModal: () => void;
}

export const DebtsPage: React.FC<DebtsPageProps> = ({ onOpenModal }) => {
  const { debts, debtInstallments, payDebtInstallment, deleteDebt } = useFinance();
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);

  const totalOriginal = debts.reduce((sum, d) => sum + Number(d.original_amount), 0);
  const totalRemaining = debts.reduce((sum, d) => sum + Number(d.remaining_balance), 0);
  const totalPaid = Math.max(0, totalOriginal - totalRemaining);
  const paidPercent = totalOriginal > 0 ? Math.round((totalPaid / totalOriginal) * 100) : 0;

  const activeDebt = debts.find(d => d.id === selectedDebtId) || debts[0];
  const activeInstallments = activeDebt
    ? debtInstallments.filter(di => di.debt_id === activeDebt.id).sort((a, b) => a.installment_number - b.installment_number)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Controle de Dívidas</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gerenciamento de empréstimos, financiamentos e parcelas de quitação
          </p>
        </div>
        <button
          onClick={onOpenModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm shadow-md shadow-amber-600/20 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" /> Nova Dívida
        </button>
      </div>

      {/* Indicadores Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-400 uppercase">Total de Dívidas</span>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{formatCurrency(totalOriginal)}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-400 uppercase">Total Já Pago</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-400 uppercase">Saldo Devedor Restante</span>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(totalRemaining)}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-400 uppercase">Progresso de Quitação</span>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{paidPercent}%</p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${paidPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Grid de Lista e Detalhes da Dívida */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Dívidas */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3">
          <h3 className="font-bold text-base mb-3">Suas Obrigações</h3>
          {debts.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Nenhuma dívida cadastrada.</p>
          ) : (
            debts.map(d => {
              const isSelected = activeDebt?.id === d.id;
              const pct = d.original_amount > 0 ? Math.round(((d.original_amount - d.remaining_balance) / d.original_amount) * 100) : 0;

              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDebtId(d.id)}
                  className={`p-3.5 rounded-xl cursor-pointer border transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-sm'
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{d.name}</h4>
                      <p className="text-xs text-slate-400">Credor: {d.creditor}</p>
                    </div>
                    <span className="text-xs font-bold text-rose-500">{formatCurrency(d.remaining_balance)}</span>
                  </div>
                  <div className="mt-2.5">
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>{pct}% quitado</span>
                      <span>{d.total_installments} parcelas</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detalhes e Parcelas da Dívida Selecionada */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          {!activeDebt ? (
            <div className="text-center py-12 text-slate-400 text-sm">Selecione ou crie uma dívida para ver as parcelas.</div>
          ) : (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 dark:border-slate-800 gap-2">
                <div>
                  <h3 className="text-lg font-bold">{activeDebt.name}</h3>
                  <p className="text-xs text-slate-400">
                    Credor: {activeDebt.creditor} • Juros: {activeDebt.interest_rate}% a.m. • Multa: {activeDebt.penalty_rate}%
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Saldo Restante:</span>
                  <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
                    {formatCurrency(activeDebt.remaining_balance)}
                  </p>
                </div>
              </div>

              {/* Tabela de Parcelas */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 rounded-l-lg">Parcela</th>
                      <th className="py-2.5 px-3">Vencimento</th>
                      <th className="py-2.5 px-3">Valor</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right rounded-r-lg">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeInstallments.map((inst) => {
                      const isPaid = inst.status === 'paid';
                      const todayStr = new Date().toISOString().split('T')[0];
                      const isLate = !isPaid && inst.due_date < todayStr;

                      return (
                        <tr key={inst.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-3 font-semibold">
                            {inst.installment_number}/{activeDebt.total_installments}
                          </td>
                          <td className="py-3 px-3">{formatDate(inst.due_date)}</td>
                          <td className="py-3 px-3 font-medium">{formatCurrency(inst.amount)}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                                isPaid
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                                  : isLate
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                                  : 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                              }`}
                            >
                              {isPaid ? 'Pago' : isLate ? 'Atrasado' : 'Pendente'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {!isPaid ? (
                              <button
                                onClick={() => payDebtInstallment(inst.id, inst.amount, todayStr)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs"
                              >
                                Baixar
                              </button>
                            ) : (
                              <span className="text-emerald-500 font-medium">Baixado</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
