import { Router, type IRouter } from "express";
import { db, salesTable, productsTable } from "@workspace/db";
import { eq, sql, gte } from "drizzle-orm";
import { subDays } from "date-fns";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/alerts", requireAuth, async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable);
  const alerts = [];

  for (const product of products) {
    // Critical stock alert
    if (product.currentStock === 0) {
      alerts.push({
        id: `critical-${product.id}`,
        type: "critical_stock",
        productId: product.id,
        productName: product.name,
        message: `${product.name} is completely out of stock!`,
        severity: "critical",
      });
    } else if (product.currentStock <= product.minimumStock) {
      alerts.push({
        id: `low-stock-${product.id}`,
        type: "restock_needed",
        productId: product.id,
        productName: product.name,
        message: `${product.name} has low stock: ${product.currentStock} units (minimum: ${product.minimumStock})`,
        severity: product.currentStock <= product.minimumStock / 2 ? "high" : "medium",
      });
    }

    // Check for idle products (no sales in last 14 days)
    const fourteenDaysAgo = subDays(new Date(), 14);
    const recentSales = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(salesTable)
      .where(
        sql`${salesTable.productId} = ${product.id} AND ${salesTable.saleDate} >= ${fourteenDaysAgo}`
      );

    const recentCount = recentSales[0]?.count || 0;
    if (recentCount === 0 && product.currentStock > 0) {
      alerts.push({
        id: `idle-${product.id}`,
        type: "idle_product",
        productId: product.id,
        productName: product.name,
        message: `${product.name} has had no sales in the last 14 days`,
        severity: "low",
      });
    }

    // High demand alert: sales in last 3 days are higher than normal
    const threeDaysAgo = subDays(new Date(), 3);
    const thirtyDaysAgo = subDays(new Date(), 30);

    const recentSales3d = await db
      .select({ total: sql<number>`sum(${salesTable.quantity})::int` })
      .from(salesTable)
      .where(sql`${salesTable.productId} = ${product.id} AND ${salesTable.saleDate} >= ${threeDaysAgo}`);

    const allSales30d = await db
      .select({ total: sql<number>`sum(${salesTable.quantity})::int` })
      .from(salesTable)
      .where(sql`${salesTable.productId} = ${product.id} AND ${salesTable.saleDate} >= ${thirtyDaysAgo}`);

    const recent3dTotal = recentSales3d[0]?.total || 0;
    const avg30dPer3d = ((allSales30d[0]?.total || 0) / 30) * 3;

    if (avg30dPer3d > 0 && recent3dTotal > avg30dPer3d * 1.5) {
      alerts.push({
        id: `high-demand-${product.id}`,
        type: "high_demand",
        productId: product.id,
        productName: product.name,
        message: `${product.name} has unusually high demand in the last 3 days`,
        severity: "medium",
      });
    }
  }

  res.json(alerts);
});

export default router;
