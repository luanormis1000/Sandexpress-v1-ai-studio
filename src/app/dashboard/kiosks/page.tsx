'use client';

import React, { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { 
  Store, 
  Plus, 
  ExternalLink, 
  Trash2, 
  Settings as SettingsIcon, 
  ChevronLeft,
  LayoutGrid,
  ShieldCheck,
  AlertCircle,
  Copy
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';

interface Kiosk {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export default function KioskManagement() {
  const supabase = getSupabase();
  const [kiosks, setKiosks] = useState<Kiosk[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKiosk, setNewKiosk] = useState({ name: '', slug: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchKiosks();
  }, [supabase]);

  const fetchKiosks = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKiosks(data || []);
    } catch (err) {
      console.error('Erro ao buscar quiosques:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleCreateKiosk = async () => {
    if (!supabase || !newKiosk.name) return;
    setError('');
    
    const slug = newKiosk.slug || generateSlug(newKiosk.name);
    
    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert({ name: newKiosk.name, slug })
        .select();

      if (error) {
        if (error.code === '23505') setError('Este nome ou URL já está em uso.');
        else throw error;
        return;
      }

      setKiosks([data[0], ...kiosks]);
      setShowAddModal(false);
      setNewKiosk({ name: '', slug: '' });
    } catch (err) {
      console.error('Erro ao criar quiosque:', err);
      setError('Erro ao criar quiosque.');
    }
  };

  const deleteKiosk = async (id: string) => {
    if (!supabase || !confirm('Tem certeza? Isso não apagará os itens do cardápio, mas desativará o link.')) return;
    try {
      const { error } = await supabase.from('vendors').delete().eq('id', id);
      if (error) throw error;
      setKiosks(kiosks.filter(k => k.id !== id));
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  };

  if (loading) return <div className="p-10 text-center">Carregando seus quiosques...</div>;

  return (
    <div className="min-h-screen bg-[#FDF8F3] p-6 lg:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        <Link href="/dashboard/pedidos" className="inline-flex items-center gap-2 text-orange-400 hover:text-primary mb-8 transition-colors font-bold text-xs uppercase tracking-widest">
          <ChevronLeft size={18} /> Voltar ao Painel
        </Link>
        
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-display font-black text-dark tracking-tighter italic">Meus Quiosques</h1>
            <p className="text-orange-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Gerencie múltiplas unidades SandExpress</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:scale-105 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-orange-400/20"
          >
            <Plus size={20} /> Novo Quiosque
          </button>
        </div>

        {/* Info Box Security */}
        <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[32px] mb-10 flex gap-4 items-start">
           <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
             <ShieldCheck size={24} />
           </div>
           <div>
             <h3 className="font-bold text-blue-900 text-sm mb-1">Isolamento e Segurança</h3>
             <p className="text-blue-700/60 text-xs leading-relaxed max-w-2xl">
               Cada quiosque possui sua própria URL única e banco de dados isolado via VendorID. O cliente que abrir um quiosque ficará vinculado a ele até encerrar sua conta, garantindo que pedidos de quiosques diferentes nunca se misturem.
             </p>
           </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {kiosks.map((kiosk) => (
            <motion.div 
              layout
              key={kiosk.id}
              className="bg-white p-8 rounded-[40px] border border-orange-100/50 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 group-hover:bg-primary/5 transition-colors"></div>
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-primary mb-6">
                  <Store size={24} />
                </div>
                
                <h3 className="text-xl font-black text-dark mb-1">{kiosk.name}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">slug: {kiosk.slug}</p>
                
                <div className="space-y-3">
                  <Link 
                    href={`/k/${kiosk.slug}/pedido?mesa=1`}
                    target="_blank"
                    className="w-full flex items-center justify-between text-xs font-bold text-primary bg-orange-50 p-4 rounded-2xl hover:bg-orange-100 transition-colors"
                  >
                    Abrir Cardápio <ExternalLink size={14} />
                  </Link>
                  
                  <div className="flex gap-2">
                    <Link 
                      href={`/dashboard/pedidos?vendor=${kiosk.id}`}
                      className="flex-grow flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest bg-dark text-white p-4 rounded-2xl hover:scale-[1.02] transition-all"
                    >
                      <LayoutGrid size={14} /> Painel
                    </Link>
                    <button 
                      onClick={() => deleteKiosk(kiosk.id)}
                      className="bg-red-50 text-red-500 p-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal Add */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-dark/60 backdrop-blur-md z-50"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white rounded-[50px] z-50 p-10 shadow-2xl overflow-hidden border-t-4 border-primary"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-100 text-primary rounded-[25px] flex items-center justify-center mx-auto mb-4">
                  <Plus size={32} />
                </div>
                <h2 className="text-2xl font-black text-dark tracking-tighter">Criar Novo Quiosque</h2>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Configure sua nova unidade</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">Nome Comercial</label>
                  <input 
                    type="text" 
                    value={newKiosk.name}
                    onChange={(e) => setNewKiosk({ ...newKiosk, name: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border border-orange-50 bg-orange-50/30 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold"
                    placeholder="Ex: Quiosque do Porto"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">URL Amigável (slug)</label>
                  <input 
                    type="text" 
                    value={newKiosk.slug}
                    onChange={(e) => setNewKiosk({ ...newKiosk, slug: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border border-orange-50 bg-orange-50/30 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-mono text-xs"
                    placeholder="quiosque-do-porto"
                  />
                  <p className="text-[9px] text-gray-300 mt-2">Deixe em branco para gerar automaticamente.</p>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-bold border border-red-100 flex items-center gap-2">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="flex-grow py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 bg-gray-50 hover:bg-gray-100 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleCreateKiosk}
                    className="flex-grow bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-400/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
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
    </Link>
  );
}
