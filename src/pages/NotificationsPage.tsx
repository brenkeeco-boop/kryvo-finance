import React from 'react';
import { Bell, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { formatDate } from '../utils/formatters';

export const NotificationsPage: React.FC = () => {
  const { notifications } = useFinance();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Central de Notificações</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Avisos inteligentes de vencimento, limites orçamentários e cobranças pendentes
        </p>
      </div>

      {/* Lista de Alertas */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-base">Tudo em dia!</h3>
            <p className="text-xs text-slate-400 mt-1">
              Não há contas atrasadas nem limites de orçamento ultrapassados no momento.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map(item => {
              const isDanger = item.type === 'danger';
              const isWarning = item.type === 'warning';

              return (
                <div key={item.id} className="p-4 flex items-start gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <div
                    className={`p-2 rounded-xl mt-0.5 ${
                      isDanger
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                        : isWarning
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                        : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600'
                    }`}
                  >
                    {isDanger ? <AlertCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{item.title}</h4>
                      <span className="text-[11px] text-slate-400">{formatDate(item.date)}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.message}</p>
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
