'use client';

import React, { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useParams, useSearchParams } from 'next/navigation';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  X, 
  ChevronRight, 
  Search,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Suspense } from 'react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  vendor_id?: string;
}

interface Vendor {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

export default function KioskOrderPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Carregando cardápio do quiosque...</div>}>
      <KioskOrderContent />
    </Suspense>
  );
}

function KioskOrderContent() {
  const supabase = getSupabase();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const tableNumber = searchParams.get('mesa') || '0';
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'submitting' | 'success' | 'error' | 'locked'>('idle');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Check if user is locked to another kiosk
    const activeKiosk = localStorage.getItem('active_kiosk_slug');
    if (activeKiosk && activeKiosk !== slug) {
      setOrderStatus('locked');
    }
    
    const fetchData = async () => {
      if (!supabase || !slug) return;
      
      try {
        // Fetch Vendor by Slug
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('slug', slug)
          .single();

        if (vendorError || !vendorData) {
          console.error('Quiosque não encontrado');
          setLoading(false);
          return;
        }
        setVendor(vendorData);

        // Fetch Menu Items for this vendor
        const { data: itemsData, error: itemsError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('vendor_id', vendorData.id)
          .order('category', { ascending: true });
        
        if (itemsError) throw itemsError;
        setItems(itemsData || []);
        
        // Auto-lock user to this kiosk if they start browsing
        localStorage.setItem('active_kiosk_slug', slug);
        localStorage.setItem('active_kiosk_name', vendorData.name);

      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [supabase, slug]);

  const addToCart = (item: MenuItem) => {
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
    if (!supabase || cart.length === 0 || !vendor) return;
    setOrderStatus('submitting');
    
    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          vendor_id: vendor.id,
          table_number: tableNumber,
          items: cart.map(i => ({ id: i.id, name: i.name, quantity: i.quantity })),
          total: total,
          status: 'pendente',
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      setOrderStatus('success');
      setCart([]);
      
      // Cleanup happens after some time or manual action
      setTimeout(() => {
        setIsCartOpen(false);
        setOrderStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      setOrderStatus('error');
    }
  };

  // Group items by category
  const groupedItems = items.reduce((acc: any, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500 font-medium">Carregando quiosque...</div>;
  }

  if (orderStatus === 'locked') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-10 text-center bg-white">
        <div className="w-24 h-24 bg-orange-100 text-orange-500 rounded-[35px] flex items-center justify-center mb-8 shadow-xl">
          <Lock size={48} />
        </div>
        <h1 className="text-2xl font-black text-dark mb-4 italic">Ops! Você já está em outro Quiosque</h1>
        <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto mb-10">
          Identificamos que você abriu uma conta no quiosque <span className="font-bold text-primary">&quot;{localStorage.getItem('active_kiosk_name')}&quot;</span>.
          <br /><br />
          Para evitar erros nos seus pedidos, encerre sua conta lá antes de abrir em um novo quiosque.
        </p>
        <button 
          onClick={() => {
            if(confirm('Isso limpará sua sacola do outro quiosque. Deseja continuar?')) {
              localStorage.removeItem('active_kiosk_slug');
              localStorage.removeItem('active_kiosk_name');
              setOrderStatus('idle');
              window.location.reload();
            }
          }}
          className="bg-primary text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-xl shadow-orange-200"
        >
          Encerrar Outra Conta e Abrir Aqui
        </button>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-dark">Quiosque não encontrado</h1>
        <p className="text-gray-500 mt-2">O link que você acessou parece ser inválido ou o quiosque foi desativado.</p>
        <button onClick={() => window.location.href = '/'} className="mt-8 bg-primary text-white px-8 py-3 rounded-2xl font-bold">Voltar ao Início</button>
      </div>
    );
  }

  // Use vendor colors if available, otherwise defaults
  const brandColors = {
    primary: vendor.primary_color || '#FF6B00',
    secondary: vendor.secondary_color || '#3D1A0A'
  };

  return (
    <div className="min-h-screen bg-[#FDF8F3] pb-32 font-sans" style={{ '--primary': brandColors.primary, '--dark': brandColors.secondary } as any}>
      {/* Header Fixo */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md shadow-sm z-30 pt-4 pb-2 border-b border-orange-100">
        <div className="max-w-xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {vendor.logo_url ? (
               <img src={vendor.logo_url} alt="Logo" className="h-10 w-auto" />
            ) : (
               <div className="w-10 h-10 bg-[var(--primary)] rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-200">
                 {vendor.name[0]}
               </div>
            )}
            <div>
              <h1 className="text-lg font-display font-bold text-[var(--dark)] leading-none">{vendor.name}</h1>
              <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Quiosque de Praia</span>
            </div>
          </div>
          <div className="bg-orange-50 px-4 py-2 rounded-2xl text-xs font-black text-orange-600 border border-orange-100 shadow-inner">
            MESA {tableNumber}
          </div>
        </div>
        
        {/* Barra de Pesquisa */}
        <div className="max-w-xl mx-auto px-6 mt-4">
          <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-300" size={18} />
             <input 
               type="text" 
               placeholder="Pesquisar no cardápio..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-orange-50/50 pl-12 pr-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all border border-orange-100/50 text-sm"
             />
          </div>
        </div>

        {/* Navegação de Categorias */}
        <div className="max-w-xl mx-auto px-6 mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-2 scrollbar-hide">
          {['Tudo', ...Object.keys(groupedItems).sort()].map(cat => (
            <button
              key={cat}
              onClick={() => {
                if (cat === 'Tudo') {
                  setSearchQuery('');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  const element = document.getElementById(`category-${cat}`);
                  if (element) {
                    const offset = 180;
                    const bodyRect = document.body.getBoundingClientRect().top;
                    const elementRect = element.getBoundingClientRect().top;
                    const elementPosition = elementRect - bodyRect;
                    const offsetPosition = elementPosition - offset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                  }
                }
              }}
              className="px-6 py-2.5 rounded-full bg-white border border-orange-100 shadow-sm text-[11px] font-black uppercase tracking-wider text-gray-500 whitespace-nowrap active:bg-[var(--primary)] active:text-white transition-all hover:border-orange-300"
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* Grid de Itens */}
      <main className="max-w-xl mx-auto px-6 mt-8 space-y-12">
        {Object.entries(groupedItems).map(([category, items]: [string, any], idx) => {
          const filteredItems = items.filter((i: any) => 
            i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            i.description.toLowerCase().includes(searchQuery.toLowerCase())
          );
          
          if (filteredItems.length === 0) return null;

          return (
            <section key={idx} id={`category-${category}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px bg-orange-200 flex-grow"></div>
                <h2 className="text-[10px] font-black text-orange-400 uppercase tracking-[0.3em] whitespace-nowrap">{category}</h2>
                <div className="h-px bg-orange-200 flex-grow"></div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                {filteredItems.map((item: any) => (
                  <motion.div 
                    layout
                    key={item.id}
                    className="bg-white rounded-[40px] shadow-sm border border-orange-100/50 flex flex-col hover:shadow-xl hover:shadow-orange-100/50 transition-all cursor-pointer active:scale-[0.96] overflow-hidden group"
                    onClick={() => addToCart(item)}
                  >
                    <div className="aspect-[4/5] relative flex-shrink-0 bg-orange-50 overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-orange-200">
                          <ImageIcon size={40} strokeWidth={1} />
                        </div>
                      )}
                      
                      <div className="absolute bottom-3 right-3">
                        <div className="w-12 h-12 bg-white shadow-xl rounded-[20px] flex items-center justify-center text-[var(--primary)] transition-all active:scale-90 border border-orange-50">
                          <Plus size={24} strokeWidth={3} />
                        </div>
                      </div>

                      <div className="absolute top-3 left-3">
                        <div className="bg-[var(--dark)]/90 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-[11px] font-black shadow-lg">
                          R$ {item.price.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 flex-grow flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-[var(--dark)] text-sm mb-1.5 line-clamp-1 group-hover:text-[var(--primary)] transition-colors">{item.name}</h3>
                        <p className="text-[10px] text-gray-400 font-medium line-clamp-2 leading-relaxed min-h-[3em]">{item.description}</p>
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
            className="fixed bottom-8 left-0 right-0 px-6 z-40 max-w-xl mx-auto"
          >
            <button 
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-[var(--dark)] text-white p-6 rounded-[32px] flex items-center justify-between shadow-2xl shadow-orange-900/20 hover:scale-[1.02] transition-all active:scale-95 border-t border-white/10"
            >
              <div className="flex items-center gap-4">
                <div className="bg-[var(--primary)] text-white w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shadow-lg">
                  {cartCount}
                </div>
                <div className="text-left">
                  <div className="text-sm font-black">Finalizar Pedido</div>
                  <div className="text-[10px] text-white/50 uppercase font-bold tracking-widest leading-none">Ver sacola agora</div>
                </div>
              </div>
              <span className="text-lg font-black text-[var(--primary)]">R$ {total.toFixed(2)}</span>
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
              className="fixed inset-0 bg-[var(--dark)]/60 backdrop-blur-md z-50"
              onClick={() => setIsCartOpen(false)}
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-[#FDF8F3] rounded-t-[50px] z-50 p-10 max-w-xl mx-auto shadow-2xl overflow-hidden border-t-4 border-[var(--primary)]"
              style={{ maxHeight: '92vh' }}
            >
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-3xl font-display font-black text-[var(--dark)]">Sua Sacola</h2>
                  <p className="text-xs text-orange-500 font-bold uppercase tracking-widest mt-1">Conclua sua experiência</p>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-gray-400 border border-orange-50"
                >
                  <X size={28} />
                </button>
              </div>

              {orderStatus === 'success' ? (
                <div className="py-20 text-center flex flex-col items-center">
                   <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[35px] flex items-center justify-center mb-8 shadow-xl shadow-emerald-100/50">
                      <CheckCircle2 size={56} />
                   </div>
                   <h3 className="text-2xl font-black text-[var(--dark)] mb-3">Pedido Recebido!</h3>
                   <p className="text-gray-500 max-w-[240px] mx-auto text-sm leading-relaxed">Já estamos preparando tudo com muito carinho.</p>
                   <button 
                     onClick={() => {
                        localStorage.removeItem('active_kiosk_slug');
                        window.location.reload();
                     }}
                     className="mt-6 text-xs text-primary font-bold underline"
                   >
                     Encerrar Sessão neste Quiosque
                   </button>
                </div>
              ) : (
                <>
                  <div className="space-y-8 overflow-y-auto max-h-[45vh] pr-2 scrollbar-hide mb-10">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center bg-white p-5 rounded-[30px] border border-orange-100/50 shadow-sm">
                        <div className="flex gap-5">
                          <div className="w-20 h-20 bg-orange-50 rounded-[20px] overflow-hidden border border-orange-100 flex items-center justify-center">
                             {item.image_url ? (
                               <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                             ) : (
                               <ImageIcon className="text-orange-200" size={24} />
                             )}
                          </div>
                          <div className="flex flex-col justify-center">
                            <h4 className="font-bold text-[var(--dark)] text-base">{item.name}</h4>
                            <span className="text-sm font-black text-[var(--primary)] mt-1 tracking-tight">R$ {item.price.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-3 bg-orange-50 rounded-2xl p-1.5 border border-orange-100">
                          <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm text-orange-600 hover:text-[var(--primary)] transition-colors">
                            <Plus size={16} />
                          </button>
                          <span className="font-black text-sm text-[var(--dark)]">{item.quantity}</span>
                          <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center hover:text-orange-600 transition-colors">
                            <Minus size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white p-8 rounded-[40px] border border-orange-100 shadow-sm space-y-5">
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400 font-bold uppercase tracking-widest">Subtotal</span>
                        <span className="font-black text-[var(--dark)]">R$ {total.toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between items-center text-emerald-600">
                        <span className="font-bold text-xs uppercase tracking-[0.2em]">Entrega no Local</span>
                        <span className="font-black text-xs uppercase tracking-widest italic bg-emerald-50 px-3 py-1 rounded-full">Grátis</span>
                     </div>
                     <div className="h-px bg-orange-50"></div>
                     <div className="flex justify-between items-end">
                        <div>
                          <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Total Geral</div>
                          <div className="text-3xl font-black text-[var(--dark)]">R$ {total.toFixed(2)}</div>
                        </div>
                        <button 
                           onClick={submitOrder}
                           disabled={orderStatus === 'submitting'}
                           className="bg-[var(--primary)] text-white px-8 py-5 rounded-[25px] font-black text-sm shadow-2xl shadow-orange-200 flex items-center justify-center gap-3 disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                        >
                           {orderStatus === 'submitting' ? 'Confirmando...' : 'ENVIAR PEDIDO'}
                        </button>
                     </div>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
