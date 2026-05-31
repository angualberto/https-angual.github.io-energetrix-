import { useState, useEffect } from 'react';
import { clientesApi, pedidosApi, vendasApi } from '../utils/api';
import { Cliente, Pedido, Venda } from '../types';

export function useSupabaseData() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useLocalStorage, setUseLocalStorage] = useState(false);

  // Carregar dados do localStorage
  const loadFromLocalStorage = () => {
    try {
      const clientesLocal = localStorage.getItem('clientes');
      const pedidosLocal = localStorage.getItem('pedidos');
      const vendasLocal = localStorage.getItem('vendas');

      setClientes(clientesLocal ? JSON.parse(clientesLocal) : []);
      setPedidos(pedidosLocal ? JSON.parse(pedidosLocal) : []);
      setVendas(vendasLocal ? JSON.parse(vendasLocal) : []);
    } catch (err) {
      console.error('Erro ao carregar do localStorage:', err);
    }
  };

  // Salvar dados no localStorage
  const saveToLocalStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error('Erro ao salvar no localStorage:', err);
    }
  };

  // Carregar dados iniciais
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Tentar carregar do Supabase primeiro
      const [clientesData, pedidosData, vendasData] = await Promise.all([
        clientesApi.getAll(),
        pedidosApi.getAll(),
        vendasApi.getAll()
      ]);

      setClientes(clientesData);
      setPedidos(pedidosData);
      setVendas(vendasData);
      setUseLocalStorage(false);

      // Sincronizar com localStorage
      saveToLocalStorage('clientes', clientesData);
      saveToLocalStorage('pedidos', pedidosData);
      saveToLocalStorage('vendas', vendasData);
    } catch (err) {
      console.error('Erro ao carregar dados do Supabase, usando localStorage:', err);
      
      // Se falhar, usar localStorage
      setUseLocalStorage(true);
      loadFromLocalStorage();
      setError(null); // Limpar erro já que estamos usando fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers para clientes
  const handleClienteCreate = async (cliente: Cliente) => {
    try {
      if (useLocalStorage) {
        const novoCliente = { ...cliente, id: Date.now().toString() };
        const novosClientes = [...clientes, novoCliente];
        setClientes(novosClientes);
        saveToLocalStorage('clientes', novosClientes);
        return novoCliente;
      }

      const novoCliente = await clientesApi.create(cliente);
      setClientes(prev => [...prev, novoCliente]);
      return novoCliente;
    } catch (err) {
      console.error('Erro ao criar cliente:', err);
      throw err;
    }
  };

  const handleClienteUpdate = async (clienteAtualizado: Cliente) => {
    try {
      if (useLocalStorage) {
        const novosClientes = clientes.map(c => c.id === clienteAtualizado.id ? clienteAtualizado : c);
        setClientes(novosClientes);
        saveToLocalStorage('clientes', novosClientes);
        return clienteAtualizado;
      }

      const cliente = await clientesApi.update(clienteAtualizado);
      setClientes(prev => prev.map(c => c.id === cliente.id ? cliente : c));
      return cliente;
    } catch (err) {
      console.error('Erro ao atualizar cliente:', err);
      throw err;
    }
  };

  // Handlers para pedidos
  const handlePedidoCreate = async (pedido: Pedido) => {
    try {
      if (useLocalStorage) {
        const novoPedido = { ...pedido, id: Date.now().toString() };
        const novosPedidos = [...pedidos, novoPedido];
        setPedidos(novosPedidos);
        saveToLocalStorage('pedidos', novosPedidos);
        return novoPedido;
      }

      const novoPedido = await pedidosApi.create(pedido);
      setPedidos(prev => [...prev, novoPedido]);
      return novoPedido;
    } catch (err) {
      console.error('Erro ao criar pedido:', err);
      throw err;
    }
  };

  const handlePedidoUpdate = async (pedidoAtualizado: Pedido) => {
    try {
      if (useLocalStorage) {
        const novosPedidos = pedidos.map(p => p.id === pedidoAtualizado.id ? pedidoAtualizado : p);
        setPedidos(novosPedidos);
        saveToLocalStorage('pedidos', novosPedidos);
        return pedidoAtualizado;
      }

      const pedido = await pedidosApi.update(pedidoAtualizado);
      setPedidos(prev => prev.map(p => p.id === pedido.id ? pedido : p));
      return pedido;
    } catch (err) {
      console.error('Erro ao atualizar pedido:', err);
      throw err;
    }
  };

  const handlePedidoDelete = async (pedidoId: string) => {
    try {
      if (useLocalStorage) {
        const novosPedidos = pedidos.filter(p => p.id !== pedidoId);
        setPedidos(novosPedidos);
        saveToLocalStorage('pedidos', novosPedidos);
        return;
      }

      await pedidosApi.delete(pedidoId);
      setPedidos(prev => prev.filter(p => p.id !== pedidoId));
    } catch (err) {
      console.error('Erro ao deletar pedido:', err);
      throw err;
    }
  };

  // Handlers para vendas
  const handleVendaCreate = async (venda: Venda) => {
    try {
      if (useLocalStorage) {
        const novaVenda = { ...venda, id: Date.now().toString() };
        const novasVendas = [...vendas, novaVenda];
        setVendas(novasVendas);
        saveToLocalStorage('vendas', novasVendas);
        
        // Atualizar pedido se vinculado
        if (venda.pedidoId) {
          const pedidoAtualizado = pedidos.find(p => p.id === venda.pedidoId);
          if (pedidoAtualizado) {
            await handlePedidoUpdate({ ...pedidoAtualizado, status: 'convertido' });
          }
        }
        
        return novaVenda;
      }

      const novaVenda = await vendasApi.create(venda);
      setVendas(prev => [...prev, novaVenda]);
      
      // Se a venda foi criada a partir de um pedido, atualizar status do pedido
      if (venda.pedidoId) {
        const pedidoAtualizado = pedidos.find(p => p.id === venda.pedidoId);
        if (pedidoAtualizado) {
          await handlePedidoUpdate({ ...pedidoAtualizado, status: 'convertido' });
        }
      }
      
      return novaVenda;
    } catch (err) {
      console.error('Erro ao criar venda:', err);
      throw err;
    }
  };

  const handleVendaUpdate = async (vendaAtualizada: Venda) => {
    try {
      if (useLocalStorage) {
        const novasVendas = vendas.map(v => v.id === vendaAtualizada.id ? vendaAtualizada : v);
        setVendas(novasVendas);
        saveToLocalStorage('vendas', novasVendas);
        return vendaAtualizada;
      }

      const venda = await vendasApi.update(vendaAtualizada);
      setVendas(prev => prev.map(v => v.id === venda.id ? venda : v));
      return venda;
    } catch (err) {
      console.error('Erro ao atualizar venda:', err);
      throw err;
    }
  };

  // Adicionar clientes aos pedidos e vendas
  const pedidosComClientes = pedidos.map(pedido => ({
    ...pedido,
    cliente: clientes.find(c => c.id === pedido.clienteId)
  }));

  const vendasComClientes = vendas.map(venda => ({
    ...venda,
    cliente: clientes.find(c => c.id === venda.clienteId) || null
  }));

  return {
    clientes,
    pedidos: pedidosComClientes,
    vendas: vendasComClientes,
    isLoading,
    error,
    handleClienteCreate,
    handleClienteUpdate,
    handlePedidoCreate,
    handlePedidoUpdate,
    handlePedidoDelete,
    handleVendaCreate,
    handleVendaUpdate,
    reloadData: loadData,
  };
}