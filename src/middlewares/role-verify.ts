import { FastifyReply, FastifyRequest } from "fastify";
import { JwtPayload } from "jsonwebtoken";

interface MyJwtPayload extends JwtPayload {
  sub: string;
  role: "ADMIN" | "USER";
}

export function RoleVerify(
  allowed: "ADMIN" | "USER"  | Array<"ADMIN" | "USER">,
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as MyJwtPayload; // Tipagem explícita
    const role = user.role;

    const allowedRoles = Array.isArray(allowed) ? allowed : [allowed];

    if (!allowedRoles.includes(role)) {
      return reply.status(403).send({ message: "Not authorized" });
    }
  };
}
