'use client';

import React, { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ChefHat, 
  MapPin 
} from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  created_at: string;
  table_number: string;
  items: OrderItem[];
  total: number;
  status: 'pendente' | 'preparando' | 'entregue';
}

export const dynamic = 'force-dynamic';

export default function OrderManagement() {
  const supabase = getSupabase();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    setAudio(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));
    
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    }
  };

  useEffect(() => {
    if (!supabase) return;
    fetchOrders();

    // Inscrição em tempo real para novos pedidos
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          fetchOrders();
          
          // Alerta sonoro
          if (audio) {
            audio.play().catch(e => console.log('Erro ao tocar áudio:', e));
          }

          // Notificação do navegador
          if (Notification.permission === 'granted') {
            new Notification('Novo Pedido Recebido! 🏖️', {
              body: `Mesa ${payload.new.table_number} acabou de fazer um pedido de R$ ${payload.new.total.toFixed(2)}`,
              icon: '/icon-192.png'
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, audio]);

  const fetchOrders = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
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

  const pendingOrders = orders.filter(o => o.status === 'pendente');
  const preparingOrders = orders.filter(o => o.status === 'preparando');

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 lg:p-10 font-sans">
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-dark flex items-center gap-3">
            Gestão de Pedidos
          </h1>
          <p className="text-gray-500 mt-1">Acompanhe a operação do seu quiosque em tempo real.</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
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
        {/* Coluna de Pendentes */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            <h2 className="font-bold text-gray-700 uppercase text-sm tracking-widest">Aguardando</h2>
          </div>
          
          {pendingOrders.length === 0 && (
            <div className="bg-white rounded-3xl p-10 border-2 border-dashed border-gray-100 text-center">
              <p className="text-gray-400 text-sm">Sem pedidos pendentes</p>
            </div>
          )}

          {pendingOrders.map(order => (
            <OrderCard key={order.id} order={order} onAction={() => updateStatus(order.id, 'preparando')} actionLabel="Preparar" />
          ))}
        </div>

        {/* Coluna de Em Preparo */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <h2 className="font-bold text-gray-700 uppercase text-sm tracking-widest">Em Preparo</h2>
          </div>

          {preparingOrders.length === 0 && (
            <div className="bg-white rounded-3xl p-10 border-2 border-dashed border-gray-100 text-center">
              <p className="text-gray-400 text-sm">Cozinha livre no momento</p>
            </div>
          )}

          {preparingOrders.map(order => (
            <OrderCard key={order.id} order={order} onAction={() => updateStatus(order.id, 'entregue')} actionLabel="Entregar" />
          ))}
        </div>

        {/* Coluna de Histórico Recente */}
        <div className="space-y-6 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
             <h2 className="font-bold text-gray-700 uppercase text-sm tracking-widest">Entregues hoje</h2>
          </div>
          
          {orders.filter(o => o.status === 'entregue').slice(0, 5).map(order => (
            <div key={order.id} className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
              <div>
                <div className="font-bold text-sm">Mesa {order.table_number}</div>
                <div className="text-xs text-gray-400">{new Date(order.created_at).toLocaleTimeString()}</div>
              </div>
              <CheckCircle2 className="text-emerald-500" size={20} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function OrderCard({ order, onAction, actionLabel }: { order: Order, onAction: () => void, actionLabel: string }) {
  const timeElapsed = Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / 60000);
  
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5 border-b border-gray-50 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-dark text-white rounded-xl flex items-center justify-center font-bold">
            {order.table_number}
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase font-bold tracking-tight">Mesa</div>
            <div className="font-bold leading-none">#{order.id.slice(0, 4)}</div>
          </div>
        </div>
        <div className={`text-[10px] font-bold px-2 py-1 rounded-full border flex items-center gap-1 ${timeElapsed > 15 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
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
    </div>
  );
}
