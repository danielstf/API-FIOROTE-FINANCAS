import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { prisma } from "../../lib/prisma";

const bodySchema = z.object({
  tipo: z.enum(["RECLAMACAO", "ELOGIO", "SUGESTAO", "OUTRO"]),
  titulo: z.string().trim().min(1),
  mensagem: z.string().trim().min(1),
  nome: z.string().trim().min(1),
  email: z.string().trim().email(),
});

export async function criarContatoController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { tipo, titulo, mensagem, nome, email } = bodySchema.parse(request.body);

  const contato = await prisma.contatoSuporte.create({
    data: { tipo, titulo: titulo.trim(), mensagem: mensagem.trim(), nome: nome.trim(), email: email.trim().toLowerCase() },
  });

  return reply.status(201).send(contato);
}
