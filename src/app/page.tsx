'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';
import { 
  Check, 
  QrCode, 
  ShoppingBag, 
  BarChart3, 
  Clock, 
  ArrowRight, 
  Store, 
  Settings, 
  MapPin, 
  RefreshCw,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const supabase = getSupabase();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeKiosk, setActiveKiosk] = useState<string | null>(null);

  useEffect(() => {
    fetchVendors();
    if (typeof window !== 'undefined') {
      setActiveKiosk(localStorage.getItem('active_kiosk_slug'));
    }
  }, [supabase]);

  const fetchVendors = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase.from('vendors').select('*').order('name');
      setVendors(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetSession = () => {
    localStorage.removeItem('active_kiosk_slug');
    localStorage.removeItem('active_kiosk_name');
    setActiveKiosk(null);
    alert('Sessão reiniciada! Agora você pode abrir qualquer quiosque.');
  };

  return (
    <div className="min-h-screen bg-[#FDF8F3] font-sans">
      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-black text-primary tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-base">S</div>
          SandExpress
        </div>
        
        <div className="flex gap-4">
          <Link 
            href="/dashboard/kiosks"
            className="hidden md:flex bg-dark text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-orange-900/20 items-center gap-2"
          >
            <LayoutDashboard size={16} /> Painel Administrativo
          </Link>
          <button 
            onClick={resetSession}
            className="bg-white border border-gray-100 text-gray-400 p-3 rounded-2xl hover:text-primary transition-all"
            title="Limpar sessão ativa"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 text-center max-w-5xl mx-auto">
        <div className="inline-block bg-orange-100 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-orange-200">
          🏖️ O Futuro dos Quiosques de Praia
        </div>
        <h1 className="text-5xl md:text-7xl font-display font-black mb-8 tracking-tighter leading-none text-dark">
          Venda mais na <br/>
          <span className="text-primary italic">beira do mar.</span>
        </h1>
        <p className="text-lg text-dark/60 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
          Sistema Multi-Quiosque pronto para escala. Gerencie de 1 a 100 unidades com isolamento total e visualização em tempo real.
        </p>

        {/* Central de Operações do Preview */}
        <div className="grid md:grid-cols-2 gap-8 mt-16 text-left">
          {/* Lado do Cliente */}
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black text-dark mb-6 flex items-center gap-3">
              <ShoppingBag className="text-primary" size={28} /> Visão do Cliente
            </h2>
            
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-12 bg-gray-100 rounded-2xl"></div>
                <div className="h-12 bg-gray-100 rounded-2xl"></div>
              </div>
            ) : vendors.length > 0 ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-4">Selecione um quiosque para simular:</p>
                {vendors.map(v => (
                  <Link 
                    key={v.id}
                    href={`/k/${v.slug}/pedido?mesa=1`}
                    className="flex items-center justify-between p-5 bg-orange-50/50 rounded-[25px] border border-orange-100 hover:border-primary transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                        <Store size={20} />
                      </div>
                      <span className="font-bold text-dark">{v.name}</span>
                    </div>
                    <ArrowRight size={18} className="text-orange-200 group-hover:text-primary transition-colors" />
                  </Link>
                ))}
                {activeKiosk && (
                  <div className="mt-6 p-4 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-blue-100 flex items-center justify-between">
                    <span>Sessão ativa em: {activeKiosk}</span>
                    <button onClick={resetSession} className="underline">Trocar</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm italic mb-6">Nenhum quiosque criado ainda.</p>
                <Link 
                  href="/dashboard/kiosks"
                  className="bg-primary text-white px-8 py-4 rounded-2xl font-bold inline-block"
                >
                  Criar Primeiro Quiosque
                </Link>
              </div>
            )}
          </div>

          {/* Lado do Operador */}
          <div className="bg-dark p-10 rounded-[40px] shadow-2xl text-white">
            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
              <Settings className="text-primary" size={28} /> Painel do Quiosque
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <OperationLink href="/dashboard/kiosks" icon={<Store size={18} />} label="Gerenciar Unidades" />
              <OperationLink href="/dashboard/mapa" icon={<MapPin size={18} />} label="Mapa de Área (Novidade)" />
              <OperationLink href="/dashboard/pedidos" icon={<ShoppingBag size={18} />} label="Painel de Pedidos" />
              <OperationLink href="/dashboard/qrcode" icon={<QrCode size={18} />} label="Gerador QR Codes" />
              <OperationLink href="/dashboard/relatorios" icon={<BarChart3 size={18} />} label="Relatórios e Vendas" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-gray-100 text-center">
        <div className="max-w-7xl mx-auto">
          <div className="text-xl font-black text-primary mb-4">SandExpress</div>
          <p className="text-gray-400 text-sm">A solução Definitiva para Gestão de Praia e Multi-Quiosques.</p>
        </div>
      </footer>
    </div>
  );
}

function OperationLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary transition-all group"
    >
      <div className="p-2 bg-primary rounded-xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="font-bold text-sm">{label}</span>
    </Link>
  );
}
