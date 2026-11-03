-- ====================================================================
-- MEU FINANCEIRO - SCHEMA COMPLETO DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- ====================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE PERFIS DE USUÁRIO
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    balance_mode TEXT NOT NULL DEFAULT 'auto' CHECK (balance_mode IN ('auto', 'manual')),
    manual_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'system')),
    notification_prefs JSONB NOT NULL DEFAULT '{"days_before": [7, 3, 0], "push_enabled": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para criar perfil automaticamente no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT,
    color TEXT,
    monthly_budget NUMERIC(15, 2) DEFAULT NULL, -- Limite orçamentário mensal
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABELA DE CARTÕES DE CRÉDITO
CREATE TABLE IF NOT EXISTS public.credit_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    brand TEXT NOT NULL, -- Visa, Mastercard, Elo, etc.
    credit_limit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    closing_day INT NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
    due_day INT NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    color TEXT DEFAULT '#4f46e5',
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABELA DE COMPARTILHAMENTO / CONVITES ENTRE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.shared_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABELA DE RECEITAS (INCOMES)
CREATE TABLE IF NOT EXISTS public.incomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    expected_date DATE NOT NULL,
    received_date DATE DEFAULT NULL,
    payer TEXT, -- Empresa / pessoa pagadora
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'previsto' CHECK (status IN ('previsto', 'recebido', 'atrasado', 'cancelado')),
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_period TEXT CHECK (recurrence_period IN ('monthly', 'weekly', 'yearly')),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABELA DE DESPESAS (EXPENSES)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    paid_date DATE DEFAULT NULL,
    payment_source TEXT, -- 'conta', 'dinheiro', 'cartao_credito'
    responsible TEXT, -- Nome da pessoa responsável
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    shared_with_email TEXT DEFAULT NULL,
    shared_permission TEXT DEFAULT 'view' CHECK (shared_permission IN ('view', 'edit')),
    installment_number INT DEFAULT 1,
    total_installments INT DEFAULT 1,
    installment_group_id UUID DEFAULT NULL, -- Agrupa parcelas da mesma compra
    is_invoice_payment BOOLEAN NOT NULL DEFAULT FALSE, -- Identifica pagamento de fatura para EVITAR DUPLICIDADE CONTÁBIL!
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABELA DE DÍVIDAS (DEBTS)
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    creditor TEXT NOT NULL,
    debt_type TEXT NOT NULL CHECK (debt_type IN ('loan', 'credit_card', 'financing', 'personal', 'overdue_bill', 'other')),
    original_amount NUMERIC(15, 2) NOT NULL,
    remaining_balance NUMERIC(15, 2) NOT NULL,
    total_installments INT NOT NULL DEFAULT 1,
    installment_amount NUMERIC(15, 2) NOT NULL,
    start_date DATE NOT NULL,
    first_due_date DATE NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
    interest_rate NUMERIC(6, 3) DEFAULT 0.00,
    penalty_rate NUMERIC(6, 3) DEFAULT 0.00,
    description TEXT,
    notes TEXT,
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    shared_with_email TEXT DEFAULT NULL,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABELA DE PARCELAS DE DÍVIDAS (DEBT INSTALLMENTS)
CREATE TABLE IF NOT EXISTS public.debt_installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    installment_number INT NOT NULL,
    due_date DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    paid_amount NUMERIC(15, 2) DEFAULT 0.00,
    paid_date DATE DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABELA DE METAS FINANCEIRAS (GOALS)
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    target_date DATE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('save_money', 'pay_debt', 'buy_item', 'emergency_reserve', 'expense_limit')),
    notes TEXT,
    deleted_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABELA DE AUDITORIA E HISTÓRICO DE COMPARTILHAMENTO
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL, -- 'expense', 'income', 'debt', 'goal', 'card'
    entity_id UUID NOT NULL,
    action TEXT NOT NULL, -- 'create', 'update', 'delete', 'pay', 'restore'
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ÍNDICES PARA ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_incomes_user_date ON public.incomes(user_id, expected_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, due_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_debts_user ON public.debts(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_debt_inst_debt ON public.debt_installments(debt_id, due_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shared_expenses ON public.expenses(shared_with_email) WHERE is_shared = TRUE AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_shared_debts ON public.debts(shared_with_email) WHERE is_shared = TRUE AND deleted_at IS NULL;

-- 12. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Apenas o próprio usuário pode ler e editar seu perfil
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories: Apenas o dono
CREATE POLICY "Users own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);

-- Credit Cards: Apenas o dono
CREATE POLICY "Users own credit cards" ON public.credit_cards FOR ALL USING (auth.uid() = user_id);

-- Incomes: Apenas o dono
CREATE POLICY "Users own incomes" ON public.incomes FOR ALL USING (auth.uid() = user_id);

-- Expenses: Dono ou usuário com quem foi compartilhado por email
CREATE POLICY "Users select expenses" ON public.expenses FOR SELECT USING (
    auth.uid() = user_id OR (is_shared = TRUE AND shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);
CREATE POLICY "Users insert own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own or shared editable expenses" ON public.expenses FOR UPDATE USING (
    auth.uid() = user_id OR (is_shared = TRUE AND shared_permission = 'edit' AND shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);
CREATE POLICY "Users delete own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- Debts: Dono ou compartilhado
CREATE POLICY "Users select debts" ON public.debts FOR SELECT USING (
    auth.uid() = user_id OR (is_shared = TRUE AND shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);
CREATE POLICY "Users insert own debts" ON public.debts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own debts" ON public.debts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own debts" ON public.debts FOR DELETE USING (auth.uid() = user_id);

-- Debt Installments: Dono da dívida
CREATE POLICY "Users handle debt installments" ON public.debt_installments FOR ALL USING (auth.uid() = user_id);

-- Financial Goals: Apenas dono
CREATE POLICY "Users own goals" ON public.financial_goals FOR ALL USING (auth.uid() = user_id);

-- Shared Links
CREATE POLICY "Users own shared links" ON public.shared_links FOR ALL USING (
    auth.uid() = owner_id OR target_user_id = auth.uid() OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Activity Logs
CREATE POLICY "Users own activity logs" ON public.activity_logs FOR ALL USING (auth.uid() = user_id);

-- ====================================================================
-- FUNÇÃO DE LIMPEZA DA LIXEIRA APÓS 90 DIAS (AUTOMÁTICA)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.cleanup_trash_after_90_days()
RETURNS void AS $$
BEGIN
    DELETE FROM public.incomes WHERE deleted_at < NOW() - INTERVAL '90 days';
    DELETE FROM public.expenses WHERE deleted_at < NOW() - INTERVAL '90 days';
    DELETE FROM public.debts WHERE deleted_at < NOW() - INTERVAL '90 days';
    DELETE FROM public.financial_goals WHERE deleted_at < NOW() - INTERVAL '90 days';
    DELETE FROM public.credit_cards WHERE deleted_at < NOW() - INTERVAL '90 days';
    DELETE FROM public.categories WHERE deleted_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. RESERVAS FINANCEIRAS (APORTES E RETIRADAS NÃO SÃO DESPESAS)
CREATE TABLE IF NOT EXISTS public.reserves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
    target_date DATE DEFAULT NULL,
    color TEXT DEFAULT '#42b883',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reserve_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reserve_id UUID NOT NULL REFERENCES public.reserves(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reserves_user ON public.reserves(user_id);
CREATE INDEX IF NOT EXISTS idx_reserve_movements_reserve_date ON public.reserve_movements(reserve_id, movement_date DESC);
ALTER TABLE public.reserves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserve_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own reserves" ON public.reserves;
CREATE POLICY "Users own reserves" ON public.reserves FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users own reserve movements" ON public.reserve_movements;
CREATE POLICY "Users own reserve movements" ON public.reserve_movements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
