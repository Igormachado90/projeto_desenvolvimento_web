import { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Clock, User, Plus, Search, ChevronLeft, ChevronRight, Filter, MoreHorizontal, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, eachDayOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { studentService } from '@/lib/studentService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { fetchSchoolPDFData, renderModernHeader, renderModernFooter } from '@/lib/pdfUtils';

interface Event {
    id: number;
    titulo: string;
    data: string;
    horario: string;
    professor_id: number;
    professor_nome?: string;
    tipo_evento: 'Agendamento' | 'Importante' | 'Normal';
    descricao: string;
    status: string;
}

export const AgendaView = ({ studentId }: { studentId?: string | number }) => {
    const { user: authUser } = useAuth();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [schoolInfo, setSchoolInfo] = useState<{ logo?: string, nome?: string, cnpj?: string, telefone?: string } | null>(null);



    const [formData, setFormData] = useState({
        titulo: '',
        data: format(new Date(), 'yyyy-MM-dd'),
        horario: '',
        professor_id: '',
        tipo_evento: 'Normal' as any,
        descricao: ''
    });

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('Agenda')
                .select(`
                    *,
                    Professores:Professor_ID (Nome)
                `);

            if (authUser?.plataforma_id) {
                query = query.eq('Plataforma_ID', authUser.plataforma_id);
            }

            if (studentId) {
                query = query.eq('Aluno_ID', String(studentId));
            }

            const { data, error } = await query
                .order('Data', { ascending: true })
                .order('Horario', { ascending: true });

            if (error) throw error;

            const mappedEvents = data.map((e: any) => ({
                id: e.Evento_ID,
                titulo: e.Titulo,
                data: e.Data,
                horario: e.Horario,
                professor_id: e.Professor_ID,
                professor_nome: e.Professores?.Nome,
                tipo_evento: e.Tipo_Evento,
                descricao: e.Descricao,
                status: e.Status
            }));
            setEvents(mappedEvents);
        } catch (error) {
            console.error('Erro ao buscar eventos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProfessionals = async () => {
        try {
            const data = await studentService.getAllProfessionals(authUser?.plataforma_id);
            setProfessionals(data);
        } catch (error) {
            console.error('Erro ao buscar profissionais:', error);
        }
    };

    useEffect(() => {
        fetchEvents();
        fetchProfessionals();

        const fetchSchoolInfo = async () => {
            if (authUser?.escola_id) {
                const { data: schoolData, error } = await supabase
                    .from('Escolas')
                    .select('Nome, Logo, CNPJ, Telefone')
                    .eq('Escola_ID', authUser.escola_id)
                    .single();
                if (schoolData) {
                    setSchoolInfo({
                        logo: schoolData.Logo,
                        nome: schoolData.Nome,
                        cnpj: schoolData.CNPJ,
                        telefone: schoolData.Telefone
                    });
                }
            }
        };
        fetchSchoolInfo();
    }, [studentId, authUser?.escola_id]);

    useEffect(() => {

        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }


        const interval = setInterval(() => {
            const now = new Date();
            const todayStr = format(now, 'yyyy-MM-dd');

            events.forEach(event => {
                if (event.tipo_evento === 'Importante' && event.data === todayStr) {
                    const eventTime = event.horario.slice(0, 5);
                    const [h, m] = eventTime.split(':').map(Number);
                    const eventDate = new Date();
                    eventDate.setHours(h, m, 0);

                    const diff = (eventDate.getTime() - now.getTime()) / (1000 * 60);
                    if (diff > 0 && diff <= 15) {
                        new Notification(`Evento Importante: ${event.titulo}`, {
                            body: `Início às ${eventTime}. Profissional: ${event.professor_nome}`,
                            icon: '/logo_icon.png'
                        });
                    }
                }
            });
        }, 60000);

        return () => clearInterval(interval);
    }, [events]);

    const handleExportWeeklyPDF = async () => {
        const jsPDFModule = await import('jspdf');
        const jsPDF = jsPDFModule.default;

        const doc = new jsPDF({ orientation: 'landscape' });
        const start = startOfWeek(currentMonth, { locale: ptBR });
        const end = endOfWeek(currentMonth, { locale: ptBR });
        const weekDays = eachDayOfInterval({ start, end });

        const schoolData = authUser?.escola_id ? await fetchSchoolPDFData(authUser.escola_id) : null;

        let contentStartY = 45;

        // Render Header
        if (schoolData) {
            contentStartY = await renderModernHeader(doc, schoolData);
        } else {
            // Fallback Header
            doc.setFillColor(20, 57, 109);
            doc.rect(0, 0, 297, 30, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text(`CRONOGRAMA SEMANAL - ${format(start, 'dd/MM')} a ${format(end, 'dd/MM')}`, 14, 20);
            contentStartY = 45;
        }

        // Title if using modern header
        if (schoolData) {
            contentStartY += 5;
            doc.setFontSize(16);
            doc.setTextColor(30, 41, 59);
            doc.setFont('helvetica', 'bold');
            doc.text(`CRONOGRAMA SEMANAL - ${format(start, 'dd/MM')} a ${format(end, 'dd/MM')}`, 14, contentStartY);
            contentStartY += 10;
        }

        let x = 14;
        const gridStartY = contentStartY + 5;

        weekDays.forEach(day => {
            const dayEvents = getDayEvents(day);
            const gray = isActiveDay(day) ? 240 : 255;

            // Background for day column
            doc.setFillColor(gray, gray, gray);
            doc.rect(x, gridStartY, 38, 130, 'F');
            doc.setDrawColor(200, 200, 200);
            doc.rect(x, gridStartY, 38, 130, 'S'); // Border

            doc.setTextColor(60, 60, 60);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(format(day, 'EEEE', { locale: ptBR }).toUpperCase(), x + 2, gridStartY + 6);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(format(day, 'dd/MM'), x + 2, gridStartY + 11);

            let y = gridStartY + 15;
            dayEvents.forEach(e => {
                const bgColor = e.tipo_evento === 'Importante' ? [254, 226, 226] : [255, 255, 255]; // Red-50 or White
                const borderColor = e.tipo_evento === 'Importante' ? [239, 68, 68] : [203, 213, 225];

                doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
                doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
                doc.rect(x + 1, y, 36, 18, 'FD'); // Fill and Draw

                doc.setTextColor(0);
                doc.setFontSize(7);
                doc.setFont('helvetica', 'bold');
                doc.text(`${e.horario.slice(0, 5)} - ${e.titulo.substring(0, 18)}...`, x + 3, y + 5);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(6);
                doc.text(e.professor_nome?.substring(0, 25) || '', x + 3, y + 12);

                y += 20;
            });
            x += 40;
        });

        if (schoolData) {
            renderModernFooter(doc, schoolData);
        } else {
            // Fallback footer
            const footerText = schoolInfo?.nome
                ? `© ${new Date().getFullYear()} ${schoolInfo.nome} - Agenda Oficial`
                : '© Vinculo PEI - Documento Oficial Reservado';

            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(footerText, 14, 200);
        }

        doc.save(`agenda_semanal_${format(new Date(), 'yyyyMMdd')}.pdf`);
    };

    const isActiveDay = (day: Date) => isSameDay(day, new Date());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                Titulo: formData.titulo,
                Data: formData.data,
                Horario: formData.horario,
                Professor_ID: parseInt(formData.professor_id),
                Tipo_Evento: formData.tipo_evento,
                Descricao: formData.descricao,
                Aluno_ID: studentId || null,
                Plataforma_ID: authUser?.plataforma_id
            };

            if (editingEvent) {
                const { error } = await supabase
                    .from('Agenda')
                    .update(payload)
                    .eq('Evento_ID', editingEvent.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('Agenda')
                    .insert([payload]);
                if (error) throw error;
            }

            setIsCreating(false);
            setEditingEvent(null);
            setFormData({
                titulo: '',
                data: format(new Date(), 'yyyy-MM-dd'),
                horario: '',
                professor_id: '',
                tipo_evento: 'Normal',
                descricao: ''
            });
            fetchEvents();
        } catch (error) {
            console.error('Erro ao salvar evento:', error);
            alert('Erro ao salvar agendamento.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEvent = async (id: number) => {
        if (!window.confirm('Tem certeza que deseja excluir este evento?')) return;
        try {
            const { error } = await supabase
                .from('Agenda')
                .delete()
                .eq('Evento_ID', id);
            if (error) throw error;
            fetchEvents();
            setIsCreating(false);
            setEditingEvent(null);
        } catch (error) {
            console.error('Erro ao excluir evento:', error);
            alert('Erro ao excluir evento.');
        }
    };

    const handleEditEvent = (event: Event) => {
        setEditingEvent(event);
        setFormData({
            titulo: event.titulo,
            data: event.data,
            horario: event.horario,
            professor_id: event.professor_id.toString(),
            tipo_evento: event.tipo_evento,
            descricao: event.descricao
        });
        setIsCreating(true);
    };



    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: ptBR });
    const endDate = endOfWeek(monthEnd, { locale: ptBR });

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const filteredEvents = useMemo(() => {
        if (!searchQuery) return events;
        const q = searchQuery.toLowerCase();
        return events.filter(e =>
            e.titulo.toLowerCase().includes(q) ||
            e.descricao.toLowerCase().includes(q) ||
            e.professor_nome?.toLowerCase().includes(q)
        );
    }, [events, searchQuery]);

    const getDayEvents = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return filteredEvents.filter(e => e.data === dateStr);
    };

    const importantEvents = useMemo(() => filteredEvents.filter(e => e.tipo_evento === 'Importante'), [filteredEvents]);
    const todayEvents = useMemo(() => getDayEvents(new Date()), [filteredEvents]);
    const tomorrowEvents = useMemo(() => getDayEvents(addDays(new Date(), 1)), [filteredEvents]);


    return (
        <div className="animate-in fade-in duration-700 space-y-8 pb-12">
            <div className="flex flex-col xl:flex-row gap-10">

                { }
                <div className="w-full xl:w-80 space-y-8">
                    { }
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest px-2">{format(currentMonth, 'MMMM', { locale: ptBR })}</h3>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"><ChevronLeft size={16} /></button>
                                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"><ChevronRight size={16} /></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {['s', 't', 'q', 'q', 's', 's', 'd'].map(d => (
                                <span key={d} className="text-[10px] font-black text-slate-400 uppercase mb-2">{d}</span>
                            ))}
                            {calendarDays.map((day, i) => {
                                const isSelected = isSameDay(day, selectedDate);
                                const isCurrentMonth = isSameMonth(day, monthStart);
                                const hasEvents = getDayEvents(day).length > 0;

                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDate(day)}
                                        className={`size-8 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center relative ${!isCurrentMonth ? 'text-slate-300 dark:text-slate-600' :
                                            isSelected ? 'bg-primary text-white shadow-lg shadow-primary/30' :
                                                'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        {format(day, 'd')}
                                        {hasEvents && !isSelected && (
                                            <div className="size-1 bg-primary rounded-full absolute bottom-1" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    { }
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-8">
                        <div>
                            <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-4">
                                <span className="size-1.5 bg-primary rounded-full" /> Hoje
                            </h4>
                            {todayEvents.length > 0 ? todayEvents.slice(0, 3).map(e => (
                                <div key={e.id} className="text-xs font-medium text-slate-500 mb-2">• {e.titulo}</div>
                            )) : <p className="text-[10px] text-slate-400 italic">Nenhum evento hoje</p>}
                        </div>

                        <div>
                            <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-4">
                                <span className="size-1.5 bg-slate-400 rounded-full" /> Amanhã
                            </h4>
                            {tomorrowEvents.length > 0 ? tomorrowEvents.slice(0, 3).map(e => (
                                <div key={e.id} className="text-xs font-medium text-slate-500 mb-2">• {e.titulo}</div>
                            )) : <p className="text-[10px] text-slate-400 italic">Nenhum evento amanhã</p>}
                        </div>

                        <div>
                            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-red-500">
                                <span className="size-1.5 bg-red-500 rounded-full animate-pulse" /> Importante
                            </h4>
                            {importantEvents.length > 0 ? (
                                <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20">
                                    <p className="text-xs font-black text-red-600 mb-1">{importantEvents[0].titulo}</p>
                                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">{importantEvents[0].horario.slice(0, 5)}</p>
                                </div>
                            ) : <p className="text-[10px] text-slate-400 italic">Nada urgente marcado</p>}
                        </div>
                    </div>
                </div>

                { }
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-50 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-6">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                        </h2>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <button
                                onClick={handleExportWeeklyPDF}
                                className="px-6 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-primary transition-all"
                            >
                                Exportar Semana (PDF)
                            </button>
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar no calendário..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 ring-primary/20"
                                />
                            </div>

                            <button
                                onClick={() => setIsCreating(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.05] transition-all border-none cursor-pointer"
                            >
                                <Plus size={16} /> Criar
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto bg-slate-50/30 dark:bg-slate-900/10">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4 py-40">
                                <Loader2 className="animate-spin text-primary" size={40} />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando Agenda...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-7 border-collapse">
                                {['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map(d => (
                                    <div key={d} className="px-4 py-6 text-center text-[10px] font-black text-slate-400 uppercase border-b border-r border-slate-100 dark:border-slate-700 last:border-r-0">{d}</div>
                                ))}
                                {calendarDays.map((day, i) => {
                                    const dayEvents = getDayEvents(day);
                                    const isCurrentMonth = isSameMonth(day, monthStart);
                                    const isToday = isSameDay(day, new Date());

                                    return (
                                        <div
                                            key={i}
                                            className={`min-h-[160px] p-4 border-b border-r border-slate-100 dark:border-slate-700 last:border-r-0 group hover:bg-white dark:hover:bg-slate-800/80 transition-all ${!isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-900/50 opacity-40' : ''
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`size-8 rounded-xl flex items-center justify-center text-xs font-black ${isToday ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400'
                                                    }`}>
                                                    {format(day, 'd')}
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                {dayEvents.map(event => (
                                                    <div
                                                        key={event.id}
                                                        onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}
                                                        className={`p-2 rounded-xl border-[1.5px] cursor-pointer hover:scale-105 transition-all ${event.tipo_evento === 'Importante'
                                                            ? 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-600'
                                                            : event.tipo_evento === 'Agendamento'
                                                                ? 'bg-primary/5 dark:bg-primary/10 border-primary/20 text-primary'
                                                                : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <Clock size={8} />
                                                            <span className="text-[8px] font-black">{event.horario.slice(0, 5)}</span>
                                                        </div>
                                                        <div className="text-[9px] font-black line-clamp-2 leading-tight uppercase tracking-tight">{event.titulo}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            { }
            {isCreating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden max-w-xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingEvent ? 'Editar' : 'Criar'} <span className="text-primary italic">Evento</span></h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{editingEvent ? 'Atualize o agendamento' : 'Novo agendamento no sistema'}</p>
                            </div>
                            <button onClick={() => { setIsCreating(false); setEditingEvent(null); }} className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Evento *</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ex: Consulta Pedagógica"
                                    value={formData.titulo}
                                    onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-primary/20 focus:ring-2"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data *</label>
                                    <input
                                        required
                                        type="date"
                                        value={formData.data}
                                        onChange={e => setFormData({ ...formData, data: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Horário *</label>
                                    <input
                                        required
                                        type="time"
                                        value={formData.horario}
                                        onChange={e => setFormData({ ...formData, horario: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profissional Responsável *</label>
                                <select
                                    required
                                    value={formData.professor_id}
                                    onChange={e => setFormData({ ...formData, professor_id: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none appearance-none"
                                >
                                    <option value="">Selecione um profissional...</option>
                                    {professionals.map(p => (
                                        <option key={p.id || p.Professor_ID} value={p.id || p.Professor_ID}>{p.Nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Evento *</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Agendamento', 'Importante', 'Normal'].map(tipo => (
                                        <button
                                            key={tipo}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, tipo_evento: tipo as any })}
                                            className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${formData.tipo_evento === tipo
                                                ? 'bg-primary/10 border-primary text-primary'
                                                : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-400'
                                                }`}
                                        >
                                            {tipo}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                                <textarea
                                    placeholder="Detalhes do agendamento..."
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-3xl py-4 px-6 text-sm font-bold outline-none min-h-[100px]"
                                />
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={() => { setIsCreating(false); setEditingEvent(null); }} className="flex-1 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50">Cancelar</button>
                                {editingEvent && (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteEvent(editingEvent.id)}
                                        className="flex-1 py-4 bg-red-50 text-red-500 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all"
                                    >
                                        Excluir
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[2] py-4 bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-[0.95] transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : editingEvent ? 'Atualizar Evento' : 'Salvar Evento'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
