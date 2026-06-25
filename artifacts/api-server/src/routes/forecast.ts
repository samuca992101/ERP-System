import { Router, type IRouter } from "express";
import { db } from "../db"; 
import { eq, gte } from "drizzle-orm";
import { subDays } from "date-fns";
import { requireAuth } from "../middlewares/auth";
import { z } from "zod";

// 1. IMPORTAÇÃO DAS TABELAS (O que estava faltando)
// Certifique-se que os nomes 'products' e 'inventoryMovements' batem com o seu schema.ts
import { products as productsTable, inventoryMovements as salesTable } from "../db/schema";

const router: IRouter = Router();

// Validador local para substituir o GetForecastParams do workspace
const GetForecastParams = z.object({
  productId: z.string().transform(Number)
});

async function computeForecast(product: typeof productsTable.$inferSelect) {
  const thirtyDaysAgo = subDays(new Date(), 30);

  const sales = await db
    .select({ 
        quantity: salesTable.quantity, 
        // Se no seu schema você usou createdAt, mude aqui para createdAt
        saleDate: salesTable.createdAt 
    })
    .from(salesTable)
    .where(eq(salesTable.productId, product.id));

  // Converte a string de data do SQLite para objeto Date se necessário
  const recentSales = sales.filter((s) => new Date(s.saleDate) >= thirtyDaysAgo);

 const dailyMap: Record<string, number> = {};
  
  for (const sale of recentSales) {
    // 1. Filtra apenas quantidades menores que 0 (saídas/vendas)
    // Isso evita que entradas de estoque (compras) sujem o cálculo da demanda
    if (sale.quantity < 0) {
      const key = new Date(sale.saleDate).toISOString().split("T")[0];
      
      // 2. Math.abs() converte o -10 do banco em uma demanda positiva de 10
      dailyMap[key] = (dailyMap[key] || 0) + Math.abs(sale.quantity);
    }
  }

  const dailyValues = Object.values(dailyMap);

  if (dailyValues.length === 0) {
    return {
      productId: product.id,
      productName: product.name,
      forecastQuantity: 0,
      currentStock: product.currentStock,
      minimumStock: product.minStock, // Ajustado para bater com o seu schema (minStock)
      suggestedPurchase: Math.max(0, (product.minStock || 0) - (product.currentStock || 0)),
      confidence: 0,
      trend: "stable",
    };
  }

  const last7 = dailyValues.slice(-7);
  const avg7 = last7.reduce((s, v) => s + v, 0) / last7.length;

  const half = Math.floor(dailyValues.length / 2);
  let trend: "up" | "down" | "stable" = "stable";
  if (half > 0) {
    const firstHalfAvg = dailyValues.slice(0, half).reduce((s, v) => s + v, 0) / half;
    const secondHalfAvg = dailyValues.slice(half).reduce((s, v) => s + v, 0) / (dailyValues.length - half);
    if (secondHalfAvg > firstHalfAvg * 1.1) trend = "up";
    else if (secondHalfAvg < firstHalfAvg * 0.9) trend = "down";
  }

  const forecastQuantity = Math.round(avg7);
  const suggestedPurchase = Math.max(0, (product.minStock || 0) - (product.currentStock || 0) + forecastQuantity);

  return {
    productId: product.id,
    productName: product.name,
    forecastQuantity,
    currentStock: product.currentStock,
    minimumStock: product.minStock,
    suggestedPurchase,
    confidence: Math.min(95, Math.round(60 + dailyValues.length * 1.5)),
    trend,
  };
}

router.get("/forecast", requireAuth, async (_req, res): Promise<void> => {
  try {
    const products = await db.select().from(productsTable);
    const forecasts = await Promise.all(products.map(computeForecast));
    res.json(forecasts);
  } catch (error) {
    res.status(500).json({ error: "Erro ao processar previsão" });
  }
});

router.get("/forecast/:productId", requireAuth, async (req, res): Promise<void> => {
  const params = GetForecastParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.productId));
  if (!product) {
    res.status(404).json({ error: "Produto não encontrado" });
    return;
  }

  const forecast = await computeForecast(product);
  res.json(forecast);
});

export default router;