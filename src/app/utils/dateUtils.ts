export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR');
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function calcularParcelas(
  valor: number,
  numeroParcelas: number,
  tipo: 'quinzenal' | 'mensal',
  dataInicio: Date = new Date()
): { numero: number; valor: number; dataVencimento: Date }[] {
  const valorParcela = valor / numeroParcelas;
  const parcelas = [];

  for (let i = 0; i < numeroParcelas; i++) {
    const dataVencimento = tipo === 'quinzenal' 
      ? addDays(dataInicio, i * 15)
      : addMonths(dataInicio, i);

    parcelas.push({
      numero: i + 1,
      valor: valorParcela,
      dataVencimento
    });
  }

  return parcelas;
}