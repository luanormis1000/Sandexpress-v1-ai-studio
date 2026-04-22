'use client';

import React, { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Filter
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface Order {
  id: string;
  created_at: string;
  total: number;
  status: string;
  items: { name: string; quantity: number }[];
}

export default function ReportsPage() {
  const supabase = getSupabase();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [timeRange, setTimeRange] = useState('7d');
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  useEffect(() => {
    fetchVendors();
  }, [supabase]);

  const fetchVendors = async () => {
    if (!supabase) return;
    const { data } = await supabase.from('vendors').select('*');
    setVendors(data || []);
    if (data?.length) setSelectedVendorId(data[0].id);
  };

  useEffect(() => {
    if (selectedVendorId) fetchStats();
  }, [selectedVendorId, timeRange]);

  const fetchStats = async () => {
    if (!supabase || !selectedVendorId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('vendor_id', selectedVendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cálculos de métricas
  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Dados para gráfico de faturamento diário (simplificado)
  const revenueByDay = orders.reduce((acc: any, o) => {
    const day = new Date(o.created_at).toLocaleDateString('pt-BR', { weekday: 'short' });
    acc[day] = (acc[day] || 0) + o.total;
    return acc;
  }, {});

  const barChartData = Object.entries(revenueByDay).map(([day, value]) => ({ day, value }));

  // Itens mais vendidos
  const itemsStats = orders.reduce((acc: any, o) => {
    o.items.forEach(item => {
      acc[item.name] = (acc[item.name] || 0) + item.quantity;
    });
    return acc;
  }, {});

  const topItems = Object.entries(itemsStats)
    .map(([name, qty]: [any, any]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 font-sans max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-dark">Relatórios de Vendas</h1>
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
        
        <div className="flex gap-3 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
          {['7d', '30d', '12m'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${timeRange === range ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-dark'}`}
            >
              {range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : 'Ano'}
            </button>
          ))}
        </div>
      </header>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <MetricCard 
          label="Faturamento Total" 
          value={`R$ ${totalRevenue.toFixed(2)}`} 
          icon={<DollarSign className="text-emerald-500" />}
          trend="+12.5%"
          isPositive={true}
        />
        <MetricCard 
          label="Total de Pedidos" 
          value={totalOrders.toString()} 
          icon={<BarChart3 className="text-blue-500" />}
          trend="+5.2%"
          isPositive={true}
        />
        <MetricCard 
          label="Ticket Médio" 
          value={`R$ ${avgOrderValue.toFixed(2)}`} 
          icon={<TrendingUp className="text-amber-500" />}
          trend="-2.1%"
          isPositive={false}
        />
        <MetricCard 
          label="Novos Clientes" 
          value="142" 
          icon={<Users className="text-purple-500" />}
          trend="+18.4%"
          isPositive={true}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Gráfico de Faturamento */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-bold text-dark">Desempenho Semanal</h2>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-widest">Faturamento em R$</div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#FF6B00" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Itens Mais Vendidos */}
        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-dark mb-8">Mais Vendidos</h2>
          <div className="space-y-6">
            {topItems.map((item: any, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center font-bold text-primary">
                  {idx + 1}º
                </div>
                <div className="flex-grow">
                  <div className="font-bold text-dark text-sm">{item.name}</div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full" 
                      style={{ width: `${(item.qty / topItems[0].qty) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-dark text-sm">{item.qty}</div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Vendas</div>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 text-sm font-bold hover:bg-gray-50 transition-colors">
            Ver relatório completo
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, trend, isPositive }: any) {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-gray-50 rounded-2xl">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
      <div>
        <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">{label}</div>
        <div className="text-2xl font-display font-bold text-dark">{value}</div>
      </div>
    </div>
  );
}
