export interface ParsedRow {
  [key: string]: string;
}

export interface ParseResult {
  headers: string[];
  rows: ParsedRow[];
}

export function parseCSV(content: string): ParseResult {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '');
  
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Detect separator (comma or semicolon)
  const firstLine = lines[0];
  const separator = firstLine.includes(';') ? ';' : ',';

  const headers = parseLine(firstLine, separator).map((h) => h.trim().toLowerCase());
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i], separator);
    const row: ParsedRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

function parseLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === separator && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

export function parseBrazilianNumber(value: string): number | null {
  if (!value || value.trim() === '') return null;

  // Remove currency symbol and spaces
  let cleaned = value.replace(/R\$\s*/g, '').trim();

  // Check if it's Brazilian format (1.234,56) or international (1,234.56)
  const hasCommaDecimal = /,\d{1,2}$/.test(cleaned);
  const hasDotDecimal = /\.\d{1,2}$/.test(cleaned);

  if (hasCommaDecimal) {
    // Brazilian format: remove dots (thousands), replace comma with dot (decimal)
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasDotDecimal) {
    // International format: just remove commas (thousands)
    cleaned = cleaned.replace(/,/g, '');
  } else {
    // No decimal, remove all separators
    cleaned = cleaned.replace(/[.,]/g, '');
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function generateSampleCSV(): string {
  return `chapa,nome,cargo,salario
12345,João da Silva,Analista de RH,5500.00
12346,Maria Santos,Gerente Comercial,8500.00
12347,Pedro Oliveira,Assistente Administrativo,3200.00`;
}
