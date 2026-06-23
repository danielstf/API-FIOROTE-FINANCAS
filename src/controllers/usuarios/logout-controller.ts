import { FastifyReply, FastifyRequest } from "fastify";

export async function logoutController(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  reply.clearCookie("fiorote_token", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  return reply.status(200).send({ message: "Logout realizado com sucesso." });
}
