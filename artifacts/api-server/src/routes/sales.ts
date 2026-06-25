import { Router, type IRouter } from "express";
import { db } from "../db"; // Importa a conexão configurada
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { z } from "zod";

// 1. IMPORTAÇÃO CORRETA DAS TABELAS
import { products as productsTable, inventoryMovements as salesTable } from "../db/schema";

// 2. SCHEMAS DE VALIDAÇÃO LOCAIS (Substituindo o @workspace/api-zod)
const CreateSaleBody = z.object({
  productId: z.number(),
  quantity: z.number().positive(),
  saleDate: z.string().optional(),
});

const router: IRouter = Router();

router.get("/sales", requireAuth, async (_req, res): Promise<void> => {
  try {
    const sales = await db
      .select({
        id: salesTable.id,
        productId: salesTable.productId,
        productName: productsTable.name,
        quantity: salesTable.quantity,
        // No seu schema.ts você usou 'createdAt' em vez de 'saleDate'
        saleDate: salesTable.createdAt, 
        price: productsTable.price,
      })
      .from(salesTable)
      .innerJoin(productsTable, eq(salesTable.productId, productsTable.id));

    const mapped = sales.map((s) => ({
      id: s.id,
      productId: s.productId,
      productName: s.productName,
      quantity: s.quantity,
      // Garante que a data seja uma string ISO para o frontend
      saleDate: new Date(s.saleDate).toISOString(),
      totalValue: s.quantity * Number(s.price),
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar vendas" });
  }
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
    res.status(400).json({ error: "Produto não encontrado" });
    return;
  }

  if ((product.currentStock || 0) < quantity) {
    res.status(400).json({ error: `Estoque insuficiente. Disponível: ${product.currentStock} unidades` });
    return;
  }

  // SQLite armazena datas como string. Vamos padronizar:
  const saleDateStr = parsed.data.saleDate 
    ? new Date(parsed.data.saleDate).toISOString() 
    : new Date().toISOString();

  const [sale] = await db
    .insert(salesTable)
    .values({ 
      productId, 
      quantity: -quantity, // Venda é uma saída, então salvamos como negativo
      type: 'OUT',
      createdAt: saleDateStr 
    })
    .returning();

  await db
    .update(productsTable)
    .set({ currentStock: (product.currentStock || 0) - quantity })
    .where(eq(productsTable.id, productId));

  res.status(201).json({
    id: sale.id,
    productId: sale.productId,
    productName: product.name,
    quantity,
    saleDate: saleDateStr,
    totalValue: quantity * Number(product.price),
  });
});

export default router;