import { Router, type IRouter } from "express";
import { db } from "../db";
import { products as productsTable } from "../db/schema";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/alerts", requireAuth, async (_req, res): Promise<void> => {
  try {
    // Filtra produtos onde o estoque atual é menor ou igual ao mínimo
    const products = await db.select().from(productsTable);
    const alerts = products
      .filter(p => (p.currentStock || 0) <= (p.minStock || 0))
      .map(p => ({
        id: p.id,
        productName: p.name,
        currentStock: p.currentStock,
        minimumStock: p.minStock,
        severity: (p.currentStock || 0) === 0 ? "high" : "medium"
      }));

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar alertas" });
  }
});

export default router;