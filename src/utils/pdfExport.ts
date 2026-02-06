// PDF Report Generator — professional salary breakdown export
// Uses jsPDF for client-side vector PDF generation (lazy-loaded)

import type { jsPDF } from 'jspdf';
import type { SalaryInput, SalaryResult, EmployedResult, SelfEmployedResult, ComparisonResult } from './types';
import { formatCurrency, formatPercent } from './formatters';

// ---- Colours ----
const ROSE = [232, 67, 111] as const;
const DARK = [45, 45, 63] as const;
const GRAY = [120, 120, 140] as const;
const LIGHT_GRAY = [240, 240, 245] as const;

// ---- Helpers ----

function maritalLabel(ms: SalaryInput['maritalStatus']): string {
  switch (ms) {
    case 'single': return 'Não Casado';
    case 'married_single_holder': return 'Casado - Único Titular';
    case 'married_two_holders': return 'Casado - Dois Titulares';
  }
}

function regionLabel(r: SalaryInput['region']): string {
  switch (r) {
    case 'continente': return 'Portugal Continental';
    case 'acores': return 'Açores';
    case 'madeira': return 'Madeira';
  }
}

class PdfBuilder {
  private doc: jsPDF;
  private y = 0;
  private readonly pageW: number;
  private readonly margin = 20;
  private readonly contentW: number;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(JsPDF: new (opts: any) => jsPDF) {
    this.doc = new JsPDF({ unit: 'mm', format: 'a4' });
    this.pageW = this.doc.internal.pageSize.getWidth();
    this.contentW = this.pageW - this.margin * 2;
    this.y = this.margin;
  }

  private checkPage(needed: number) {
    const pageH = this.doc.internal.pageSize.getHeight();
    if (this.y + needed > pageH - 20) {
      this.doc.addPage();
      this.y = this.margin;
    }
  }

  header(title: string, subtitle: string) {
    // Rose accent bar
    this.doc.setFillColor(...ROSE);
    this.doc.rect(0, 0, this.pageW, 3, 'F');

    this.y = 15;
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(22);
    this.doc.setTextColor(...DARK);
    this.doc.text(title, this.margin, this.y);

    this.y += 8;
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(...GRAY);
    this.doc.text(subtitle, this.margin, this.y);

    // Date
    const dateStr = new Date().toLocaleDateString('pt-PT', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    this.doc.text(`Gerado em ${dateStr}`, this.pageW - this.margin, this.y, { align: 'right' });

    this.y += 4;
    this.doc.setDrawColor(...ROSE);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.y, this.pageW - this.margin, this.y);
    this.y += 8;
  }

  sectionTitle(title: string) {
    this.checkPage(15);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(13);
    this.doc.setTextColor(...ROSE);
    this.doc.text(title, this.margin, this.y);
    this.y += 2;
    this.doc.setDrawColor(230, 230, 235);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.y, this.pageW - this.margin, this.y);
    this.y += 6;
  }

  keyValueRow(label: string, value: string, bold = false) {
    this.checkPage(7);
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(...DARK);
    this.doc.text(label, this.margin + 2, this.y);
    this.doc.text(value, this.pageW - this.margin - 2, this.y, { align: 'right' });
    this.y += 6;
  }

  highlightRow(label: string, value: string) {
    this.checkPage(10);
    this.doc.setFillColor(...LIGHT_GRAY);
    this.doc.roundedRect(this.margin, this.y - 4, this.contentW, 8, 1.5, 1.5, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(11);
    this.doc.setTextColor(...DARK);
    this.doc.text(label, this.margin + 4, this.y);
    this.doc.setTextColor(...ROSE);
    this.doc.text(value, this.pageW - this.margin - 4, this.y, { align: 'right' });
    this.y += 10;
  }

  heroBox(label: string, value: string) {
    this.checkPage(20);
    this.doc.setFillColor(...ROSE);
    this.doc.roundedRect(this.margin, this.y - 2, this.contentW, 16, 3, 3, 'F');
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(label, this.margin + 6, this.y + 3);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(16);
    this.doc.text(value, this.pageW - this.margin - 6, this.y + 3, { align: 'right' });
    this.y += 22;
  }

  comparisonHeader() {
    this.checkPage(10);
    this.doc.setFillColor(...LIGHT_GRAY);
    this.doc.roundedRect(this.margin, this.y - 4, this.contentW, 8, 1.5, 1.5, 'F');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(9);
    this.doc.setTextColor(...GRAY);

    const col2 = this.margin + this.contentW * 0.5;
    const col3 = this.margin + this.contentW * 0.78;
    this.doc.text('', this.margin + 4, this.y);
    this.doc.text('Outrem', col2, this.y, { align: 'right' });
    this.doc.text('Independente', col3, this.y, { align: 'right' });
    this.y += 8;
  }

  comparisonRow(label: string, val1: string, val2: string, bold = false) {
    this.checkPage(7);
    this.doc.setFont('helvetica', bold ? 'bold' : 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(...DARK);

    const col2 = this.margin + this.contentW * 0.5;
    const col3 = this.margin + this.contentW * 0.78;
    this.doc.text(label, this.margin + 4, this.y);
    this.doc.text(val1, col2, this.y, { align: 'right' });
    this.doc.text(val2, col3, this.y, { align: 'right' });
    this.y += 6;
  }

  spacer(mm = 4) {
    this.y += mm;
  }

  footer(text: string) {
    const pageH = this.doc.internal.pageSize.getHeight();
    this.doc.setFont('helvetica', 'italic');
    this.doc.setFontSize(7);
    this.doc.setTextColor(...GRAY);
    this.doc.text(text, this.pageW / 2, pageH - 8, { align: 'center', maxWidth: this.contentW });
  }

  save(filename: string) {
    this.doc.save(filename);
  }
}

// ---- Input parameters section ----

function addInputParams(pdf: PdfBuilder, input: SalaryInput) {
  pdf.sectionTitle('Parâmetros da Simulação');
  pdf.keyValueRow('Estado Civil', maritalLabel(input.maritalStatus));
  pdf.keyValueRow('Dependentes', String(input.dependents));
  pdf.keyValueRow('Região', regionLabel(input.region));
  if (input.employmentType !== 'self_employed') {
    pdf.keyValueRow('Salário Bruto Mensal', formatCurrency(input.grossMonthly));
    pdf.keyValueRow('Meses de Salário', String(input.numberOfMonths));
    if (input.mealAllowancePerDay > 0) {
      pdf.keyValueRow(
        'Sub. Alimentação',
        `${formatCurrency(input.mealAllowancePerDay)}/dia (${input.mealAllowanceType === 'card' ? 'cartão' : 'dinheiro'})`
      );
    }
    if (input.otherTaxableIncome > 0) {
      pdf.keyValueRow('Complementos Tributáveis', formatCurrency(input.otherTaxableIncome) + '/mês');
    }
    if (input.irsJovem) {
      pdf.keyValueRow('IRS Jovem', `${input.irsJovemYear}.º ano`);
    }
  }
  if (input.employmentType !== 'employed') {
    pdf.keyValueRow('Faturação Mensal', formatCurrency(input.grossMonthly));
    pdf.keyValueRow('Atividade', input.activityType === 'services' ? 'Prestação de Serviços' : 'Vendas / Produção');
    pdf.keyValueRow('Regime', input.fiscalRegime === 'simplified' ? 'Simplificado' : 'Contabilidade Organizada');
    pdf.keyValueRow('IVA', input.vatRegime === 'exempt_art53' ? 'Isento (Art. 53)' : 'Regime Normal (23%)');
  }
  pdf.spacer();
}

// ---- Employed result ----

function addEmployedResult(pdf: PdfBuilder, r: EmployedResult, input: SalaryInput) {
  pdf.sectionTitle('Resultados — Conta de Outrem');
  pdf.heroBox('Salário Líquido Mensal', formatCurrency(r.totalNetMonthly));

  pdf.sectionTitle('Decomposição Mensal');
  pdf.keyValueRow('Salário Bruto', formatCurrency(r.totalGrossMonthly));
  if (r.otherTaxableIncome > 0) {
    pdf.keyValueRow('  Base + Complementos', `${formatCurrency(r.grossMonthly)} + ${formatCurrency(r.otherTaxableIncome)}`);
  }
  if (r.mealTaxableMonthly > 0) {
    pdf.keyValueRow('  Sub. alimentação tributável', formatCurrency(r.mealTaxableMonthly));
  }
  pdf.keyValueRow(`Segurança Social (${formatPercent(r.ssRate)})`, `- ${formatCurrency(r.ssEmployee)}`);
  pdf.keyValueRow(`Retenção IRS (${formatPercent(r.irsRate)})`, `- ${formatCurrency(r.irsWithholding)}`);
  if (r.irsJovemDiscount > 0) {
    pdf.keyValueRow('  Desconto IRS Jovem', `- ${formatCurrency(r.irsJovemDiscount)}`);
  }
  pdf.keyValueRow('Salário Líquido', formatCurrency(r.netMonthly), true);
  if (r.mealAllowanceMonthly > 0) {
    pdf.keyValueRow('Sub. Alimentação (isento)', `+ ${formatCurrency(r.mealExemptMonthly)}`);
  }
  pdf.highlightRow('Total Líquido Mensal', formatCurrency(r.totalNetMonthly));

  pdf.sectionTitle('Resumo Anual');
  pdf.keyValueRow(`Bruto Anual (${input.numberOfMonths} meses)`, formatCurrency(r.grossAnnual));
  pdf.keyValueRow('Segurança Social Anual', `- ${formatCurrency(r.ssAnnualEmployee)}`);
  pdf.keyValueRow('IRS Anual', `- ${formatCurrency(r.irsAnnual)}`);
  if (r.mealAllowanceAnnual > 0) {
    pdf.keyValueRow('Sub. Alimentação Anual', `+ ${formatCurrency(r.mealAllowanceAnnual - r.mealTaxableAnnual)}`);
  }
  pdf.highlightRow('Total Líquido Anual', formatCurrency(r.totalNetAnnual));

  pdf.sectionTitle('Custo para a Empresa');
  pdf.keyValueRow(`SS Patronal (${formatPercent(0.2375)})`, formatCurrency(r.ssEmployerAnnual) + '/ano');
  pdf.highlightRow('Custo Total Anual', formatCurrency(r.totalEmployerCostAnnual));

  pdf.sectionTitle('Taxas Efetivas');
  pdf.keyValueRow('Taxa Efetiva IRS', formatPercent(r.effectiveIrsRate));
  pdf.keyValueRow('Taxa Total Descontos', formatPercent(r.effectiveTotalRate));
  pdf.spacer();
}

// ---- Self-employed result ----

function addSelfEmployedResult(pdf: PdfBuilder, r: SelfEmployedResult) {
  pdf.sectionTitle('Resultados — Trabalhador Independente');
  pdf.heroBox('Rendimento Líquido Mensal', formatCurrency(r.totalNetMonthly));

  pdf.sectionTitle('Decomposição Mensal');
  pdf.keyValueRow('Faturação Bruta', formatCurrency(r.grossMonthly));
  pdf.keyValueRow(`Retenção IRS (${formatPercent(r.irsWithholdingRate)})`, `- ${formatCurrency(r.irsWithholding)}`);
  pdf.keyValueRow(`Seg. Social (${formatPercent(r.ssRate)} s/ ${formatPercent(r.grossMonthly > 0 ? r.ssBase / r.grossMonthly : 0)})`, `- ${formatCurrency(r.ssContribution)}`);
  if (r.vatCollected > 0) {
    pdf.keyValueRow(`IVA (${formatPercent(r.vatRate)})`, `- ${formatCurrency(r.vatCollected)}`);
  }
  pdf.highlightRow('Rendimento Líquido Mensal', formatCurrency(r.totalNetMonthly));

  pdf.sectionTitle('Resumo Anual');
  pdf.keyValueRow('Faturação Bruta Anual', formatCurrency(r.grossAnnual));
  pdf.keyValueRow('IRS Anual', `- ${formatCurrency(r.irsAnnual)}`);
  pdf.keyValueRow('SS Anual', `- ${formatCurrency(r.ssAnnual)}`);
  if (r.vatAnnual > 0) {
    pdf.keyValueRow('IVA Anual', `- ${formatCurrency(r.vatAnnual)}`);
  }
  pdf.highlightRow('Rendimento Líquido Anual', formatCurrency(r.totalNetAnnual));

  pdf.sectionTitle('Informação Fiscal');
  pdf.keyValueRow('Coeficiente aplicável', String(r.coefficient));
  pdf.keyValueRow('Rendimento coletável anual', formatCurrency(r.taxableIncome));
  if (r.annualExpenses > 0) {
    pdf.keyValueRow('Despesas dedutíveis anuais', formatCurrency(r.annualExpenses));
  }
  pdf.keyValueRow('Equivalente por conta de outrem', formatCurrency(r.equivalentGrossEmployed) + ' bruto/mês (14m)');

  pdf.sectionTitle('Taxas Efetivas');
  pdf.keyValueRow('Taxa Efetiva IRS', formatPercent(r.effectiveIrsRate));
  pdf.keyValueRow('Taxa Total Descontos', formatPercent(r.effectiveTotalRate));
  pdf.spacer();
}

// ---- Comparison result ----

function addComparisonResult(pdf: PdfBuilder, r: ComparisonResult, input: SalaryInput) {
  const emp = r.employed;
  const se = r.selfEmployed;
  const diff = r.difference;

  const betterLabel = diff.betterOption === 'employed' ? 'Conta de Outrem' :
    diff.betterOption === 'self_employed' ? 'Independente' : 'Resultado semelhante';

  pdf.sectionTitle('Resultado da Comparação');
  pdf.heroBox(
    diff.betterOption === 'equal' ? 'Resultado semelhante' : `Melhor opção: ${betterLabel}`,
    diff.betterOption !== 'equal' ? `+${formatCurrency(Math.abs(diff.annualNet))}/ano` : '—'
  );

  pdf.sectionTitle('Comparação Detalhada — Mensal');
  pdf.comparisonHeader();
  pdf.comparisonRow('Bruto', formatCurrency(emp.totalGrossMonthly), formatCurrency(se.grossMonthly));
  pdf.comparisonRow('Seg. Social', `- ${formatCurrency(emp.ssEmployee)}`, `- ${formatCurrency(se.ssContribution)}`);
  pdf.comparisonRow('IRS', `- ${formatCurrency(emp.irsWithholding)}`, `- ${formatCurrency(se.irsWithholding)}`);
  if (se.vatCollected > 0) {
    pdf.comparisonRow('IVA', '—', `- ${formatCurrency(se.vatCollected)}`);
  }
  if (emp.mealExemptMonthly > 0) {
    pdf.comparisonRow('Sub. Alimentação', `+ ${formatCurrency(emp.mealExemptMonthly)}`, '—');
  }
  pdf.comparisonRow('Líquido Mensal', formatCurrency(emp.totalNetMonthly), formatCurrency(se.totalNetMonthly), true);
  pdf.spacer();

  pdf.sectionTitle('Comparação Anual');
  pdf.comparisonHeader();
  pdf.comparisonRow('Bruto Anual', formatCurrency(emp.grossAnnual), formatCurrency(se.grossAnnual));
  pdf.comparisonRow('SS Anual', `- ${formatCurrency(emp.ssAnnualEmployee)}`, `- ${formatCurrency(se.ssAnnual)}`);
  pdf.comparisonRow('IRS Anual', `- ${formatCurrency(emp.irsAnnual)}`, `- ${formatCurrency(se.irsAnnual)}`);
  pdf.comparisonRow('Líquido Anual', formatCurrency(emp.totalNetAnnual), formatCurrency(se.totalNetAnnual), true);
  pdf.spacer();

  pdf.sectionTitle('Taxas Efetivas');
  pdf.comparisonHeader();
  pdf.comparisonRow('Taxa IRS', formatPercent(emp.effectiveIrsRate), formatPercent(se.effectiveIrsRate));
  pdf.comparisonRow('Taxa Total', formatPercent(emp.effectiveTotalRate), formatPercent(se.effectiveTotalRate));
  pdf.spacer();

  pdf.sectionTitle('Custo Empregador (Conta de Outrem)');
  pdf.keyValueRow(`SS Patronal (${formatPercent(0.2375)})`, formatCurrency(emp.ssEmployerAnnual) + '/ano');
  pdf.highlightRow('Custo Total Anual', formatCurrency(emp.totalEmployerCostAnnual));

  addInputParams(pdf, input);
}

// ---- Main export function ----

export async function exportPdf(input: SalaryInput, result: SalaryResult): Promise<void> {
  const { jsPDF: JsPDF } = await import('jspdf');
  const pdf = new PdfBuilder(JsPDF);

  const typeLabel = result.type === 'comparison' ? 'Comparação' :
    result.type === 'employed' ? 'Conta de Outrem' : 'Trabalhador Independente';

  pdf.header(
    'Simulação Salarial',
    `${typeLabel} · Tabelas IRS 2026 (Despacho n.º 233-A/2026)`
  );

  if (result.type === 'comparison') {
    addComparisonResult(pdf, result as ComparisonResult, input);
  } else {
    addInputParams(pdf, input);
    if (result.type === 'employed') {
      addEmployedResult(pdf, result as EmployedResult, input);
    } else {
      addSelfEmployedResult(pdf, result as SelfEmployedResult);
    }
  }

  pdf.footer(
    'Valores indicativos baseados nas tabelas de retenção IRS 2026 (Despacho n.º 233-A/2026). Consulte sempre um contabilista para situações específicas. · Salário PT'
  );

  const filename = `salario-pt-${result.type}-${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(filename);
}
