import { randomUUID } from "node:crypto";
import { FormaPagamentoDespesa } from "@prisma/client";
import { CartaoRepositoryInterface } from "../../repositories/interface/cartoes/cartao-repo-interface";
import { DespesaRepositoryInterface } from "../../repositories/interface/despesas/despesa-repo-interface";
import { UsuarioRepositoryInterface } from "../../repositories/interface/usuarios/usuario-repo-interface";
import { somarMeses } from "../receitas/receita-mes";
import { criarDataOpcional, criarMesReferencia, formatarDespesa } from "./despesa-dados";

interface CriarDespesaUseCaseRequest {
  usuarioId: string;
  nome: string;
  valor: number;
  categoria?: string | null;
  formaPagamento: FormaPagamentoDespesa;
  cartaoCreditoId?: string | null;
  mes?: string | null;
  dataVencimento?: string | null;
  fixa?: boolean;
  numeroParcelas?: number;
}

export class UsuarioNaoEncontradoError extends Error {
  constructor() {
    super("Usuario nao encontrado");
  }
}

export class CartaoObrigatorioError extends Error {
  constructor() {
    super("Selecione um cartao para despesas no cartao de credito");
  }
}

export class CartaoNaoEncontradoError extends Error {
  constructor() {
    super("Cartao nao encontrado");
  }
}

export class CriarDespesaUseCase {
  constructor(
    private despesaRepository: DespesaRepositoryInterface,
    private usuarioRepository: UsuarioRepositoryInterface,
    private cartaoRepository: CartaoRepositoryInterface,
  ) {}

  async execute({
    usuarioId,
    nome,
    valor,
    categoria,
    formaPagamento,
    cartaoCreditoId,
    mes,
    dataVencimento,
    fixa = false,
    numeroParcelas,
  }: CriarDespesaUseCaseRequest) {
    // Confere se o usuario do token ainda existe antes de gravar a despesa.
    const usuario = await this.usuarioRepository.findById(usuarioId);

    if (!usuario) {
      throw new UsuarioNaoEncontradoError();
    }

    let cartaoId: string | null = null;

    if (formaPagamento === FormaPagamentoDespesa.CARTAO_CREDITO) {
      if (!cartaoCreditoId) {
        throw new CartaoObrigatorioError();
      }

      const cartao = await this.cartaoRepository.findByIdAndUsuario(
        cartaoCreditoId,
        usuarioId,
      );

      if (!cartao) {
        throw new CartaoNaoEncontradoError();
      }

      cartaoId = cartao.id;
    }

    const vencimento = criarDataOpcional(dataVencimento);
    const mesReferencia = criarMesReferencia(mes, vencimento);
    const totalParcelas = numeroParcelas && numeroParcelas > 1 ? numeroParcelas : 1;
    const parcelamentoId = totalParcelas > 1 ? randomUUID() : null;

    const despesas = await this.despesaRepository.createMany(
      Array.from({ length: totalParcelas }, (_, index) => ({
        usuarioId,
        descricao:
          totalParcelas > 1
            ? `${nome.trim()} (${index + 1}/${totalParcelas})`
            : nome.trim(),
        valor,
        categoriaNome: categoria?.trim() || null,
        formaPagamento,
        cartaoCreditoId: cartaoId,
        mesReferencia: somarMeses(mesReferencia, index),
        dataVencimento: vencimento ? somarMeses(vencimento, index) : null,
        fixa,
        numeroParcelas: totalParcelas > 1 ? totalParcelas : null,
        parcelaAtual: totalParcelas > 1 ? index + 1 : null,
        parcelamentoId,
      })),
    );

    return {
      despesas: despesas.map(formatarDespesa),
    };
  }
}
