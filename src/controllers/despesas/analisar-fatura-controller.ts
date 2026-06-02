import { FastifyReply, FastifyRequest } from 'fastify';
import z from 'zod';
import { extrairItensFatura } from '../../lib/pdf-parser';

const bodySchema = z.object({
  pdf: z.string().min(1, 'PDF base64 é obrigatório'),
});

export async function analisarFaturaController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { pdf } = bodySchema.parse(request.body);

  try {
    const buffer = Buffer.from(pdf, 'base64');
    const itens = await extrairItensFatura(buffer);
    return reply.status(200).send({ itens });
  } catch (error) {
    console.error('Erro ao analisar fatura:', error);
    return reply.status(422).send({
      message: 'Não foi possível ler o PDF. Verifique se é uma fatura válida e não está protegida por senha.',
    });
  }
}
