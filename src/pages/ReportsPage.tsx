import React, { useState } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate, getMonthName } from '../utils/formatters';

export const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { incomes, expenses, debts, categories, availableBalance, metrics } = useFinance();
  const [reportType, setReportType] = useState<string>('monthly');

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const generatedAt = new Date().toLocaleString('pt-BR');

    // Header do Relatório
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text('Meu Financeiro - Relatório Oficial', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Usuário: ${user?.full_name || 'Usuário'} (${user?.email})`, 14, 30);
    doc.text(`Data de Geração: ${generatedAt}`, 14, 36);
    doc.text(`Saldo Disponível Atual: ${formatCurrency(availableBalance)}`, 14, 42);

    // Linha divisória
    doc.setDrawColor(220);
    doc.line(14, 46, 196, 46);

    let startY = 52;

    if (reportType === 'monthly' || reportType === 'all') {
      doc.setFontSize(14);
      doc.setTextColor(30);
      doc.text('Resumo das Receitas do Mês', 14, startY);

      const incomeRows = incomes
        .filter(i => !i.deleted_at)
        .map(i => [
          i.description,
          formatDate(i.expected_date),
          i.status,
          formatCurrency(i.amount)
        ]);

      autoTable(doc, {
        startY: startY + 4,
        head: [['Descrição', 'Data Prevista', 'Status', 'Valor']],
        body: incomeRows.length > 0 ? incomeRows : [['Nenhuma receita registrada', '-', '-', '-']],
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] } // Emerald
      });

      // @ts-ignore
      startY = doc.lastAutoTable.finalY + 12;

      doc.setFontSize(14);
      doc.setTextColor(30);
      doc.text('Resumo das Despesas do Mês', 14, startY);

      const expenseRows = expenses
        .filter(e => !e.deleted_at)
        .map(e => [
          e.description,
          formatDate(e.due_date),
          e.status,
          formatCurrency(e.amount)
        ]);

      autoTable(doc, {
        startY: startY + 4,
        head: [['Descrição', 'Vencimento', 'Status', 'Valor']],
        body: expenseRows.length > 0 ? expenseRows : [['Nenhuma despesa registrada', '-', '-', '-']],
        theme: 'striped',
        headStyles: { fillColor: [225, 29, 72] } // Rose
      });

      // @ts-ignore
      startY = doc.lastAutoTable.finalY + 12;
    }

    if (reportType === 'debts' || reportType === 'all') {
      doc.setFontSize(14);
      doc.setTextColor(30);
      doc.text('Posição de Dívidas e Obrigações', 14, startY);

      const debtRows = debts
        .filter(d => !d.deleted_at)
        .map(d => [
          d.name,
          d.creditor,
          formatCurrency(d.original_amount),
          formatCurrency(d.remaining_balance),
          `${d.total_installments}x`
        ]);

      autoTable(doc, {
        startY: startY + 4,
        head: [['Dívida', 'Credor', 'Valor Original', 'Saldo Devedor', 'Parcelas']],
        body: debtRows.length > 0 ? debtRows : [['Nenhuma dívida cadastrada', '-', '-', '-', '-']],
        theme: 'striped',
        headStyles: { fillColor: [245, 158, 11] } // Amber
      });
    }

    // Salva o PDF no dispositivo do usuário
    doc.save(`relatorio-financeiro-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Relatórios e Exportação</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Gere relatórios completos e certificados em formato PDF
        </p>
      </div>

      {/* Card de Configuração do Relatório */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <div>
          <label className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
            Selecione o Tipo de Relatório
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            {[
              { id: 'monthly', title: 'Resumo Mensal', desc: 'Receitas e despesas do período atual' },
              { id: 'debts', title: 'Posição de Dívidas', desc: 'Quadro completo de saldo devedor' },
              { id: 'all', title: 'Relatório Completo', desc: 'Consolidado com todas as contas' },
            ].map(type => (
              <div
                key={type.id}
                onClick={() => setReportType(type.id)}
                className={`p-4 rounded-xl cursor-pointer border transition-all ${
                  reportType === type.id
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{type.title}</p>
                <p className="text-xs text-slate-400 mt-1">{type.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo do Cabeçalho que sairá no PDF */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <p className="font-semibold text-slate-700 dark:text-slate-300">Dados do Documento:</p>
          <p className="text-slate-500">Usuário emissor: {user?.full_name} ({user?.email})</p>
          <p className="text-slate-500">Saldo Atual contabilizado: {formatCurrency(availableBalance)}</p>
          <p className="text-slate-500">Moeda: Real Brasileiro (BRL - R$) | Fuso: America/Sao_Paulo</p>
        </div>

        <button
          onClick={handleGeneratePDF}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Download className="w-4 h-4" /> Exportar Relatório em PDF Real
        </button>
      </div>
    </div>
  );
};
