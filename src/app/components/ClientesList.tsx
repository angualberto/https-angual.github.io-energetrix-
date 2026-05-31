import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Cliente, Venda } from '../types';
import { formatDate, formatCurrency } from '../utils/dateUtils';
import { Search, Phone, Mail, MapPin, Edit, Plus } from 'lucide-react';
import { ClienteForm } from './ClienteForm';

interface ClientesListProps {
  clientes: Cliente[];
  vendas: Venda[];
  onClienteUpdate: (cliente: Cliente) => void;
  onClienteCreate: (cliente: Cliente) => void;
}

export function ClientesList({ clientes, vendas, onClienteUpdate, onClienteCreate }: ClientesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone.includes(searchTerm)
  );

  const getClienteDebitos = (clienteId: string) => {
    const clienteVendas = vendas.filter(v => v.clienteId === clienteId);
    return clienteVendas.reduce((total, venda) => {
      const debitoVenda = venda.parcelas.reduce((acc, parcela) => acc + parcela.valorRestante, 0);
      return total + debitoVenda;
    }, 0);
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setShowForm(true);
  };

  const handleSave = (cliente: Cliente) => {
    if (editingCliente) {
      onClienteUpdate(cliente);
    } else {
      onClienteCreate(cliente);
    }
    setEditingCliente(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCliente(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold mb-2">Clientes</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie seus clientes</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-primary text-primary-foreground self-start sm:self-auto">
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClientes.map((cliente) => {
          const debito = getClienteDebitos(cliente.id);
          return (
            <Card key={cliente.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-base sm:text-lg truncate mr-2">{cliente.nome}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(cliente)}
                  className="p-1 h-auto flex-shrink-0"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 mr-2" />
                  {cliente.telefone}
                </div>
                
                {cliente.email && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 mr-2" />
                    {cliente.email}
                  </div>
                )}
                
                {cliente.endereco && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    {cliente.endereco}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  Cliente desde {formatDate(cliente.createdAt)}
                </div>
                {debito > 0 && (
                  <Badge variant="destructive">
                    Débito: {formatCurrency(debito)}
                  </Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filteredClientes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </p>
        </div>
      )}

      <ClienteForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSave={handleSave}
        cliente={editingCliente || undefined}
      />
    </div>
  );
}