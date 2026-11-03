import React, { useState } from 'react';
import { Settings, Moon, Sun, DollarSign, Database, Download, Upload, ShieldCheck, Tag, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { LocalStorageManager } from '../utils/storageManager';
import { formatCurrency } from '../utils/formatters';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { categories, addCategory, updateCategory, deleteCategory, refreshData } = useFinance();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [balanceMode, setBalanceMode] = useState(user?.balance_mode || 'auto');
  const [manualBalance, setManualBalance] = useState(user?.manual_balance?.toString() || '0');
  const [theme, setTheme] = useState(user?.theme || 'dark');

  // Nova Categoria State
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [newCatBudget, setNewCatBudget] = useState('');

  const handleSaveProfile = async () => {
    await updateProfile({
      full_name: fullName,
      balance_mode: balanceMode,
      manual_balance: parseFloat(manualBalance) || 0,
      theme,
    });
    alert('Configurações e preferências salvas com sucesso!');
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName,
      type: newCatType,
      monthly_budget: newCatBudget ? parseFloat(newCatBudget) : null,
      icon: 'Tag',
      color: '#6366f1'
    });
    setNewCatName('');
    setNewCatBudget('');
  };

  // Exportar Backup
  const handleDownloadBackup = () => {
    if (!user) return;
    const backup = LocalStorageManager.createBackup(user.id);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-meufinanceiro-${user.email}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Importar Backup
  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        LocalStorageManager.restoreBackup(parsed, user.id);
        refreshData();
        alert('Backup restaurado com sucesso!');
      } catch (err) {
        alert('Erro ao restaurar arquivo de backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Personalização e Configurações</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Personalize temas, modos de saldo, categorias e realize backups seguros
        </p>
      </div>

      {/* Perfil & Modo de Saldo */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base flex items-center gap-2">
          <Settings className="w-4 h-4 text-indigo-500" /> Preferências Gerais
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-600 dark:text-slate-300">Nome Completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-600 dark:text-slate-300">Tema da Interface</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              <option value="dark">Tema Escuro (Dark Premium)</option>
              <option value="light">Tema Claro (Clean Light)</option>
            </select>
          </div>
        </div>

        {/* Modo de Saldo Obrigatório da Especificação */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
            Modo de Cálculo do Saldo Disponível
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <div
              onClick={() => setBalanceMode('auto')}
              className={`p-3.5 rounded-xl cursor-pointer border text-xs transition-all ${
                balanceMode === 'auto'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <p className="font-bold text-slate-800 dark:text-slate-200">Modo Automático (Recomendado)</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Calcula em tempo real: (Receitas recebidas) - (Despesas pagas) - (Pagamentos de dívidas). Sem duplicar despesas.
              </p>
            </div>

            <div
              onClick={() => setBalanceMode('manual')}
              className={`p-3.5 rounded-xl cursor-pointer border text-xs transition-all ${
                balanceMode === 'manual'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <p className="font-bold text-slate-800 dark:text-slate-200">Modo Manual</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Você digita diretamente quanto dinheiro possui disponível neste momento.
              </p>
            </div>
          </div>

          {balanceMode === 'manual' && (
            <div className="mt-3">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Informe o Saldo Disponível Atual (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={manualBalance}
                onChange={(e) => setManualBalance(e.target.value)}
                className="mt-1 w-full max-w-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>
          )}
        </div>

        <button
          onClick={handleSaveProfile}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
        >
          Salvar Alterações
        </button>
      </div>

      {/* Gerenciamento de Categorias & Limites */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base flex items-center gap-2">
          <Tag className="w-4 h-4 text-indigo-500" /> Categorias e Limites Orçamentários
        </h3>

        {/* Adicionar Categoria */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <input
            type="text"
            placeholder="Nome da Categoria"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 sm:col-span-2"
          />
          <select
            value={newCatType}
            onChange={(e) => setNewCatType(e.target.value as any)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
          <input
            type="number"
            placeholder="Limite Orçamentário (R$)"
            value={newCatBudget}
            onChange={(e) => setNewCatBudget(e.target.value)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
          />
        </div>
        <button
          onClick={handleAddCategory}
          className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-medium"
        >
          Adicionar Categoria
        </button>

        {/* Lista de Categorias Atuais */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
          {categories.map(cat => (
            <div key={cat.id} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                <span className="text-[10px] text-slate-400 ml-2">({cat.type === 'income' ? 'Receita' : 'Despesa'})</span>
                {cat.monthly_budget && (
                  <p className="text-[10px] text-indigo-500 font-medium">Orçamento: {formatCurrency(cat.monthly_budget)}</p>
                )}
              </div>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="text-slate-400 hover:text-rose-500 p-1"
                title="Excluir Categoria"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Backup e Recuperação */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-500" /> Sistema Real de Backup e Restauração
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Gere um snapshot integral de seus dados ou importe de um arquivo para garantir soberania e segurança total dos seus registros.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownloadBackup}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" /> Baixar Backup Completo (.JSON)
          </button>

          <label className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs flex items-center gap-2 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" /> Restaurar Backup
            <input type="file" accept=".json" onChange={handleUploadBackup} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
