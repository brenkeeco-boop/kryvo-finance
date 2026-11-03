import React, { useState } from 'react';
import { Plus, Filter, CheckCircle2, Clock, Trash2, Users, AlertCircle } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Expense } from '../types';

interface ExpensesPageProps {
  onOpenModal: () => void;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({ onOpenModal }) => {
  const { expenses, categories, creditCards, updateExpense, deleteExpense } = useFinance();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterShared, setFilterShared] = useState<boolean>(false);

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const filteredExpenses = expenses.filter(e => {
    if (e.deleted_at) return false;
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (filterCategory !== 'all' && e.category_id !== filterCategory) return false;
    if (filterShared && !e.is_shared) return false;
    return true;
  });

  const handlePayExpense = (expense: Expense) => {
    const today = new Date().toISOString().split('T')[0];
    updateExpense(expense.id, {
      status: 'pago',
      paid_date: today
    });
  };

  const totalPaid = filteredExpenses
    .filter(e => e.status === 'pago')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalPending = filteredExpenses
    .filter(e => e.status === 'pendente')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Despesas</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gerencie contas fixas, variáveis, parceladas e compartilhadas
          </p>
        </div>
        <button
          onClick={onOpenModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm shadow-md shadow-rose-600/20 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" /> Nova Despesa
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-400 uppercase">Pagas (Deduzido no Saldo)</span>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-400 uppercase">Pendentes a Pagar</span>
          <p className="text-2xl font-bold text-amber-500 mt-1">{formatCurrency(totalPending)}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-medium text-slate-400 uppercase">Total de Despesas Filtradas</span>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
            {formatCurrency(totalPaid + totalPending)}
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
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
          <option value="atrasado">Atrasado</option>
          <option value="cancelado">Cancelado</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs font-medium px-3 py-2 text-slate-700 dark:text-slate-300"
        >
          <option value="all">Todas as Categorias</option>
          {expenseCategories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <button
          onClick={() => setFilterShared(!filterShared)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            filterShared
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Apenas Compartilhadas
        </button>
      </div>

      {/* Lista de Despesas */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-slate-400">Nenhuma despesa encontrada para os filtros aplicados.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredExpenses.map((expense) => {
              const cat = categories.find(c => c.id === expense.category_id);
              const card = creditCards.find(c => c.id === expense.credit_card_id);
              const isPaid = expense.status === 'pago';
              const isSharedFromOther = expense.user_id !== user?.id;

              return (
                <div
                  key={expense.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isPaid ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-500'
                      }`}
                    >
                      {isPaid ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">{expense.description}</h4>
                        {expense.total_installments > 1 && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                            {expense.installment_number}/{expense.total_installments}
                          </span>
                        )}
                        {expense.is_shared && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {isSharedFromOther ? 'Compartilhado com você' : `Compartilhado com ${expense.shared_with_email}`}
                          </span>
                        )}
                        {expense.is_invoice_payment && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600">
                            Fatura de Cartão
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{cat?.name || 'Geral'}</span>
                        {card && <span>• Cartão: {card.name}</span>}
                        {expense.responsible && <span>• Resp: {expense.responsible}</span>}
                        <span>• Vencimento: {formatDate(expense.due_date)}</span>
                        {expense.paid_date && (
                          <span className="text-emerald-500 font-medium">
                            • Pago em: {formatDate(expense.paid_date)}
                          </span>
                        )}
                        <span>• Forma: {expense.payment_source || 'conta'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                      -{formatCurrency(expense.amount)}
                    </span>

                    {!isPaid && (
                      <button
                        onClick={() => handlePayExpense(expense)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Pagar
                      </button>
                    )}

                    <button
                      onClick={() => deleteExpense(expense.id)}
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
