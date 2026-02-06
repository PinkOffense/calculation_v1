# Calculadora de Salario Liquido - Portugal 2026

Calculadora de salario liquido para trabalhadores em Portugal, baseada nas tabelas de retencao IRS 2026 (Despacho n. 233-A/2026).

## Funcionalidades

- **Conta de Outrem** - Calculo completo de salario liquido com SS, IRS, subsidio de alimentacao, IRS Jovem, complementos tributaveis
- **Trabalhador Independente** - Servicos e vendas, regime simplificado/organizado, IVA, retencao na fonte
- **Comparacao** - Side-by-side entre conta de outrem e independente com o mesmo bruto
- **Regioes** - Continente, Acores (-30% IRS) e Madeira (-30% IRS)
- **Exportar PDF** - Relatorio profissional em PDF com decomposicao detalhada
- **Tabelas externas** - Configuracao JSON versionada com cache em localStorage

## Requisitos

- Node.js >= 20
- npm >= 10

## Setup

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Abrir no browser
# http://localhost:5173/calculation_v1/
```

## Scripts

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de producao (typecheck + vite build) |
| `npm run preview` | Pre-visualizar build de producao |
| `npm run test` | Executar testes |
| `npm run test:watch` | Testes em modo watch |
| `npm run test:coverage` | Testes com relatorio de cobertura |
| `npm run lint` | Verificar codigo com ESLint |
| `npm run typecheck` | Verificar tipos TypeScript |
| `npm run validate` | Typecheck + lint + testes (pipeline completa) |

## Stack Tecnologica

- **React 19** + **TypeScript 5.9**
- **Vite 7** (build + dev server)
- **Vitest 4** + **Testing Library** (testes)
- **jsPDF** (exportacao PDF, lazy-loaded)
- **ESLint 9** (flat config)

## Estrutura do Projeto

```
src/
  App.tsx                  # Componente principal
  components/
    form/                  # Formulario de input
    results/               # Painel de resultados
    DonutChart.tsx          # Grafico SVG interativo
  hooks/
    useTaxTables.ts        # Carregamento de tabelas IRS
    useAnimatedValue.ts    # Animacao de valores
  utils/
    calculator.ts          # Motor de calculo (puro, sem side-effects)
    constants.ts           # Constantes fiscais hardcoded (fallback)
    taxTables.ts           # Loader de tabelas externas JSON
    formatters.ts          # Formatacao de moeda e percentagem
    pdfExport.ts           # Gerador de PDF
    types.ts               # Definicoes de tipos
public/
  tax-tables/2026.json     # Tabelas IRS 2026 (versionadas)
  manifest.json            # PWA manifest
  favicon.svg              # Favicon
```

## Tabelas Fiscais

As tabelas IRS sao carregadas de `public/tax-tables/2026.json` e passadas ao motor de calculo. Se o fetch falhar, o calculador usa os valores hardcoded em `constants.ts` como fallback.

Para atualizar as tabelas para um novo ano, basta criar um novo ficheiro JSON (ex: `2027.json`) e atualizar a referencia em `taxTables.ts`.

## Testes

O projeto inclui ~190 testes cobrindo:
- Calculo de salario (unit tests com invariantes)
- Constantes fiscais (verificacao de valores)
- Componentes React (rendering, interacao)
- Exportacao PDF (mocked)
- Hooks customizados

```bash
npm run test:coverage
```

## Deploy

O deploy e feito automaticamente para GitHub Pages via GitHub Actions quando ha push para `main`. O pipeline executa lint, testes e build antes do deploy.

## Licenca

Privado.
