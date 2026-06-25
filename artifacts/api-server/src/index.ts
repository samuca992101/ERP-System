import app from "./app";
import { logger } from "./lib/logger";

// Tenta pegar a porta do ambiente ou usa 3000 por padrão
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${process.env.PORT}"`);
}

// O Express no Windows às vezes precisa do host '0.0.0.0' para evitar bloqueios
app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "Server listening");
});