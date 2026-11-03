import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ArrowDownCircle, ArrowUpCircle, AlertOctagon, CreditCard,
  Calendar, TrendingUp, Target, Bot, FileText, Bell, Trash2, Settings, Plus,
  Menu, X, Users, Wallet, PiggyBank, PanelLeftClose, PanelLeftOpen, MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { formatCurrency } from '../utils/formatters';

interface LayoutProps {
  children: React.ReactNode;
  onOpenQuickModal: (type: 'income' | 'expense' | 'debt' | 'card' | 'invoice') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onOpenQuickModal }) => {
  const { user, switchProfile } = useAuth();
  const { availableBalance, notifications } = useFinance();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Receitas', path: '/receitas', icon: ArrowDownCircle },
    { name: 'Despesas', path: '/despesas', icon: ArrowUpCircle },
    { name: 'Dívidas', path: '/dividas', icon: AlertOctagon },
    { name: 'Cartões', path: '/cartoes', icon: CreditCard },
    { name: 'Reservas', path: '/reservas', icon: PiggyBank },
    { name: 'Calendário', path: '/calendario', icon: Calendar },
    { name: 'Planejamento', path: '/planejamento', icon: TrendingUp },
    { name: 'Metas', path: '/metas', icon: Target },
    { name: 'Assistente', path: '/assistente', icon: Bot },
    { name: 'Relatórios', path: '/relatorios', icon: FileText },
    { name: 'Notificações', path: '/notificacoes', icon: Bell, badge: notifications.length },
    { name: 'Lixeira', path: '/lixeira', icon: Trash2 },
    { name: 'Configurações', path: '/configuracoes', icon: Settings },
  ];
  const mobilePrimary = navItems.slice(0, 3).concat(navItems[5]);
  const activeItem = navItems.find(item => item.path === location.pathname);

  const quickActions = [
    { label: 'Nova receita', type: 'income' as const, icon: ArrowDownCircle },
    { label: 'Nova despesa', type: 'expense' as const, icon: ArrowUpCircle },
    { label: 'Nova dívida', type: 'debt' as const, icon: AlertOctagon },
    { label: 'Novo cartão', type: 'card' as const, icon: CreditCard },
  ];

  return (
    <div className="kryvo-shell flex min-h-screen text-slate-100">
      <aside className={`kryvo-sidebar hidden lg:flex flex-col sticky top-0 h-screen z-30 ${sidebarExpanded ? 'is-expanded' : 'is-collapsed'}`}>
        <div className={`kryvo-brand flex items-center ${sidebarExpanded ? 'justify-between' : 'justify-center'}`}>
          <div className="flex min-w-0 items-center gap-3">
            <div className="kryvo-brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"><Wallet size={19}/></div>
            {sidebarExpanded && <div className="min-w-0"><h1>KRYVO</h1><p>FINANCE</p></div>}
          </div>
          {sidebarExpanded && <button onClick={() => setSidebarExpanded(false)} title="Recolher menu" className="kryvo-icon-button"><PanelLeftClose size={17}/></button>}
        </div>
        {!sidebarExpanded && <button onClick={() => setSidebarExpanded(true)} title="Expandir menu" className="kryvo-sidebar-expand"><PanelLeftOpen size={17}/></button>}

        <div className={`kryvo-profile ${sidebarExpanded ? '' : 'profile-collapsed'}`}>
          <div className="kryvo-avatar">{(user?.full_name || 'K').slice(0, 1).toUpperCase()}</div>
          {sidebarExpanded && <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-200">{user?.full_name}</p><p className="truncate text-xs text-slate-500">{user?.email}</p><p className="mt-2 text-xs text-emerald-300">{formatCurrency(availableBalance)} livres</p></div>}
          <button onClick={() => switchProfile(user?.email === 'kelven@financeiro.app' ? 1 : 0)} title="Alternar perfil" className="kryvo-icon-button"><Users size={16}/></button>
        </div>

        <div className={`relative px-2 ${sidebarExpanded ? '' : 'flex justify-center'}`}>
          <button onClick={() => setShowQuickMenu(!showQuickMenu)} title="Novo lançamento" className={`kryvo-new-button ${sidebarExpanded ? 'w-full' : ''}`}><Plus size={17}/>{sidebarExpanded && <span>Novo lançamento</span>}</button>
          {showQuickMenu && <div className={`kryvo-quick-menu ${sidebarExpanded ? '' : 'quick-menu-collapsed'}`}>{quickActions.map(action => { const Icon = action.icon; return <button key={action.type} onClick={() => { onOpenQuickModal(action.type); setShowQuickMenu(false); }}><Icon size={15}/>{action.label}</button>; })}</div>}
        </div>

        <nav className="kryvo-navigation mt-5 flex-1 space-y-1 overflow-y-auto px-2 pb-4">
          {navItems.map(item => { const Icon = item.icon; return <NavLink key={item.path} to={item.path} title={!sidebarExpanded ? item.name : undefined} aria-label={item.name} className={({ isActive }) => `kryvo-nav-link ${isActive ? 'active' : ''} ${sidebarExpanded ? 'expanded' : 'collapsed'}`}>
            <Icon size={18}/>{sidebarExpanded && <span>{item.name}</span>}{sidebarExpanded && item.badge ? <span className="kryvo-nav-badge">{item.badge}</span> : null}
          </NavLink>; })}
        </nav>
        {sidebarExpanded && <div className="px-4 pb-4 text-[10px] tracking-[.18em] text-slate-600">LUXURY FINANCE</div>}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="kryvo-mobile-header lg:hidden">
          <div className="flex items-center gap-3"><div className="kryvo-brand-mark flex h-9 w-9 items-center justify-center rounded-xl"><Wallet size={17}/></div><div><strong>KRYVO</strong><p>{activeItem?.name || 'Finance'}</p></div></div>
          <div className="flex items-center gap-2"><span className="hidden sm:block text-xs text-emerald-300">{formatCurrency(availableBalance)}</span><button onClick={() => onOpenQuickModal('expense')} className="kryvo-mobile-action" aria-label="Nova despesa"><Plus size={18}/></button></div>
        </header>

        <main className="kryvo-main min-w-0 flex-1 w-full mx-auto">{children}</main>

        <nav className="kryvo-mobile-nav lg:hidden" aria-label="Navegação principal">
          {mobilePrimary.map(item => { const Icon = item.icon; return <NavLink key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `kryvo-mobile-nav-item ${isActive ? 'active' : ''}`}><Icon size={19}/><span>{item.name}</span></NavLink>; })}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`kryvo-mobile-nav-item ${mobileMenuOpen ? 'active' : ''}`}><MoreHorizontal size={19}/><span>Mais</span></button>
        </nav>

        {mobileMenuOpen && <div className="kryvo-mobile-more lg:hidden"><div className="mb-2 flex items-center justify-between border-b border-white/10 px-3 pb-3"><div><p className="text-sm font-medium text-white">{user?.full_name}</p><p className="text-xs text-emerald-300">{formatCurrency(availableBalance)} livres</p></div><button onClick={() => switchProfile(user?.email === 'kelven@financeiro.app' ? 1 : 0)} className="kryvo-icon-button"><Users size={16}/></button></div>{navItems.filter(item => !mobilePrimary.some(primary => primary.path === item.path)).map(item => { const Icon = item.icon; return <NavLink key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `kryvo-mobile-more-link ${isActive ? 'active' : ''}`}><Icon size={17}/>{item.name}</NavLink>; })}</div>}
      </div>
    </div>
  );
};
