export class PlanoPremiumObrigatorioError extends Error {
  constructor() {
    super("Este recurso está disponível apenas para usuários Premium.");
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
