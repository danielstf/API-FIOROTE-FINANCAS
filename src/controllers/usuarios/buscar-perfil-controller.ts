import { FastifyReply, FastifyRequest } from "fastify";
import { UsuarioRepository } from "../../repositories/repository/usuarios/usuario-repository";
import { atualizarPremiumExpirado } from "../../use-cases/pagamentos/premium-validade";

export async function buscarPerfilController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const usuarioRepository = new UsuarioRepository();
    const usuario = await usuarioRepository.findById(request.user.sub);

    if (!usuario) {
      return reply.status(404).send({ message: "Usuário não encontrado." });
    }

    const usuarioAtualizado = await atualizarPremiumExpirado(usuario);

    return reply.status(200).send({
      usuario: {
        id: usuarioAtualizado.id,
        nome: usuarioAtualizado.nome,
        email: usuarioAtualizado.email,
        role: usuarioAtualizado.role,
        plano: usuarioAtualizado.plano,
        premiumExpiraEm: usuarioAtualizado.premiumExpiraEm,
        temSenha: Boolean(usuarioAtualizado.senha),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return reply.status(500).send({ message: "Erro ao buscar perfil" });
  }
}
