'use client';

import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Download, Printer, Plus, Trash2 } from 'lucide-react';

export default function QRCodeGenerator() {
  const [tables, setTables] = useState(['1', '2', '3', '4', '5']);
  const [newTable, setNewTable] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const addTable = () => {
    if (newTable && !tables.includes(newTable)) {
      setTables([...tables, newTable].sort((a, b) => parseInt(a) - parseInt(b)));
      setNewTable('');
    }
  };

  const removeTable = (table: string) => {
    setTables(tables.filter(t => t !== table));
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sandexpress.app';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 lg:p-10 font-sans max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-dark">Gerador de QR Codes</h1>
          <p className="text-gray-500 mt-1">Crie os códigos para colocar nos seus guarda-sóis.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-dark/10"
        >
          <Printer size={20} /> Imprimir Todos
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Adicionar Mesa */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
          <h2 className="font-bold mb-6 text-gray-700 flex items-center gap-2">
            <Plus size={20} className="text-primary" /> Adicionar Mesa/Posto
          </h2>
          <div className="flex gap-3">
            <input 
              type="number" 
              value={newTable}
              onChange={(e) => setNewTable(e.target.value)}
              placeholder="Nº"
              className="w-20 px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 border-none"
            />
            <button 
              onClick={addTable}
              className="flex-grow bg-primary text-white font-bold rounded-xl transition-all hover:scale-[1.02]"
            >
              Adicionar
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-4 leading-relaxed">
            Cada mesa terá um QR Code exclusivo que já identifica o número automaticamente para você.
          </p>
        </div>

        {/* Lista de QR Codes */}
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4" id="print-area">
          {tables.map(table => (
            <div key={table} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center group relative overflow-hidden">
              <button 
                onClick={() => removeTable(table)}
                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 print:hidden"
              >
                <Trash2 size={18} />
              </button>
              
              <div className="mb-4 bg-gray-50 p-4 rounded-2xl">
                <QRCodeSVG 
                  value={`${currentUrl}/pedido?mesa=${table}`} 
                  size={140}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              <div className="text-center">
                 <div className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mb-1">Guarda-sol / Mesa</div>
                 <div className="text-3xl font-display font-bold text-dark">{table}</div>
              </div>

              <div className="mt-6 w-full pt-4 border-t border-gray-50 text-[10px] text-gray-300 text-center font-mono">
                {currentUrl}/pedido?mesa={table}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; background: white !important; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .bg-white { border: 1px solid #eee !important; box-shadow: none !important; break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
