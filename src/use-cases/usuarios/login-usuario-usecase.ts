import { UsuarioRepositoryInterface } from "../../repositories/interface/usuarios/usuario-repo-interface";
import { Usuario } from "@prisma/client";
import { compare } from "bcryptjs";
import { atualizarPremiumExpirado } from "../pagamentos/premium-validade";

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

    if (!usuario.senha) {
      throw new InvalidCredentialsError();
    }

    const senhaCorreta = await compare(senha, usuario.senha);

    if (!senhaCorreta) {
      throw new InvalidCredentialsError();
    }

    // No login tambem conferimos se o premium venceu para devolver dados atuais.
    const usuarioAtualizado = await atualizarPremiumExpirado(usuario);

    return {
      usuario: usuarioAtualizado,
    };
  }
}
