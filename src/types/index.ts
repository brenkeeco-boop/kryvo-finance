export type UUID = string;

export type BalanceMode = 'auto' | 'manual';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserProfile {
  id: UUID;
  email: string;
  full_name: string;
  avatar_url?: string;
  balance_mode: BalanceMode;
  manual_balance: number;
  theme: ThemeMode;
  notification_prefs: {
    days_before: number[];
    push_enabled: boolean;
  };
  created_at: string;
}

export interface Category {
  id: UUID;
  user_id: UUID;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  monthly_budget?: number | null;
  deleted_at?: string | null;
  created_at: string;
}

export interface CreditCard {
  id: UUID;
  user_id: UUID;
  name: string;
  brand: string;
  credit_limit: number;
  closing_day: number;
  due_day: number;
  color?: string;
  deleted_at?: string | null;
  created_at: string;
}

export type IncomeStatus = 'previsto' | 'recebido' | 'atrasado' | 'cancelado';
export type RecurrencePeriod = 'monthly' | 'weekly' | 'yearly';

export interface Income {
  id: UUID;
  user_id: UUID;
  category_id?: UUID | null;
  description: string;
  amount: number;
  expected_date: string; // YYYY-MM-DD
  received_date?: string | null;
  payer?: string;
  notes?: string;
  status: IncomeStatus;
  is_recurring: boolean;
  recurrence_period?: RecurrencePeriod;
  deleted_at?: string | null;
  created_at: string;
}

export type ExpenseStatus = 'pendente' | 'pago' | 'atrasado' | 'cancelado';
export type PaymentSource = 'conta' | 'dinheiro' | 'cartao_credito';
export type SharedPermission = 'view' | 'edit';

export interface Expense {
  id: UUID;
  user_id: UUID;
  category_id?: UUID | null;
  credit_card_id?: UUID | null;
  description: string;
  amount: number;
  due_date: string; // YYYY-MM-DD
  paid_date?: string | null;
  payment_source?: PaymentSource;
  responsible?: string;
  notes?: string;
  status: ExpenseStatus;
  is_recurring: boolean;
  is_shared: boolean;
  shared_with_email?: string | null;
  shared_permission?: SharedPermission;
  installment_number: number;
  total_installments: number;
  installment_group_id?: UUID | null;
  is_invoice_payment: boolean; // Previne duplicidade ao pagar fatura
  deleted_at?: string | null;
  created_at: string;
}

export type DebtType = 'loan' | 'credit_card' | 'financing' | 'personal' | 'overdue_bill' | 'other';
export type DebtInstallmentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface Debt {
  id: UUID;
  user_id: UUID;
  name: string;
  creditor: string;
  debt_type: DebtType;
  original_amount: number;
  remaining_balance: number;
  total_installments: number;
  installment_amount: number;
  start_date: string;
  first_due_date: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  interest_rate: number;
  penalty_rate: number;
  description?: string;
  notes?: string;
  is_shared: boolean;
  shared_with_email?: string | null;
  deleted_at?: string | null;
  created_at: string;
}

export interface DebtInstallment {
  id: UUID;
  debt_id: UUID;
  user_id: UUID;
  installment_number: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  paid_date?: string | null;
  status: DebtInstallmentStatus;
  deleted_at?: string | null;
  created_at: string;
}

export type GoalCategory = 'save_money' | 'pay_debt' | 'buy_item' | 'emergency_reserve' | 'expense_limit';

export interface FinancialGoal {
  id: UUID;
  user_id: UUID;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  category: GoalCategory;
  notes?: string;
  deleted_at?: string | null;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'danger';
  date: string;
  read: boolean;
  link?: string;
}

export interface ActivityLog {
  id: UUID;
  user_id: UUID;
  entity_type: string;
  entity_id: UUID;
  action: string;
  details?: any;
  created_at: string;
}


export interface Reserve {
  id: UUID;
  user_id: UUID;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string | null;
  color?: string;
  notes?: string;
  created_at: string;
}

export interface ReserveMovement {
  id: UUID;
  user_id: UUID;
  reserve_id: UUID;
  type: 'deposit' | 'withdrawal';
  amount: number;
  description?: string;
  movement_date: string;
  created_at: string;
}
