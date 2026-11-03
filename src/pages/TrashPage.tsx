import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { LocalStorageManager } from '../utils/storageManager';
import { formatCurrency, formatDate } from '../utils/formatters';

export const TrashPage: React.FC = () => {
  const { user } = useAuth();
  const { restoreItem, permanentDeleteItem, refreshData } = useFinance();
  const [trashItems, setTrashItems] = useState<{
    incomes: any[];
    expenses: any[];
    debts: any[];
    goals: any[];
  }>({ incomes: [], expenses: [], debts: [], goals: [] });

  const loadTrash = () => {
    if (!user) return;
    const items = LocalStorageManager.getTrashItems(user.id);
    setTrashItems(items);
  };

  useEffect(() => {
    loadTrash();
  }, [user?.id]);

  const handleRestore = (type: 'income' | 'expense' | 'debt' | 'goal', id: string) => {
    restoreItem(type, id);
    loadTrash();
    refreshData();
  };

  const handlePermanentDelete = (type: 'income' | 'expense' | 'debt' | 'goal', id: string) => {
    if (confirm('Tem certeza que deseja apagar definitivamente este item? Esta ação não pode ser desfeita.')) {
      permanentDeleteItem(type, id);
      loadTrash();
      refreshData();
    }
  };

  const totalCount =
    trashItems.incomes.length +
    trashItems.expenses.length +
    trashItems.debts.length +
    trashItems.goals.length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Lixeira e Recuperação</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Itens excluídos permanecem protegidos por 90 dias antes da exclusão permanente automática.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        {totalCount === 0 ? (
          <div className="text-center py-16">
            <Trash2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <h3 className="font-bold text-base">A lixeira está vazia</h3>
            <p className="text-xs text-slate-400 mt-1">Nenhum lançamento excluído no período recente.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Despesas Excluídas */}
            {trashItems.expenses.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Despesas Excluídas</h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                  {trashItems.expenses.map(e => (
                    <div key={e.id} className="p-3 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{e.description}</p>
                        <p className="text-[11px] text-slate-400">
                          Excluído em {formatDate(e.deleted_at)} • {formatCurrency(e.amount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRestore('expense', e.id)}
                          className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-lg hover:bg-emerald-100 flex items-center gap-1 font-medium"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                        </button>
                        <button
                          onClick={() => handlePermanentDelete('expense', e.id)}
                          className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-lg hover:bg-rose-100 flex items-center gap-1 font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Apagar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Receitas Excluídas */}
            {trashItems.incomes.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Receitas Excluídas</h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                  {trashItems.incomes.map(i => (
                    <div key={i.id} className="p-3 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{i.description}</p>
                        <p className="text-[11px] text-slate-400">
                          Excluído em {formatDate(i.deleted_at)} • {formatCurrency(i.amount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRestore('income', i.id)}
                          className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-lg hover:bg-emerald-100 flex items-center gap-1 font-medium"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                        </button>
                        <button
                          onClick={() => handlePermanentDelete('income', i.id)}
                          className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-lg hover:bg-rose-100 flex items-center gap-1 font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Apagar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
