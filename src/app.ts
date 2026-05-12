import fastifyJwt from "@fastify/jwt";
import { fastify } from "fastify";
import { env } from "./env";
import fastifyCors from "@fastify/cors";
import { usuariosRoutes } from "./controllers/usuarios/routes";
import { pagamentosRoutes } from "./controllers/pagamentos/routes";

export const app = fastify();

app.register(fastifyCors, {
  origin: ["localhost:5173", "http://localhost:5173"], // Substitua pelo domínio do seu frontend
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true, // ⬅️ adicione aqui
});

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  sign: {
    expiresIn: "24h", // ⬅️ define o tempo de expiração do token
  },
});

app.register(usuariosRoutes);
app.register(pagamentosRoutes);
