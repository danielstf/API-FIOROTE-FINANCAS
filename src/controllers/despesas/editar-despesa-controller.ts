import { FormaPagamentoDespesa } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeEditarDespesaFactory } from "../../factory/despesas-factory/editar-despesa-factory";
import {
  CartaoNaoEncontradoError,
  CartaoObrigatorioError,
} from "../../use-cases/despesas/criar-despesa-usecase";
import { DataDespesaInvalidaError } from "../../use-cases/despesas/despesa-dados";
import { DespesaNaoEncontradaError } from "../../use-cases/despesas/obter-despesa-usecase";
import { MesReceitaInvalidoError } from "../../use-cases/receitas/receita-mes";

const editarDespesaParamsSchema = z.object({
  despesaId: z.string().uuid("Id da despesa invalido"),
});

const formaPagamentoSchema = z
  .enum(["DINHEIRO", "CARTAO_CREDITO"])
  .transform((value) => value as FormaPagamentoDespesa);

const editarDespesaBodySchema = z
  .object({
    // Edicao parcial: envie apenas os campos alterados.
    nome: z.string().trim().min(1, "O nome da despesa e obrigatorio").optional(),
    valor: z.coerce
      .number()
      .positive("O valor da despesa deve ser maior que zero")
      .optional(),
    categoria: z.string().trim().optional().nullable(),
    formaPagamento: formaPagamentoSchema.optional(),
    cartaoCreditoId: z.string().uuid("Id do cartao invalido").optional().nullable(),
    mes: z.string().trim().optional().nullable(),
    dataVencimento: z.string().trim().optional().nullable(),
    fixa: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.nome ||
      data.valor !== undefined ||
      data.categoria !== undefined ||
      data.formaPagamento ||
      data.cartaoCreditoId !== undefined ||
      data.mes !== undefined ||
      data.dataVencimento !== undefined ||
      data.fixa !== undefined,
    {
      message: "Informe ao menos um campo para atualizar",
    },
  );

export async function editarDespesaController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { despesaId } = editarDespesaParamsSchema.parse(request.params);
  const {
    nome,
    valor,
    categoria,
    formaPagamento,
    cartaoCreditoId,
    mes,
    dataVencimento,
    fixa,
  } =
    editarDespesaBodySchema.parse(request.body);

  try {
    const editarDespesa = makeEditarDespesaFactory();

    const despesa = await editarDespesa.execute({
      usuarioId: request.user.sub,
      despesaId,
      nome,
      valor,
      categoria,
      formaPagamento,
      cartaoCreditoId,
      mes,
      dataVencimento,
      fixa,
    });

    return reply.status(200).send(despesa);
  } catch (error) {
    if (error instanceof DespesaNaoEncontradaError) {
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

    console.error("Erro ao editar despesa:", error);
    return reply.status(500).send({ message: "Erro ao editar despesa" });
  }
}
