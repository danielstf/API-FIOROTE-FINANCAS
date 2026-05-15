import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { makeCriarSugestaoFactory } from "../../factory/sugestoes-factory/criar-sugestao-factory";
import { UsuarioNaoEncontradoError } from "../../use-cases/sugestoes/criar-sugestao-usecase";

const criarSugestaoBodySchema = z.object({
  tipo: z.enum(["RECLAMACAO", "ELOGIO", "SUGESTAO", "OUTRO"]),
  titulo: z.string().trim().min(1, "O titulo e obrigatorio"),
  mensagem: z.string().trim().min(1, "A mensagem e obrigatoria"),
});

export async function criarSugestaoController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { tipo, titulo, mensagem } = criarSugestaoBodySchema.parse(request.body);

  try {
    const criarSugestao = makeCriarSugestaoFactory();

    const sugestao = await criarSugestao.execute({
      usuarioId: request.user.sub,
      tipo,
      titulo,
      mensagem,
    });

    return reply.status(201).send(sugestao);
  } catch (error) {
    if (error instanceof UsuarioNaoEncontradoError) {
      return reply.status(404).send({ message: error.message });
    }

    console.error("Erro ao criar sugestao:", error);
    return reply.status(500).send({ message: "Erro ao criar sugestao" });
  }
}
