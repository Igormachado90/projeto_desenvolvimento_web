import { useState, useEffect } from 'react';
import { Building2, Phone, MapPin, Upload, Save, CheckCircle2, AlertCircle, School } from 'lucide-react';
import { schoolsService, SchoolData } from '../../../lib/schoolsService';
import { useAuth } from '../../../lib/useAuth';
import { supabase } from '../../../lib/supabase';

export const InstitutionTab = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [school, setSchool] = useState<SchoolData | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [availableSchools, setAvailableSchools] = useState<SchoolData[]>([]);
    const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

    useEffect(() => {
        const fetchSchool = async () => {
            if (user?.escola_id) {
                // User is linked to a school, load it directly
                setIsLoading(true);
                try {
                    const data = await schoolsService.getById(user.escola_id.toString());
                    setSchool(data);
                } catch (err) {
                    console.error('Erro ao carregar dados da instituição:', err);
                } finally {
                    setIsLoading(false);
                }
            } else if (user?.tipo === 'Administrador') {
                // User is Admin but not linked, fetch available schools
                setIsLoading(true);
                try {
                    const schools = await schoolsService.getAll(user.plataforma_id);
                    setAvailableSchools(schools);
                    if (schools.length > 0) {
                        // Auto-select the first one if available, or force selection
                        // For now, let's auto-select the first one to be helpful
                        const firstSchool = schools[0];
                        setSelectedSchoolId(firstSchool.id || null);
                        if (firstSchool.id) {
                            const data = await schoolsService.getById(firstSchool.id);
                            setSchool(data);
                        }
                    }
                } catch (err) {
                    console.error('Erro ao buscar escolas:', err);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchSchool();
    }, [user]);

    // Handle school selection change for admins
    const handleSchoolChange = async (schoolId: string) => {
        setSelectedSchoolId(schoolId);
        setIsLoading(true);
        try {
            const data = await schoolsService.getById(schoolId);
            setSchool(data);
        } catch (err) {
            console.error('Erro ao carregar escola selecionada:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="p-10 text-center animate-pulse font-bold text-slate-400">Carregando dados...</div>;

    if (!user?.escola_id && user?.tipo !== 'Administrador') return (
        <div className="p-10 text-center">
            <AlertCircle className="mx-auto size-12 text-amber-500 mb-4" />
            <p className="font-black text-slate-900">Nenhuma instituição vinculada</p>
            <p className="text-sm text-slate-500">Seu perfil não possui uma escola associada para configuração.</p>
        </div>
    );

    if (!school && !isLoading) return (
        <div className="p-10 text-center bg-slate-50 dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <Building2 className="mx-auto size-12 text-slate-300 mb-4" />
            <p className="font-black text-slate-900 dark:text-white">Nenhuma instituição encontrada</p>
            <p className="text-sm text-slate-500 mb-6">Cadastre uma nova escola no menu "Gerenciamento" para configurá-la aqui.</p>
        </div>
    );

    const getSchoolId = () => user?.escola_id?.toString() || selectedSchoolId;

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const effectiveSchoolId = getSchoolId();

        if (!file || !effectiveSchoolId) return;

        setIsSaving(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${effectiveSchoolId}-${Math.random()}.${fileExt}`;
            const filePath = `logos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('institutional-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('institutional-assets')
                .getPublicUrl(filePath);

            await schoolsService.update(effectiveSchoolId, { logo: publicUrl });
            setSchool(prev => prev ? { ...prev, logo: publicUrl } : null);
            setMessage({ type: 'success', text: 'Logotipo atualizado com sucesso!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: `Erro no upload: ${err.message}` });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const effectiveSchoolId = getSchoolId();

        if (!school || !effectiveSchoolId) return;

        setIsSaving(true);
        try {
            await schoolsService.update(effectiveSchoolId, school);
            setMessage({ type: 'success', text: 'Dados da instituição salvos com sucesso!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: `Erro ao salvar: ${err.message}` });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-4xl space-y-12">
            <header className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight italic">Dados da <span className="text-primary">Instituição</span></h2>
                        <p className="text-sm text-slate-500 font-medium">Configure as informações que aparecerão nos cabeçalhos dos seus documentos.</p>
                    </div>

                    {/* School Selector for Admins */}
                    {(!user?.escola_id && user?.tipo === 'Administrador' && availableSchools.length > 0) && (
                        <div className="w-full md:w-64">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Selecionar Escola</label>
                            <div className="relative">
                                <School size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={selectedSchoolId || ''}
                                    onChange={(e) => handleSchoolChange(e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 ring-primary/20 cursor-pointer"
                                >
                                    {availableSchools.map(s => (
                                        <option key={s.id} value={s.id}>{s.nome}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300 ${message.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span className="text-xs font-black uppercase tracking-widest">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 space-y-6 text-center">
                    <div className="relative group mx-auto size-48">
                        <div className="size-48 rounded-[3rem] bg-slate-50 dark:bg-slate-900 border-[1.5px] border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden shadow-sm">
                            {school?.logo ? (
                                <img src={school.logo} alt="Logo" className="w-full h-full object-contain p-4" />
                            ) : (
                                <Building2 size={64} className="text-slate-300" />
                            )}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-slate-900/60 text-white rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            <div className="flex flex-col items-center gap-2">
                                <Upload size={24} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Alterar Logo</span>
                            </div>
                        </label>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed px-4">
                        DICA: Use uma imagem PNG com fundo transparente para melhor resultado.
                    </p>
                </div>

                <div className="lg:col-span-2">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome Fantasia (Exibição)</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="text"
                                            required
                                            value={school?.nome || ''}
                                            onChange={(e) => setSchool(prev => prev ? { ...prev, nome: e.target.value } : null)}
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[1.5rem] py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Razão Social (Oficial)</label>
                                    <input
                                        type="text"
                                        value={school?.razao_social || ''}
                                        onChange={(e) => setSchool(prev => prev ? { ...prev, razao_social: e.target.value } : null)}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[1.5rem] py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        placeholder="Instituição Educacional LTDA"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Telefone / WhatsApp</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="text"
                                            value={school?.telefone || ''}
                                            onChange={(e) => setSchool(prev => prev ? { ...prev, telefone: e.target.value } : null)}
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[1.5rem] py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">CNPJ</label>
                                    <input
                                        type="text"
                                        value={school?.cnpj || ''}
                                        onChange={(e) => setSchool(prev => prev ? { ...prev, cnpj: e.target.value } : null)}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[1.5rem] py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        placeholder="00.000.000/0000-00"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">E-mail de Contato</label>
                                    <input
                                        type="email"
                                        value={school?.configuracoes?.email || ''}
                                        onChange={(e) => setSchool(prev => prev ? {
                                            ...prev,
                                            configuracoes: { ...(prev.configuracoes || {}), email: e.target.value }
                                        } : null)}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[1.5rem] py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        placeholder="contato@instituicao.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Website</label>
                                    <input
                                        type="text"
                                        value={school?.configuracoes?.website || ''}
                                        onChange={(e) => setSchool(prev => prev ? {
                                            ...prev,
                                            configuracoes: { ...(prev.configuracoes || {}), website: e.target.value }
                                        } : null)}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[1.5rem] py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        placeholder="www.instituicao.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Endereço Completo</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-4 text-slate-300" size={18} />
                                    <textarea
                                        rows={3}
                                        value={school?.endereco || ''}
                                        onChange={(e) => setSchool(prev => prev ? { ...prev, endereco: e.target.value } : null)}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-[1.5rem] py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isSaving ? <Building2 size={18} className="animate-spin" /> : <Save size={18} />}
                                Salvar Alterações
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Premium PDF Header Preview */}
            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-[2.5rem] p-8 md:p-12 border-2 border-dashed border-slate-200 dark:border-slate-800">
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="size-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-sm">
                                <Building2 size={16} />
                            </span>
                            Visualização do <span className="text-primary italic">Cabeçalho PDF</span>
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Veja como sua marca será exibida nos documentos gerados.</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-sm shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden max-w-2xl mx-auto">
                    {/* Header Top Bar */}
                    <div className="h-2.5 bg-primary" />

                    <div className="p-8">
                        {/* Header Top: Logo + Name + Platform Branding */}
                        <div className="flex items-start gap-5 mb-5">
                            <div className="shrink-0">
                                {school?.logo ? (
                                    <img src={school.logo} alt="Logo Preview" className="h-12 w-auto object-contain" />
                                ) : (
                                    <Building2 size={32} className="text-slate-300" />
                                )}
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-primary uppercase leading-tight tracking-tight">
                                    {school?.nome || 'ESCOLA MODELO'}
                                </h4>
                                <p className="text-[10px] font-bold italic text-slate-700 dark:text-slate-300">
                                    Plataforma VínculoTEA
                                </p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="h-[1px] bg-slate-200 dark:bg-slate-700 w-full mb-4" />

                        {/* Details Section - Mirroring pdfUtils layout */}
                        <div className="space-y-1.5 text-[9px] text-slate-500 dark:text-slate-400 font-normal leading-relaxed">

                            {/* Row 1: Razão + CNPJ */}
                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                                {(school?.razao_social && school.razao_social !== school.nome) && (
                                    <span>{school.razao_social}</span>
                                )}
                                {(school?.razao_social && school.razao_social !== school.nome && school?.cnpj) && (
                                    <span className="text-slate-300 font-light">|</span>
                                )}
                                {school?.cnpj && (
                                    <span>CNPJ: {school.cnpj}</span>
                                )}
                                {(!school?.razao_social && !school?.cnpj) && (
                                    <span className="text-slate-300 italic">Razão Social | CNPJ</span>
                                )}
                            </div>

                            {/* Row 2: Contacts */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span>{school?.telefone || '(00) 00000-0000'}</span>
                                <span className="text-slate-300 font-light">•</span>
                                <span>{school?.configuracoes?.email || 'email@escola.com'}</span>
                                <span className="text-slate-300 font-light">•</span>
                                <span>{school?.configuracoes?.website || 'www.escola.com'}</span>
                            </div>

                            {/* Row 3: Address */}
                            <div className="block max-w-[80%]">
                                <span>{school?.endereco || 'Endereço completo da instituição'}</span>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
