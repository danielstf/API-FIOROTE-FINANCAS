import { CartaoCredito, Despesa, FormaPagamentoDespesa } from "@prisma/client";
import { criarDataDoMes } from "../receitas/receita-mes";

// Categorias iniciais para o select; o usuario pode informar outra no campo manual.
export const categoriasDespesaPadrao = [
  "Alimentacao",
  "Moradia",
  "Transporte",
  "Saude",
  "Educacao",
  "Lazer",
  "Outras",
];

export const formasPagamentoDespesaPadrao = [
  FormaPagamentoDespesa.DINHEIRO,
  FormaPagamentoDespesa.CARTAO_CREDITO,
];

// Valida datas opcionais no formato YYYY-MM-DD.
export function criarDataOpcional(data?: string | null) {
  if (!data) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);

  if (!match) {
    throw new DataDespesaInvalidaError();
  }

  const dataFormatada = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );

  if (Number.isNaN(dataFormatada.getTime())) {
    throw new DataDespesaInvalidaError();
  }

  return dataFormatada;
}

// Cria mes de referencia da despesa. Se nao vier, usa o mes do vencimento ou mes atual.
export function criarMesReferencia(mes?: string | null, dataVencimento?: Date | null) {
  if (mes) {
    return criarDataDoMes(mes);
  }

  if (dataVencimento) {
    return new Date(dataVencimento.getFullYear(), dataVencimento.getMonth(), 1);
  }

  const hoje = new Date();

  return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
}

// Conta vencida e aquela nao paga com vencimento anterior ao dia atual.
export function despesaEstaVencida(despesa: Pick<Despesa, "paga" | "dataVencimento">) {
  if (despesa.paga || !despesa.dataVencimento) {
    return false;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const vencimento = new Date(despesa.dataVencimento);
  vencimento.setHours(0, 0, 0, 0);

  return vencimento < hoje;
}

// Padroniza a resposta da API para o frontend.
type DespesaComCartao = Despesa & {
  cartaoCredito?: CartaoCredito | null;
};

export function formatarDespesa(despesa: DespesaComCartao) {
  return {
    id: despesa.id,
    nome: despesa.descricao,
    valor: Number(despesa.valor),
    categoria: despesa.categoriaNome,
    formaPagamento: despesa.formaPagamento,
    cartaoCreditoId: despesa.cartaoCreditoId,
    cartaoCredito: despesa.cartaoCredito
      ? {
          id: despesa.cartaoCredito.id,
          nome: despesa.cartaoCredito.nome,
        }
      : null,
    mesReferencia: despesa.mesReferencia,
    dataVencimento: despesa.dataVencimento,
    dataPagamento: despesa.dataPagamento,
    paga: despesa.paga,
    fixa: despesa.fixa,
    numeroParcelas: despesa.numeroParcelas,
    parcelaAtual: despesa.parcelaAtual,
    parcelamentoId: despesa.parcelamentoId,
    vencida: despesaEstaVencida(despesa),
    alerta: despesaEstaVencida(despesa) ? "Conta vencida" : null,
    criadoEm: despesa.criadoEm,
  };
}

export class DataDespesaInvalidaError extends Error {
  constructor() {
    super("Data da despesa invalida. Use o formato YYYY-MM-DD");
  }
}
