// Opcoes padrao exibidas no cadastro; o usuario tambem pode digitar outro nome.
export const nomesReceitaPadrao = ["Salario", "Renda extra", "Outras"];

// Valida e converte o mes no formato YYYY-MM para uma data salva no banco.
export function criarDataDoMes(mes: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(mes);

  if (!match) {
    throw new MesReceitaInvalidoError();
  }

  const ano = Number(match[1]);
  const mesIndex = Number(match[2]) - 1;

  if (mesIndex < 0 || mesIndex > 11) {
    throw new MesReceitaInvalidoError();
  }

  return new Date(ano, mesIndex, 1);
}

// Cria o intervalo usado para filtrar receitas de um mes especifico.
export function criarIntervaloDoMes(mes: string) {
  const inicio = criarDataDoMes(mes);
  const fim = new Date(inicio);
  fim.setMonth(fim.getMonth() + 1);

  return { inicio, fim };
}

// Soma meses mantendo o dia 1, usado para gerar parcelas mensais.
export function somarMeses(data: Date, quantidade: number) {
  const novaData = new Date(data);
  novaData.setMonth(novaData.getMonth() + quantidade);

  return novaData;
}

// Formata a data da receita de volta para YYYY-MM para facilitar o uso no frontend.
export function formatarMesReceita(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");

  return `${ano}-${mes}`;
}

export class MesReceitaInvalidoError extends Error {
  constructor() {
    super("Mes da receita invalido. Use o formato YYYY-MM");
  }
}
