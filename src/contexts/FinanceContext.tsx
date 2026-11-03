import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  Income, Expense, Debt, DebtInstallment, CreditCard,
  Category, FinancialGoal, NotificationItem, BalanceMode, Reserve, ReserveMovement
} from '../types';
import { LocalStorageManager } from '../utils/storageManager';
import { calculateAvailableBalance, calculateMonthlyMetrics } from '../utils/financialCalculations';
import { generateUUID } from '../utils/formatters';

interface FinanceContextType {
  incomes: Income[];
  expenses: Expense[];
  debts: Debt[];
  debtInstallments: DebtInstallment[];
  creditCards: CreditCard[];
  categories: Category[];
  goals: FinancialGoal[];
  reserves: Reserve[];
  reserveMovements: ReserveMovement[];
  totalReserved: number;
  notifications: NotificationItem[];
  selectedMonth: number; // 0-11
  selectedYear: number;
  setSelectedMonth: (m: number) => void;
  setSelectedYear: (y: number) => void;
  metrics: ReturnType<typeof calculateMonthlyMetrics>;
  balanceMode: BalanceMode;
  availableBalance: number;
  
  // Actions
  addIncome: (income: Omit<Income, 'id' | 'user_id' | 'created_at'>) => void;
  updateIncome: (id: string, updates: Partial<Income>) => void;
  deleteIncome: (id: string) => void;

  addExpense: (expense: Omit<Expense, 'id' | 'user_id' | 'created_at'>, installmentsCount?: number) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  addCreditCard: (card: Omit<CreditCard, 'id' | 'user_id' | 'created_at'>) => void;
  updateCreditCard: (id: string, updates: Partial<CreditCard>) => void;
  deleteCreditCard: (id: string) => void;
  payCreditCardInvoice: (cardId: string, amount: number, paymentDate: string) => void;

  addDebt: (debt: Omit<Debt, 'id' | 'user_id' | 'created_at'>) => void;
  payDebtInstallment: (installmentId: string, paidAmount: number, paidDate: string) => void;
  deleteDebt: (id: string) => void;

  addGoal: (goal: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at'>) => void;
  updateGoal: (id: string, updates: Partial<FinancialGoal>) => void;
  deleteGoal: (id: string) => void;

  addReserve: (reserve: Omit<Reserve, 'id' | 'user_id' | 'created_at' | 'current_amount'>) => void;
  moveReserve: (reserveId: string, type: 'deposit' | 'withdrawal', amount: number, description?: string) => boolean;
  deleteReserve: (id: string) => void;

  addCategory: (category: Omit<Category, 'id' | 'user_id' | 'created_at'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Trash & restore
  restoreItem: (type: 'income' | 'expense' | 'debt' | 'goal', id: string) => void;
  permanentDeleteItem: (type: 'income' | 'expense' | 'debt' | 'goal', id: string) => void;
  refreshData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateProfile } = useAuth();
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [debtInstallments, setDebtInstallments] = useState<DebtInstallment[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [reserves, setReserves] = useState<Reserve[]>([]);
  const [reserveMovements, setReserveMovements] = useState<ReserveMovement[]>([]);

  const refreshData = () => {
    if (!user) return;
    setIncomes(LocalStorageManager.getIncomes(user.id));
    setExpenses(LocalStorageManager.getExpenses(user.id, user.email));
    setDebts(LocalStorageManager.getDebts(user.id, user.email));
    setDebtInstallments(LocalStorageManager.getDebtInstallments(user.id));
    setCreditCards(LocalStorageManager.getCreditCards(user.id));
    setCategories(LocalStorageManager.getCategories(user.id));
    setGoals(LocalStorageManager.getGoals(user.id));
    setReserves(LocalStorageManager.getReserves(user.id));
    setReserveMovements(LocalStorageManager.getReserveMovements(user.id));
  };

  useEffect(() => {
    refreshData();
  }, [user?.id, user?.email]);

  // Saldo e métricas
  const balanceMode = user?.balance_mode || 'auto';
  const autoBalance = useMemo(() => {
    return calculateAvailableBalance(incomes, expenses, debtInstallments);
  }, [incomes, expenses, debtInstallments]);

  const totalReserved = useMemo(() => reserves.reduce((sum, reserve) => sum + Number(reserve.current_amount || 0), 0), [reserves]);
  // Dinheiro reservado deixa de compor o saldo livre, mas não é lançado como despesa.
  const availableBalance = (balanceMode === 'manual' ? (user?.manual_balance || 0) : autoBalance) - totalReserved;

  const metrics = useMemo(() => {
    return calculateMonthlyMetrics(
      incomes,
      expenses,
      debts,
      debtInstallments,
      selectedYear,
      selectedMonth + 1
    );
  }, [incomes, expenses, debts, debtInstallments, selectedYear, selectedMonth]);

  // Notificações automáticas baseadas em regras
  const notifications = useMemo(() => {
    const list: NotificationItem[] = [];
    const today = new Date().toISOString().split('T')[0];

    // 1. Despesas atrasadas ou próximas do vencimento
    expenses.forEach(e => {
      if (e.status === 'pendente') {
        if (e.due_date < today) {
          list.push({
            id: `exp-late-${e.id}`,
            title: 'Despesa Atrasada',
            message: `A despesa "${e.description}" venceu em ${e.due_date} e ainda não foi paga.`,
            type: 'danger',
            date: e.due_date,
            read: false,
          });
        } else if (e.due_date === today) {
          list.push({
            id: `exp-today-${e.id}`,
            title: 'Vence Hoje',
            message: `A despesa "${e.description}" vence hoje!`,
            type: 'warning',
            date: e.due_date,
            read: false,
          });
        }
      }
    });

    // 2. Orçamento estourando (50%, 75%, 90%, 100%)
    categories.forEach(cat => {
      if (cat.monthly_budget && cat.monthly_budget > 0) {
        const spent = expenses
          .filter(e => e.category_id === cat.id && e.status !== 'cancelado')
          .reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const ratio = (spent / cat.monthly_budget) * 100;
        if (ratio >= 100) {
          list.push({
            id: `budget-100-${cat.id}`,
            title: 'Orçamento Excedido (100%)',
            message: `A categoria "${cat.name}" atingiu ${ratio.toFixed(0)}% do orçamento planejado!`,
            type: 'danger',
            date: today,
            read: false,
          });
        } else if (ratio >= 90) {
          list.push({
            id: `budget-90-${cat.id}`,
            title: 'Atenção ao Orçamento (90%)',
            message: `A categoria "${cat.name}" já utilizou ${ratio.toFixed(0)}% do limite definido.`,
            type: 'warning',
            date: today,
            read: false,
          });
        }
      }
    });

    return list;
  }, [expenses, categories]);

  // Receitas
  const addIncome = (data: Omit<Income, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    const newIncome: Income = {
      ...data,
      id: generateUUID(),
      user_id: user.id,
      created_at: new Date().toISOString(),
    };
    LocalStorageManager.saveIncomes([newIncome]);
    refreshData();
  };

  const updateIncome = (id: string, updates: Partial<Income>) => {
    const updated = incomes.map(i => i.id === id ? { ...i, ...updates } : i);
    LocalStorageManager.saveIncomes(updated);
    refreshData();
  };

  const deleteIncome = (id: string) => {
    const updated = incomes.map(i => i.id === id ? { ...i, deleted_at: new Date().toISOString() } : i);
    LocalStorageManager.saveIncomes(updated);
    refreshData();
  };

  // Despesas com suporte inteligente a parcelamento
  const addExpense = (data: Omit<Expense, 'id' | 'user_id' | 'created_at'>, installmentsCount = 1) => {
    if (!user) return;
    const now = new Date().toISOString();
    const isInstallment = installmentsCount > 1;
    const groupId = isInstallment ? generateUUID() : undefined;
    const baseDueDate = new Date(data.due_date);

    const newExpenses: Expense[] = [];

    for (let i = 1; i <= installmentsCount; i++) {
      const dueDate = new Date(baseDueDate);
      dueDate.setMonth(baseDueDate.getMonth() + (i - 1));

      newExpenses.push({
        ...data,
        id: generateUUID(),
        user_id: user.id,
        installment_number: i,
        total_installments: installmentsCount,
        installment_group_id: groupId,
        amount: data.amount,
        due_date: dueDate.toISOString().split('T')[0],
        created_at: now,
      });
    }

    LocalStorageManager.saveExpenses(newExpenses);
    refreshData();
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    const updated = expenses.map(e => e.id === id ? { ...e, ...updates } : e);
    LocalStorageManager.saveExpenses(updated);
    refreshData();
  };

  const deleteExpense = (id: string) => {
    const updated = expenses.map(e => e.id === id ? { ...e, deleted_at: new Date().toISOString() } : e);
    LocalStorageManager.saveExpenses(updated);
    refreshData();
  };

  // Cartões de Crédito
  const addCreditCard = (data: Omit<CreditCard, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    const newCard: CreditCard = {
      ...data,
      id: generateUUID(),
      user_id: user.id,
      created_at: new Date().toISOString(),
    };
    LocalStorageManager.saveCreditCards([newCard]);
    refreshData();
  };

  const updateCreditCard = (id: string, updates: Partial<CreditCard>) => {
    const updated = creditCards.map(c => c.id === id ? { ...c, ...updates } : c);
    LocalStorageManager.saveCreditCards(updated);
    refreshData();
  };

  const deleteCreditCard = (id: string) => {
    const updated = creditCards.map(c => c.id === id ? { ...c, deleted_at: new Date().toISOString() } : c);
    LocalStorageManager.saveCreditCards(updated);
    refreshData();
  };

  // REGRA CONTÁBIL: Pagamento de fatura de cartão
  const payCreditCardInvoice = (cardId: string, amount: number, paymentDate: string) => {
    if (!user) return;
    const card = creditCards.find(c => c.id === cardId);
    const invoiceExpense: Expense = {
      id: generateUUID(),
      user_id: user.id,
      credit_card_id: cardId,
      description: `Pagamento de Fatura - Cartão ${card?.name || ''}`,
      amount,
      due_date: paymentDate,
      paid_date: paymentDate,
      payment_source: 'conta',
      status: 'pago',
      is_recurring: false,
      is_shared: false,
      installment_number: 1,
      total_installments: 1,
      is_invoice_payment: true, // Essencial para evitar duplicar despesas nas métricas do mês!
      created_at: new Date().toISOString()
    };
    LocalStorageManager.saveExpenses([invoiceExpense]);
    refreshData();
  };

  // Dívidas
  const addDebt = (data: Omit<Debt, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    const debtId = generateUUID();
    const newDebt: Debt = {
      ...data,
      id: debtId,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    // Gera as parcelas correspondentes automaticamente
    const installments: DebtInstallment[] = [];
    const baseDueDate = new Date(data.first_due_date);

    for (let i = 1; i <= data.total_installments; i++) {
      const d = new Date(baseDueDate);
      d.setMonth(baseDueDate.getMonth() + (i - 1));

      installments.push({
        id: generateUUID(),
        debt_id: debtId,
        user_id: user.id,
        installment_number: i,
        due_date: d.toISOString().split('T')[0],
        amount: data.installment_amount,
        paid_amount: 0,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    }

    LocalStorageManager.saveDebts([newDebt]);
    LocalStorageManager.saveDebtInstallments(installments);
    refreshData();
  };

  const payDebtInstallment = (installmentId: string, paidAmount: number, paidDate: string) => {
    const target = debtInstallments.find(di => di.id === installmentId);
    if (!target) return;

    // Atualiza parcela
    const updatedInstallments = debtInstallments.map(di => {
      if (di.id === installmentId) {
        return {
          ...di,
          paid_amount: paidAmount,
          paid_date: paidDate,
          status: 'paid' as const,
        };
      }
      return di;
    });

    // Atualiza saldo devedor da dívida mãe sem duplicar
    const debt = debts.find(d => d.id === target.debt_id);
    if (debt) {
      const newBalance = Math.max(0, debt.remaining_balance - paidAmount);
      const updatedDebts = debts.map(d => d.id === debt.id ? { ...d, remaining_balance: newBalance } : d);
      LocalStorageManager.saveDebts(updatedDebts);
    }

    LocalStorageManager.saveDebtInstallments(updatedInstallments);
    refreshData();
  };

  const deleteDebt = (id: string) => {
    const updated = debts.map(d => d.id === id ? { ...d, deleted_at: new Date().toISOString() } : d);
    LocalStorageManager.saveDebts(updated);
    refreshData();
  };

  // Metas
  const addGoal = (data: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    const newGoal: FinancialGoal = {
      ...data,
      id: generateUUID(),
      user_id: user.id,
      created_at: new Date().toISOString(),
    };
    LocalStorageManager.saveGoals([newGoal]);
    refreshData();
  };

  const updateGoal = (id: string, updates: Partial<FinancialGoal>) => {
    const updated = goals.map(g => g.id === id ? { ...g, ...updates } : g);
    LocalStorageManager.saveGoals(updated);
    refreshData();
  };

  const deleteGoal = (id: string) => {
    const updated = goals.map(g => g.id === id ? { ...g, deleted_at: new Date().toISOString() } : g);
    LocalStorageManager.saveGoals(updated);
    refreshData();
  };

  // Reservas: transferências internas, sem contabilizar como despesa.
  const addReserve = (data: Omit<Reserve, 'id' | 'user_id' | 'created_at' | 'current_amount'>) => {
    if (!user) return;
    const reserve: Reserve = { ...data, id: generateUUID(), user_id: user.id, current_amount: 0, created_at: new Date().toISOString() };
    LocalStorageManager.saveReserves([reserve]);
    refreshData();
  };

  const moveReserve = (reserveId: string, type: 'deposit' | 'withdrawal', amount: number, description = ''): boolean => {
    if (!user || !Number.isFinite(amount) || amount <= 0) return false;
    const reserve = reserves.find(item => item.id === reserveId);
    if (!reserve || (type === 'withdrawal' && amount > Number(reserve.current_amount))) return false;
    const delta = type === 'deposit' ? amount : -amount;
    const updatedReserves = reserves.map(item => item.id === reserveId ? { ...item, current_amount: Math.max(0, Number(item.current_amount) + delta) } : item);
    const movement: ReserveMovement = {
      id: generateUUID(), user_id: user.id, reserve_id: reserveId, type, amount,
      description: description.trim() || (type === 'deposit' ? 'Aporte à reserva' : 'Retirada da reserva'),
      movement_date: new Date().toISOString().slice(0, 10), created_at: new Date().toISOString(),
    };
    LocalStorageManager.saveReserves(updatedReserves);
    LocalStorageManager.saveReserveMovements([movement]);
    refreshData();
    return true;
  };

  const deleteReserve = (id: string) => {
    const reserve = reserves.find(item => item.id === id);
    if (!reserve || Number(reserve.current_amount) > 0) return;
    LocalStorageManager.deleteReserve(id);
    refreshData();
  };

  // Categorias
  const addCategory = (data: Omit<Category, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;
    const newCat: Category = {
      ...data,
      id: generateUUID(),
      user_id: user.id,
      created_at: new Date().toISOString(),
    };
    LocalStorageManager.saveCategories([newCat]);
    refreshData();
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    const updated = categories.map(c => c.id === id ? { ...c, ...updates } : c);
    LocalStorageManager.saveCategories(updated);
    refreshData();
  };

  const deleteCategory = (id: string) => {
    const updated = categories.map(c => c.id === id ? { ...c, deleted_at: new Date().toISOString() } : c);
    LocalStorageManager.saveCategories(updated);
    refreshData();
  };

  // Lixeira e Restauração
  const restoreItem = (type: 'income' | 'expense' | 'debt' | 'goal', id: string) => {
    if (type === 'income') {
      const all = LocalStorageManager.get<Income[]>('meufinanceiro_incomes', []);
      LocalStorageManager.set('meufinanceiro_incomes', all.map(i => i.id === id ? { ...i, deleted_at: null } : i));
    } else if (type === 'expense') {
      const all = LocalStorageManager.get<Expense[]>('meufinanceiro_expenses', []);
      LocalStorageManager.set('meufinanceiro_expenses', all.map(e => e.id === id ? { ...e, deleted_at: null } : e));
    } else if (type === 'debt') {
      const all = LocalStorageManager.get<Debt[]>('meufinanceiro_debts', []);
      LocalStorageManager.set('meufinanceiro_debts', all.map(d => d.id === id ? { ...d, deleted_at: null } : d));
    } else if (type === 'goal') {
      const all = LocalStorageManager.get<FinancialGoal[]>('meufinanceiro_goals', []);
      LocalStorageManager.set('meufinanceiro_goals', all.map(g => g.id === id ? { ...g, deleted_at: null } : g));
    }
    refreshData();
  };

  const permanentDeleteItem = (type: 'income' | 'expense' | 'debt' | 'goal', id: string) => {
    if (type === 'income') {
      const all = LocalStorageManager.get<Income[]>('meufinanceiro_incomes', []);
      LocalStorageManager.set('meufinanceiro_incomes', all.filter(i => i.id !== id));
    } else if (type === 'expense') {
      const all = LocalStorageManager.get<Expense[]>('meufinanceiro_expenses', []);
      LocalStorageManager.set('meufinanceiro_expenses', all.filter(e => e.id !== id));
    } else if (type === 'debt') {
      const all = LocalStorageManager.get<Debt[]>('meufinanceiro_debts', []);
      LocalStorageManager.set('meufinanceiro_debts', all.filter(d => d.id !== id));
    } else if (type === 'goal') {
      const all = LocalStorageManager.get<FinancialGoal[]>('meufinanceiro_goals', []);
      LocalStorageManager.set('meufinanceiro_goals', all.filter(g => g.id !== id));
    }
    refreshData();
  };

  return (
    <FinanceContext.Provider
      value={{
        incomes,
        expenses,
        debts,
        debtInstallments,
        creditCards,
        categories,
        goals,
        reserves,
        reserveMovements,
        totalReserved,
        notifications,
        selectedMonth,
        selectedYear,
        setSelectedMonth,
        setSelectedYear,
        metrics,
        balanceMode,
        availableBalance,
        addIncome,
        updateIncome,
        deleteIncome,
        addExpense,
        updateExpense,
        deleteExpense,
        addCreditCard,
        updateCreditCard,
        deleteCreditCard,
        payCreditCardInvoice,
        addDebt,
        payDebtInstallment,
        deleteDebt,
        addGoal,
        updateGoal,
        deleteGoal,
        addReserve,
        moveReserve,
        deleteReserve,
        addCategory,
        updateCategory,
        deleteCategory,
        restoreItem,
        permanentDeleteItem,
        refreshData
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};
