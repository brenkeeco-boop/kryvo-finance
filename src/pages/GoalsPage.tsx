import React, { useState } from 'react';
import { Target, Plus, TrendingUp, CheckCircle, Trash2 } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';

interface GoalsPageProps {
  onOpenModal: () => void;
}

export const GoalsPage: React.FC<GoalsPageProps> = ({ onOpenModal }) => {
  const { goals, updateGoal, deleteGoal } = useFinance();
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');

  const handleAddContribution = (goalId: string) => {
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val <= 0) return;
    const g = goals.find(item => item.id === goalId);
    if (g) {
      updateGoal(goalId, {
        current_amount: Number(g.current_amount) + val
      });
      setDepositGoalId(null);
      setDepositAmount('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Metas Financeiras</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acompanhe suas economias, reservas e objetivos de vida
          </p>
        </div>
        <button
          onClick={onOpenModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Nova Meta
        </button>
      </div>

      {/* Grid de Metas */}
      {goals.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Target className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="font-bold text-base">Nenhuma meta definida</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Defina metas como reserva de emergência, viagens ou quitação antecipada de dívidas.
          </p>
          <button onClick={onOpenModal} className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl">
            Criar Minha Primeira Meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map(goal => {
            const pct = Math.min(100, Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100));
            const isCompleted = pct >= 100;

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">{goal.title}</h3>
                      <p className="text-xs text-slate-400">Prazo: {formatDate(goal.target_date)}</p>
                    </div>
                    {isCompleted ? (
                      <span className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                        <CheckCircle className="w-5 h-5" />
                      </span>
                    ) : (
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Progresso Numérico */}
                  <div className="mt-4 flex justify-between items-baseline">
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(goal.current_amount)}
                    </span>
                    <span className="text-xs text-slate-400">de {formatCurrency(goal.target_amount)}</span>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-right text-slate-400 mt-1 font-semibold">{pct}% alcançado</p>
                </div>

                {/* Ações de Depósito */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {depositGoalId === goal.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="R$ Valor"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        autoFocus
                      />
                      <button
                        onClick={() => handleAddContribution(goal.id)}
                        className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setDepositGoalId(null)}
                        className="px-2 py-2 text-slate-400 text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDepositGoalId(goal.id)}
                      className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      + Adicionar Economia / Aporte
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
