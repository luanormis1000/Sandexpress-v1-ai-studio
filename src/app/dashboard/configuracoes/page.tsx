'use client';

import React, { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Save, Palette, Image as ImageIcon, Store, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

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
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard/pedidos" className="inline-flex items-center gap-2 text-gray-500 hover:text-dark mb-6 transition-colors">
          <ChevronLeft size={20} /> Voltar para Pedidos
        </Link>
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-bold text-dark">Personalização</h1>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save size={20} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="grid gap-6">
          {/* Identidade */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Store className="text-primary" /> Identidade do Quiosque
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nome do Estabelecimento</label>
                <input 
                  type="text" 
                  value={settings.vendor_name}
                  onChange={(e) => setSettings({...settings, vendor_name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Ex: Quiosque do Sol"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">URL da Logo (PNG ou SVG)</label>
                <div className="flex gap-4">
                  <div className="flex-grow">
                    <input 
                      type="text" 
                      value={settings.logo_url}
                      onChange={(e) => setSettings({...settings, logo_url: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="w-24 h-24 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden">
                    {settings.logo_url ? (
                      <img src={settings.logo_url} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <ImageIcon className="text-gray-300" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cores */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Palette className="text-primary" /> Cores da Marca
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Cor Principal</label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="color" 
                    value={settings.primary_color}
                    onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                    className="w-12 h-12 rounded-lg cursor-pointer p-0 border-none"
                  />
                  <input 
                    type="text" 
                    value={settings.primary_color}
                    onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                    className="flex-grow px-4 py-3 rounded-xl border border-gray-200 uppercase font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">Usada em botões e elementos de destaque.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Cor de Contraste</label>
                <div className="flex gap-4 items-center">
                  <input 
                    type="color" 
                    value={settings.secondary_color}
                    onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                    className="w-12 h-12 rounded-lg cursor-pointer p-0 border-none"
                  />
                  <input 
                    type="text" 
                    value={settings.secondary_color}
                    onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                    className="flex-grow px-4 py-3 rounded-xl border border-gray-200 uppercase font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">Usada em textos e ícones escuros.</p>
              </div>
            </div>
          </div>

          {/* Preview do Ticket */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-widest text-center">Prévia Visual</label>
            <div className="flex justify-center">
              <div 
                className="w-full max-w-sm p-8 rounded-3xl shadow-xl transition-all"
                style={{ backgroundColor: settings.primary_color, color: '#fff' }}
              >
                <div className="flex flex-col items-center text-center">
                  {settings.logo_url && (
                    <img src={settings.logo_url} alt="Logo Preview" className="h-12 w-auto mb-4 brightness-0 invert" />
                  )}
                  <h3 className="text-2xl font-display font-bold">{settings.vendor_name}</h3>
                  <div className="w-12 h-1 bg-white/30 rounded-full my-6"></div>
                  <button className="bg-white text-dark px-8 py-3 rounded-xl font-bold w-full" style={{ color: settings.secondary_color }}>
                    Fazer Pedido
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
