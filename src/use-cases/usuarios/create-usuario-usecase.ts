import { UsuarioRepositoryInterface } from "../../repositories/interface/usuarios/usuario-repo-interface";
import { Usuario } from "@prisma/client";
import { hash } from "bcryptjs";

interface CreateUsuarioUseCaseRequest {
  email: string;
  senha: string;
  nome: string;
}

interface CreateUsuarioUseCaseResponse {
  usuario: Usuario;
}

export class CreateUsuarioUseCase {
  constructor(private usuarioRepository: UsuarioRepositoryInterface) {}

  async execute({
    email,
    senha,
    nome,
  }: CreateUsuarioUseCaseRequest): Promise<CreateUsuarioUseCaseResponse> {
    const findUsuario = await this.usuarioRepository.findByEmail(email);

    if (findUsuario) {
      throw new Error("Usuário já existe com esse email");
    }

    const hashedSenha = await hash(senha, 10);

    const usuario = await this.usuarioRepository.create({
      email,
      senha: hashedSenha,
      nome,
    });

    return {
      usuario,
    };
  }
}
