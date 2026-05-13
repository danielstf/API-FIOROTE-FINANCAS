import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeCriarReceitaFactory } from "../../factory/receitas-factory/criar-receita-factory";
import { UsuarioNaoEncontradoError } from "../../use-cases/receitas/criar-receita-usecase";
import { MesReceitaInvalidoError } from "../../use-cases/receitas/receita-mes";

const criarReceitaBodySchema = z.object({
  // Nome pode vir de opcoes padrao ou ser digitado manualmente pelo usuario.
  nome: z.string().trim().min(1, "O nome da receita e obrigatorio"),
  valor: z.coerce.number().positive("O valor da receita deve ser maior que zero"),
  mes: z.string().trim().min(1, "O mes da receita e obrigatorio"),
  fixa: z.boolean().optional().default(false),
  numeroParcelas: z.coerce.number().int().positive().optional(),
});

export async function criarReceitaController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { nome, valor, mes, fixa, numeroParcelas } =
    criarReceitaBodySchema.parse(request.body);

  try {
    const criarReceita = makeCriarReceitaFactory();

    const receita = await criarReceita.execute({
      usuarioId: request.user.sub,
      nome,
      valor,
      mes,
      fixa,
      numeroParcelas,
    });

    return reply.status(201).send(receita);
  } catch (error) {
    if (error instanceof UsuarioNaoEncontradoError) {
      return reply.status(404).send({ message: error.message });
    }

    if (error instanceof MesReceitaInvalidoError) {
      return reply.status(400).send({ message: error.message });
    }

    console.error("Erro ao criar receita:", error);
    return reply.status(500).send({ message: "Erro ao criar receita" });
  }
}
