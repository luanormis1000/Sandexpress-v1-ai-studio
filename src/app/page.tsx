import React from 'react';
import { Check, QrCode, ShoppingBag, BarChart3, Clock } from 'lucide-react';

const steps = [
  { t: "QR Code no Guarda-sol", d: "Cada guarda-sol recebe um código exclusivo para identificação automática da mesa." },
  { t: "Cliente Acessa o Menu", d: "O cliente escaneia o código com o celular e vê seu cardápio com fotos e preços." },
  { t: "Pedido Realizado", d: "O pedido chega instantaneamente no seu painel de controle ou impressora." },
  { t: "Entrega Rápida", d: "Sua equipe entrega o pedido diretamente no guarda-sol certo, sem confusão." }
];

const benefits = [
  { title: "Pedidos via QR Code", desc: "Seus clientes pedem sem precisar chamar o garçom." },
  { title: "Gestão em Tempo Real", desc: "Acompanhe todos os pedidos e faturamento ao vivo." },
  { title: "Cardápio Digital", desc: "Atualize preços e itens em segundos, sem imprimir nada." },
  { title: "Relatórios de Vendas", desc: "Descubra quais produtos vendem mais e horários de pico." }
];

const plans = [
  { name: "Trial", price: "Grátis", desc: "Para conhecer a plataforma", features: ["Até 5 guarda-sóis", "Pedidos ilimitados", "Todas as funcionalidades"] },
  { name: "Mensal", price: "R$ 97", desc: "Ideal para testar a temporada", features: ["Até 50 guarda-sóis", "Pedidos ilimitados", "Relatórios completos"] },
  { name: "Anual", price: "R$ 797", desc: "Para quem quer faturar o ano todo", features: ["Até 100 guarda-sóis", "Pedidos ilimitados", "QR codes personalizados"] }
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-primary">SandExpress</div>
        <div className="hidden md:flex gap-8">
          <a href="#como-funciona" className="text-dark hover:text-primary transition-colors">Como funciona</a>
          <a href="#beneficios" className="text-dark hover:text-primary transition-colors">Benefícios</a>
          <a href="#planos" className="text-dark hover:text-primary transition-colors">Planos</a>
        </div>
        <button className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-full font-medium transition-colors">
          Entrar
        </button>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 tracking-tight leading-tight">
          Seu quiosque vendendo mais, <span className="text-primary">sem esforço.</span>
        </h1>
        <p className="text-lg text-gray-600 mb-10 leading-relaxed">
          Elimine filas, reduza erros de pedidos e deixe seus clientes pedirem direto do guarda-sol usando apenas um QR Code.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-all">
            Ver demonstração
          </button>
          <button className="bg-secondary text-dark px-8 py-4 rounded-xl font-bold text-lg hover:brightness-95 transition-all">
            Teste Grátis 7 dias
          </button>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="bg-gray-50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold mb-4">Em 4 passos simples</h2>
            <p className="text-gray-600">O fluxo perfeito para o seu cliente pedir sem complicação.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 font-bold text-xl">
                  {i + 1}
                </div>
                <h3 className="font-bold mb-3">{step.t}</h3>
                <p className="text-sm text-gray-600 line-clamp-3">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section id="beneficios" className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-display font-bold mb-4">Tudo que você precisa</h2>
          <p className="text-gray-600">Funcionalidades pensadas para maximizar suas vendas na praia.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {benefits.map((b, i) => (
            <div key={i} className="text-left p-6">
              <div className="w-12 h-12 bg-secondary text-dark rounded-xl flex items-center justify-center mb-4">
                {i === 0 && <QrCode size={24} />}
                {i === 1 && <BarChart3 size={24} />}
                {i === 2 && <ShoppingBag size={24} />}
                {i === 3 && <Clock size={24} />}
              </div>
              <h3 className="font-bold mb-2">{b.title}</h3>
              <p className="text-sm text-gray-600">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="bg-gray-50 py-20 px-6">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-display font-bold mb-4">Planos que cabem no seu bolso</h2>
          <p className="text-gray-600">Comece com 7 dias grátis. Sem surpresas.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, i) => (
            <div key={i} className={`bg-white p-10 rounded-3xl shadow-sm flex flex-col ${i === 1 ? 'ring-2 ring-primary scale-105 shadow-xl relative z-10' : 'border border-gray-100'}`}>
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className="text-4xl font-display font-bold mb-4">{plan.price}</div>
              <p className="text-sm text-gray-400 mb-8">{plan.desc}</p>
              <ul className="space-y-4 mb-10 flex-grow">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-gray-600">
                    <Check className="text-primary" size={18} />
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-4 rounded-xl font-bold transition-all ${i === 1 ? 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20' : 'bg-gray-100 text-dark hover:bg-gray-200'}`}>
                Começar agora
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 text-center bg-dark text-white overflow-hidden relative">
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-8">Pronto para transformar seu atendimento?</h2>
          <p className="text-gray-300 mb-10 text-lg">Comece agora com 7 dias grátis. Não precisa cartão de crédito.</p>
          <button className="bg-primary text-white px-10 py-5 rounded-2xl font-bold text-xl hover:scale-105 active:scale-95 transition-all">
            Criar conta agora
          </button>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary rounded-full blur-[120px]"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xl font-bold text-primary">SandExpress</div>
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} SandExpress. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
