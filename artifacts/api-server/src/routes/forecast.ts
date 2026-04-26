import { Router, type IRouter } from "express";
import { db, salesTable, productsTable } from "@workspace/db";
import { eq, gte } from "drizzle-orm";
import { subDays } from "date-fns";
import { requireAuth } from "../middlewares/auth";
import { GetForecastParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function computeForecast(product: typeof productsTable.$inferSelect) {
  const thirtyDaysAgo = subDays(new Date(), 30);

  const sales = await db
    .select({ quantity: salesTable.quantity, saleDate: salesTable.saleDate })
    .from(salesTable)
    .where(eq(salesTable.productId, product.id));

  const recentSales = sales.filter((s) => s.saleDate >= thirtyDaysAgo);

  // Group by day
  const dailyMap: Record<string, number> = {};
  for (const sale of recentSales) {
    const key = sale.saleDate.toISOString().split("T")[0];
    dailyMap[key] = (dailyMap[key] || 0) + sale.quantity;
  }

  const dailyValues = Object.values(dailyMap);

  if (dailyValues.length === 0) {
    return {
      productId: product.id,
      productName: product.name,
      forecastQuantity: 0,
      currentStock: product.currentStock,
      minimumStock: product.minimumStock,
      suggestedPurchase: Math.max(0, product.minimumStock - product.currentStock),
      confidence: 0,
      trend: "stable",
    };
  }

  // Moving average of last 7 days
  const last7 = dailyValues.slice(-7);
  const avg7 = last7.reduce((s, v) => s + v, 0) / last7.length;

  // Simple linear trend: compare first half vs second half
  const half = Math.floor(dailyValues.length / 2);
  let trend: "up" | "down" | "stable" = "stable";
  if (half > 0) {
    const firstHalfAvg = dailyValues.slice(0, half).reduce((s, v) => s + v, 0) / half;
    const secondHalfAvg = dailyValues.slice(half).reduce((s, v) => s + v, 0) / (dailyValues.length - half);
    if (secondHalfAvg > firstHalfAvg * 1.1) trend = "up";
    else if (secondHalfAvg < firstHalfAvg * 0.9) trend = "down";
  }

  const forecastQuantity = Math.round(avg7);
  const neededStock = product.currentStock - forecastQuantity;
  const suggestedPurchase = Math.max(0, -neededStock + product.minimumStock);

  // Confidence: based on sample size
  const confidence = Math.min(95, Math.round(60 + dailyValues.length * 1.5));

  return {
    productId: product.id,
    productName: product.name,
    forecastQuantity,
    currentStock: product.currentStock,
    minimumStock: product.minimumStock,
    suggestedPurchase,
    confidence,
    trend,
  };
}

router.get("/forecast", requireAuth, async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable);
  const forecasts = await Promise.all(products.map(computeForecast));
  res.json(forecasts);
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
