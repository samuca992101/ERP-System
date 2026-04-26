import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateProductBody,
  GetProductParams,
  GetProductResponse,
  UpdateProductParams,
  UpdateProductBody,
  UpdateProductResponse,
  DeleteProductParams,
  DeleteProductResponse,
  ListProductsResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function mapProduct(p: typeof productsTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: Number(p.price),
    currentStock: p.currentStock,
    minimumStock: p.minimumStock,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/products", requireAuth, async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable).orderBy(productsTable.name);
  res.json(ListProductsResponse.parse(products.map(mapProduct)));
});

router.post("/products", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, category, price, currentStock, minimumStock } = parsed.data;
  const [product] = await db
    .insert(productsTable)
    .values({ name, category, price: String(price), currentStock, minimumStock })
    .returning();

  res.status(201).json(GetProductResponse.parse(mapProduct(product)));
});

router.get("/products/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!product) {
    res.status(404).json({ error: "Produto não encontrado" });
    return;
  }

  res.json(GetProductResponse.parse(mapProduct(product)));
});

router.put("/products/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, category, price, currentStock, minimumStock } = parsed.data;
  const [product] = await db
    .update(productsTable)
    .set({ name, category, price: String(price), currentStock, minimumStock })
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Produto não encontrado" });
    return;
  }

  res.json(UpdateProductResponse.parse(mapProduct(product)));
});

router.delete("/products/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db.delete(productsTable).where(eq(productsTable.id, params.data.id)).returning();
  if (!product) {
    res.status(404).json({ error: "Produto não encontrado" });
    return;
  }

  res.json(DeleteProductResponse.parse({ success: true }));
});

export default router;
