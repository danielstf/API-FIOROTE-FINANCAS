import { Prisma, Usuario } from "@prisma/client";

export interface UsuarioRepositoryInterface {
  //criar um novo usuario
  create(data: Prisma.UsuarioCreateInput): Promise<Usuario>;

  //Buscar um usuario no banco de dados com base no e-mail.
  findByEmail(email: string): Promise<Usuario | null>;

  //Buscar um usuario pelo id (geralmente UUID).
  findById(id: string): Promise<Usuario | null>;

  //Buscar um usuario pelo token de redefinicao de senha.
  findByResetToken(resetToken: string): Promise<Usuario | null>;

  //Atualizar dados de um usuario.
  update(id: string, data: Prisma.UsuarioUpdateInput): Promise<Usuario>;
}
