import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { formatCurrency, formatDate, getMonthName } from '../utils/formatters';

export const CalendarPage: React.FC = () => {
  const { incomes, expenses, selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = useFinance();
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay(); // 0 is Sunday

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

  const calendarDays = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const getEventsForDay = (day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayIncomes = incomes.filter(i => !i.deleted_at && i.expected_date === dateStr);
    const dayExpenses = expenses.filter(e => !e.deleted_at && e.due_date === dateStr);

    let events: Array<{ id: string; title: string; amount: number; type: 'income' | 'expense'; status: string }> = [];
    if (filterType === 'all' || filterType === 'income') {
      events = events.concat(dayIncomes.map(i => ({ id: i.id, title: i.description, amount: i.amount, type: 'income', status: i.status })));
    }
    if (filterType === 'all' || filterType === 'expense') {
      events = events.concat(dayExpenses.map(e => ({ id: e.id, title: e.description, amount: e.amount, type: 'expense', status: e.status })));
    }
    return events;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendário Financeiro</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acompanhe vencimentos e recebimentos organizados por dia
          </p>
        </div>

        {/* Controles de Navegação */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterType === 'income' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}
            >
              Receitas
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filterType === 'expense' ? 'bg-rose-600 text-white' : 'text-slate-500'}`}
            >
              Despesas
            </button>
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2 min-w-[120px] text-center">
              {getMonthName(selectedMonth)} {selectedYear}
            </span>
            <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Dias da Semana */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 uppercase py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
          <div>Dom</div>
          <div>Seg</div>
          <div>Ter</div>
          <div>Qua</div>
          <div>Qui</div>
          <div>Sex</div>
          <div>Sáb</div>
        </div>

        {/* Grade do Calendário */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="min-h-[90px] bg-slate-50/40 dark:bg-slate-950/20 rounded-xl" />;
            }
            const events = getEventsForDay(day);
            const isToday =
              day === new Date().getDate() &&
              selectedMonth === new Date().getMonth() &&
              selectedYear === new Date().getFullYear();

            return (
              <div
                key={`day-${day}`}
                className={`min-h-[90px] p-1.5 rounded-xl border flex flex-col justify-between transition-colors ${
                  isToday
                    ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20'
                    : 'border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-bold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {day}
                  </span>
                  {events.length > 0 && (
                    <span className="text-[10px] text-slate-400">{events.length}</span>
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto max-h-[60px] custom-scrollbar">
                  {events.map((evt, eIdx) => (
                    <div
                      key={eIdx}
                      className={`text-[10px] px-1 py-0.5 rounded truncate font-medium ${
                        evt.type === 'income'
                          ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                      }`}
                      title={`${evt.title} - ${formatCurrency(evt.amount)}`}
                    >
                      {evt.title} ({formatCurrency(evt.amount)})
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
