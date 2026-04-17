'use client';

import React, { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  X, 
  ChevronRight, 
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Categorias e Itens de Exemplo (Em um cenário real viriam do Supabase)
const MENU_DATA = [
  {
    category: "Bebidas Geladas",
    items: [
      { id: "1", name: "Água Coco Natural", desc: "400ml, gelada na hora", price: 12.00, img: "https://picsum.photos/seed/coco/400/400" },
      { id: "2", name: "Cerveja Lata 350ml", desc: "Marcas variadas, super gelada", price: 8.50, img: "https://picsum.photos/seed/beer/400/400" },
      { id: "3", name: "Caipirinha Limão", desc: "Cachaça artesanal, açúcar e gelo", price: 22.00, img: "https://picsum.photos/seed/drink/400/400" },
    ]
  },
  {
    category: "Petiscos da Areia",
    items: [
      { id: "4", name: "Porção de Batata", desc: "500g, acompanha molho rosé", price: 38.00, img: "https://picsum.photos/seed/fries/400/400" },
      { id: "5", name: "Isca de Peixe", desc: "Tilápia empanada (400g)", price: 65.00, img: "https://picsum.photos/seed/fish/400/400" },
      { id: "6", name: "Camarão à Milanesa", desc: "Porção generosa (300g)", price: 89.00, img: "https://picsum.photos/seed/shrimp/400/400" },
    ]
  }
];

import { Suspense } from 'react';

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Carregando cardápio...</div>}>
      <OrderContent />
    </Suspense>
  );
}

function OrderContent() {
  const supabase = getSupabase();
  const searchParams = useSearchParams();
  const tableNumber = searchParams.get('mesa') || '0';
  
  const [settings, setSettings] = useState({
    vendor_name: 'SandExpress',
    logo_url: '',
    primary_color: '#FF6B00',
    secondary_color: '#3D1A0A',
  });

  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      if (!supabase) return;
      const { data } = await supabase.from('settings').select('*').single();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, [supabase]);

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const submitOrder = async () => {
    if (!supabase || cart.length === 0) return;
    setOrderStatus('submitting');
    
    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          table_number: tableNumber,
          items: cart.map(i => ({ id: i.id, name: i.name, quantity: i.quantity })),
          total: total,
          status: 'pendente'
        });

      if (error) throw error;
      setOrderStatus('success');
      setCart([]);
      setTimeout(() => {
        setIsCartOpen(false);
        setOrderStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      setOrderStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans" style={{ '--primary': settings.primary_color } as any}>
      {/* Header Fixo */}
      <header className="sticky top-0 bg-white shadow-sm z-30 pt-4 pb-4">
        <div className="max-w-xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.logo_url ? (
               <img src={settings.logo_url} alt="Logo" className="h-10 w-auto" />
            ) : (
               <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">
                 S
               </div>
            )}
            <h1 className="text-xl font-display font-bold text-dark">{settings.vendor_name}</h1>
          </div>
          <div className="bg-gray-100 px-4 py-2 rounded-xl text-sm font-bold text-dark">
            Mesa {tableNumber}
          </div>
        </div>
        
        {/* Barra de Pesquisa */}
        <div className="max-w-xl mx-auto px-6 mt-4">
          <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
               type="text" 
               placeholder="Pesquisar no cardápio..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-gray-100 pl-12 pr-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all border-none"
             />
          </div>
        </div>
      </header>

      {/* Grid de Itens */}
      <main className="max-w-xl mx-auto px-6 mt-8 space-y-10">
        {MENU_DATA.map((cat, idx) => {
          const filteredItems = cat.items.filter(i => 
            i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            i.desc.toLowerCase().includes(searchQuery.toLowerCase())
          );
          
          if (filteredItems.length === 0) return null;

          return (
            <section key={idx}>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">{cat.category}</h2>
              <div className="grid gap-4">
                {filteredItems.map(item => (
                  <motion.div 
                    layout
                    key={item.id}
                    className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]"
                    onClick={() => addToCart(item)}
                  >
                    <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow flex flex-col justify-between py-1">
                      <div>
                        <h3 className="font-bold text-dark mb-1">{item.name}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.desc}</p>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="font-bold text-primary">R$ {item.price.toFixed(2)}</span>
                        <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center text-dark hover:bg-primary hover:text-white transition-colors">
                          <Plus size={18} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* Botão Flutuante Carrinho */}
      <AnimatePresence>
        {cartCount > 0 && !isCartOpen && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-0 right-0 px-6 z-40 max-w-xl mx-auto"
          >
            <button 
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-dark text-white p-5 rounded-2xl flex items-center justify-between shadow-2xl shadow-dark/30 hover:scale-[1.02] transition-transform active:scale-95"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary px-3 py-1 rounded-lg text-xs font-bold">
                  {cartCount}
                </div>
                <span className="font-bold">Ver sacola</span>
              </div>
              <span className="font-bold">R$ {total.toFixed(2)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Carrinho */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-dark/40 backdrop-blur-sm z-50"
              onClick={() => setIsCartOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] z-50 p-8 max-w-xl mx-auto shadow-2xl overflow-hidden"
              style={{ maxHeight: '90vh' }}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-display font-bold">Sua Sacola</h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400"
                >
                  <X size={24} />
                </button>
              </div>

              {orderStatus === 'success' ? (
                <div className="py-12 text-center flex flex-col items-center">
                   <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 size={48} />
                   </div>
                   <h3 className="text-xl font-bold mb-2">Pedido Enviado!</h3>
                   <p className="text-gray-500 mb-8">Sua equipe está preparando seu pedido.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-6 overflow-y-auto max-h-[50vh] pr-2 scrollbar-hide mb-8">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="flex gap-4">
                          <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                             <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="font-bold text-dark">{item.name}</h4>
                            <span className="text-sm font-bold text-primary">R$ {item.price.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-xl">
                          <button onClick={() => removeFromCart(item.id)} className="p-1 hover:text-primary transition-colors">
                            <Minus size={18} />
                          </button>
                          <span className="font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => addToCart(item)} className="p-1 hover:text-primary transition-colors">
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 pt-6 space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-medium">Subtotal</span>
                        <span className="font-bold">R$ {total.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between items-center text-emerald-600">
                        <span className="font-medium text-sm">Taxa de Serviço</span>
                        <span className="font-bold text-xs uppercase tracking-widest italic">Inclusa</span>
                     </div>
                     <div className="flex justify-between items-center text-xl pt-2">
                        <span className="font-bold">Total</span>
                        <span className="font-bold text-primary underline underline-offset-8">R$ {total.toFixed(2)}</span>
                     </div>
                     <button 
                        onClick={submitOrder}
                        disabled={orderStatus === 'submitting'}
                        className="w-full bg-primary text-white py-5 rounded-2xl font-bold text-lg mt-4 shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 transition-all hover:scale-[1.01]"
                     >
                        {orderStatus === 'submitting' ? 'Enviando...' : (
                          <>Fazer Pedido <ChevronRight size={20} /></>
                        )}
                     </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        :root {
          --primary: ${settings.primary_color};
          --secondary: ${settings.secondary_color};
        }
        .text-primary { color: var(--primary); }
        .bg-primary { background-color: var(--primary); }
        .focus\\:ring-primary\\/20:focus { --tw-ring-color: color-mix(in srgb, var(--primary) 20%, transparent); }
        .hover\\:text-primary:hover { color: var(--primary); }
        .bg-dark { background-color: var(--secondary); }
      `}</style>
    </div>
  );
}
