import { FormaPagamentoDespesa } from "@prisma/client";
import { CartaoRepositoryInterface } from "../../repositories/interface/cartoes/cartao-repo-interface";
import { DespesaRepositoryInterface } from "../../repositories/interface/despesas/despesa-repo-interface";
import { criarDataOpcional, criarMesReferencia, formatarDespesa } from "./despesa-dados";
import { criarDataDoMes, mesAtualOuFuturo, OperacaoEmMesPassadoError, somarMeses } from "../receitas/receita-mes";
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

    // Despesa fixa: bloqueia operacoes em meses passados.
    if (despesaExistente.fixa && mes) {
      const mesAlvo = criarDataDoMes(mes);
      if (!mesAtualOuFuturo(mesAlvo)) {
        throw new OperacaoEmMesPassadoError();
      }
    }

    // Despesa parcelada: bloqueia se o registro pertence a um mes passado.
    if (!despesaExistente.fixa && despesaExistente.parcelamentoId) {
      if (!mesAtualOuFuturo(new Date(despesaExistente.mesReferencia))) {
        throw new OperacaoEmMesPassadoError();
      }
    }

    // "Editar este e todos os seguintes": encerra o original e cria um novo a partir do mes informado.
    if (despesaExistente.fixa && escopo === "todas" && mes) {
      const mesAlvo = criarDataDoMes(mes);
      const recorrenciaFim = new Date(mesAlvo);
      recorrenciaFim.setDate(recorrenciaFim.getDate() - 1);

      await this.despesaRepository.update(despesaExistente.id, {
        recorrenciaFim,
        recorrenciaEncerrada: true,
      });

      const novaDespesa = await this.despesaRepository.create({
        usuarioId,
        perfilFinanceiroId: perfilFinanceiroId ?? despesaExistente.perfilFinanceiroId,
        descricao: nome?.trim() ?? despesaExistente.descricao,
        valor: valor ?? Number(despesaExistente.valor),
        categoriaNome:
          categoria === undefined
            ? despesaExistente.categoriaNome
            : categoria?.trim() || null,
        formaPagamento: formaFinal,
        cartaoCreditoId:
          cartaoId === undefined ? despesaExistente.cartaoCreditoId : cartaoId,
        mesReferencia: mesAlvo,
        dataVencimento:
          vencimento === undefined ? despesaExistente.dataVencimento : vencimento,
        fixa: true,
        recorrenciaFim: somarMeses(mesAlvo, 12),
      });

      return formatarDespesa(novaDespesa);
    }

    // "Editar só este mês": cria excecao no original e um registro avulso para o mes.
    if (despesaExistente.fixa && mes) {
      const mesReferencia = criarDataDoMes(mes);
      const diferencaMeses =
        (mesReferencia.getFullYear() - despesaExistente.mesReferencia.getFullYear()) *
          12 +
        (mesReferencia.getMonth() - despesaExistente.mesReferencia.getMonth());
      const vencimentoFinal =
        vencimento === undefined
          ? despesaExistente.dataVencimento
            ? somarMeses(despesaExistente.dataVencimento, Math.max(diferencaMeses, 0))
            : null
          : vencimento;

      await this.despesaRepository.createExcecaoRecorrencia(
        despesaExistente.id,
        usuarioId,
        mesReferencia,
      );

      const despesaDoMes = await this.despesaRepository.create({
        usuarioId,
        perfilFinanceiroId: perfilFinanceiroId ?? despesaExistente.perfilFinanceiroId,
        descricao: nome?.trim() ?? despesaExistente.descricao,
        valor: valor ?? Number(despesaExistente.valor),
        categoriaNome:
          categoria === undefined
            ? despesaExistente.categoriaNome
            : categoria?.trim() || null,
        formaPagamento: formaFinal,
        cartaoCreditoId:
          cartaoId === undefined ? despesaExistente.cartaoCreditoId : cartaoId,
        mesReferencia,
        dataVencimento: vencimentoFinal,
        fixa: false,
        numeroParcelas: null,
        parcelaAtual: null,
        parcelamentoId: null,
      });

      return formatarDespesa(despesaDoMes);
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
