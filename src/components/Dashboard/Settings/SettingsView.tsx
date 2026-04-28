import { useState } from 'react';
import { Settings as SystemIcon, Shield, Building2 } from 'lucide-react';
import { SystemTab } from './SystemTab';
import { SecurityTab } from './SecurityTab';
import { InstitutionTab } from './InstitutionTab';
import { UsersTab } from './UsersTab';
import { useAuth } from '../../../lib/useAuth';
import { Users as UsersIcon } from 'lucide-react';


type Tab = 'institution' | 'system' | 'security' | 'users';

export const SettingsView = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>(user?.escola_id ? 'institution' : 'system');

    return (
        <div className="animate-in fade-in duration-700 space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        Ajustes do <span className="text-primary italic">Sistema</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-2">
                        <div className="size-2 bg-amber-500 rounded-full animate-pulse" />
                        Gerencie as configurações da sua instituição e preferências
                    </p>
                </div>
            </div>

            { }
            <div className="bg-white dark:bg-slate-800 p-2 rounded-3xl border-[1.5px] border-slate-100 dark:border-slate-700 shadow-sm inline-flex flex-wrap gap-2">
                {[
                    { id: 'institution', icon: Building2, label: 'Instituição' }, // Always visible
                    { id: 'users', icon: UsersIcon, label: 'Usuários', hidden: user?.tipo !== 'Administrador' && user?.tipo !== 'GESTOR' },
                    { id: 'system', icon: SystemIcon, label: 'Sistema' },
                    { id: 'security', icon: Shield, label: 'Segurança' },
                ].filter(t => !t.hidden).map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.1em] transition-all duration-500 ${isActive
                                ? 'bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white shadow-xl shadow-blue-500/20 scale-105'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-primary active:scale-95'
                                }`}
                        >
                            <tab.icon size={18} strokeWidth={isActive ? 3 : 2} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            { }
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border-[1.5px] border-slate-100 dark:border-slate-700 shadow-sm min-h-[500px]">
                <div className="p-8 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'institution' && <InstitutionTab />}
                    {activeTab === 'users' && <UsersTab />}
                    {activeTab === 'system' && <SystemTab />}
                    {activeTab === 'security' && <SecurityTab />}
                </div>
            </div>
        </div>
    );
};
