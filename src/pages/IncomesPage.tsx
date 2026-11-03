import React, { useState } from 'react';
import { Plus, Filter, CheckCircle2, Clock, Trash2, Edit2, Calendar } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Income, IncomeStatus } from '../types';

interface IncomesPageProps {
  onOpenModal: () => void;
}

export const IncomesPage: React.FC<IncomesPageProps> = ({ onOpenModal }) => {
  const { incomes, categories, updateIncome, deleteIncome } = useFinance();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const incomeCategories = categories.filter(c => c.type === 'income');

  const filteredIncomes = incomes.filter(i => {
    if (i.deleted_at) return false;
    if (filterStatus !== 'all' && i.status !== filterStatus) return false;
    if (filterCategory !== 'all' && i.category_id !== filterCategory) return false;
    return true;
  });

  const handleConfirmReceived = (income: Income) => {
    const today = new Date().toISOString().split('T')[0];
    updateIncome(income.id, {
      status: 'recebido',
      received_date: today
    });
  };

  const totalReceived = filteredIncomes
    .filter(i => i.status === 'recebido')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const totalExpected = filteredIncomes
    .filter(i => i.status === 'previsto')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Receitas</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Controle de salários, serviços e outros recebimentos
          </p>
        </div>
        <button
          onClick={onOpenModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" /> Nova Receita
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-400 uppercase">Recebido (Efetivo no Saldo)</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(totalReceived)}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-400 uppercase">Previsto (Aguardando)</span>
          <p className="text-2xl font-bold text-amber-500 mt-1">{formatCurrency(totalExpected)}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-400 uppercase">Total Previsto Geral</span>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
            {formatCurrency(totalReceived + totalExpected)}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <Filter className="w-4 h-4 text-slate-400 ml-1" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs font-medium px-3 py-2 text-slate-700 dark:text-slate-300"
        >
          <option value="all">Todos os Status</option>
          <option value="previsto">Previsto</option>
          <option value="recebido">Recebido</option>
          <option value="atrasado">Atrasado</option>
          <option value="cancelado">Cancelado</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs font-medium px-3 py-2 text-slate-700 dark:text-slate-300"
        >
          <option value="all">Todas as Categorias</option>
          {incomeCategories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Lista de Receitas */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredIncomes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">Nenhuma receita encontrada para os filtros aplicados.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredIncomes.map((income) => {
              const cat = categories.find(c => c.id === income.category_id);
              const isReceived = income.status === 'recebido';

              return (
                <div
                  key={income.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isReceived ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isReceived ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{income.description}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{cat?.name || 'Geral'}</span>
                        {income.payer && <span>• Pagador: {income.payer}</span>}
                        <span>• Data Prevista: {formatDate(income.expected_date)}</span>
                        {income.received_date && (
                          <span className="text-emerald-500 font-medium">
                            • Recebido em: {formatDate(income.received_date)}
                          </span>
                        )}
                        {income.is_recurring && (
                          <span className="px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-950 text-indigo-500 rounded text-[10px]">
                            Recorrente ({income.recurrence_period || 'mensal'})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(income.amount)}
                    </span>

                    {!isReceived && (
                      <button
                        onClick={() => handleConfirmReceived(income)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar
                      </button>
                    )}

                    <button
                      onClick={() => deleteIncome(income.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                      title="Mover para lixeira"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
