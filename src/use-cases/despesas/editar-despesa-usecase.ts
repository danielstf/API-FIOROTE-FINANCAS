import { FormaPagamentoDespesa } from "@prisma/client";
import { CartaoRepositoryInterface } from "../../repositories/interface/cartoes/cartao-repo-interface";
import { DespesaRepositoryInterface } from "../../repositories/interface/despesas/despesa-repo-interface";
import { criarDataOpcional, criarMesReferencia, formatarDespesa } from "./despesa-dados";
import { criarDataDoMes } from "../receitas/receita-mes";
import {
  CartaoNaoEncontradoError,
  CartaoObrigatorioError,
} from "./criar-despesa-usecase";
import { DespesaNaoEncontradaError } from "./obter-despesa-usecase";

interface EditarDespesaUseCaseRequest {
  usuarioId: string;
  perfilFinanceiroId?: string | null;
  despesaId: string;
  nome?: string;
  valor?: number;
  categoria?: string | null;
  formaPagamento?: FormaPagamentoDespesa;
  cartaoCreditoId?: string | null;
  mes?: string | null;
  dataVencimento?: string | null;
  fixa?: boolean;
  escopo?: "mes" | "todas";
}

export class EditarDespesaUseCase {
  constructor(
    private despesaRepository: DespesaRepositoryInterface,
    private cartaoRepository: CartaoRepositoryInterface,
  ) {}

  async execute({
    usuarioId,
    perfilFinanceiroId,
    despesaId,
    nome,
    valor,
    categoria,
    formaPagamento,
    cartaoCreditoId,
    mes,
    dataVencimento,
    fixa,
    escopo,
  }: EditarDespesaUseCaseRequest) {
    const despesaExistente = await this.despesaRepository.findByIdAndUsuario(
      despesaId,
      usuarioId,
    );

    if (!despesaExistente) {
      throw new DespesaNaoEncontradaError();
    }

    const vencimento =
      dataVencimento === undefined
        ? undefined
        : criarDataOpcional(dataVencimento);
    const formaFinal = formaPagamento ?? despesaExistente.formaPagamento;
    let cartaoId: string | null | undefined = undefined;

    if (formaFinal === FormaPagamentoDespesa.CARTAO_CREDITO) {
      const cartaoInformado = cartaoCreditoId ?? despesaExistente.cartaoCreditoId;

      if (!cartaoInformado) {
        throw new CartaoObrigatorioError();
      }

      const cartao = await this.cartaoRepository.findByIdAndUsuario(
        cartaoInformado,
        usuarioId,
        perfilFinanceiroId,
      );

      if (!cartao) {
        throw new CartaoNaoEncontradoError();
      }

      cartaoId = cartao.id;
    }

    if (formaFinal !== FormaPagamentoDespesa.CARTAO_CREDITO) {
      cartaoId = null;
    }

    // Despesa fixa: registros individuais agrupados por parcelamentoId.
    if (despesaExistente.fixa && despesaExistente.parcelamentoId) {
      if (escopo === "todas" && mes) {
        const mesAlvo = criarDataDoMes(mes);
        await this.despesaRepository.updateManyByParcelamentoFromMes(
          despesaExistente.parcelamentoId,
          usuarioId,
          mesAlvo,
          {
            descricao: nome?.trim(),
            valor,
            categoriaNome: categoria === undefined ? undefined : categoria?.trim() || null,
            formaPagamento,
            cartaoCreditoId: cartaoId,
          },
        );
        return formatarDespesa(
          await this.despesaRepository.findByIdAndUsuario(despesaExistente.id, usuarioId) ?? despesaExistente,
        );
      }

      const despesa = await this.despesaRepository.update(despesaExistente.id, {
        descricao: nome?.trim(),
        valor,
        categoriaNome: categoria === undefined ? undefined : categoria?.trim() || null,
        formaPagamento,
        cartaoCreditoId: cartaoId,
        dataVencimento: vencimento,
      });
      return formatarDespesa(despesa);
    }

    const despesa = await this.despesaRepository.update(despesaId, {
      descricao: nome?.trim(),
      valor,
      categoriaNome:
        categoria === undefined ? undefined : categoria?.trim() || null,
      formaPagamento,
      cartaoCreditoId: cartaoId,
      mesReferencia:
        mes === undefined ? undefined : criarMesReferencia(mes, vencimento),
      dataVencimento: vencimento,
      fixa,
    });

    return formatarDespesa(despesa);
  }
}
