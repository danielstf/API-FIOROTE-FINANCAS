import { OAuth2Client } from "google-auth-library";
import { Usuario } from "@prisma/client";
import { env } from "../../env";
import { UsuarioRepositoryInterface } from "../../repositories/interface/usuarios/usuario-repo-interface";
import { atualizarPremiumExpirado } from "../pagamentos/premium-validade";

interface LoginGoogleUseCaseRequest {
  idToken: string;
}

interface LoginGoogleUseCaseResponse {
  usuario: Usuario;
}

export class GoogleLoginNaoConfiguradoError extends Error {
  constructor() {
    super("Login com Google nao configurado");
  }
}

export class GoogleTokenInvalidoError extends Error {
  constructor() {
    super("Token do Google invalido");
  }
}

export class LoginGoogleUseCase {
  constructor(private usuarioRepository: UsuarioRepositoryInterface) {}

  async execute({
    idToken,
  }: LoginGoogleUseCaseRequest): Promise<LoginGoogleUseCaseResponse> {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new GoogleLoginNaoConfiguradoError();
    }

    const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
    const ticket = await googleClient
      .verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
      })
      .catch(() => {
        throw new GoogleTokenInvalidoError();
      });

    const payload = ticket.getPayload();
    const googleId = payload?.sub;
    const email = payload?.email;
    const nome = payload?.name ?? payload?.email?.split("@")[0];

    if (!googleId || !email || !payload?.email_verified) {
      throw new GoogleTokenInvalidoError();
    }

    const usuarioPorGoogle = await this.usuarioRepository.findByGoogleId(googleId);

    if (usuarioPorGoogle) {
      return {
        usuario: await atualizarPremiumExpirado(usuarioPorGoogle),
      };
    }

    const usuarioPorEmail = await this.usuarioRepository.findByEmail(email);

    if (usuarioPorEmail) {
      const usuarioAtualizado = await this.usuarioRepository.update(usuarioPorEmail.id, {
        googleId,
      });

      return {
        usuario: await atualizarPremiumExpirado(usuarioAtualizado),
      };
    }

    const usuario = await this.usuarioRepository.create({
      email,
      nome: nome ?? email,
      googleId,
    });

    return {
      usuario,
    };
  }
}
