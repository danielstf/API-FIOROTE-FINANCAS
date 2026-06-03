import fastifyJwt from "@fastify/jwt";
import fastifyCors from "@fastify/cors";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import { fastify } from "fastify";
import { ZodError } from "zod";
import { env } from "./env";
import { usuariosRoutes } from "./controllers/usuarios/routes";
import { pagamentosRoutes } from "./controllers/pagamentos/routes";
import { receitasRoutes } from "./controllers/receitas/routes";
import { despesasRoutes } from "./controllers/despesas/routes";
import { cartoesRoutes } from "./controllers/cartoes/routes";
import { dashboardRoutes } from "./controllers/dashboard/routes";
import { sugestoesRoutes } from "./controllers/sugestoes/routes";
import { perfisRoutes } from "./controllers/perfis/routes";
import { adminRoutes } from "./controllers/admin/routes";
import { pushTokensRoutes } from "./controllers/push-tokens/routes";

export const app = fastify();

const allowedOrigins = new Set([
  "http://localhost:5176",
  "http://localhost:8083",
  "http://localhost:19006",
  "localhost:5176",
  env.FRONTEND_URL,
  "https://front-fiorote-financas-production.up.railway.app",
]);

function isDevelopmentOrigin(origin: string) {
  if (env.NODE_ENV === "production") return false;

  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "10.0.2.2" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.16.") ||
      hostname.startsWith("172.17.") ||
      hostname.startsWith("172.18.") ||
      hostname.startsWith("172.19.") ||
      hostname.startsWith("172.20.") ||
      hostname.startsWith("172.21.") ||
      hostname.startsWith("172.22.") ||
      hostname.startsWith("172.23.") ||
      hostname.startsWith("172.24.") ||
      hostname.startsWith("172.25.") ||
      hostname.startsWith("172.26.") ||
      hostname.startsWith("172.27.") ||
      hostname.startsWith("172.28.") ||
      hostname.startsWith("172.29.") ||
      hostname.startsWith("172.30.") ||
      hostname.startsWith("172.31.")
    );
  } catch {
    return false;
  }
}

app.register(fastifyHelmet);
app.register(fastifyRateLimit, { global: false });

app.register(fastifyCors, {
  origin(origin, callback) {
    const normalizedOrigin = origin?.replace(/\/$/, "");

    if (!origin || !normalizedOrigin || allowedOrigins.has(normalizedOrigin) || isDevelopmentOrigin(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin not allowed by CORS"), false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Perfil-Financeiro-Id"],
  credentials: true,
});

app.get("/", async () => {
  return { status: "ok", service: "api-fiorote-financas" };
});

app.get("/health", async () => {
  return { status: "ok" };
});

app.setErrorHandler((error, _request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: "Revise as informações preenchidas e tente novamente.",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  console.error("Erro não tratado:", error);
  return reply.status(500).send({
    message: "Não foi possível concluir a operação. Tente novamente em alguns minutos.",
  });
});

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  sign: {
    expiresIn: "24h",
  },
});

app.register(usuariosRoutes);
app.register(pagamentosRoutes);
app.register(receitasRoutes);
app.register(despesasRoutes);
app.register(cartoesRoutes);
app.register(dashboardRoutes);
app.register(sugestoesRoutes);
app.register(perfisRoutes);
app.register(adminRoutes);
app.register(pushTokensRoutes);
