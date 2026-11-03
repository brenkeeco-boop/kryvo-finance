import {
  UserProfile, Category, CreditCard, Income, Expense, Debt,
  DebtInstallment, FinancialGoal, ActivityLog, Reserve, ReserveMovement
} from '../types';
import { generateUUID } from '../utils/formatters';

const STORAGE_KEYS = {
  CURRENT_USER: 'meufinanceiro_current_user',
  USERS: 'meufinanceiro_users',
  CATEGORIES: 'meufinanceiro_categories',
  CARDS: 'meufinanceiro_cards',
  INCOMES: 'meufinanceiro_incomes',
  EXPENSES: 'meufinanceiro_expenses',
  DEBTS: 'meufinanceiro_debts',
  DEBT_INSTALLMENTS: 'meufinanceiro_debt_installments',
  GOALS: 'meufinanceiro_goals',
  RESERVES: 'kryvo_reserves',
  RESERVE_MOVEMENTS: 'kryvo_reserve_movements',
  LOGS: 'meufinanceiro_logs',
};

// Default seed categories
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Moradia', icon: 'Home', color: '#3b82f6' },
  { name: 'Alimentação e mercado', icon: 'ShoppingCart', color: '#10b981' },
  { name: 'Combustível e transporte', icon: 'Car', color: '#f59e0b' },
  { name: 'Lazer e passeios', icon: 'Film', color: '#ec4899' },
  { name: 'Compras pessoais', icon: 'ShoppingBag', color: '#8b5cf6' },
  { name: 'Assinaturas', icon: 'CreditCard', color: '#06b6d4' },
  { name: 'Saúde e farmácia', icon: 'Activity', color: '#ef4444' },
  { name: 'Água, luz e internet', icon: 'Zap', color: '#6366f1' },
  { name: 'Despesas com veículos', icon: 'Wrench', color: '#14b8a6' },
  { name: 'Outros', icon: 'Tag', color: '#64748b' },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salário', icon: 'Briefcase', color: '#10b981' },
  { name: 'Serviços particulares', icon: 'Code', color: '#3b82f6' },
  { name: 'Devolução de empréstimos', icon: 'RotateCcw', color: '#f59e0b' },
  { name: 'Outros recebimentos', icon: 'DollarSign', color: '#8b5cf6' },
];

export class LocalStorageManager {
  static get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  // --- Initializer for a user ---
  static initializeUser(user: UserProfile) {
    const existingCategories = this.getCategories(user.id);
    if (existingCategories.length === 0) {
      const newCats: Category[] = [
        ...DEFAULT_INCOME_CATEGORIES.map(c => ({
          id: generateUUID(),
          user_id: user.id,
          name: c.name,
          type: 'income' as const,
          icon: c.icon,
          color: c.color,
          monthly_budget: null,
          created_at: new Date().toISOString(),
        })),
        ...DEFAULT_EXPENSE_CATEGORIES.map(c => ({
          id: generateUUID(),
          user_id: user.id,
          name: c.name,
          type: 'expense' as const,
          icon: c.icon,
          color: c.color,
          monthly_budget: null,
          created_at: new Date().toISOString(),
        }))
      ];
      this.saveCategories(newCats);
    }
  }

  // Categories
  static getCategories(userId: string): Category[] {
    const all = this.get<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    return all.filter(c => c.user_id === userId && !c.deleted_at);
  }

  static saveCategories(categories: Category[]) {
    const all = this.get<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    const others = all.filter(c => !categories.find(n => n.id === c.id));
    this.set(STORAGE_KEYS.CATEGORIES, [...others, ...categories]);
  }

  // Incomes
  static getIncomes(userId: string): Income[] {
    const all = this.get<Income[]>(STORAGE_KEYS.INCOMES, []);
    return all.filter(i => i.user_id === userId && !i.deleted_at);
  }

  static saveIncomes(incomes: Income[]) {
    const all = this.get<Income[]>(STORAGE_KEYS.INCOMES, []);
    const others = all.filter(i => !incomes.find(n => n.id === i.id));
    this.set(STORAGE_KEYS.INCOMES, [...others, ...incomes]);
  }

  // Expenses (includes shared expenses shared with this user's email)
  static getExpenses(userId: string, userEmail?: string): Expense[] {
    const all = this.get<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    return all.filter(e => {
      if (e.deleted_at) return false;
      if (e.user_id === userId) return true;
      if (e.is_shared && userEmail && e.shared_with_email?.toLowerCase() === userEmail.toLowerCase()) return true;
      return false;
    });
  }

  static saveExpenses(expenses: Expense[]) {
    const all = this.get<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    const others = all.filter(e => !expenses.find(n => n.id === e.id));
    this.set(STORAGE_KEYS.EXPENSES, [...others, ...expenses]);
  }

  // Credit Cards
  static getCreditCards(userId: string): CreditCard[] {
    const all = this.get<CreditCard[]>(STORAGE_KEYS.CARDS, []);
    return all.filter(c => c.user_id === userId && !c.deleted_at);
  }

  static saveCreditCards(cards: CreditCard[]) {
    const all = this.get<CreditCard[]>(STORAGE_KEYS.CARDS, []);
    const others = all.filter(c => !cards.find(n => n.id === c.id));
    this.set(STORAGE_KEYS.CARDS, [...others, ...cards]);
  }

  // Debts
  static getDebts(userId: string, userEmail?: string): Debt[] {
    const all = this.get<Debt[]>(STORAGE_KEYS.DEBTS, []);
    return all.filter(d => {
      if (d.deleted_at) return false;
      if (d.user_id === userId) return true;
      if (d.is_shared && userEmail && d.shared_with_email?.toLowerCase() === userEmail.toLowerCase()) return true;
      return false;
    });
  }

  static saveDebts(debts: Debt[]) {
    const all = this.get<Debt[]>(STORAGE_KEYS.DEBTS, []);
    const others = all.filter(d => !debts.find(n => n.id === d.id));
    this.set(STORAGE_KEYS.DEBTS, [...others, ...debts]);
  }

  // Debt Installments
  static getDebtInstallments(userId: string): DebtInstallment[] {
    const all = this.get<DebtInstallment[]>(STORAGE_KEYS.DEBT_INSTALLMENTS, []);
    return all.filter(di => di.user_id === userId && !di.deleted_at);
  }

  static saveDebtInstallments(installments: DebtInstallment[]) {
    const all = this.get<DebtInstallment[]>(STORAGE_KEYS.DEBT_INSTALLMENTS, []);
    const others = all.filter(di => !installments.find(n => n.id === di.id));
    this.set(STORAGE_KEYS.DEBT_INSTALLMENTS, [...others, ...installments]);
  }

  // Goals
  static getGoals(userId: string): FinancialGoal[] {
    const all = this.get<FinancialGoal[]>(STORAGE_KEYS.GOALS, []);
    return all.filter(g => g.user_id === userId && !g.deleted_at);
  }

  static saveGoals(goals: FinancialGoal[]) {
    const all = this.get<FinancialGoal[]>(STORAGE_KEYS.GOALS, []);
    const others = all.filter(g => !goals.find(n => n.id === g.id));
    this.set(STORAGE_KEYS.GOALS, [...others, ...goals]);
  }

  // Reservas financeiras e histórico de aportes/retiradas
  static getReserves(userId: string): Reserve[] {
    return this.get<Reserve[]>(STORAGE_KEYS.RESERVES, []).filter(r => r.user_id === userId);
  }

  static saveReserves(reserves: Reserve[]) {
    const all = this.get<Reserve[]>(STORAGE_KEYS.RESERVES, []);
    const others = all.filter(r => !reserves.find(n => n.id === r.id));
    this.set(STORAGE_KEYS.RESERVES, [...others, ...reserves]);
  }

  static getReserveMovements(userId: string): ReserveMovement[] {
    return this.get<ReserveMovement[]>(STORAGE_KEYS.RESERVE_MOVEMENTS, []).filter(m => m.user_id === userId);
  }

  static saveReserveMovements(movements: ReserveMovement[]) {
    const all = this.get<ReserveMovement[]>(STORAGE_KEYS.RESERVE_MOVEMENTS, []);
    const others = all.filter(m => !movements.find(n => n.id === m.id));
    this.set(STORAGE_KEYS.RESERVE_MOVEMENTS, [...others, ...movements]);
  }

  static deleteReserve(reserveId: string) {
    const reserves = this.get<Reserve[]>(STORAGE_KEYS.RESERVES, []).filter(r => r.id !== reserveId);
    const movements = this.get<ReserveMovement[]>(STORAGE_KEYS.RESERVE_MOVEMENTS, []).filter(m => m.reserve_id !== reserveId);
    this.set(STORAGE_KEYS.RESERVES, reserves);
    this.set(STORAGE_KEYS.RESERVE_MOVEMENTS, movements);
  }

  // Trash: Returns all deleted items within 90 days for current user
  static getTrashItems(userId: string) {
    const now = new Date().getTime();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

    const incomes = this.get<Income[]>(STORAGE_KEYS.INCOMES, []).filter(
      i => i.user_id === userId && i.deleted_at && (now - new Date(i.deleted_at).getTime()) <= ninetyDaysMs
    );
    const expenses = this.get<Expense[]>(STORAGE_KEYS.EXPENSES, []).filter(
      e => e.user_id === userId && e.deleted_at && (now - new Date(e.deleted_at).getTime()) <= ninetyDaysMs
    );
    const debts = this.get<Debt[]>(STORAGE_KEYS.DEBTS, []).filter(
      d => d.user_id === userId && d.deleted_at && (now - new Date(d.deleted_at).getTime()) <= ninetyDaysMs
    );
    const goals = this.get<FinancialGoal[]>(STORAGE_KEYS.GOALS, []).filter(
      g => g.user_id === userId && g.deleted_at && (now - new Date(g.deleted_at).getTime()) <= ninetyDaysMs
    );

    return { incomes, expenses, debts, goals };
  }

  // Backup & Restore
  static createBackup(userId: string) {
    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      userId,
      data: {
        categories: this.getCategories(userId),
        cards: this.getCreditCards(userId),
        incomes: this.getIncomes(userId),
        expenses: this.getExpenses(userId),
        debts: this.getDebts(userId),
        debtInstallments: this.getDebtInstallments(userId),
        goals: this.getGoals(userId),
        reserves: this.getReserves(userId),
        reserveMovements: this.getReserveMovements(userId),
      }
    };
  }

  static restoreBackup(backupData: any, userId: string) {
    if (!backupData || !backupData.data) throw new Error('Arquivo de backup inválido');
    const { categories, cards, incomes, expenses, debts, debtInstallments, goals, reserves, reserveMovements } = backupData.data;

    if (categories) this.saveCategories(categories.map((c: any) => ({ ...c, user_id: userId })));
    if (cards) this.saveCreditCards(cards.map((c: any) => ({ ...c, user_id: userId })));
    if (incomes) this.saveIncomes(incomes.map((i: any) => ({ ...i, user_id: userId })));
    if (expenses) this.saveExpenses(expenses.map((e: any) => ({ ...e, user_id: userId })));
    if (debts) this.saveDebts(debts.map((d: any) => ({ ...d, user_id: userId })));
    if (debtInstallments) this.saveDebtInstallments(debtInstallments.map((di: any) => ({ ...di, user_id: userId })));
    if (goals) this.saveGoals(goals.map((g: any) => ({ ...g, user_id: userId })));
    if (reserves) this.saveReserves(reserves.map((r: any) => ({ ...r, user_id: userId })));
    if (reserveMovements) this.saveReserveMovements(reserveMovements.map((m: any) => ({ ...m, user_id: userId })));
  }
}
