import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeEditarReceitaFactory } from "../../factory/receitas-factory/editar-receita-factory";
import { ReceitaNaoEncontradaError } from "../../use-cases/receitas/obter-receita-usecase";
import { MesReceitaInvalidoError } from "../../use-cases/receitas/receita-mes";

const editarReceitaParamsSchema = z.object({
  receitaId: z.string().uuid("Id da receita invalido"),
});

const editarReceitaBodySchema = z
  .object({
    // Todos os campos sao opcionais para permitir edicao parcial.
    nome: z.string().trim().min(1, "O nome da receita e obrigatorio").optional(),
    valor: z.coerce
      .number()
      .positive("O valor da receita deve ser maior que zero")
      .optional(),
    mes: z.string().trim().min(1, "O mes da receita e obrigatorio").optional(),
    fixa: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.nome ||
      data.valor !== undefined ||
      data.mes ||
      data.fixa !== undefined,
    {
      message: "Informe ao menos um campo para atualizar",
    },
  );

export async function editarReceitaController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { receitaId } = editarReceitaParamsSchema.parse(request.params);
  const { nome, valor, mes, fixa } = editarReceitaBodySchema.parse(request.body);

  try {
    const editarReceita = makeEditarReceitaFactory();

    const receita = await editarReceita.execute({
      usuarioId: request.user.sub,
      receitaId,
      nome,
      valor,
      mes,
      fixa,
    });

    return reply.status(200).send(receita);
  } catch (error) {
    if (error instanceof ReceitaNaoEncontradaError) {
      return reply.status(404).send({ message: error.message });
    }

    if (error instanceof MesReceitaInvalidoError) {
      return reply.status(400).send({ message: error.message });
    }

    console.error("Erro ao editar receita:", error);
    return reply.status(500).send({ message: "Erro ao editar receita" });
  }
}
