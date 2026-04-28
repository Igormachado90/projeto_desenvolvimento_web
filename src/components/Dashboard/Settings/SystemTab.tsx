
import { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Accessibility, EyeOff, EarOff, Brain, Ear, Zap } from 'lucide-react';
import { useAccessibility } from '../../../contexts/AccessibilityContext';

export const SystemTab = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [notifications, setNotifications] = useState(() => {
        return localStorage.getItem('sound_notifications') !== 'false';
    });


    const { config, toggleMode, setTutorialCompleted } = useAccessibility();

    useEffect(() => {
        localStorage.setItem('sound_notifications', notifications.toString());
    }, [notifications]);



    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
        setIsDarkMode(isDark);
    }, []);

    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-left-4 duration-500 max-w-4xl space-y-12">
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight italic">Informações do <span className="text-primary">Sistema</span></h2>
                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-700" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                        { label: 'Versão Atual', value: '2.4.0', status: 'Estável' },
                        { label: 'Ambiente', value: 'Produção', status: 'Online' },
                        { label: 'Sincronização', value: 'Ativa', status: '100%' }
                    ].map((item, i) => (
                        <div key={i} className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-transparent hover:border-primary/20 transition-all group">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{item.value}</p>
                            <span className="mt-3 inline-block px-2 py-0.5 bg-success/10 text-success text-[9px] font-black uppercase tracking-widest rounded-full">{item.status}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight italic">Preferências de <span className="text-primary">Interface</span></h2>
                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-700" />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-transparent hover:border-primary/20 transition-all cursor-pointer group" onClick={() => setNotifications(!notifications)}>
                        <div className="flex items-center gap-5">
                            <div className={`size-14 rounded-2xl flex items-center justify-center transition-all ${notifications ? 'bg-primary text-white shadow-lg shadow-primary-500/20' : 'bg-slate-100 text-slate-400 shadow-inner'}`}>
                                <Bell size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">Notificações Sonoras</p>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Ative alertas auditivos para eventos críticos e agendamentos</p>
                            </div>
                        </div>
                        <div className={`w-14 h-7 rounded-full p-1 transition-all duration-300 ${notifications ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}>
                            <div className={`size-5 bg-white rounded-full shadow-md transition-all duration-300 ${notifications ? 'translate-x-7' : 'translate-x-0'}`} />
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight italic">Acessibilidade e <span className="text-primary">Inclusão</span></h2>
                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-700" />
                </div>

                <div className="p-8 rounded-[2rem] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-[1.5px] border-slate-200 dark:border-slate-700 text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 bg-primary/5 rounded-bl-[100%] transition-transform group-hover:scale-150 duration-700" />

                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="size-16 rounded-full bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-primary mb-2 ring-4 ring-primary/10">
                            <Accessibility size={32} strokeWidth={2.5} />
                        </div>

                        <div className="max-w-md mx-auto space-y-2">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">Menu Global de Acessibilidade</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                Todas as ferramentas de inclusão (VLibras, Leitor de Tela, Modos de Contraste e Perfis) agora estão reunidas no menu flutuante no canto inferior direito da tela.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                                <button
                                    onClick={() => document.querySelector<HTMLElement>('button[aria-label="Menu de Acessibilidade"]')?.click()}
                                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#004183] to-[#455a85] text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                                >
                                <Accessibility size={16} />
                                Abrir Menu Acessibilidade
                            </button>

                            <button
                                onClick={() => setTutorialCompleted(false)}
                                className="px-6 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-[1.5px] border-slate-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wide hover:border-primary/50 hover:text-primary transition-all shadow-sm flex items-center gap-2"
                            >
                                <Zap size={16} className="text-orange-500" />
                                Refazer Guia de Configuração
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
