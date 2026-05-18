export class PlanoPremiumObrigatorioError extends Error {
  constructor() {
    super("Recurso disponivel apenas para usuarios Premium");
  }
}

export class LimitePerfisError extends Error {
  constructor() {
    super("Limite de 5 perfis atingido");
  }
}

export class PerfilNaoEncontradoError extends Error {
  constructor() {
    super("Perfil nao encontrado");
  }
}