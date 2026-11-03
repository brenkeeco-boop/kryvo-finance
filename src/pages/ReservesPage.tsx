import React, { useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Plus, PiggyBank, ShieldCheck, Trash2, X, Wallet, History } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';

export const ReservesPage: React.FC = () => {
  const { reserves, reserveMovements, availableBalance, addReserve, moveReserve, deleteReserve } = useFinance();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [activeReserve, setActiveReserve] = useState<string | null>(null);
  const [movementType, setMovementType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const totalSaved = reserves.reduce((sum, reserve) => sum + Number(reserve.current_amount || 0), 0);
  const totalTarget = reserves.reduce((sum, reserve) => sum + Number(reserve.target_amount || 0), 0);
  const movementsByReserve = useMemo(() => reserveMovements.slice().sort((a, b) => b.created_at.localeCompare(a.created_at)), [reserveMovements]);

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    const targetValue = Number(target.replace(',', '.'));
    if (!name.trim() || !Number.isFinite(targetValue) || targetValue <= 0) return;
    addReserve({ name: name.trim(), target_amount: targetValue, target_date: targetDate || null, color: '#42b883' });
    setName(''); setTarget(''); setTargetDate(''); setShowCreate(false);
  };

  const openMovement = (id: string, type: 'deposit' | 'withdrawal') => {
    setActiveReserve(id); setMovementType(type); setAmount(''); setDescription(''); setError('');
  };

  const handleMovement = (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(amount.replace(',', '.'));
    if (!activeReserve || !Number.isFinite(value) || value <= 0) { setError('Informe um valor válido.'); return; }
    const ok = moveReserve(activeReserve, movementType, value, description);
    if (!ok) { setError('Saldo da reserva insuficiente para essa retirada.'); return; }
    setActiveReserve(null);
  };

  return (
    <div className="kryvo-page space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Reservas</h1>
          <p className="text-sm text-slate-400 mt-1">Seu dinheiro separado por objetivo.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="kryvo-action-primary inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium">
          <Plus size={16}/> Nova reserva
        </button>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="kryvo-glass-card p-5 sm:col-span-1">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-medium"><PiggyBank size={15}/> TOTAL GUARDADO</div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{formatCurrency(totalSaved)}</p>
          <p className="mt-2 text-xs text-slate-400">Em {reserves.length} {reserves.length === 1 ? 'reserva' : 'reservas'}</p>
        </div>
        <div className="kryvo-glass-card p-5">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium"><Wallet size={15}/> SALDO LIVRE</div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{formatCurrency(availableBalance)}</p>
          <p className="mt-2 text-xs text-slate-500">Já descontadas as reservas.</p>
        </div>
        <div className="kryvo-glass-card p-5">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium"><ShieldCheck size={15}/> OBJETIVOS</div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{totalTarget > 0 ? `${Math.round((totalSaved / totalTarget) * 100)}%` : '—'}</p>
          <p className="mt-2 text-xs text-slate-500">Progresso somado das metas.</p>
        </div>
      </section>

      {reserves.length === 0 ? (
        <div className="kryvo-glass-card py-16 px-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300"><PiggyBank size={26}/></div>
          <h2 className="text-base font-semibold text-white">Comece sua primeira reserva</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">Crie um objetivo, como reserva de emergência, viagem ou compra planejada.</p>
          <button onClick={() => setShowCreate(true)} className="kryvo-action-primary mt-5 rounded-xl px-4 py-2.5 text-sm">Criar reserva</button>
        </div>
      ) : (
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {reserves.map(reserve => {
            const percent = Math.min(100, Math.round((Number(reserve.current_amount) / Math.max(1, Number(reserve.target_amount))) * 100));
            const history = movementsByReserve.filter(m => m.reserve_id === reserve.id).slice(0, 4);
            return <article key={reserve.id} className="kryvo-glass-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300"><PiggyBank size={19}/></div>
                  <div className="min-w-0"><h2 className="truncate font-semibold text-white">{reserve.name}</h2><p className="mt-0.5 text-xs text-slate-500">{reserve.target_date ? `Prazo ${formatDate(reserve.target_date)}` : 'Sem prazo definido'}</p></div>
                </div>
                <button onClick={() => { if (Number(reserve.current_amount) === 0 && window.confirm('Excluir esta reserva?')) deleteReserve(reserve.id); }} disabled={Number(reserve.current_amount) > 0} title={Number(reserve.current_amount) > 0 ? 'Retire o saldo antes de excluir' : 'Excluir reserva'} className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-25"><Trash2 size={16}/></button>
              </div>
              <div className="mt-6 flex items-end justify-between gap-3">
                <div><p className="text-2xl font-semibold tracking-tight text-white">{formatCurrency(reserve.current_amount)}</p><p className="mt-1 text-xs text-slate-500">de {formatCurrency(reserve.target_amount)}</p></div>
                <span className="text-sm font-semibold text-emerald-300">{percent}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-300 transition-all duration-500" style={{ width: `${percent}%` }}/></div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => openMovement(reserve.id, 'deposit')} className="kryvo-action-primary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs"><ArrowDownToLine size={14}/> Guardar dinheiro</button>
                <button onClick={() => openMovement(reserve.id, 'withdrawal')} disabled={Number(reserve.current_amount) <= 0} className="kryvo-action-secondary inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs disabled:opacity-35"><ArrowUpFromLine size={14}/> Retirar</button>
              </div>
              {history.length > 0 && <div className="mt-5 border-t border-white/[0.07] pt-4"><div className="mb-2 flex items-center gap-2 text-xs text-slate-500"><History size={13}/> Últimas movimentações</div><div className="space-y-2">{history.map(item => <div key={item.id} className="flex items-center justify-between gap-3 text-xs"><span className="truncate text-slate-400">{item.description || (item.type === 'deposit' ? 'Aporte' : 'Retirada')} · {formatDate(item.movement_date)}</span><span className={item.type === 'deposit' ? 'shrink-0 font-medium text-emerald-300' : 'shrink-0 font-medium text-slate-200'}>{item.type === 'deposit' ? '+' : '−'}{formatCurrency(item.amount)}</span></div>)}</div></div>}
            </article>;
          })}
        </section>
      )}

      {showCreate && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) setShowCreate(false); }}><form onSubmit={handleCreate} className="kryvo-dialog w-full max-w-md rounded-2xl p-6">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">Nova reserva</h2><button type="button" onClick={() => setShowCreate(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5"><X size={18}/></button></div>
        <label className="kryvo-field-label">Nome</label><input autoFocus required value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Reserva de emergência" className="kryvo-field mb-4 w-full"/>
        <label className="kryvo-field-label">Meta (R$)</label><input required type="number" min="0.01" step="0.01" value={target} onChange={e => setTarget(e.target.value)} placeholder="10000" className="kryvo-field mb-4 w-full"/>
        <label className="kryvo-field-label">Prazo (opcional)</label><input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="kryvo-field mb-6 w-full"/>
        <button type="submit" className="kryvo-action-primary w-full rounded-xl px-4 py-3 text-sm font-semibold">Criar reserva</button>
      </form></div>}

      {activeReserve && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) setActiveReserve(null); }}><form onSubmit={handleMovement} className="kryvo-dialog w-full max-w-md rounded-2xl p-6">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-semibold text-white">{movementType === 'deposit' ? 'Guardar dinheiro' : 'Retirar dinheiro'}</h2><button type="button" onClick={() => setActiveReserve(null)} className="rounded-lg p-2 text-slate-400 hover:bg-white/5"><X size={18}/></button></div>
        <label className="kryvo-field-label">Valor (R$)</label><input autoFocus required type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" className="kryvo-field mb-4 w-full"/>
        <label className="kryvo-field-label">Descrição (opcional)</label><input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex.: aporte mensal" className="kryvo-field mb-3 w-full"/>
        {error && <p className="mb-3 text-xs text-rose-300">{error}</p>}
        <p className="mb-5 text-xs text-slate-500">{movementType === 'deposit' ? 'O valor será retirado do saldo disponível e transferido para esta reserva. Não será registrado como despesa.' : 'O valor voltará para o saldo disponível.'}</p>
        <button type="submit" className="kryvo-action-primary w-full rounded-xl px-4 py-3 text-sm font-semibold">Confirmar {movementType === 'deposit' ? 'aporte' : 'retirada'}</button>
      </form></div>}
    </div>
  );
};
