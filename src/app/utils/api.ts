import { projectId, publicAnonKey } from './supabase/info';
import { Cliente, Pedido, Venda } from '../types';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-cb4c73c7`;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`,
};

// ===== CLIENTES API =====
export const clientesApi = {
  getAll: async (): Promise<Cliente[]> => {
    const response = await fetch(`${API_BASE}/clientes`, { headers });
    if (!response.ok) {
      throw new Error(`Erro ao buscar clientes: ${response.status}`);
    }
    const data = await response.json();
    return data.map((cliente: any) => ({
      ...cliente,
      createdAt: new Date(cliente.createdAt)
    }));
  },

  create: async (cliente: Cliente): Promise<Cliente> => {
    const response = await fetch(`${API_BASE}/clientes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(cliente),
    });
    if (!response.ok) {
      throw new Error(`Erro ao criar cliente: ${response.status}`);
    }
    const data = await response.json();
    return {
      ...data,
      createdAt: new Date(data.createdAt)
    };
  },

  update: async (cliente: Cliente): Promise<Cliente> => {
    const response = await fetch(`${API_BASE}/clientes/${cliente.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(cliente),
    });
    if (!response.ok) {
      throw new Error(`Erro ao atualizar cliente: ${response.status}`);
    }
    const data = await response.json();
    return {
      ...data,
      createdAt: new Date(data.createdAt)
    };
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/clientes/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) {
      throw new Error(`Erro ao deletar cliente: ${response.status}`);
    }
  },
};

// ===== PEDIDOS API =====
export const pedidosApi = {
  getAll: async (): Promise<Pedido[]> => {
    const response = await fetch(`${API_BASE}/pedidos`, { headers });
    if (!response.ok) {
      throw new Error(`Erro ao buscar pedidos: ${response.status}`);
    }
    const data = await response.json();
    return data.map((pedido: any) => ({
      ...pedido,
      createdAt: new Date(pedido.createdAt)
    }));
  },

  create: async (pedido: Pedido): Promise<Pedido> => {
    const response = await fetch(`${API_BASE}/pedidos`, {
      method: 'POST',
      headers,
      body: JSON.stringify(pedido),
    });
    if (!response.ok) {
      throw new Error(`Erro ao criar pedido: ${response.status}`);
    }
    const data = await response.json();
    return {
      ...data,
      createdAt: new Date(data.createdAt)
    };
  },

  update: async (pedido: Pedido): Promise<Pedido> => {
    const response = await fetch(`${API_BASE}/pedidos/${pedido.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(pedido),
    });
    if (!response.ok) {
      throw new Error(`Erro ao atualizar pedido: ${response.status}`);
    }
    const data = await response.json();
    return {
      ...data,
      createdAt: new Date(data.createdAt)
    };
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/pedidos/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) {
      throw new Error(`Erro ao deletar pedido: ${response.status}`);
    }
  },
};

// ===== VENDAS API =====
export const vendasApi = {
  getAll: async (): Promise<Venda[]> => {
    const response = await fetch(`${API_BASE}/vendas`, { headers });
    if (!response.ok) {
      throw new Error(`Erro ao buscar vendas: ${response.status}`);
    }
    const data = await response.json();
    return data.map((venda: any) => ({
      ...venda,
      createdAt: new Date(venda.createdAt),
      parcelas: venda.parcelas.map((parcela: any) => ({
        ...parcela,
        dataVencimento: new Date(parcela.dataVencimento),
        recebimentos: parcela.recebimentos.map((recebimento: any) => ({
          ...recebimento,
          createdAt: new Date(recebimento.createdAt)
        }))
      }))
    }));
  },

  create: async (venda: Venda): Promise<Venda> => {
    const response = await fetch(`${API_BASE}/vendas`, {
      method: 'POST',
      headers,
      body: JSON.stringify(venda),
    });
    if (!response.ok) {
      throw new Error(`Erro ao criar venda: ${response.status}`);
    }
    const data = await response.json();
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      parcelas: data.parcelas.map((parcela: any) => ({
        ...parcela,
        dataVencimento: new Date(parcela.dataVencimento),
        recebimentos: parcela.recebimentos.map((recebimento: any) => ({
          ...recebimento,
          createdAt: new Date(recebimento.createdAt)
        }))
      }))
    };
  },

  update: async (venda: Venda): Promise<Venda> => {
    const response = await fetch(`${API_BASE}/vendas/${venda.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(venda),
    });
    if (!response.ok) {
      throw new Error(`Erro ao atualizar venda: ${response.status}`);
    }
    const data = await response.json();
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      parcelas: data.parcelas.map((parcela: any) => ({
        ...parcela,
        dataVencimento: new Date(parcela.dataVencimento),
        recebimentos: parcela.recebimentos.map((recebimento: any) => ({
          ...recebimento,
          createdAt: new Date(recebimento.createdAt)
        }))
      }))
    };
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/vendas/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) {
      throw new Error(`Erro ao deletar venda: ${response.status}`);
    }
  },
};

// ===== MIGRATION API =====
export const migrationApi = {
  migrate: async (data: { clientes: Cliente[], pedidos: Pedido[], vendas: Venda[] }) => {
    const response = await fetch(`${API_BASE}/migrate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Erro na migração: ${response.status}`);
    }
    return await response.json();
  },
};