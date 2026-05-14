import { FastifyReply, FastifyRequest } from "fastify";
import { UsuarioRepository } from "../../repositories/repository/usuarios/usuario-repository";

export async function buscarPerfilController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const usuarioRepository = new UsuarioRepository();
    const usuario = await usuarioRepository.findById(request.user.sub);

    if (!usuario) {
      return reply.status(404).send({ message: "Usuario nao encontrado" });
    }

    return reply.status(200).send({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        plano: usuario.plano,
        premiumExpiraEm: usuario.premiumExpiraEm,
        temSenha: Boolean(usuario.senha),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return reply.status(500).send({ message: "Erro ao buscar perfil" });
  }
}
