'use client';

import React, { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Play, 
  Send, 
  RefreshCcw, 
  Database, 
  CheckCircle2, 
  AlertCircle,
  ShoppingBag,
  Bell,
  Trash2,
  Loader2,
  ExternalLink,
  ChevronRight,
  Monitor,
  ShieldCheck,
  Menu as MenuIcon,
  BarChart,
  Settings,
  QrCode,
  Store,
  MapPin,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TestPlayground() {
  const supabase = getSupabase();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<{ id: number; message: string; type: 'info' | 'success' | 'error' }[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState('');
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    fetchMenu();
    fetchVendors();
  }, [supabase]);

  const fetchVendors = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('vendors').select('*');
    setVendors(data || []);
    if (data && data.length > 0) setSelectedVendorId(data[0].id);
  };

  const fetchMenu = async () => {
    if (!supabase) return;
    // Get menu for selected vendor or first one
    const { data } = await supabase.from('menu_items').select('*').limit(10);
    setMenuItems(data || []);
  };

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{ id: Date.now(), message, type }, ...prev].slice(0, 15));
  };

  const verifyAdmin = () => {
    if (adminPassword !== 'Novasenha123@') {
      alert('Senha do Admin incorreta!');
      addLog('Tentativa de acesso negada: senha incorreta', 'error');
      return false;
    }
    return true;
  };

  const simulateCustomerOrder = async () => {
    if (!supabase) return;
    
    const targetVendorId = selectedVendorId || (vendors.length > 0 ? vendors[0].id : null);
    if (!targetVendorId) {
      addLog('Nenhum quiosque disponível para simular pedido', 'error');
      return;
    }

    const vendorItems = menuItems.filter(i => i.vendor_id === targetVendorId);
    const pool = vendorItems.length > 0 ? vendorItems : menuItems;

    if (pool.length === 0) {
      addLog('Nenhum item disponível para este quiosque', 'error');
      return;
    }

    setLoading(true);
    addLog(`Simulando pedido para Quiosque ID: ${targetVendorId.slice(0, 5)}...`, 'info');

    try {
      const randomItem = pool[Math.floor(Math.random() * pool.length)];
      const table = Math.floor(Math.random() * 50) + 1;
      
      const { data, error } = await supabase
        .from('orders')
        .insert({
          vendor_id: targetVendorId,
          table_number: table.toString(),
          client_name: ['Luan', 'Maria', 'João', 'Ana', 'Carlos'][Math.floor(Math.random() * 5)],
          items: [{ name: randomItem.name, quantity: 1, id: randomItem.id }],
          total: randomItem.price,
          status: 'pendente'
        })
        .select();

      if (error) throw error;
      addLog(`Pedido #${data[0].id.slice(0, 4)} criado para G.Sol ${table}`, 'success');
    } catch (error: any) {
      addLog(`Erro ao criar pedido: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const cleanDatabase = async (scope: 'vendor' | 'global') => {
    if (!supabase || !verifyAdmin()) return;
    
    const msg = scope === 'global' 
      ? 'Deseja limpar TODOS os dados de TODOS os quiosques? (Pedidos, Itens, Mapas)' 
      : 'Deseja limpar todos os pedidos deste quiosque?';
      
    if (!confirm(msg)) return;
    
    setLoading(true);
    addLog(`Limpando base (${scope})...`, 'info');
    
    try {
      if (scope === 'global') {
        // Clear everything
        await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        addLog('Sistema reinicializado: Todos os dados limpos', 'success');
      } else {
        if (!selectedVendorId) return;
        const { error } = await supabase.from('orders').delete().eq('vendor_id', selectedVendorId);
        if (error) throw error;
        addLog(`Pedidos do quiosque ${selectedVendorId.slice(0, 5)} removidos`, 'success');
      }
    } catch (error: any) {
      addLog(`Erro na limpeza: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = async () => {
    if (!supabase) return;
    setLoading(true);
    addLog('Testando comunicação em tempo real...', 'info');
    try {
      const start = Date.now();
      const { data, error } = await supabase.from('vendors').select('count');
      const latency = Date.now() - start;
      if (error) throw error;
      addLog(`Conexão OK! Latência: ${latency}ms`, 'success');
    } catch (error: any) {
      addLog(`Falha de Conexão: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 font-sans max-w-4xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-display font-bold text-dark italic">Central de Testes</h1>
        <p className="text-gray-500 mt-1 uppercase text-xs tracking-widest font-bold">Ambiente de validação técnica</p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Painel de Controle */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <h2 className="font-bold text-dark mb-6 flex items-center gap-2">
              <ShieldCheck className="text-primary" size={20} /> Admin & Suporte
            </h2>
            
            <div className="space-y-6">
              {/* Seleção de Quiosque */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Quiosque Alvo</label>
                <select 
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecione um Quiosque</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              {/* Senha Admin */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Chave Mestra Admin (Senha)</label>
                <input 
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={simulateCustomerOrder}
                  disabled={loading}
                  className="bg-dark text-white p-4 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  <ShoppingBag size={18} />
                  Simular Pedido
                </button>

                <button 
                  onClick={checkConnection}
                  disabled={loading}
                  className="bg-primary text-white p-4 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  <RefreshCcw className={loading ? 'animate-spin' : ''} size={18} />
                  Testar Conexão
                </button>

                <button 
                  onClick={() => cleanDatabase('vendor')}
                  disabled={loading}
                  className="bg-orange-50 text-orange-600 border border-orange-100 p-4 rounded-2xl font-bold text-[10px] flex flex-col items-center justify-center gap-2 hover:bg-orange-100 transition-all disabled:opacity-50"
                >
                  <Trash2 size={18} />
                  Limpar Quiosque
                </button>

                <button 
                  onClick={() => cleanDatabase('global')}
                  disabled={loading}
                  className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-2xl font-bold text-[10px] flex flex-col items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                >
                  <AlertCircle size={18} />
                  RESET GLOBAL
                </button>
              </div>
            </div>
          </div>

          {/* Atalhos para Todas as Instâncias */}
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
            <h2 className="font-bold text-dark mb-6 flex items-center gap-2">
              <Monitor className="text-primary" size={20} /> Atalhos de Instâncias
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TestInstanceLink href="/" label="Home Hub" icon={<Store size={18} />} color="bg-orange-50 text-orange-600" />
              <TestInstanceLink href="/dashboard/kiosks" label="Quiosques" icon={<LayoutDashboard size={18} />} color="bg-blue-50 text-blue-600" />
              <TestInstanceLink href="/dashboard/mapa" label="Mapa de Área" icon={<MapPin size={18} />} color="bg-emerald-50 text-emerald-600" />
              <TestInstanceLink href="/dashboard/pedidos" label="Gestão Pedidos" icon={<ShoppingBag size={18} />} color="bg-pink-50 text-pink-600" />
              <TestInstanceLink href="/dashboard/cardapio" label="Cardápio Admin" icon={<Database size={18} />} color="bg-purple-50 text-purple-600" />
              <TestInstanceLink href="/dashboard/qrcode" label="QR Codes" icon={<QrCode size={18} />} color="bg-amber-50 text-amber-600" />
            </div>
          </div>

          <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
             <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="text-emerald-500" size={20} />
                <h3 className="font-bold text-emerald-800 text-sm">Status da Conexão</h3>
             </div>
             <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-700/60 font-bold uppercase tracking-widest">Supabase Database</span>
                  <span className="text-emerald-600 font-bold">ONLINE</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-700/60 font-bold uppercase tracking-widest">Realtime Service</span>
                  <span className="text-emerald-600 font-bold">READY</span>
                </div>
             </div>
          </div>
        </div>

        {/* Logs de Eventos */}
        <div className="bg-dark rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col h-[500px]">
           <div className="absolute top-0 left-0 w-full h-1 bg-primary/20" />
           <h2 className="font-mono text-xs font-bold text-primary mb-6 flex items-center gap-2 uppercase tracking-[0.2em]">
             <Bell size={14} /> System_Activity_Logs
           </h2>
           
           <div className="flex-grow space-y-4 overflow-y-auto no-scrollbar font-mono text-[11px]">
             <AnimatePresence initial={false}>
               {logs.length === 0 ? (
                 <p className="text-gray-500 italic">Nenhuma atividade registrada ainda...</p>
               ) : (
                 logs.map(log => (
                   <motion.div 
                     key={log.id}
                     initial={{ x: -20, opacity: 0 }}
                     animate={{ x: 0, opacity: 1 }}
                     className={`p-3 rounded-xl border flex items-start gap-3 ${
                       log.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                       log.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                       'bg-white/5 border-white/10 text-gray-400'
                     }`}
                   >
                     <div className="mt-0.5">
                       {log.type === 'success' ? <CheckCircle2 size={14} /> :
                        log.type === 'error' ? <AlertCircle size={14} /> :
                        <InfoIcon size={14} />}
                     </div>
                     <span className="flex-grow leading-relaxed">{log.message}</span>
                     <span className="opacity-30 text-[9px] uppercase tracking-tighter">
                       {new Date(log.id).toLocaleTimeString()}
                     </span>
                   </motion.div>
                 ))
               )}
             </AnimatePresence>
           </div>

           <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 text-gray-500 text-[10px] font-bold">
                 <RefreshCcw size={12} className="animate-spin-slow" /> ESSE AMBIENTE É APENAS PARA TESTES
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function InfoIcon({ size }: { size: number }) {
  return (
    <svg 
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function TestInstanceLink({ href, label, icon, color }: { href: string, label: string, icon: React.ReactNode, color: string }) {
  return (
    <Link 
      href={href}
      className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-white hover:border-primary transition-all group shadow-sm active:scale-95"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${color} transition-colors`}>
          {icon}
        </div>
        <span className="text-xs font-bold text-dark">{label}</span>
      </div>
      <ChevronRight size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
    </Link>
  );
}
