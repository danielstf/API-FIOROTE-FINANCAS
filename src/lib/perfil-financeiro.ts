import { FastifyRequest } from "fastify";

export function getPerfilFinanceiroId(request: FastifyRequest) {
  const value = request.headers["x-perfil-financeiro-id"];
  const perfilId = Array.isArray(value) ? value[0] : value;

  return perfilId && perfilId.trim() ? perfilId.trim() : null;
}
