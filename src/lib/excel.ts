/* eslint-disable @typescript-eslint/no-namespace */
/// <reference types="office-js" />

// === Range Read/Write ===

export async function readRange(
  worksheetName: string,
  rangeAddress: string,
): Promise<(string | number | boolean)[][]> {
  return Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getItem(worksheetName);
    const range = sheet.getRange(rangeAddress);
    range.load('values');
    await context.sync();
    return range.values as (string | number | boolean)[][];
  });
}

export async function writeRange(
  worksheetName: string,
  rangeAddress: string,
  values: (string | number | boolean)[][],
): Promise<void> {
  await Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getItem(worksheetName);
    const range = sheet.getRange(rangeAddress);
    range.values = values;
    await context.sync();
  });
}

export async function writeFormulas(
  worksheetName: string,
  rangeAddress: string,
  formulas: string[][],
): Promise<void> {
  await Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getItem(worksheetName);
    const range = sheet.getRange(rangeAddress);
    range.formulas = formulas;
    await context.sync();
  });
}

// === Worksheet Management ===

export async function ensureWorksheet(name: string): Promise<void> {
  await Excel.run(async (context) => {
    const sheets = context.workbook.worksheets;
    sheets.load('items/name');
    await context.sync();
    const exists = sheets.items.some((s) => s.name === name);
    if (!exists) {
      sheets.add(name);
      await context.sync();
    }
  });
}

export async function createTable(
  worksheetName: string,
  rangeAddress: string,
  tableName: string,
  headers: string[],
): Promise<void> {
  await Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getItem(worksheetName);
    const headerRange = sheet.getRange(rangeAddress);
    headerRange.values = [headers];
    const table = sheet.tables.add(rangeAddress, true);
    table.name = tableName;
    table.style = 'TableStyleMedium2';
    await context.sync();
  });
}

// === Workspace Initialization ===

export async function initializeUTMWorkspace(): Promise<void> {
  await ensureWorksheet('UTM Builder');
  await createTable('UTM Builder', 'A1:E1', 'UTMTable', [
    'Landing_Page_URL',
    'Campaign_Name',
    'Source',
    'Medium',
    'UTM_String',
  ]);
}

const FORECAST_HEADERS = [
  'Period',
  'Channel',
  'Tactic',
  'Buy_Type',
  'Budget',
  'CPM',
  'Impressions',
  'Universe',
  'TRPs',
  'Fee_Pct',
  'Fee_Flat',
  'Fees',
  'Total',
];

export async function initializeForecastingWorkspace(): Promise<void> {
  await ensureWorksheet('Forecasting');
  await createTable('Forecasting', 'A1:M1', 'ForecastTable', FORECAST_HEADERS);
}

export async function initializePacingWorkspace(): Promise<void> {
  await ensureWorksheet('Pacing');
  await createTable('Pacing', 'A1:D1', 'PacingTable', [
    'Campaign_Name',
    'Planned_Spend',
    'Actual_Spend',
    'Pacing_Ratio',
  ]);
}

// === Forecast Data Types ===

export interface ForecastRow {
  period: number;
  channel: string;
  tactic: string;
  buyType: string;
  budget: number;
  cpm: number;
  universe: number;
  feePct: number;
  feeFlat: number;
}

// === Forecast Writing ===

export async function clearForecastTable(): Promise<void> {
  await Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getItem('Forecasting');
    let table: Excel.Table;
    try {
      table = sheet.tables.getItem('ForecastTable');
    } catch {
      return;
    }
    const bodyRange = table.getDataBodyRange();
    bodyRange.load('rowCount');
    await context.sync();

    if (bodyRange.rowCount > 0) {
      bodyRange.delete(Excel.DeleteShiftDirection.up);
      await context.sync();
    }

    // Also clear any summary row below the table
    const tableRange = table.getRange();
    tableRange.load('rowCount');
    await context.sync();
    const summaryRow = tableRange.rowCount + 1;
    const summaryRange = sheet.getRange(`D${summaryRow}:M${summaryRow}`);
    summaryRange.clear(Excel.ClearApplyTo.all);
    await context.sync();
  });
}

export async function writeForecastToSheet(rows: ForecastRow[]): Promise<void> {
  if (rows.length === 0) return;

  await Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getItem('Forecasting');
    const table = sheet.tables.getItem('ForecastTable');

    // Build static value rows (formulas columns get placeholder 0)
    const valueRows = rows.map((r) => [
      r.period,
      r.channel,
      r.tactic,
      r.buyType,
      r.budget,
      r.cpm,
      0, // Impressions placeholder
      r.universe,
      0, // TRPs placeholder
      r.feePct,
      r.feeFlat,
      0, // Fees placeholder
      0, // Total placeholder
    ]);

    table.rows.add(undefined, valueRows);
    await context.sync();

    // Now overlay formulas on columns G (7), I (9), L (12), M (13)
    // Data starts at row 2 (row 1 is header)
    const startRow = 2;
    const formulaData: string[][] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = startRow + i;
      // G: Impressions = (Budget/CPM)*1000
      const impressions = `=IF(F${row}>0,(E${row}/F${row})*1000,0)`;
      // I: TRPs = IF(Universe>0, (Impressions/Universe)*100, 0)
      const trps = `=IF(H${row}>0,(G${row}/H${row})*100,0)`;
      // L: Fees = Budget*Fee_Pct + Fee_Flat
      const fees = `=E${row}*J${row}+K${row}`;
      // M: Total = Budget + Fees
      const total = `=E${row}+L${row}`;

      formulaData.push([impressions, trps, fees, total]);
    }

    // Write Impressions formulas (column G)
    const gRange = sheet.getRange(`G${startRow}:G${startRow + rows.length - 1}`);
    gRange.formulas = formulaData.map((r) => [r[0]]);
    await context.sync();

    // Write TRPs formulas (column I)
    const iRange = sheet.getRange(`I${startRow}:I${startRow + rows.length - 1}`);
    iRange.formulas = formulaData.map((r) => [r[1]]);
    await context.sync();

    // Write Fees formulas (column L)
    const lRange = sheet.getRange(`L${startRow}:L${startRow + rows.length - 1}`);
    lRange.formulas = formulaData.map((r) => [r[2]]);
    await context.sync();

    // Write Total formulas (column M)
    const mRange = sheet.getRange(`M${startRow}:M${startRow + rows.length - 1}`);
    mRange.formulas = formulaData.map((r) => [r[3]]);
    await context.sync();
  });
}

export async function writeForecastSummary(rowCount: number): Promise<void> {
  if (rowCount === 0) return;

  await Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getItem('Forecasting');
    const summaryRow = rowCount + 2; // header row + data rows + 1

    // Label
    const labelRange = sheet.getRange(`D${summaryRow}`);
    labelRange.values = [['TOTALS']];
    labelRange.format.font.bold = true;

    // SUM formulas for key columns
    const budgetSum = `=SUM(ForecastTable[Budget])`;
    const impressionSum = `=SUM(ForecastTable[Impressions])`;
    const trpSum = `=SUM(ForecastTable[TRPs])`;
    const feeSum = `=SUM(ForecastTable[Fees])`;
    const totalSum = `=SUM(ForecastTable[Total])`;

    sheet.getRange(`E${summaryRow}`).formulas = [[budgetSum]];
    sheet.getRange(`G${summaryRow}`).formulas = [[impressionSum]];
    sheet.getRange(`I${summaryRow}`).formulas = [[trpSum]];
    sheet.getRange(`L${summaryRow}`).formulas = [[feeSum]];
    sheet.getRange(`M${summaryRow}`).formulas = [[totalSum]];

    // Bold the summary row
    const summaryRange = sheet.getRange(`D${summaryRow}:M${summaryRow}`);
    summaryRange.format.font.bold = true;

    await context.sync();
  });
}

export async function applyForecastFormatting(rowCount: number): Promise<void> {
  if (rowCount === 0) return;

  await Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getItem('Forecasting');
    const lastDataRow = rowCount + 1; // +1 for header
    const summaryRow = rowCount + 2;

    // Currency format: Budget (E), CPM (F), Fees (L), Total (M)
    const currencyFormat = '$#,##0.00';
    sheet.getRange(`E2:E${summaryRow}`).numberFormat = [[currencyFormat]];
    sheet.getRange(`F2:F${lastDataRow}`).numberFormat = [[currencyFormat]];
    sheet.getRange(`L2:L${summaryRow}`).numberFormat = [[currencyFormat]];
    sheet.getRange(`M2:M${summaryRow}`).numberFormat = [[currencyFormat]];

    // Number format: Impressions (G)
    const numberFormat = '#,##0';
    sheet.getRange(`G2:G${summaryRow}`).numberFormat = [[numberFormat]];

    // Number format: TRPs (I)
    const trpFormat = '#,##0.0';
    sheet.getRange(`I2:I${summaryRow}`).numberFormat = [[trpFormat]];

    // Percentage format: Fee_Pct (J)
    const pctFormat = '0.00%';
    sheet.getRange(`J2:J${lastDataRow}`).numberFormat = [[pctFormat]];

    // Fee_Flat (K) currency
    sheet.getRange(`K2:K${lastDataRow}`).numberFormat = [[currencyFormat]];

    // Universe (H) number
    sheet.getRange(`H2:H${lastDataRow}`).numberFormat = [[numberFormat]];

    // Auto-fit columns
    sheet.getRange('A1:M1').format.autofitColumns();

    await context.sync();
  });
}

// === UTM Writing ===

export async function appendUTMToTable(
  landingPageUrl: string,
  campaignName: string,
  source: string,
  medium: string,
  utmString: string,
): Promise<void> {
  await Excel.run(async (context) => {
    const sheets = context.workbook.worksheets;
    sheets.load('items/name');
    await context.sync();

    const sheetExists = sheets.items.some((s) => s.name === 'UTM Builder');
    if (!sheetExists) {
      throw new Error('UTM workspace not initialized. Click "Initialize Workspace" first.');
    }

    const sheet = context.workbook.worksheets.getItem('UTM Builder');
    let table: Excel.Table;
    try {
      table = sheet.tables.getItem('UTMTable');
    } catch {
      throw new Error('UTMTable not found. Click "Initialize Workspace" to create it.');
    }

    table.rows.add(undefined, [[landingPageUrl, campaignName, source, medium, utmString]]);
    await context.sync();
  });
}

export async function batchAppendUTMsToTable(
  rows: { landingPageUrl: string; campaignName: string; source: string; medium: string; utmString: string }[],
): Promise<void> {
  if (rows.length === 0) return;
  await Excel.run(async (context) => {
    const sheets = context.workbook.worksheets;
    sheets.load('items/name');
    await context.sync();

    const sheetExists = sheets.items.some((s) => s.name === 'UTM Builder');
    if (!sheetExists) {
      throw new Error('UTM workspace not initialized. Click "Initialize Workspace" first.');
    }

    const sheet = context.workbook.worksheets.getItem('UTM Builder');
    const table = sheet.tables.getItem('UTMTable');
    const values = rows.map((r) => [r.landingPageUrl, r.campaignName, r.source, r.medium, r.utmString]);
    table.rows.add(undefined, values);
    await context.sync();
  });
}

// === Conditional Formatting ===

export async function applyPacingFormatting(
  worksheetName: string,
  rangeAddress: string,
): Promise<void> {
  await Excel.run(async (context) => {
    const sheet = context.workbook.worksheets.getItem(worksheetName);
    const range = sheet.getRange(rangeAddress);

    // Red: < 0.90 (under-pacing by >10%)
    const underRule = range.conditionalFormats.add(
      Excel.ConditionalFormatType.cellValue,
    );
    underRule.cellValue.format.fill.color = '#FFCDD2';
    underRule.cellValue.rule = {
      formula1: '0.90',
      operator: Excel.ConditionalCellValueOperator.lessThan,
    };

    // Yellow: 0.90 – 0.95
    const slightlyUnderRule = range.conditionalFormats.add(
      Excel.ConditionalFormatType.cellValue,
    );
    slightlyUnderRule.cellValue.format.fill.color = '#FFF9C4';
    slightlyUnderRule.cellValue.rule = {
      formula1: '0.90',
      formula2: '0.95',
      operator: Excel.ConditionalCellValueOperator.between,
    };

    // Green: 0.95 – 1.05 (on track)
    const onTrackRule = range.conditionalFormats.add(
      Excel.ConditionalFormatType.cellValue,
    );
    onTrackRule.cellValue.format.fill.color = '#C8E6C9';
    onTrackRule.cellValue.rule = {
      formula1: '0.95',
      formula2: '1.05',
      operator: Excel.ConditionalCellValueOperator.between,
    };

    // Orange: > 1.05 (over-pacing)
    const overRule = range.conditionalFormats.add(
      Excel.ConditionalFormatType.cellValue,
    );
    overRule.cellValue.format.fill.color = '#FFE0B2';
    overRule.cellValue.rule = {
      formula1: '1.05',
      operator: Excel.ConditionalCellValueOperator.greaterThan,
    };

    await context.sync();
  });
}

// === Formula Generators ===

export function generateImpressionFormula(spendCell: string, cpmCell: string): string {
  return `=(${spendCell}/${cpmCell})*1000`;
}

export function generateCPMFormula(spendCell: string, impressionsCell: string): string {
  return `=(${spendCell}/${impressionsCell})*1000`;
}

export function generatePacingFormula(actualCell: string, plannedCell: string): string {
  return `=${actualCell}/${plannedCell}`;
}

export function generateBenchmarkFormula(
  historicalCell: string,
  historicalWeightCell: string,
  planCell: string,
  planWeightCell: string,
): string {
  return `=(${historicalCell}*${historicalWeightCell})+(${planCell}*${planWeightCell})`;
}

export function generatePercentDiffFormula(actualCell: string, benchmarkCell: string): string {
  return `=${actualCell}/${benchmarkCell}-1`;
}
