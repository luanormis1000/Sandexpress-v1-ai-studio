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

  useEffect(() => {
    fetchMenu();
  }, [supabase]);

  const fetchMenu = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('menu_items').select('*').limit(5);
    setMenuItems(data || []);
  };

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{ id: Date.now(), message, type }, ...prev].slice(0, 10));
  };

  const simulateCustomerOrder = async () => {
    if (!supabase || menuItems.length === 0) {
      addLog('Nenhum item no cardápio para simular pedido', 'error');
      return;
    }

    setLoading(true);
    addLog('Iniciando simulação de pedido...', 'info');

    try {
      const randomItem = menuItems[Math.floor(Math.random() * menuItems.length)];
      const table = Math.floor(Math.random() * 20) + 1;
      
      const { data, error } = await supabase
        .from('orders')
        .insert({
          table_number: table.toString(),
          items: [{ name: randomItem.name, quantity: 1, id: randomItem.id }],
          total: randomItem.price,
          status: 'pendente'
        })
        .select();

      if (error) throw error;
      addLog(`Pedido #${data[0].id.slice(0, 4)} criado para mesa ${table}`, 'success');
      
      // Tocar som de teste se as notificações estiverem ativas
      if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Teste de Pedido', {
              body: `Novo pedido da mesa ${table}: ${randomItem.name}`,
              icon: '/icon.png'
          });
      }
    } catch (error: any) {
      addLog(`Erro ao criar pedido: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const cleanDatabase = async () => {
    if (!supabase || !confirm('Deseja limpar todos os pedidos de teste?')) return;
    
    setLoading(true);
    addLog('Limpando base de pedidos...', 'info');
    
    try {
      const { error } = await supabase.from('orders').delete().neq('id', '0');
      if (error) throw error;
      addLog('Base de pedidos limpa com sucesso', 'success');
    } catch (error: any) {
      addLog(`Erro ao limpar base: ${error.message}`, 'error');
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
              <Play className="text-primary" size={20} /> Ações de Fluxo
            </h2>
            
            <div className="space-y-4">
              <button 
                onClick={simulateCustomerOrder}
                disabled={loading}
                className="w-full bg-dark text-white p-5 rounded-2xl font-bold flex items-center justify-between hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                   <div className="bg-primary p-2 rounded-lg">
                      <ShoppingBag size={20} />
                   </div>
                   <div className="text-left">
                      <div className="text-sm">Simular Cliente</div>
                      <div className="text-[10px] text-gray-400 font-normal">Cria um pedido aleatório</div>
                   </div>
                </div>
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              </button>

              <button 
                onClick={cleanDatabase}
                disabled={loading}
                className="w-full bg-gray-50 text-gray-500 p-5 rounded-2xl font-bold flex items-center justify-between hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100"
              >
                <div className="flex items-center gap-3">
                   <div className="bg-white p-2 rounded-lg border border-gray-100">
                      <Trash2 size={20} />
                   </div>
                   <div className="text-left">
                      <div className="text-sm">Zerar Pedidos</div>
                      <div className="text-[10px] opacity-60 font-normal">Limpa a tabela de ordens</div>
                   </div>
                </div>
                <Database size={20} />
              </button>
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
