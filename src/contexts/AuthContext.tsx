import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LocalStorageManager } from '../utils/storageManager';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  switchProfile: (profileIndex: number) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  loginWithEmail: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dois perfis independentes pré-configurados para a experiência inicial conforme especificação
const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'user-profile-1-default',
    email: 'kelven@financeiro.app',
    full_name: 'Kelven (Perfil Principal)',
    balance_mode: 'auto',
    manual_balance: 0,
    theme: 'dark',
    notification_prefs: { days_before: [7, 3, 0], push_enabled: true },
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-profile-2-default',
    email: 'parceiro@financeiro.app',
    full_name: 'Convidado / Parceiro',
    balance_mode: 'auto',
    manual_balance: 0,
    theme: 'dark',
    notification_prefs: { days_before: [7, 3, 0], push_enabled: true },
    created_at: new Date().toISOString(),
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Inicialização
    const savedUser = LocalStorageManager.get<UserProfile | null>('meufinanceiro_current_user', null);
    if (savedUser) {
      setUser(savedUser);
      LocalStorageManager.initializeUser(savedUser);
    } else {
      const defaultUser = INITIAL_PROFILES[0];
      setUser(defaultUser);
      LocalStorageManager.set('meufinanceiro_current_user', defaultUser);
      LocalStorageManager.initializeUser(defaultUser);
    }
    setLoading(false);
  }, []);

  // Aplica tema escuro/claro no html
  useEffect(() => {
    if (user?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [user?.theme]);

  const switchProfile = (profileIndex: number) => {
    const selected = INITIAL_PROFILES[profileIndex] || INITIAL_PROFILES[0];
    setUser(selected);
    LocalStorageManager.set('meufinanceiro_current_user', selected);
    LocalStorageManager.initializeUser(selected);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    LocalStorageManager.set('meufinanceiro_current_user', updated);
  };

  const loginWithEmail = async (email: string) => {
    const found = INITIAL_PROFILES.find(p => p.email.toLowerCase() === email.toLowerCase());
    const newUser: UserProfile = found || {
      id: `user-${Date.now()}`,
      email,
      full_name: email.split('@')[0],
      balance_mode: 'auto',
      manual_balance: 0,
      theme: 'dark',
      notification_prefs: { days_before: [7, 3, 0], push_enabled: true },
      created_at: new Date().toISOString()
    };
    setUser(newUser);
    LocalStorageManager.set('meufinanceiro_current_user', newUser);
    LocalStorageManager.initializeUser(newUser);
  };

  const logout = () => {
    switchProfile(0);
  };

  return (
    <AuthContext.Provider value={{ user, loading, switchProfile, updateProfile, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
