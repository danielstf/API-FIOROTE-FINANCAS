import { UsuarioRepositoryInterface } from "../../repositories/interface/usuarios/usuario-repo-interface";
import { Usuario } from "@prisma/client";
import { compare } from "bcryptjs";

interface LoginUsuarioUseCaseRequest {
  email: string;
  senha: string;
}

interface LoginUsuarioUseCaseResponse {
  usuario: Usuario;
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Credenciais invalidas");
  }
}

export class LoginUsuarioUseCase {
  constructor(private usuarioRepository: UsuarioRepositoryInterface) {}

  async execute({
    email,
    senha,
  }: LoginUsuarioUseCaseRequest): Promise<LoginUsuarioUseCaseResponse> {
    const usuario = await this.usuarioRepository.findByEmail(email);

    if (!usuario) {
      throw new InvalidCredentialsError();
    }

    const senhaCorreta = await compare(senha, usuario.senha);

    if (!senhaCorreta) {
      throw new InvalidCredentialsError();
    }

    return {
      usuario,
    };
  }
}
