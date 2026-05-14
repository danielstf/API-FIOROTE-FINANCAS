import { FormaPagamentoDespesa } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeCriarDespesaFactory } from "../../factory/despesas-factory/criar-despesa-factory";
import {
  CartaoNaoEncontradoError,
  CartaoObrigatorioError,
  UsuarioNaoEncontradoError,
} from "../../use-cases/despesas/criar-despesa-usecase";
import { DataDespesaInvalidaError } from "../../use-cases/despesas/despesa-dados";
import { MesReceitaInvalidoError } from "../../use-cases/receitas/receita-mes";

const formaPagamentoSchema = z
  .enum([
    "DINHEIRO",
    "CARTAO_CREDITO",
    "CARTAO_DEBITO",
    "VALE_ALIMENTACAO",
    "VALE_REFEICAO",
    "BOLETO",
  ])
  .transform((value) => value as FormaPagamentoDespesa);

const criarDespesaBodySchema = z.object({
  // Nome e valor sao obrigatorios para manter o lancamento compreensivel.
  nome: z.string().trim().min(1, "O nome da despesa e obrigatorio"),
  valor: z.coerce.number().positive("O valor da despesa deve ser maior que zero"),
  categoria: z.string().trim().optional().nullable(),
  formaPagamento: formaPagamentoSchema.default("DINHEIRO" as FormaPagamentoDespesa),
  cartaoCreditoId: z.string().uuid("Id do cartao invalido").optional().nullable(),
  mes: z.string().trim().optional().nullable(),
  dataVencimento: z.string().trim().optional().nullable(),
  fixa: z.boolean().optional().default(false),
  numeroParcelas: z.coerce.number().int().positive().optional(),
});

export async function criarDespesaController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const {
    nome,
    valor,
    categoria,
    formaPagamento,
    cartaoCreditoId,
    mes,
    dataVencimento,
    fixa,
    numeroParcelas,
  } =
    criarDespesaBodySchema.parse(request.body);

  try {
    const criarDespesa = makeCriarDespesaFactory();

    const despesa = await criarDespesa.execute({
      usuarioId: request.user.sub,
      nome,
      valor,
      categoria,
      formaPagamento,
      cartaoCreditoId,
      mes,
      dataVencimento,
      fixa,
      numeroParcelas,
    });

    return reply.status(201).send(despesa);
  } catch (error) {
    if (error instanceof UsuarioNaoEncontradoError) {
      return reply.status(404).send({ message: error.message });
    }

    if (error instanceof DataDespesaInvalidaError) {
      return reply.status(400).send({ message: error.message });
    }

    if (error instanceof MesReceitaInvalidoError) {
      return reply.status(400).send({ message: error.message });
    }

    if (error instanceof CartaoObrigatorioError) {
      return reply.status(400).send({ message: error.message });
    }

    if (error instanceof CartaoNaoEncontradoError) {
      return reply.status(404).send({ message: error.message });
    }

    console.error("Erro ao criar despesa:", error);
    return reply.status(500).send({ message: "Erro ao criar despesa" });
  }
}
