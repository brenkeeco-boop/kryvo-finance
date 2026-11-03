import React, { useState } from 'react';
import { Bot, Send, Sparkles, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/formatters';

export const AssistantPage: React.FC = () => {
  const { user } = useAuth();
  const { availableBalance, metrics, debts, expenses, incomes, categories } = useFinance();

  const [inputQuestion, setInputQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; date: string }>>([
    {
      sender: 'ai',
      text: `Olá, ${user?.full_name || 'Usuário'}! Eu sou o seu Assistente Financeiro Inteligente. Analisei os seus registros atuais: você possui um saldo disponível de ${formatCurrency(availableBalance)}, com ${formatCurrency(metrics.totalToPay)} a pagar neste mês e ${formatCurrency(metrics.remainingDebts)} em saldo devedor restante. Como posso te orientar hoje?`,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const quickQuestions = [
    'Quanto posso gastar até o final do mês?',
    'Quais dívidas devo priorizar?',
    'Como fica meu planejamento se eu quitar R$ 500 hoje?',
    'Quais categorias tiveram maior gasto?'
  ];

  const handleAsk = (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: queryText,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    let reply = '';
    const q = queryText.toLowerCase();

    if (q.includes('quanto posso gastar') || q.includes('final do mês')) {
      const freeMargin = metrics.monthProjectedEndBalance;
      reply = freeMargin > 0
        ? `Considerando suas receitas previstas e todas as contas a pagar deste mês, você terá uma margem estimada de ${formatCurrency(freeMargin)} até o fechamento. Recomendo manter uma reserva mínima de segurança de pelo menos 20% desse valor.`
        : `Atenção: sua projeção de fechamento está negativa em ${formatCurrency(Math.abs(freeMargin))}. Recomendo postergar gastos não essenciais e revisar despesas variáveis para não entrar no cheque especial.`;
    } else if (q.includes('dívida') || q.includes('priorizar')) {
      if (debts.length === 0) {
        reply = 'Parabéns! Você não possui nenhuma dívida ativa cadastrada no momento.';
      } else {
        const highestInterest = [...debts].sort((a, b) => Number(b.interest_rate) - Number(a.interest_rate))[0];
        reply = `Com base no método dos juros mais altos (Método Avalanche), você deve priorizar a dívida "${highestInterest.name}" com o credor ${highestInterest.creditor}, pois possui juros de ${highestInterest.interest_rate}% a.m. e saldo de ${formatCurrency(highestInterest.remaining_balance)}. Em seguida, liquide as dívidas de menor valor pelo método Bola de Neve para obter vitórias psicológicas rápidas.`;
      }
    } else if (q.includes('500') || q.includes('quitar')) {
      reply = `Se você amortizar R$ 500 hoje em suas dívidas, o seu saldo restante cairá de ${formatCurrency(metrics.remainingDebts)} para ${formatCurrency(Math.max(0, metrics.remainingDebts - 500))}, economizando juros futuros proporcionais ao CET (Custo Efetivo Total).`;
    } else if (q.includes('categoria') || q.includes('maior gasto')) {
      // Agrupa despesas por categoria
      const catTotals: Record<string, number> = {};
      expenses.forEach(e => {
        if (!e.deleted_at && e.status !== 'cancelado') {
          const cName = categories.find(c => c.id === e.category_id)?.name || 'Outros';
          catTotals[cName] = (catTotals[cName] || 0) + Number(e.amount);
        }
      });
      const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        reply = `As categorias com maior saída financeira acumulada são: 1º ${sorted[0][0]} (${formatCurrency(sorted[0][1])})${sorted[1] ? `, 2º ${sorted[1][0]} (${formatCurrency(sorted[1][1])})` : ''}. Sugiro definir um limite de orçamento mensal para elas para otimizar suas economias.`;
      } else {
        reply = 'Você ainda não possui despesas registradas suficientes para análise categórica.';
      }
    } else {
      reply = `Com base na sua situação atual (Saldo: ${formatCurrency(availableBalance)}, Receitas do mês: ${formatCurrency(metrics.monthIncomes)}, Despesas do mês: ${formatCurrency(metrics.monthExpenses)}), seu fluxo de caixa está operando conforme planejado. Recomendo sempre confirmar os recebimentos no dia correto e cadastrar as compras do cartão assim que realizadas para manter o limite disponível sempre fiel.`;
    }

    const aiMsg = {
      sender: 'ai' as const,
      text: reply,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInputQuestion('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Assistente Financeiro Inteligente</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Análise personalizada e consultoria baseada estritamente nos dados do seu perfil
        </p>
      </div>

      {/* Sugestões de Perguntas Rápidas */}
      <div className="flex flex-wrap gap-2">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(q)}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Caixa de Mensagens do Chat */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col h-[460px]">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/50 dark:border-slate-700/50'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.date}</span>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk(inputQuestion)}
            placeholder="Pergunte sobre seus limites, dívidas, projeções..."
            className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => handleAsk(inputQuestion)}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
