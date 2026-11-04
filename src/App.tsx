
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { Layout } from './components/Layout';
import { TransactionModals } from './components/TransactionModals';

// Páginas
import { Dashboard } from './pages/Dashboard';
import { IncomesPage } from './pages/IncomesPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { DebtsPage } from './pages/DebtsPage';
import { CardsPage } from './pages/CardsPage';
import { CalendarPage } from './pages/CalendarPage';
import { PlanningPage } from './pages/PlanningPage';
import { GoalsPage } from './pages/GoalsPage';
import { ReservesPage } from './pages/ReservesPage';
import { AssistantPage } from './pages/AssistantPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { TrashPage } from './pages/TrashPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const [modalType, setModalType] = useState<
    'income' | 'expense' | 'debt' | 'card' | 'goal' | null
  >(null);

  const handleOpenQuickModal = (
    type: 'income' | 'expense' | 'debt' | 'card' | 'invoice'
  ) => {
    if (type === 'invoice') {
      setModalType('expense');
    } else {
      setModalType(type);
    }
  };

  return (
    <AuthProvider>
      <FinanceProvider>
        <HashRouter>
          <Layout onOpenQuickModal={handleOpenQuickModal}>
            <Routes>
              <Route
                path="/"
                element={<Dashboard onOpenQuickModal={handleOpenQuickModal} />}
              />

              <Route
                path="/receitas"
                element={<IncomesPage onOpenModal={() => setModalType('income')} />}
              />

              <Route
                path="/despesas"
                element={<ExpensesPage onOpenModal={() => setModalType('expense')} />}
              />

              <Route
                path="/dividas"
                element={<DebtsPage onOpenModal={() => setModalType('debt')} />}
              />

              <Route
                path="/cartoes"
                element={
                  <CardsPage
                    onOpenCardModal={() => setModalType('card')}
                    onOpenExpenseModal={() => setModalType('expense')}
                  />
                }
              />

              <Route path="/calendario" element={<CalendarPage />} />
              <Route path="/planejamento" element={<PlanningPage />} />
              <Route path="/reservas" element={<ReservesPage />} />

              <Route
                path="/metas"
                element={<GoalsPage onOpenModal={() => setModalType('goal')} />}
              />

              <Route path="/assistente" element={<AssistantPage />} />
              <Route path="/relatorios" element={<ReportsPage />} />
              <Route path="/notificacoes" element={<NotificationsPage />} />
              <Route path="/lixeira" element={<TrashPage />} />
              <Route path="/configuracoes" element={<SettingsPage />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>

          {/* Modal Global de Ação Rápida */}
          <TransactionModals
            type={modalType}
            onClose={() => setModalType(null)}
          />
        </HashRouter>
      </FinanceProvider>
    </AuthProvider>
  );
};

export default App;
