import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-cb4c73c7/health", (c) => {
  return c.json({ status: "ok" });
});

// ===== CLIENTES ROUTES =====
app.get("/make-server-cb4c73c7/clientes", async (c) => {
  try {
    const clientes = await kv.getByPrefix("cliente:");
    return c.json(clientes || []);
  } catch (error) {
    console.log("Erro ao buscar clientes:", error);
    return c.json({ error: "Erro interno do servidor" }, 500);
  }
});

app.post("/make-server-cb4c73c7/clientes", async (c) => {
  try {
    const cliente = await c.req.json();
    const key = `cliente:${cliente.id}`;
    await kv.set(key, cliente);
    return c.json(cliente, 201);
  } catch (error) {
    console.log("Erro ao criar cliente:", error);
    return c.json({ error: "Erro interno do servidor" }, 500);
  }
});

app.put("/make-server-cb4c73c7/clientes/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const cliente = await c.req.json();
    const key = `cliente:${id}`;
    await kv.set(key, cliente);
    return c.json(cliente);
  } catch (error) {
    console.log("Erro ao atualizar cliente:", error);
    return c.json({ error: "Erro interno do servidor" }, 500);
  }
});

app.delete("/make-server-cb4c73c7/clientes/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const key = `cliente:${id}`;
    await kv.del(key);
    return c.json({ success: true });
  } catch (error) {
    console.log("Erro ao deletar cliente:", error);
    return c.json({ error: "Erro interno do servidor" }, 500);
  }
});

// ===== PEDIDOS ROUTES =====
app.get("/make-server-cb4c73c7/pedidos", async (c) => {
  try {
    const pedidos = await kv.getByPrefix("pedido:");
    return c.json(pedidos || []);
  } catch (error) {
    console.log("Erro ao buscar pedidos:", error);
    return c.json({ error: "Erro interno do servidor" }, 500);
  }
});

app.post("/make-server-cb4c73c7/pedidos", async (c) => {
  try {
    const pedido = await c.req.json();
    const key = `pedido:${pedido.id}`;
    await kv.set(key, pedido);
    return c.json(pedido, 201);
  } catch (error) {
    console.log("Erro ao criar pedido:", error);
    return c.json({ error: "Erro interno do servidor" }, 500);
  }
});

app.put("/make-server-cb4c73c7/pedidos/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const pedido = await c.req.json();
    const key = `pedido:${id}`;
    await kv.set(key, pedido);
    return c.json(pedido);
  } catch (error) {
    console.log("Erro ao atualizar pedido:", error);
    return c.json({ error: "Erro interno do servidor" }, 500);
  }
});

app.delete("/make-server-cb4c73c7/pedidos/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const key = `pedido:${id}`;
    await kv.del(key);
    return c.json({ success: true });
  } catch (error) {
    console.log("Erro ao deletar pedido:", error);
    return c.json({ error: "Erro interno do servidor" }, 500);
  }
});

// ===== VENDAS ROUTES =====
app.get("/make-server-cb4c73c7/vendas", async (c) => {
  try {
    const vendas = await kv.getByPrefix("venda:");
    return c.json(vendas || []);
  } catch (error) {
    console.log("Erro ao buscar vendas:", error);
    return c.json({ error: "Erro interno do servidor" }, 500);
  }
});

app.post("/make-server-cb4c73c7/vendas", async (c) => {
  try {
    const venda = await c.req.json();
    const key = `venda:${venda.id}`;
    await kv.set(key, venda);
    return c.json(venda, 201);
  } catch (error) {
    console.log("Erro ao criar venda:", error);
    return c.json({ error: "Erro interno do servidor" }, 500);
  }
});

app.put("/make-server-cb4c73c7/vendas/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const venda = await c.req.json();
    const key = `venda:${id}`;
    await kv.set(key, venda);
    return c.json(venda);
  } catch (error) {
    console.log("Erro ao atualizar venda:", error);
    return c.json({ error: "Erro interno do servidor" }, 500);
  }
});

app.delete("/make-server-cb4c73c7/vendas/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const key = `venda:${id}`;
    await kv.del(key);
    return c.json({ success: true });
  } catch (error) {
    console.log("Erro ao deletar venda:", error);
    return c.json({ error: "Erro interno do servidor" }, 500);
  }
});

// ===== MIGRATION ROUTE =====
app.post("/make-server-cb4c73c7/migrate", async (c) => {
  try {
    const { clientes, pedidos, vendas } = await c.req.json();
    
    console.log(`Migrando ${clientes?.length || 0} clientes, ${pedidos?.length || 0} pedidos, ${vendas?.length || 0} vendas`);
    
    // Migrar clientes
    if (clientes && clientes.length > 0) {
      for (const cliente of clientes) {
        const key = `cliente:${cliente.id}`;
        await kv.set(key, cliente);
      }
    }
    
    // Migrar pedidos
    if (pedidos && pedidos.length > 0) {
      for (const pedido of pedidos) {
        const key = `pedido:${pedido.id}`;
        await kv.set(key, pedido);
      }
    }
    
    // Migrar vendas
    if (vendas && vendas.length > 0) {
      for (const venda of vendas) {
        const key = `venda:${venda.id}`;
        await kv.set(key, venda);
      }
    }
    
    return c.json({ 
      success: true, 
      message: `Migração concluída: ${clientes?.length || 0} clientes, ${pedidos?.length || 0} pedidos, ${vendas?.length || 0} vendas` 
    });
  } catch (error) {
    console.log("Erro na migração:", error);
    return c.json({ error: "Erro interno do servidor durante migração" }, 500);
  }
});

Deno.serve(app.fetch);