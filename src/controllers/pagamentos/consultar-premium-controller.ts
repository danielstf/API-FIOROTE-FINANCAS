import { FastifyReply, FastifyRequest } from "fastify";
import {
  ConsultarPremiumUseCase,
  UsuarioNaoEncontradoError,
} from "../../use-cases/pagamentos/consultar-premium-usecase";

export async function consultarPremiumController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    // Caso de uso responsavel por buscar o status premium do usuario logado.
    const consultarPremium = new ConsultarPremiumUseCase();

    // O id do usuario vem do token JWT validado pelo middleware da rota.
    const premium = await consultarPremium.execute({
      usuarioId: request.user.sub,
    });

    return reply.status(200).send(premium);
  } catch (error) {
    // Usuario inexistente retorna 404 para diferenciar de falhas internas.
    if (error instanceof UsuarioNaoEncontradoError) {
      return reply.status(404).send({ message: error.message });
    }

    // Erros inesperados ficam no log do servidor e retornam resposta generica.
    console.error("Erro ao consultar premium:", error);
    return reply.status(500).send({ message: "Erro ao consultar premium" });
  }
}
