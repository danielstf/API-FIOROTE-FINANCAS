import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      // payload do token
      sub: string;
      role: "ADMIN" | "USER";
    };
    user: {
      // usuário após jwtVerify()
      sub: string;
      role: "ADMIN" | "USER";
    };
  }
}
