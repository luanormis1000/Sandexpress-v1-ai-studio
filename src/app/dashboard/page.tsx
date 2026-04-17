import React from 'react';
import { ChefHat, Settings, QrCode, TrendingUp, Users, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function DashboardHome() {
  return (
    <div className="p-6 lg:p-10 font-sans max-w-7xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-display font-bold text-dark">Bem-vindo, Administrador</h1>
        <p className="text-gray-500 mt-2">Veja o que está acontecendo no seu quiosque agora.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard icon={<ShoppingBag className="text-primary" />} label="Pedidos Hoje" value="42" change="+12% que ontem" />
        <StatCard icon={<TrendingUp className="text-emerald-500" />} label="Faturamento" value="R$ 1.240" change="+8% esta semana" />
        <StatCard icon={<Users className="text-blue-500" />} label="Clientes Ativos" value="15" change="Em 8 mesas" />
      </div>

      <h2 className="text-xl font-bold text-dark mb-6">Ações Rápidas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuickAction 
          href="/dashboard/pedidos" 
          icon={<ChefHat size={32} />} 
          title="Ver Pedidos" 
          desc="Gerencie as comandas da cozinha em tempo real."
          color="bg-primary"
        />
        <QuickAction 
          href="/dashboard/configuracoes" 
          icon={<Settings size={32} />} 
          title="Personalizar App" 
          desc="Mude cores, logo e nome do quiosque."
          color="bg-dark"
        />
        <QuickAction 
          href="/dashboard/qrcode" 
          icon={<QrCode size={32} />} 
          title="Gerar QR Codes" 
          desc="Crie e imprima códigos para as mesas."
          color="bg-gray-400"
        />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, change }: any) {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-3xl font-display font-bold text-dark mb-2">{value}</div>
      <div className="text-xs font-bold text-gray-400">{change}</div>
    </div>
  );
}

function QuickAction({ href, icon, title, desc, color }: any) {
  return (
    <Link href={href}>
      <div className="group bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer h-full border-b-8 border-b-transparent hover:border-b-primary">
        <div className={`w-16 h-16 ${color} text-white rounded-3xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-dark mb-2">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </Link>
  );
}
