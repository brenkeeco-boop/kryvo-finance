import React, { useState } from 'react';
import { X, ArrowDownCircle, ArrowUpCircle, AlertOctagon, CreditCard, Users, Calendar, Target } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { DebtType, PaymentSource, RecurrencePeriod, GoalCategory } from '../types';

interface ModalProps {
  type: 'income' | 'expense' | 'debt' | 'card' | 'goal' | null;
  onClose: () => void;
}

export const TransactionModals: React.FC<ModalProps> = ({ type, onClose }) => {
  const { user } = useAuth();
  const {
    categories, creditCards, addIncome, addExpense, addDebt, addCreditCard, addGoal
  } = useFinance();

  // Estados Formulário Receita
  const [incDesc, setIncDesc] = useState('');
  const [incAmount, setIncAmount] = useState('');
  const [incDate, setIncDate] = useState(new Date().toISOString().split('T')[0]);
  const [incCategory, setIncCategory] = useState('');
  const [incPayer, setIncPayer] = useState('');
  const [incRecurring, setIncRecurring] = useState(false);
  const [incStatus, setIncStatus] = useState<'previsto' | 'recebido'>('previsto');

  // Estados Formulário Despesa
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expCategory, setExpCategory] = useState('');
  const [expCardId, setExpCardId] = useState('');
  const [expSource, setExpSource] = useState<PaymentSource>('conta');
  const [expInstallments, setExpInstallments] = useState('1');
  const [expShared, setExpShared] = useState(false);
  const [expSharedEmail, setExpSharedEmail] = useState('');
  const [expStatus, setExpStatus] = useState<'pendente' | 'pago'>('pendente');

  // Estados Formulário Dívida
  const [debtName, setDebtName] = useState('');
  const [debtCreditor, setDebtCreditor] = useState('');
  const [debtType, setDebtType] = useState<DebtType>('loan');
  const [debtOriginal, setDebtOriginal] = useState('');
  const [debtInstallmentsCount, setDebtInstallmentsCount] = useState('12');
  const [debtInstallmentAmount, setDebtInstallmentAmount] = useState('');
  const [debtFirstDate, setDebtFirstDate] = useState(new Date().toISOString().split('T')[0]);
  const [debtInterest, setDebtInterest] = useState('0');

  // Estados Formulário Cartão
  const [cardName, setCardName] = useState('');
  const [cardBrand, setCardBrand] = useState('Mastercard');
  const [cardLimit, setCardLimit] = useState('');
  const [cardClosing, setCardClosing] = useState('10');
  const [cardDue, setCardDue] = useState('17');

  // Estados Formulário Metas
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('0');
  const [goalDate, setGoalDate] = useState(new Date().toISOString().split('T')[0]);
  const [goalCat, setGoalCat] = useState<GoalCategory>('save_money');

  if (!type) return null;

  const handleSubmitIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(incAmount);
    if (!incDesc || isNaN(amt) || amt <= 0) return;

    addIncome({
      description: incDesc,
      amount: amt,
      expected_date: incDate,
      received_date: incStatus === 'recebido' ? incDate : null,
      category_id: incCategory || null,
      payer: incPayer,
      status: incStatus,
      is_recurring: incRecurring,
      recurrence_period: incRecurring ? 'monthly' : undefined,
    });
    onClose();
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expAmount);
    if (!expDesc || isNaN(amt) || amt <= 0) return;

    const count = parseInt(expInstallments) || 1;

    addExpense({
      description: expDesc,
      amount: amt,
      due_date: expDate,
      paid_date: expStatus === 'pago' ? expDate : null,
      category_id: expCategory || null,
      credit_card_id: expSource === 'cartao_credito' ? expCardId : null,
      payment_source: expSource,
      status: expStatus,
      is_recurring: false,
      is_shared: expShared,
      shared_with_email: expShared ? expSharedEmail : null,
      shared_permission: 'view',
      installment_number: 1,
      total_installments: count,
      is_invoice_payment: false
    }, count);
    onClose();
  };

  const handleSubmitDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const orig = parseFloat(debtOriginal);
    const instAmt = parseFloat(debtInstallmentAmount) || (orig / (parseInt(debtInstallmentsCount) || 1));
    const instCount = parseInt(debtInstallmentsCount) || 1;
    if (!debtName || isNaN(orig) || orig <= 0) return;

    addDebt({
      name: debtName,
      creditor: debtCreditor || 'Credor Não Informado',
      debt_type: debtType,
      original_amount: orig,
      remaining_balance: orig,
      total_installments: instCount,
      installment_amount: instAmt,
      start_date: debtFirstDate,
      first_due_date: debtFirstDate,
      frequency: 'monthly',
      interest_rate: parseFloat(debtInterest) || 0,
      penalty_rate: 0,
      is_shared: false,
    });
    onClose();
  };

  const handleSubmitCard = (e: React.FormEvent) => {
    e.preventDefault();
    const lim = parseFloat(cardLimit);
    if (!cardName || isNaN(lim) || lim <= 0) return;

    addCreditCard({
      name: cardName,
      brand: cardBrand,
      credit_limit: lim,
      closing_day: parseInt(cardClosing) || 1,
      due_day: parseInt(cardDue) || 10,
      color: '#4f46e5'
    });
    onClose();
  };

  const handleSubmitGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const tgt = parseFloat(goalTarget);
    if (!goalTitle || isNaN(tgt) || tgt <= 0) return;

    addGoal({
      title: goalTitle,
      target_amount: tgt,
      current_amount: parseFloat(goalCurrent) || 0,
      target_date: goalDate,
      category: goalCat
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal: Receita */}
        {type === 'income' && (
          <form onSubmit={handleSubmitIncome} className="space-y-4">
            <h3 className="font-bold text-lg text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5" /> Nova Receita
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Descrição</label>
              <input
                type="text"
                required
                placeholder="Ex: Salário da Empresa, Consultoria"
                value={incDesc}
                onChange={(e) => setIncDesc(e.target.value)}
                className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={incAmount}
                  onChange={(e) => setIncAmount(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Data Prevista</label>
                <input
                  type="date"
                  required
                  value={incDate}
                  onChange={(e) => setIncDate(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Categoria</label>
                <select
                  value={incCategory}
                  onChange={(e) => setIncCategory(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  <option value="">Selecione...</option>
                  {categories.filter(c => c.type === 'income').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Pagador / Empresa</label>
                <input
                  type="text"
                  placeholder="Ex: Empresa Ltda"
                  value={incPayer}
                  onChange={(e) => setIncPayer(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Status Inicial</label>
                <select
                  value={incStatus}
                  onChange={(e) => setIncStatus(e.target.value as any)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  <option value="previsto">Previsto (Não altera saldo)</option>
                  <option value="recebido">Recebido (Entra no Saldo)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="incRec"
                  checked={incRecurring}
                  onChange={(e) => setIncRecurring(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="incRec" className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Receita Recorrente Mensal
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs shadow-md shadow-emerald-600/20"
            >
              Salvar Receita
            </button>
          </form>
        )}

        {/* Modal: Despesa */}
        {type === 'expense' && (
          <form onSubmit={handleSubmitExpense} className="space-y-4">
            <h3 className="font-bold text-lg text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5" /> Nova Despesa
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Descrição</label>
              <input
                type="text"
                required
                placeholder="Ex: Supermercado, Aluguel, Farmácia"
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Valor da Parcela (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Vencimento (1ª Parcela)</label>
                <input
                  type="date"
                  required
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Categoria</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  <option value="">Selecione...</option>
                  {categories.filter(c => c.type === 'expense').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Forma de Pagamento</label>
                <select
                  value={expSource}
                  onChange={(e) => setExpSource(e.target.value as any)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  <option value="conta">Conta Corrente / Pix</option>
                  <option value="dinheiro">Dinheiro Físico</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                </select>
              </div>
            </div>

            {expSource === 'cartao_credito' && (
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Selecione o Cartão</label>
                <select
                  value={expCardId}
                  onChange={(e) => setExpCardId(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  required
                >
                  <option value="">Selecione um cartão...</option>
                  {creditCards.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.brand})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Quantidade de Parcelas</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={expInstallments}
                  onChange={(e) => setExpInstallments(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Status</label>
                <select
                  value={expStatus}
                  onChange={(e) => setExpStatus(e.target.value as any)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  <option value="pendente">Pendente (Não baixa do saldo)</option>
                  <option value="pago">Pago (Deduz do Saldo)</option>
                </select>
              </div>
            </div>

            {/* Compartilhamento entre usuários */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="expShareCheck"
                  checked={expShared}
                  onChange={(e) => setExpShared(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="expShareCheck" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Compartilhar com o outro usuário
                </label>
              </div>

              {expShared && (
                <div className="mt-2">
                  <input
                    type="email"
                    placeholder="Email da pessoa convidada"
                    value={expSharedEmail}
                    onChange={(e) => setExpSharedEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                    required={expShared}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Esta despesa ficará visível de forma isolada na conta da pessoa sem expor seus outros registros.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold text-xs shadow-md shadow-rose-600/20"
            >
              Salvar Despesa
            </button>
          </form>
        )}

        {/* Modal: Dívida */}
        {type === 'debt' && (
          <form onSubmit={handleSubmitDebt} className="space-y-4">
            <h3 className="font-bold text-lg text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5" /> Nova Dívida / Obrigação
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Nome da Dívida</label>
              <input
                type="text"
                required
                placeholder="Ex: Empréstimo Pessoal, Financiamento Carro"
                value={debtName}
                onChange={(e) => setDebtName(e.target.value)}
                className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Credor / Instituição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Banco X, João Silva"
                  value={debtCreditor}
                  onChange={(e) => setDebtCreditor(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Tipo de Dívida</label>
                <select
                  value={debtType}
                  onChange={(e) => setDebtType(e.target.value as any)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  <option value="loan">Empréstimo</option>
                  <option value="financing">Financiamento</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="personal">Dívida Pessoal</option>
                  <option value="overdue_bill">Conta Atrasada</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Valor Original (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={debtOriginal}
                  onChange={(e) => setDebtOriginal(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Qtd. Parcelas</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={debtInstallmentsCount}
                  onChange={(e) => setDebtInstallmentsCount(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Valor da Parcela</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Automático"
                  value={debtInstallmentAmount}
                  onChange={(e) => setDebtInstallmentAmount(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Primeiro Vencimento</label>
                <input
                  type="date"
                  required
                  value={debtFirstDate}
                  onChange={(e) => setDebtFirstDate(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Taxa de Juros (% a.m.)</label>
                <input
                  type="number"
                  step="0.1"
                  value={debtInterest}
                  onChange={(e) => setDebtInterest(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold text-xs shadow-md shadow-amber-600/20"
            >
              Registrar Dívida
            </button>
          </form>
        )}

        {/* Modal: Cartão */}
        {type === 'card' && (
          <form onSubmit={handleSubmitCard} className="space-y-4">
            <h3 className="font-bold text-lg text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Adicionar Cartão de Crédito
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Apelido do Cartão</label>
              <input
                type="text"
                required
                placeholder="Ex: Nubank Black, Inter Platinum"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Bandeira</label>
                <select
                  value={cardBrand}
                  onChange={(e) => setCardBrand(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  <option value="Mastercard">Mastercard</option>
                  <option value="Visa">Visa</option>
                  <option value="Elo">Elo</option>
                  <option value="American Express">American Express</option>
                  <option value="Hipercard">Hipercard</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Limite Total (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="5000,00"
                  value={cardLimit}
                  onChange={(e) => setCardLimit(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Dia do Fechamento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={cardClosing}
                  onChange={(e) => setCardClosing(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Dia do Vencimento</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={cardDue}
                  onChange={(e) => setCardDue(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs shadow-md shadow-indigo-600/20"
            >
              Cadastrar Cartão
            </button>
          </form>
        )}

        {/* Modal: Meta */}
        {type === 'goal' && (
          <form onSubmit={handleSubmitGoal} className="space-y-4">
            <h3 className="font-bold text-lg text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <Target className="w-5 h-5" /> Nova Meta Financeira
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Título do Objetivo</label>
              <input
                type="text"
                required
                placeholder="Ex: Reserva de Emergência 6 Meses, Viagem"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Valor Desejado (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="10000,00"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Valor Inicial (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={goalCurrent}
                  onChange={(e) => setGoalCurrent(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Data Limite</label>
                <input
                  type="date"
                  required
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Categoria da Meta</label>
                <select
                  value={goalCat}
                  onChange={(e) => setGoalCat(e.target.value as any)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                >
                  <option value="save_money">Guardar Dinheiro</option>
                  <option value="emergency_reserve">Reserva de Emergência</option>
                  <option value="pay_debt">Quitar Dívidas</option>
                  <option value="buy_item">Comprar Algo Específico</option>
                  <option value="expense_limit">Limite de Gastos</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs shadow-md shadow-indigo-600/20"
            >
              Criar Meta
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
