'use client';

import React, { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ChefHat, 
  MapPin,
  RefreshCw,
  Search,
  X
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { Suspense } from 'react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  vendor_id: string;
  created_at: string;
  table_number: string;
  client_name?: string;
  items: OrderItem[];
  total: number;
  status: 'pendente' | 'preparando' | 'entregue';
}

export const dynamic = 'force-dynamic';

export default function OrderManagement() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold text-gray-400">Carregando painel de pedidos...</div>}>
      <OrderManagementContent />
    </Suspense>
  );
}

function OrderManagementContent() {
  const supabase = getSupabase();
  const searchParams = useSearchParams();
  const vendorIdFromQuery = searchParams.get('vendor');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(vendorIdFromQuery);
  const [vendors, setVendors] = useState<any[]>([]);

  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    fetchVendors();
    setAudio(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));
    
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, [supabase]);

  const fetchVendors = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('vendors').select('*');
    setVendors(data || []);
    if (data?.length && !vendorIdFromQuery) {
      setSelectedVendorId(data[0].id);
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    }
  };

  useEffect(() => {
    if (!supabase || !selectedVendorId) {
      if (!selectedVendorId) setLoading(false);
      return;
    }
    fetchOrders();

    // Inscrição em tempo real filtrada por vendor_id
    const channel = supabase
      .channel(`orders-vendor-${selectedVendorId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders',
          filter: `vendor_id=eq.${selectedVendorId}`
        },
        (payload) => {
          const newOrder = payload.new as Order;
          setOrders(prev => [newOrder, ...prev]);
          if (audio) audio.play().catch(e => console.log('Erro áudio:', e));
          if (Notification.permission === 'granted') {
            new Notification('🏖️ Novo Pedido!', { body: `Guarda-Sol ${newOrder.table_number}` });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updatedOrder = payload.new as Order;
          if (updatedOrder.vendor_id === selectedVendorId) {
            setOrders(prev => prev.map(order => order.id === updatedOrder.id ? updatedOrder : order));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, audio, selectedVendorId]);

  const fetchOrders = async () => {
    if (!supabase || !selectedVendorId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('vendor_id', selectedVendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: Order['status']) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      // O fetchOrders será chamado automaticamente pelo listener do Supabase
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pendente': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'preparando': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'entregue': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen font-sans">
        <div className="animate-pulse flex flex-col items-center">
          <ChefHat size={48} className="text-primary mb-4" />
          <p className="text-gray-500 font-medium">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  const filteredOrders = orders.filter(order => 
    order.table_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.client_name && order.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingOrders = filteredOrders.filter(o => o.status === 'pendente');
  const preparingOrders = filteredOrders.filter(o => o.status === 'preparando');

  return (
    <div className="min-h-screen bg-[#FDF8F3] p-6 lg:p-10 font-sans">
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-200">
               <ChefHat size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-display font-black text-dark tracking-tighter">
                Gestão de Pedidos
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <select 
                  value={selectedVendorId || ''}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="bg-transparent text-orange-500 font-bold text-[10px] uppercase tracking-[0.2em] py-1 border-b border-orange-100 outline-none cursor-pointer"
                >
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button 
              onClick={() => {
                setLoading(true);
                fetchOrders();
              }}
              className="p-2 text-gray-400 hover:text-primary transition-colors rounded-xl hover:bg-white bg-white/50 border border-orange-100/50"
              title="Recarregar manual"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          
          <div className="mt-8 relative max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-300 group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar guarda-sol, cliente ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white pl-12 pr-10 py-4 rounded-[20px] border border-orange-100 outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium shadow-sm"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-dark"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <Link 
            href="/dashboard/mapa"
            className="flex items-center gap-2 bg-white text-dark px-4 py-2 rounded-xl text-sm font-bold border border-orange-100 hover:border-primary transition-all shadow-sm"
          >
            <MapPin size={18} className="text-primary" /> Ver Mapa
          </Link>

          {!notificationsEnabled && (
            <button 
              onClick={requestNotificationPermission}
              className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold border border-amber-100 hover:bg-amber-100 transition-colors"
            >
              <AlertCircle size={18} /> Ativar Notificações
            </button>
          )}
          
          <div className="flex gap-4">
            <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
            <AlertCircle className="text-amber-500" size={20} />
            <div>
              <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Pendentes</div>
              <div className="text-xl font-bold">{pendingOrders.length}</div>
            </div>
          </div>
          <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
            <Clock className="text-blue-500" size={20} />
            <div>
              <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">No Fogo</div>
              <div className="text-xl font-bold">{preparingOrders.length}</div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <LayoutGroup>
          {/* Coluna de Pendentes */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              <h2 className="font-bold text-gray-700 uppercase text-sm tracking-widest">Aguardando</h2>
            </div>
            
            <AnimatePresence mode="popLayout">
              {pendingOrders.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-3xl p-10 border-2 border-dashed border-gray-100 text-center"
                >
                  <p className="text-gray-400 text-sm">Sem pedidos pendentes</p>
                </motion.div>
              )}

              {pendingOrders.map(order => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onAction={() => updateStatus(order.id, 'preparando')} 
                  actionLabel="Preparar" 
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Coluna de Em Preparo */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <h2 className="font-bold text-gray-700 uppercase text-sm tracking-widest">Em Preparo</h2>
            </div>

            <AnimatePresence mode="popLayout">
              {preparingOrders.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-3xl p-10 border-2 border-dashed border-gray-100 text-center"
                >
                  <p className="text-gray-400 text-sm">Cozinha livre no momento</p>
                </motion.div>
              )}

              {preparingOrders.map(order => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onAction={() => updateStatus(order.id, 'entregue')} 
                  actionLabel="Entregar" 
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Coluna de Histórico Recente */}
          <div className="space-y-6 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
            <div className="flex items-center gap-2 mb-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
               <h2 className="font-bold text-gray-700 uppercase text-sm tracking-widest">Entregues hoje</h2>
            </div>
            
            <AnimatePresence mode="popLayout">
              {filteredOrders.filter(o => o.status === 'entregue').slice(0, 5).map(order => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={order.id} 
                  className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 flex justify-between items-center"
                >
                  <div>
                    <div className="font-bold text-sm">Guarda-Sol {order.table_number}</div>
                    <div className="text-xs text-gray-400">{new Date(order.created_at).toLocaleTimeString()}</div>
                  </div>
                  <CheckCircle2 className="text-emerald-500" size={20} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      </main>
    </div>
  );
}

function OrderCard({ order, onAction, actionLabel }: { order: Order, onAction: () => void, actionLabel: string }) {
  const timeElapsed = Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / 60000);
  const isDelayed = timeElapsed > 15;
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`bg-white rounded-3xl shadow-sm border-2 overflow-hidden hover:shadow-md transition-all ${isDelayed ? 'border-red-500 shadow-red-100 animate-pulse-subtle' : 'border-gray-100'}`}
    >
      <div className={`p-5 border-b flex justify-between items-start ${isDelayed ? 'bg-red-50/50 border-red-100' : 'border-gray-50'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-sm ${isDelayed ? 'bg-red-600' : 'bg-dark'} text-white`}>
            {order.table_number}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <div className="text-[9px] text-gray-400 uppercase font-black tracking-tight">Guarda-Sol</div>
              {isDelayed && <AlertCircle size={12} className="text-red-500 animate-bounce" />}
            </div>
            <div className="font-bold leading-none text-dark">{order.client_name || 'Cliente'}</div>
            <div className="text-[10px] text-gray-400 mt-1">Ref: #{order.id.slice(0, 4)}</div>
          </div>
        </div>
        <div className={`text-[10px] font-bold px-2 py-1 rounded-full border flex items-center gap-1 ${isDelayed ? 'bg-red-100 text-red-600 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
          <Clock size={10} /> {timeElapsed}min
        </div>
      </div>
      
      <div className="p-5 space-y-3">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center text-[10px] font-bold">{item.quantity}x</span>
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-5 bg-gray-50 flex items-center justify-between">
        <div className="font-bold text-dark">R$ {order.total.toFixed(2)}</div>
        <button 
          onClick={onAction}
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary/10"
        >
          {actionLabel} <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  );
}
