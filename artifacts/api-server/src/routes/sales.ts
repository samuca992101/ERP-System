import { Router, type IRouter } from "express";
import { db, salesTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateSaleBody, ListSalesResponse } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/sales", requireAuth, async (_req, res): Promise<void> => {
  const sales = await db
    .select({
      id: salesTable.id,
      productId: salesTable.productId,
      productName: productsTable.name,
      quantity: salesTable.quantity,
      saleDate: salesTable.saleDate,
      price: productsTable.price,
    })
    .from(salesTable)
    .innerJoin(productsTable, eq(salesTable.productId, productsTable.id))
    .orderBy(salesTable.saleDate);

  const mapped = sales.map((s) => ({
    id: s.id,
    productId: s.productId,
    productName: s.productName,
    quantity: s.quantity,
    saleDate: s.saleDate.toISOString(),
    totalValue: s.quantity * Number(s.price),
  }));

  res.json(ListSalesResponse.parse(mapped));
});

router.post("/sales", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateSaleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { productId, quantity } = parsed.data;

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product) {
    res.status(400).json({ error: "Product not found" });
    return;
  }

  if (product.currentStock < quantity) {
    res.status(400).json({ error: `Insufficient stock. Available: ${product.currentStock}` });
    return;
  }

  const saleDate = parsed.data.saleDate ? new Date(parsed.data.saleDate) : new Date();

  const [sale] = await db
    .insert(salesTable)
    .values({ productId, quantity, saleDate })
    .returning();

  await db
    .update(productsTable)
    .set({ currentStock: product.currentStock - quantity })
    .where(eq(productsTable.id, productId));

  res.status(201).json({
    id: sale.id,
    productId: sale.productId,
    productName: product.name,
    quantity: sale.quantity,
    saleDate: sale.saleDate.toISOString(),
    totalValue: sale.quantity * Number(product.price),
  });
});

export default router;
