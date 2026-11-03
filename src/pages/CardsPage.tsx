import React, { useState } from 'react';
import { Plus, CreditCard as CardIcon, Receipt, Calendar, ArrowUpRight } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';

interface CardsPageProps {
  onOpenCardModal: () => void;
  onOpenExpenseModal: () => void;
}

export const CardsPage: React.FC<CardsPageProps> = ({ onOpenCardModal, onOpenExpenseModal }) => {
  const { creditCards, expenses, payCreditCardInvoice } = useFinance();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const activeCard = creditCards.find(c => c.id === selectedCardId) || creditCards[0];

  // Compras atreladas ao cartão ativo (excluindo faturas pagas)
  const cardExpenses = activeCard
    ? expenses.filter(e => e.credit_card_id === activeCard.id && !e.is_invoice_payment && !e.deleted_at)
    : [];

  // Fatura atual: soma das compras pendentes
  const currentInvoiceTotal = cardExpenses
    .filter(e => e.status === 'pendente')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Limite disponível calculado
  const availableLimit = activeCard ? Math.max(0, activeCard.credit_limit - currentInvoiceTotal) : 0;

  const handlePayInvoice = () => {
    if (!activeCard || currentInvoiceTotal <= 0) return;
    const today = new Date().toISOString().split('T')[0];
    payCreditCardInvoice(activeCard.id, currentInvoiceTotal, today);
    alert('Fatura quitada com sucesso! O pagamento foi registrado contabilmente sem duplicar suas despesas.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cartões de Crédito</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gerenciamento de faturas, limites e compras parceladas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenExpenseModal}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Comprar no Cartão
          </button>
          <button
            onClick={onOpenCardModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Novo Cartão
          </button>
        </div>
      </div>

      {creditCards.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <CardIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="font-bold text-base">Nenhum cartão cadastrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Cadastre seu primeiro cartão de crédito para acompanhar faturas e limites disponíveis automaticamente.
          </p>
          <button
            onClick={onOpenCardModal}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
          >
            Adicionar Cartão
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visual do Cartão Físico Digital */}
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {creditCards.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCardId(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    activeCard?.id === c.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Cartão UI Premium */}
            <div className="p-6 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-slate-800">
              <div className="flex justify-between items-center mb-8">
                <span className="font-bold tracking-wider text-sm">{activeCard.name}</span>
                <span className="text-xs uppercase tracking-widest font-mono text-indigo-300">{activeCard.brand}</span>
              </div>
              <div className="space-y-1 mb-6">
                <span className="text-[11px] text-slate-400">Limite Disponível Calculado</span>
                <p className="text-2xl font-black">{formatCurrency(availableLimit)}</p>
              </div>
              <div className="flex justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                <div>
                  <span>Fecha dia: </span>
                  <span className="font-bold text-white">{activeCard.closing_day}</span>
                </div>
                <div>
                  <span>Vence dia: </span>
                  <span className="font-bold text-white">{activeCard.due_day}</span>
                </div>
                <div>
                  <span>Limite Total: </span>
                  <span className="font-bold text-white">{formatCurrency(activeCard.credit_limit)}</span>
                </div>
              </div>
            </div>

            {/* Card de Fatura Atual */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs text-slate-400 uppercase font-medium">Fatura Aberta</span>
                  <p className="text-2xl font-extrabold text-rose-500 mt-0.5">{formatCurrency(currentInvoiceTotal)}</p>
                </div>
                <Receipt className="w-5 h-5 text-slate-400" />
              </div>

              <button
                disabled={currentInvoiceTotal <= 0}
                onClick={handlePayInvoice}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <ArrowUpRight className="w-4 h-4" /> Quitar Fatura do Cartão
              </button>
            </div>
          </div>

          {/* Compras no Cartão Selecionado */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-base mb-4">Compras Registradas no Cartão</h3>
            {cardExpenses.length === 0 ? (
              <p className="text-xs text-slate-400 py-10 text-center">Nenhuma compra realizada com este cartão.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {cardExpenses.map(item => (
                  <div key={item.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.description}</p>
                      <p className="text-xs text-slate-400">
                        {formatDate(item.due_date)} • Parcela {item.installment_number}/{item.total_installments}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-rose-500">{formatCurrency(item.amount)}</p>
                      <span className="text-[10px] text-slate-400 uppercase">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
