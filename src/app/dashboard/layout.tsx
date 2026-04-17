'use client';

import React from 'react';
import { ChefHat, Settings, LayoutDashboard, QrCode } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar sidebar */}
      <aside className="w-64 bg-dark text-white p-6 flex flex-col hidden lg:flex">
        <div className="text-2xl font-display font-bold text-primary mb-12">SandExpress</div>
        
        <nav className="space-y-2 flex-grow">
          <DashboardLink href="/dashboard/pedidos" icon={<ChefHat size={20} />} label="Pedidos" />
          <DashboardLink href="/dashboard/configuracoes" icon={<Settings size={20} />} label="Configurações" />
          <DashboardLink href="/dashboard/qrcode" icon={<QrCode size={20} />} label="Gerar QR Codes" />
        </nav>

        <div className="pt-6 border-t border-white/10">
          <DashboardLink href="/" icon={<LayoutDashboard size={20} />} label="Ver Site" />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow flex flex-col">
        {/* Mobile Nav area */}
        <div className="lg:hidden bg-dark p-4 flex justify-between items-center text-white">
           <div className="text-xl font-display font-bold text-primary">SandExpress</div>
           <div className="flex gap-4">
             <Link href="/dashboard/pedidos"><ChefHat size={24} /></Link>
             <Link href="/dashboard/configuracoes"><Settings size={24} /></Link>
           </div>
        </div>
        
        <main className="flex-grow">
          {children}
        </main>
      </div>
    </div>
  );
}

function DashboardLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-gray-300 hover:text-white"
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}
