import { Router, type IRouter } from "express";
import { db, salesTable, productsTable } from "@workspace/db";
import { eq, gte, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { subDays, format, startOfDay } from "date-fns";

const router: IRouter = Router();

router.get("/dashboard", requireAuth, async (_req, res): Promise<void> => {
  const today = startOfDay(new Date());

  // Total products
  const [{ count: totalProducts }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productsTable);

  // Sales today
  const todaySales = await db
    .select({
      quantity: salesTable.quantity,
      price: productsTable.price,
    })
    .from(salesTable)
    .innerJoin(productsTable, eq(salesTable.productId, productsTable.id))
    .where(gte(salesTable.saleDate, today));

  const salesToday = todaySales.reduce((sum, s) => sum + s.quantity, 0);
  const salesTodayValue = todaySales.reduce((sum, s) => sum + s.quantity * Number(s.price), 0);

  // Low stock products (current_stock <= minimum_stock)
  const lowStockProducts = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(sql`${productsTable.currentStock} <= ${productsTable.minimumStock}`);

  const lowStockCount = lowStockProducts.length;

  // Weekly sales (last 7 days)
  const weeklySales = [];
  for (let i = 6; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const dayStart = startOfDay(day);
    const dayEnd = new Date(dayStart.getTime() + 86400000);

    const daySales = await db
      .select({
        quantity: salesTable.quantity,
        price: productsTable.price,
      })
      .from(salesTable)
      .innerJoin(productsTable, eq(salesTable.productId, productsTable.id))
      .where(sql`${salesTable.saleDate} >= ${dayStart} AND ${salesTable.saleDate} < ${dayEnd}`);

    weeklySales.push({
      day: format(day, "EEE"),
      quantity: daySales.reduce((sum, s) => sum + s.quantity, 0),
      value: daySales.reduce((sum, s) => sum + s.quantity * Number(s.price), 0),
    });
  }

  // Top products by sales quantity
  const topProductsRaw = await db
    .select({
      name: productsTable.name,
      quantity: sql<number>`sum(${salesTable.quantity})::int`,
    })
    .from(salesTable)
    .innerJoin(productsTable, eq(salesTable.productId, productsTable.id))
    .groupBy(productsTable.name)
    .orderBy(sql`sum(${salesTable.quantity}) desc`)
    .limit(5);

  const topProducts = topProductsRaw.map((p) => ({ name: p.name, quantity: p.quantity || 0 }));

  const topProduct = topProducts.length > 0 ? topProducts[0].name : "N/A";

  // Stock evolution for last 7 days (simplified: use current stock as latest)
  const allProducts = await db.select().from(productsTable).limit(5);
  const stockEvolution = allProducts.map((p) => ({
    date: format(new Date(), "yyyy-MM-dd"),
    stock: p.currentStock,
    productName: p.name,
  }));

  // Simple forecast: average daily sales of last 7 days
  const totalWeeklySales = weeklySales.reduce((sum, d) => sum + d.quantity, 0);
  const forecastTomorrow = Math.round(totalWeeklySales / 7);

  res.json({
    totalProducts,
    salesToday,
    salesTodayValue: Math.round(salesTodayValue * 100) / 100,
    lowStockCount,
    topProduct,
    forecastTomorrow,
    weeklySales,
    topProducts,
    stockEvolution,
  });
});

export default router;
