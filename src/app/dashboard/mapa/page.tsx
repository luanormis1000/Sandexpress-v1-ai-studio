'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import { 
  MapPin, 
  Map as MapIcon, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Check, 
  X,
  Navigation,
  Move
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UmbrellaPoint {
  id: string;
  vendor_id: string;
  umbrella_number: string;
  x: number;
  y: number;
}

interface ActiveOrder {
  id: string;
  table_number: string;
  status: string;
  client_name?: string;
}

export default function UmbrellaMap() {
  const supabase = getSupabase();
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [points, setPoints] = useState<UmbrellaPoint[]>([]);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<{ x: number, y: number } | null>(null);
  const [tempNumber, setTempNumber] = useState('');

  // Fetch data
  useEffect(() => {
    fetchVendors();
  }, [supabase]);

  const fetchVendors = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('vendors').select('*');
    setVendors(data || []);
    if (data?.length) setSelectedVendorId(data[0].id);
  };

  useEffect(() => {
    if (selectedVendorId) {
      fetchPoints();
      fetchActiveOrders();
      subscribeToOrders();
    }
  }, [selectedVendorId]);

  const fetchPoints = async () => {
    if (!supabase || !selectedVendorId) return;
    setIsLoading(true);
    // In a real app, this would be a Supabase query
    // const { data } = await supabase.from('umbrellas').select('*').eq('vendor_id', selectedVendorId);
    // setPoints(data || []);
    
    // For now, using localStorage to simulate persistence as we can't easily create tables
    const saved = localStorage.getItem(`map_points_${selectedVendorId}`);
    if (saved) {
      setPoints(JSON.parse(saved));
    } else {
      setPoints([]);
    }
    setIsLoading(false);
  };

  const fetchActiveOrders = async () => {
    if (!supabase || !selectedVendorId) return;
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('vendor_id', selectedVendorId)
      .in('status', ['pendente', 'preparando']);
    setActiveOrders(data || []);
  };

  const subscribeToOrders = () => {
    if (!supabase || !selectedVendorId) return;
    const channel = supabase
      .channel(`map_orders_${selectedVendorId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `vendor_id=eq.${selectedVendorId}`
      }, () => {
        fetchActiveOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const savePoints = (newPoints: UmbrellaPoint[]) => {
    setPoints(newPoints);
    if (selectedVendorId) {
      localStorage.setItem(`map_points_${selectedVendorId}`, JSON.stringify(newPoints));
      // In production, we'd also sync to DB:
      // supabase.from('umbrellas').upsert(newPoints.map(p => ({...p, vendor_id: selectedVendorId})));
    }
  };

  const handleGridClick = (x: number, y: number) => {
    if (!isEditMode) return;
    
    // Check if point already exists
    const existing = points.find(p => p.x === x && p.y === y);
    if (existing) {
      if (confirm(`Remover guarda-sol #${existing.umbrella_number}?`)) {
        savePoints(points.filter(p => p.id !== existing.id));
      }
      return;
    }

    if (points.length >= 50) {
      alert('Limite de 50 guarda-sóis atingido por tela.');
      return;
    }

    setShowConfirmModal({ x, y });
    setTempNumber('');
  };

  const confirmAllocation = () => {
    if (!showConfirmModal || !tempNumber) return;
    
    // Check if number already registered
    if (points.find(p => p.umbrella_number === tempNumber)) {
      alert('Este número de guarda-sol já foi alocado.');
      return;
    }

    const newPoint: UmbrellaPoint = {
      id: Math.random().toString(36).substr(2, 9),
      vendor_id: selectedVendorId!,
      umbrella_number: tempNumber,
      x: showConfirmModal.x,
      y: showConfirmModal.y
    };

    savePoints([...points, newPoint]);
    setShowConfirmModal(null);
  };

  const GRID_SIZE = 10;
  const cells = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      cells.push({ x, y });
    }
  }

  const getUmbrellaAt = (x: number, y: number) => {
    return points.find(p => p.x === x && p.y === y);
  };

  const hasOrder = (num: string) => {
    return activeOrders.some(o => o.table_number === num);
  };

  return (
    <div className="p-6 lg:p-10 font-sans max-w-7xl mx-auto min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-dark flex items-center gap-3">
            <MapIcon className="text-primary" size={32} /> Mapa de Área
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <select 
              value={selectedVendorId || ''}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="bg-transparent text-primary font-bold text-[10px] uppercase tracking-[0.2em] py-1 border-b border-orange-100 outline-none cursor-pointer"
            >
              {vendors.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all ${isEditMode ? 'bg-emerald-500 text-white' : 'bg-dark text-white shadow-xl shadow-dark/20'}`}
          >
            {isEditMode ? <Check size={20} /> : <Move size={20} />}
            {isEditMode ? 'Finalizar Edição' : 'Editar Posições'}
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-4 gap-10">
        {/* Map Grid */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[40px] p-4 lg:p-10 shadow-2xl border border-gray-100 relative overflow-hidden">
            {/* Sand Pattern Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#d4b483 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }}></div>
            
            <div 
              className="grid gap-2 lg:gap-4 relative z-10" 
              style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
            >
              {cells.map(cell => {
                const umbrella = getUmbrellaAt(cell.x, cell.y);
                const order = umbrella ? activeOrders.find(o => o.table_number === umbrella.umbrella_number) : null;
                const isBlinking = order && (order.status === 'pendente' || order.status === 'preparando');

                return (
                  <div 
                    key={`${cell.x}-${cell.y}`}
                    onClick={() => handleGridClick(cell.x, cell.y)}
                    className={`
                      aspect-square rounded-2xl flex flex-col items-center justify-center relative cursor-pointer transition-all duration-300
                      ${umbrella ? 'bg-orange-50 border-2 border-orange-200 shadow-sm' : 'bg-gray-50 border-2 border-dashed border-gray-100 hover:bg-orange-50/30'}
                      ${isEditMode && !umbrella ? 'hover:scale-105 hover:border-primary' : ''}
                    `}
                  >
                    {umbrella ? (
                      <>
                        <div className={`
                          w-8 h-8 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-white font-black text-xs lg:text-sm
                          ${isBlinking ? 'bg-red-500 animate-pulse shadow-lg shadow-red-200' : 'bg-primary'}
                        `}>
                          {umbrella.umbrella_number}
                        </div>
                        {order && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm"></div>
                        )}
                        {isEditMode && (
                          <div className="absolute top-1 right-1 opacity-20"><Trash2 size={10} /></div>
                        )}
                      </>
                    ) : (
                      isEditMode && <Plus size={16} className="text-gray-300" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          <div className="bg-dark text-white p-8 rounded-[32px] shadow-2xl">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Navigation size={20} className="text-primary" /> Atividade em Tempo Real
            </h2>
            <div className="space-y-4">
              {activeOrders.length === 0 ? (
                <p className="text-gray-400 text-sm italic">Nenhum pedido pendente no momento.</p>
              ) : (
                activeOrders.map(order => (
                  <div key={order.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex justify-between items-center animate-in fade-in slide-in-from-right-4">
                    <div>
                      <div className="font-bold text-xs uppercase tracking-widest text-primary mb-1">Guarda-Sol #{order.table_number}</div>
                      <div className="text-sm font-bold">{order.client_name || 'Vago'}</div>
                    </div>
                    <div className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${order.status === 'pendente' ? 'bg-red-500/20 text-red-300' : 'bg-orange-500/20 text-orange-300'}`}>
                      {order.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <h3 className="font-bold text-dark mb-4">Legenda</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-primary rounded-full"></div>
                <span className="text-sm text-gray-600">Ocupado / Em Atendimento</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 animate-pulse rounded-full"></div>
                <span className="text-sm text-gray-600 font-bold">Chamado Pendente / Piscando</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-50 border-2 border-dashed border-gray-100 rounded-lg"></div>
                <span className="text-sm text-gray-600">Espaço Disponível</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-dark/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl overflow-hidden relative"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-50 text-primary rounded-[25px] flex items-center justify-center mx-auto mb-4">
                  <MapPin size={32} />
                </div>
                <h2 className="text-2xl font-black text-dark italic">Alocar Guarda-Sol</h2>
                <p className="text-gray-500 text-sm mt-2">Defina o número de identificação para este ponto no mapa.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Número do Guarda-Sol</label>
                  <input 
                    type="text" 
                    value={tempNumber}
                    onChange={(e) => setTempNumber(e.target.value)}
                    placeholder="Ex: 12"
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 text-dark font-bold focus:border-primary outline-none transition-all text-center text-2xl"
                    autoFocus
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowConfirmModal(null)}
                    className="flex-1 py-4 rounded-2xl font-bold bg-gray-100 text-gray-400 hover:bg-gray-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={confirmAllocation}
                    className="flex-1 py-4 rounded-2xl font-bold bg-primary text-white shadow-xl shadow-orange-200 hover:scale-105 transition-all"
                  >
                    Confirmar Local
                  </button>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-50 flex items-center gap-3 text-amber-600 bg-amber-50 -mx-10 px-10 py-4">
                <AlertCircle size={20} />
                <p className="text-[10px] font-bold uppercase leading-tight">Verifique se a posição no mapa reflete a localização real na areia.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
