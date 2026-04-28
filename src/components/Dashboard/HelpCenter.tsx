import React, { useState, useMemo } from 'react';
import {
    Search, HelpCircle, Book, MessageSquare,
    Video, Phone, Mail, ChevronRight,
    ExternalLink, FileText, Shield, Zap, Clock, Instagram, X, ArrowLeft,
    CheckCircle2, AlertCircle, Info, Lock, Globe, Users, Settings, Filter,
    Building, GraduationCap, Layout, PenTool, Database, ChevronDown, Rocket,
    BarChart3, PieChart, ClipboardList
} from 'lucide-react';

interface Article {
    title: string;
    content: React.ReactNode;
}

interface Category {
    id: string;
    icon: any;
    title: string;
    desc: string;
    color: string;
    bg: string;
    articles: Article[];
}

export const HelpCenter: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    const categories: Category[] = [
        {
            id: 'start',
            icon: Rocket,
            title: 'Primeiros Passos',
            desc: 'Aprenda a configurar seu ecossistema do zero',
            color: 'text-[#004183]',
            bg: 'bg-blue-50',
            articles: [
                {
                    title: 'Configurando sua Instituição',
                    content: (
                        <div className="space-y-6">
                            <p className="text-slate-600 font-medium leading-relaxed">
                                Para que seus relatórios e documentos tenham sua identidade visual, o primeiro passo é configurar os dados da sua instituição ou clínica.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 border border-slate-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="size-8 rounded-lg bg-[#004183]/10 text-[#004183] flex items-center justify-center font-black">1</div>
                                        <h4 className="font-black text-[#0f172a]">Acesse Ajustes</h4>
                                    </div>
                                    <p className="text-xs text-slate-500 font-bold">Vá na aba de Configurações do Sistema e preencha o Perfil da Instituição.</p>
                                </div>
                                <div className="p-5 border border-slate-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="size-8 rounded-lg bg-[#004183]/10 text-[#004183] flex items-center justify-center font-black">2</div>
                                        <h4 className="font-black text-[#0f172a]">Carregue seu Logotipo</h4>
                                    </div>
                                    <p className="text-xs text-slate-500 font-bold">O logo enviado aqui aparecerá automaticamente no topo de todos os seus PEIs e relatórios em PDF.</p>
                                </div>
                            </div>
                        </div>
                    )
                }
            ]
        },
        {
            id: 'gestion',
            icon: Users,
            title: 'Gestão de Alunos',
            desc: 'Acompanhamento, limites e prontuário digital',
            color: 'text-violet-600',
            bg: 'bg-violet-50',
            articles: [
                {
                    title: 'Entendendo os Limites do Plano',
                    content: (
                        <div className="p-8 bg-slate-900 rounded-[2.5rem] relative overflow-hidden group">
                            <div className="relative z-10">
                                <h4 className="text-xl font-black text-white mb-4 leading-tight">Como funcionam as cotas?</h4>
                                <p className="text-slate-400 text-sm font-medium mb-6 leading-relaxed">
                                    Cada conta no VínculoTEA possui um limite de alunos ativos baseado no seu plano SaaS. Quando o limite é atingido, o botão "Novo Cadastro" ficará desabilitado (cinza).
                                </p>
                            </div>
                        </div>
                    )
                }
            ]
        },
        {
            id: 'pei',
            icon: PenTool,
            title: 'PEIs e Documentos',
            desc: 'Crie documentos científicos de alto impacto',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            articles: [
                {
                    title: 'Estrutura do PEI',
                    content: <p className="text-slate-600 font-medium">O PEI é composto por metas SMART, barreiras mapeadas e estratégias de intervenção.</p>
                }
            ]
        },
        {
            id: 'reports',
            icon: BarChart3,
            title: 'Relatórios & Gráficos',
            desc: 'Visualize dados, evolução e métricas de progresso',
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            articles: [
                {
                    title: 'Tipos de Relatórios Disponíveis',
                    content: (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                                    <div className="size-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
                                        <PieChart size={24} />
                                    </div>
                                    <h5 className="font-black text-slate-800 mb-2">Relatório de Evolução</h5>
                                    <p className="text-xs text-slate-500 font-medium">Gráficos de linha mostrando o progresso individual nas metas do PEI ao longo dos meses.</p>
                                </div>
                                <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                                    <div className="size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                                        <ClipboardList size={24} />
                                    </div>
                                    <h5 className="font-black text-slate-800 mb-2">Relatório de Assiduidade</h5>
                                    <p className="text-xs text-slate-500 font-medium">Controle de faltas e presenças para acompanhamento da família e escola.</p>
                                </div>
                            </div>
                        </div>
                    )
                }
            ]
        }
    ];

    const faqs = [
        { q: 'Por que não consigo adicionar novos alunos?', a: 'Isso acontece quando você atinge o limite do seu plano atual. Verifique seu status no topo da página de Gestão de Alunos.' },
        { q: 'Como vincular um professor a uma turma?', a: 'Vá em Gestão Escolar > Turmas, selecione a turma desejada e use a opção de adicionar profissionais vinculados.' },
        { q: 'O Logo da minha escola não sai no PDF, o que fazer?', a: 'Certifique-se de que o logo foi carregado na aba "Ajustes" e que a imagem não ultrapassa 2MB.' },
        { q: 'Esqueci minha senha, como recuperar?', a: 'Na tela de login, clique em "Esqueci minha senha". Você receberá um link de redefinição no seu e-mail cadastrado.' }
    ];

    const filteredFaqs = useMemo(() => {
        if (!searchQuery) return faqs;
        const q = searchQuery.toLowerCase();
        return faqs.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
    }, [searchQuery]);

    if (selectedCategory) {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest">
                        <span>Páginas</span>
                        <span className="text-slate-300">/</span>
                        <button onClick={() => setSelectedCategory(null)} className="hover:text-[#004183] transition-colors">Help</button>
                        <span className="text-slate-300">/</span>
                        <span className="text-[#004183]">{selectedCategory.title}</span>
                    </div>
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar
                    </button>
                </div>

                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col md:flex-row">
                    <div className={`md:w-80 p-12 ${selectedCategory.bg} border-r border-slate-50 flex flex-col gap-8`}>
                        <div className={`size-20 rounded-3xl bg-white ${selectedCategory.color} flex items-center justify-center shadow-xl shadow-[#004183]/5 border border-white`}>
                            <selectedCategory.icon size={40} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">{selectedCategory.title}</h1>
                            <p className="text-slate-500 font-bold text-sm leading-relaxed">{selectedCategory.desc}</p>
                        </div>
                        <div className="mt-auto p-6 bg-white/50 rounded-2xl border border-white/50 italic text-[11px] text-slate-400 font-medium">
                            Dúvidas sobre esses temas devem ser resolvidas via suporte.
                        </div>
                    </div>

                    <div className="flex-1 p-12 md:p-20 space-y-20 bg-slate-50/30">
                        {selectedCategory.articles.map((article, i) => (
                            <section key={i} className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className={`h-8 w-[4px] rounded-full ${selectedCategory.color.replace('text', 'bg')}`} />
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{article.title}</h2>
                                </div>
                                <div className="font-medium text-slate-600">
                                    {article.content}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12 pb-20">
            <div className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest">
                <span>Páginas</span>
                <span className="text-slate-300">/</span>
                <span className="text-[#004183]">Help</span>
            </div>

            <div className="bg-[#004183] rounded-[40px] p-12 md:p-20 relative overflow-hidden group shadow-2xl shadow-[#004183]/20">
                <div className="relative z-10 max-w-2xl">
                    <span className="inline-block px-4 py-1.5 bg-white/10 rounded-full text-white/60 text-[10px] font-black uppercase tracking-widest mb-6">Suporte & Documentação</span>
                    <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tighter leading-tight">Central de <span className="text-primary italic">Ajuda</span></h1>
                    <p className="text-slate-300 text-lg mb-10 font-medium leading-relaxed">Encontre guias rápidos e tire suas dúvidas técnicas.</p>

                    <div className="relative group/search">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within/search:text-white transition-colors" size={24} />
                        <input
                            type="text"
                            placeholder="Pesquisar ajuda..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/10 border-2 border-white/5 rounded-3xl py-6 pl-16 pr-6 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all backdrop-blur-xl text-lg font-bold"
                        />
                    </div>
                </div>
                <div className="absolute right-20 bottom-0 opacity-10 pointer-events-none hidden lg:block">
                    <HelpCircle size={350} strokeWidth={1} />
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-8 px-4">
                    <h2 className="text-2xl font-black text-[#0f172a] uppercase tracking-tighter">Categorias de <span className="text-[#004183]">Suporte</span></h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat)}
                            className="bg-white p-8 rounded-[30px] border-2 border-slate-100/50 shadow-sm hover:shadow-2xl hover:shadow-[#004183]/5 hover:-translate-y-2 transition-all text-left flex flex-col group relative overflow-hidden h-full"
                        >
                            <div className={`size-14 rounded-2xl ${cat.bg} ${cat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <cat.icon size={28} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-xl font-black text-[#0f172a] mb-3 tracking-tight">{cat.title}</h3>
                            <p className="text-slate-400 font-bold text-xs leading-relaxed mb-8">{cat.desc}</p>
                            
                            <div className="mt-auto flex items-center gap-3 text-[#004183] text-[9px] font-black uppercase tracking-[0.2em]">
                                Abrir Manual <ChevronRight size={14} strokeWidth={3} />
                            </div>
                        </button>
                    ))}
                </div>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center gap-4">
                        <MessageSquare size={20} className="text-slate-400" />
                        <h2 className="text-2xl font-black text-[#0f172a] tracking-tight">Perguntas Frequentes</h2>
                    </div>

                    <div className="bg-white rounded-[40px] border border-slate-100 overflow-hidden shadow-sm">
                        {faqs.map((faq, i) => (
                            <details key={i} className="group border-b border-slate-50 last:border-0">
                                <summary className="flex items-center justify-between p-8 cursor-pointer list-none outline-none hover:bg-slate-50/50 transition-colors">
                                    <span className="text-base font-black text-slate-800">{faq.q}</span>
                                    <ChevronDown size={18} className="text-slate-300 group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="px-8 pb-8">
                                    <p className="text-slate-500 font-bold text-sm bg-slate-50 p-6 rounded-3xl border border-slate-100">{faq.a}</p>
                                </div>
                            </details>
                        ))}
                    </div>
                </div>

                <div className="bg-[#004183] rounded-[40px] p-10 text-white shadow-xl shadow-[#004183]/20 flex flex-col items-center text-center relative overflow-hidden h-fit">
                    <div className="relative z-10 space-y-6">
                        <div className="size-16 bg-white/10 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-xl">
                            <Phone size={28} className="text-primary" />
                        </div>
                        <div>
                            <h4 className="text-xl font-black mb-2 uppercase tracking-tight">Suporte Direto</h4>
                            <p className="text-white/60 text-xs font-bold leading-relaxed mb-8">Atendimento rápido via WhatsApp.</p>
                        </div>
                        <a href="#" className="block w-full py-5 bg-primary text-[#0f172a] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95">Abrir WhatsApp</a>
                    </div>
                </div>
            </div>
        </div>
    );
};
