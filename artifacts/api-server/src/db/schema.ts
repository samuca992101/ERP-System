import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Tabela de Produtos
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  currentStock: integer('current_stock').default(0),
  minStock: integer('min_stock').default(5), // Útil para a IA avisar quando repor
});

// Tabela de Movimentações (Onde a IA aprende os padrões)
export const inventoryMovements = sqliteTable('inventory_movements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').references(() => products.id),
  quantity: integer('quantity').notNull(), // Positivo = Entrada, Negativo = Saída
  type: text('type').notNull(), // 'IN' ou 'OUT'
  createdAt: text('created_at').notNull(), // A IA usa essa data para prever pedidos futuros
});

// Adicione isto ao final do seu arquivo schema.ts
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
});