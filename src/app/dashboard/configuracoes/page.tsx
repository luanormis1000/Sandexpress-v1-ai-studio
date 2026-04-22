'use client';

import React, { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Save, Palette, Image as ImageIcon, Store, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';

export default function AdminSettings() {
  const supabase = getSupabase();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [settings, setSettings] = useState({
    vendor_name: 'Meu Quiosque',
    logo_url: '',
    primary_color: '#FF6B00',
    secondary_color: '#3D1A0A',
  });

  useEffect(() => {
    fetchSettings();
  }, [supabase]);

  const fetchSettings = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setSettings(data);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!supabase) return;
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          id: 1, // Usando ID fixo para configurações globais por enquanto
          ...settings,
          updated_at: new Date().toISOString() 
        });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      
      // Atualiza variáveis de ambiente CSS dinamicamente para visualização imediata
      document.documentElement.style.setProperty('--primary-color', settings.primary_color);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-[#FDF8F3] p-6 lg:p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard/pedidos" className="inline-flex items-center gap-2 text-orange-400 hover:text-primary mb-8 transition-colors font-bold text-xs uppercase tracking-widest">
          <ChevronLeft size={18} /> Voltar ao Painel
        </Link>
        
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-display font-black text-dark tracking-tighter italic">Personalização</h1>
            <p className="text-orange-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Ajuste a identidade do seu quiosque</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:scale-105 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50 shadow-xl shadow-orange-400/20"
          >
            <Save size={20} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-2xl mb-8 font-bold text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}
          >
            {message.text}
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            {/* Identidade */}
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-orange-100/50">
              <h2 className="text-lg font-black text-dark mb-8 flex items-center gap-3">
                <Store className="text-primary" /> Identidade Visual
              </h2>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">Nome da Marca</label>
                  <input 
                    type="text" 
                    value={settings.vendor_name}
                    onChange={(e) => setSettings({...settings, vendor_name: e.target.value})}
                    className="w-full px-5 py-4 rounded-2xl border border-orange-50 bg-orange-50/30 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-dark"
                    placeholder="Ex: Quiosque da Areia"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">Link da Logo (PNG/SVG)</label>
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      value={settings.logo_url}
                      onChange={(e) => setSettings({...settings, logo_url: e.target.value})}
                      className="flex-grow px-5 py-4 rounded-2xl border border-orange-50 bg-orange-50/30 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-mono text-xs"
                      placeholder="https://..."
                    />
                    <div className="w-16 h-16 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-center p-2">
                      {settings.logo_url ? (
                        <img src={settings.logo_url} alt="Logo Prev" className="w-full h-full object-contain" />
                      ) : (
                        <ImageIcon className="text-orange-200" size={24} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cores */}
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-orange-100/50">
              <h2 className="text-lg font-black text-dark mb-8 flex items-center gap-3">
                <Palette className="text-primary" /> Cores do Logo
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">Principal (Orange)</label>
                  <div className="flex gap-3 items-center">
                    <input 
                      type="color" 
                      value={settings.primary_color}
                      onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                      className="w-12 h-12 rounded-xl cursor-pointer p-1 bg-gray-50 border border-gray-100 transition-all hover:scale-110"
                    />
                    <input 
                      type="text" 
                      value={settings.primary_color}
                      className="flex-grow px-4 py-3 rounded-xl border border-orange-50 font-mono text-xs text-orange-500 font-bold bg-orange-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">Contraste (Brown)</label>
                  <div className="flex gap-3 items-center">
                    <input 
                      type="color" 
                      value={settings.secondary_color}
                      onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                      className="w-12 h-12 rounded-xl cursor-pointer p-1 bg-gray-50 border border-gray-100 transition-all hover:scale-110"
                    />
                    <input 
                      type="text" 
                      value={settings.secondary_color}
                      className="flex-grow px-4 py-3 rounded-xl border border-orange-50 font-mono text-xs text-orange-500 font-bold bg-orange-50/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Mobile */}
          <div className="sticky top-10">
            <div className="bg-dark rounded-[60px] p-4 shadow-2xl border-4 border-white">
               <div className="bg-[#FDF8F3] rounded-[45px] overflow-hidden aspect-[9/18] relative flex flex-col">
                  {/* Status bar mock */}
                  <div className="px-8 pt-6 flex justify-between items-center text-[10px] font-bold text-dark/30">
                    <span>9:41</span>
                    <div className="flex gap-1.5 items-center">
                      <div className="w-4 h-2 bg-dark/20 rounded-full"></div>
                      <div className="w-2 h-2 bg-dark/20 rounded-full"></div>
                    </div>
                  </div>

                  <div className="p-8 text-center flex-grow flex flex-col justify-center">
                    <div 
                      className="p-8 rounded-[40px] shadow-2xl transition-all mb-8 aspect-square flex flex-col items-center justify-center text-center"
                      style={{ backgroundColor: settings.primary_color }}
                    >
                      {settings.logo_url ? (
                        <img src={settings.logo_url} alt="Logo Preview" className="h-20 w-auto mb-6 brightness-0 invert" />
                      ) : (
                        <div className="w-16 h-16 bg-white/20 rounded-2xl mb-4 border border-white/30"></div>
                      )}
                      <h3 className="text-xl font-black text-white leading-tight italic uppercase tracking-tighter">{settings.vendor_name}</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div 
                        className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl"
                        style={{ backgroundColor: settings.secondary_color }}
                      >
                        Pedido Mesa 04
                      </div>
                      <div className="w-full h-12 bg-white rounded-2xl border border-orange-100 italic text-[10px] text-gray-300 flex items-center justify-center">
                        Prévia do Menu Digital
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 border-t border-orange-50 bg-white">
                    <div className="h-1.5 w-1/3 bg-gray-100 mx-auto rounded-full"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
