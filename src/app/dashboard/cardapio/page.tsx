'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Upload, 
  Loader2, 
  Search,
  Image as ImageIcon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
}

export default function MenuManagement() {
  const supabase = getSupabase();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['Todos', 'Bebidas', 'Petiscos', 'Refeições', 'Sobremesas'];

  useEffect(() => {
    const fetchVendors = async () => {
      if (!supabase) return;
      const { data } = await supabase.from('vendors').select('*');
      setVendors(data || []);
      if (data?.length) setSelectedVendorId(data[0].id);
    };
    fetchVendors();
  }, [supabase]);

  useEffect(() => {
    const fetchItems = async () => {
      if (!supabase || !selectedVendorId) return;
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('vendor_id', selectedVendorId)
          .order('category', { ascending: true })
          .order('name', { ascending: true });
        if (error) throw error;
        setItems(data || []);
      } catch (error) {
        console.error('Erro ao buscar cardápio:', error);
      } finally {
        setLoading(false);
      }
    };
    if (selectedVendorId) fetchItems();
  }, [selectedVendorId, supabase]);

  const fetchItems = async () => {
    if (!supabase || !selectedVendorId) return;
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('vendor_id', selectedVendorId)
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Erro ao buscar cardápio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !editingItem) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('menu_items')
        .upsert({
          ...editingItem,
          vendor_id: selectedVendorId,
          id: editingItem.id || undefined 
        });

      if (error) throw error;
      await fetchItems();
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      alert('Erro ao salvar item.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase || !confirm('Tem certeza que deseja excluir este item?')) return;
    
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `menu-items/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      setEditingItem(prev => ({ ...prev, image_url: publicUrl }));
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload.');
    } finally {
      setUploading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedItems = filteredItems.reduce((acc: Record<string, MenuItem[]>, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const currentCategories = Object.keys(groupedItems).sort();

  return (
    <div className="p-6 lg:p-10 font-sans max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-dark">Gestão do Cardápio</h1>
          <div className="flex items-center gap-2 mt-2">
            <select 
              value={selectedVendorId || ''}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="bg-transparent text-primary font-bold text-[10px] uppercase tracking-[0.2em] py-1 border-b border-orange-100 outline-none cursor-pointer"
            >
              {vendors.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button 
          onClick={() => {
            setEditingItem({ category: 'Bebidas', price: 0 });
            setIsModalOpen(true);
          }}
          className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/10"
        >
          <Plus size={20} /> Novo Item
        </button>
      </header>

      {/* Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-6 mb-10">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white pl-12 pr-4 py-3 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-dark"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                selectedCategory === cat 
                ? 'bg-dark text-white shadow-lg' 
                : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading && items.length === 0 ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="space-y-12">
          {currentCategories.length === 0 ? (
            <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-200">
              <p className="text-gray-400">Nenhum produto encontrado nesta categoria ou busca.</p>
            </div>
          ) : (
            currentCategories.map(category => (
              <section key={category}>
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{category}</h2>
                  <div className="h-[1px] bg-gray-100 flex-grow"></div>
                  <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                    {groupedItems[category].length} {groupedItems[category].length === 1 ? 'item' : 'itens'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedItems[category].map(item => (
                    <motion.div 
                      layout
                      key={item.id} 
                      className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow"
                    >
                      <div className="h-48 bg-gray-50 relative overflow-hidden">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-300">
                            <ImageIcon size={40} />
                            <span className="text-[10px] mt-2 uppercase font-bold tracking-widest">Sem foto</span>
                          </div>
                        )}
                        <div className="absolute top-4 right-4 flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingItem(item);
                              setIsModalOpen(true);
                            }}
                            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-gray-600 hover:text-primary shadow-sm transition-all"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-gray-600 hover:text-red-500 shadow-sm transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-dark text-lg leading-tight">{item.name}</h3>
                          <span className="font-bold text-primary whitespace-nowrap ml-2">R$ {item.price.toFixed(2)}</span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{item.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {/* Modal de Edição */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-[40px] p-8 shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-display font-bold">
                  {editingItem?.id ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-dark">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                {/* Upload de Imagem */}
                <div className="flex flex-col items-center border-2 border-dashed border-gray-100 rounded-3xl p-6 bg-gray-50/50">
                  <div className="w-32 h-32 rounded-2xl bg-white border border-gray-100 overflow-hidden mb-4 relative group">
                    {editingItem?.image_url ? (
                      <img src={editingItem.image_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300">
                        <ImageIcon size={32} />
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-dark/60 flex items-center justify-center">
                        <Loader2 className="animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    ref={fileInputRef} 
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary text-sm font-bold flex items-center gap-2 hover:underline"
                  >
                    <Upload size={16} /> {uploading ? 'Carregando...' : 'Escolher foto'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nome do Produto</label>
                    <input 
                      required
                      type="text" 
                      value={editingItem?.name || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Categoria</label>
                    <select 
                      value={editingItem?.category || 'Bebidas'}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none"
                    >
                      <option value="Bebidas">Bebidas</option>
                      <option value="Petiscos">Petiscos</option>
                      <option value="Refeições">Refeições</option>
                      <option value="Sobremesas">Sobremesas</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Preço (R$)</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      value={editingItem?.price || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Descrição</label>
                    <textarea 
                      rows={3}
                      value={editingItem?.description || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none text-sm"
                      placeholder="Ex: Suco natural de laranja, sem açúcar..."
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading || uploading}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50 shadow-xl shadow-primary/20"
                >
                  <Save size={20} /> Salvar Produto
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
