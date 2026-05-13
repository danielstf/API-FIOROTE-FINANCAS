import { prisma } from "../../../lib/prisma";
import { Prisma, Usuario } from "@prisma/client";
import { UsuarioRepositoryInterface } from "../../interface/usuarios/usuario-repo-interface";

export class UsuarioRepository implements UsuarioRepositoryInterface {
  // Cria um novo usuário no banco de dados
  async create(data: Prisma.UsuarioCreateInput): Promise<Usuario> {
    const usuario = await prisma.usuario.create({
      data,
    });
    return usuario;
  }

  // Busca um usuário pelo Email/login (e-mail/login)
  async findByEmail(email: string): Promise<Usuario | null> {
    const usuario = await prisma.usuario.findFirst({
      where: { email },
    });
    return usuario;
  }

  // Busca um usuário pelo ID (geralmente UUID)
  async findById(id: string): Promise<Usuario | null> {
    const usuario = await prisma.usuario.findFirst({
      where: { id },
    });
    return usuario;
  }

  // Busca um usuario pelo identificador unico retornado pelo Google
  async findByGoogleId(googleId: string): Promise<Usuario | null> {
    const usuario = await prisma.usuario.findFirst({
      where: { googleId },
    });
    return usuario;
  }

  // Busca um usuario pelo token de redefinicao de senha
  async findByResetToken(resetToken: string): Promise<Usuario | null> {
    const usuario = await prisma.usuario.findFirst({
      where: { resetToken },
    });
    return usuario;
  }

  // Atualiza dados de um usuario
  async update(id: string, data: Prisma.UsuarioUpdateInput): Promise<Usuario> {
    const usuario = await prisma.usuario.update({
      where: { id },
      data,
    });
    return usuario;
  }
}
