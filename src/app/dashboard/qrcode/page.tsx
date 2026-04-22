'use client';

import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Download, Printer, Plus, Trash2, LayoutGrid, Award, Info } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

export default function QRCodeGenerator() {
  const supabase = getSupabase();
  const [tables, setTables] = useState(['1', '2', '3', '4', '5']);
  const [newTable, setNewTable] = useState('');
  const [mode, setMode] = useState<'individual' | 'master'>('individual');
  const [settings, setSettings] = useState({ vendor_name: 'SandExpress', primary_color: '#FF6B00' });
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  
  useEffect(() => {
    fetchVendors();
  }, [supabase]);

  const fetchVendors = async () => {
    if (!supabase) return;
    const { data: vendorsData } = await supabase.from('vendors').select('*');
    if (vendorsData && vendorsData.length > 0) {
      setVendors(vendorsData);
      setSelectedVendor(vendorsData[0]);
    }
    
    // Fallback settings if no vendor selected or for global branding
    const { data: settingsData } = await supabase.from('settings').select('*').single();
    if (settingsData) setSettings(settingsData);
  };

  const addTable = () => {
    if (newTable && !tables.includes(newTable)) {
      if (confirm(`Gerar QR Code único para o Guarda-Sol #${newTable}?`)) {
        setTables([...tables, newTable].sort((a, b) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          if (isNaN(numA) || isNaN(numB)) return a.localeCompare(b);
          return numA - numB;
        }));
        setNewTable('');
      }
    }
  };

  const removeTable = (table: string) => {
    setTables(tables.filter(t => t !== table));
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sandexpress.app';
  const vendorBaseUrl = selectedVendor ? `${currentUrl}/k/${selectedVendor.slug}/pedido` : `${currentUrl}/pedido`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 lg:p-10 font-sans max-w-7xl mx-auto" style={{ '--primary': selectedVendor?.primary_color || settings.primary_color } as any}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-dark">Gerador de QR Codes</h1>
          <div className="flex items-center gap-2 mt-2">
            <select 
              value={selectedVendor?.id || ''}
              onChange={(e) => {
                const vendor = vendors.find(v => v.id === e.target.value);
                setSelectedVendor(vendor);
              }}
              className="bg-transparent text-primary font-bold text-[10px] uppercase tracking-[0.2em] py-1 border-b border-orange-100 outline-none cursor-pointer"
            >
              {vendors.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
          <button 
            onClick={() => setMode('individual')}
            className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${mode === 'individual' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-dark'}`}
          >
            <LayoutGrid size={18} /> Individuais (Mesas)
          </button>
          <button 
            onClick={() => setMode('master')}
            className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${mode === 'master' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-dark'}`}
          >
            <Award size={18} /> QR Code Mestre
          </button>
        </div>

        <button 
          onClick={handlePrint}
          className="bg-dark text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:scale-[1.02] transition-all shadow-xl shadow-dark/20"
        >
          <Printer size={20} /> Imprimir agora
        </button>
      </header>

      {mode === 'individual' ? (
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Adicionar Guarda-Sol */}
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 h-fit lg:sticky lg:top-10">
            <h2 className="font-bold mb-6 text-dark flex items-center gap-2 text-lg">
              <Plus size={22} className="text-primary" /> Novo Guarda-Sol
            </h2>
            <div className="flex gap-2">
              <input 
                type="number" 
                value={newTable}
                onChange={(e) => setNewTable(e.target.value)}
                placeholder="Nº"
                className="w-24 px-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 border-none font-bold text-xl text-center"
              />
              <button 
                onClick={addTable}
                className="flex-grow bg-primary text-white font-bold rounded-2xl transition-all hover:brightness-110 active:scale-95"
              >
                Gerar Único
              </button>
            </div>
            <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
              <Info className="text-amber-500 shrink-0" size={20} />
              <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                Dica: O número informado será embutido no QR Code para identificação automática do pedido.
              </p>
            </div>
          </div>

          {/* Lista de QR Codes */}
          <div className="lg:col-span-3 grid sm:grid-cols-2 xl:grid-cols-3 gap-6" id="print-area">
            {tables.map(table => (
              <div key={table} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col items-center justify-between group relative overflow-hidden text-center print:border-4 print:border-dark print:w-[10cm] print:h-[15cm] print:m-4">
                <button 
                  onClick={() => removeTable(table)}
                  className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 print:hidden"
                >
                  <Trash2 size={18} />
                </button>
                
                <div className="w-full">
                   <div className="text-primary font-display font-black text-3xl uppercase tracking-tighter mb-2">{selectedVendor?.name || settings.vendor_name}</div>
                   <div className="h-1 bg-primary/20 w-12 mx-auto rounded-full mb-8"></div>
                </div>

                <div className="flex-grow flex flex-col items-center justify-center">
                   <div className="text-[12px] text-gray-400 font-bold uppercase tracking-[0.5em] mb-0">MESA</div>
                   <div className="text-[12rem] font-display font-black text-dark leading-none -mt-4 mb-4">{table}</div>
                </div>

                <div className="mt-auto flex flex-col items-center p-6 bg-gray-50 rounded-[32px] w-full border border-gray-100">
                  <div className="mb-3">
                    <QRCodeSVG 
                      value={`${vendorBaseUrl}?mesa=${table}`} 
                      size={90}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <div className="text-[10px] text-dark font-bold uppercase tracking-widest mb-1">Escaneie para pedir</div>
                  <div className="text-[8px] text-gray-400 font-mono italic truncate w-full">{vendorBaseUrl.replace('https://', '')}?mesa={table}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* QR Code Mestre */
        <div className="max-w-xl mx-auto" id="print-area-master">
          <div className="bg-white p-12 rounded-[48px] shadow-2xl border border-gray-100 flex flex-col items-center text-center relative overflow-hidden print:border-4 print:border-primary">
            <div className="absolute top-0 left-0 w-full h-3 bg-primary" />
            
            <div className="mb-10 mt-4">
              {/* Título de Destaque */}
              <h2 className="text-4xl font-display font-black text-dark mb-4 leading-tight">
                Peça direto <br /> pelo celular!
              </h2>
              <p className="text-gray-500 font-medium">Acesse nosso cardápio digital completo</p>
            </div>

            <div className="p-8 bg-gray-50 rounded-[40px] border-2 border-primary/10 shadow-inner mb-10">
               <QRCodeSVG 
                  value={vendorBaseUrl} 
                  size={240}
                  level="H"
                  includeMargin={true}
                  fgColor={selectedVendor?.primary_color || settings.primary_color}
                />
            </div>

            <div className="space-y-6 w-full">
               <div className="flex flex-col items-center">
                 <div className="text-xs text-gray-400 font-bold uppercase tracking-[0.4em] mb-2 text-primary">Quiosque</div>
                 <div className="text-5xl font-display font-black text-dark tracking-tight">{selectedVendor?.name || settings.vendor_name}</div>
               </div>
               
               <div className="flex items-center gap-4 py-6 border-y border-gray-100">
                  <div className="flex-1 text-right">
                    <div className="font-bold text-dark text-sm">Escaneie</div>
                    <div className="text-xs text-gray-400">Abra a câmera</div>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <QrCode size={20} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-dark text-sm">Peça agora</div>
                    <div className="text-xs text-gray-400">Rápido e fácil</div>
                  </div>
               </div>
               
               <div className="text-[10px] text-gray-300 font-mono">{currentUrl}/pedido</div>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-dark text-white rounded-3xl flex items-start gap-4 print:hidden">
             <Info className="text-primary shrink-0" size={24} />
             <div className="text-sm leading-relaxed">
                Este é o <strong>QR Code Mestre</strong>. Ideal para ser colocado no balcão, entrada ou nas redes sociais. Ele leva o cliente para o cardápio sem definir uma mesa específica.
             </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; background: white !important; }
          #print-area, #print-area *, #print-area-master, #print-area-master * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; padding: 20px; }
          #print-area-master { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 80%; }
          .bg-white { border: 1px solid #eee !important; box-shadow: none !important; break-inside: avoid; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .text-primary { color: var(--primary); }
        .bg-primary { background-color: var(--primary); }
        .border-primary { border-color: var(--primary); }
        .border-primary\\/10 { border-color: color-mix(in srgb, var(--primary) 10%, transparent); }
        .bg-primary\\/10 { background-color: color-mix(in srgb, var(--primary) 10%, transparent); }
        .shadow-primary\\/10 { --tw-shadow-color: color-mix(in srgb, var(--primary) 10%, transparent); }
      `}</style>
    </div>
  );
}
