import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Cria o cliente para o SQLite local usando o driver que funciona no Windows
const client = createClient({ 
  url: 'file:sqlite.db' 
});

// Exporta a instância 'db' que você usa em todas as suas rotas
export const db = drizzle(client, { schema });