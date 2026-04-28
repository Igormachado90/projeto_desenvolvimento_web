import { useState, useEffect } from 'react';
import { Search, Plus, Filter, MessageSquare, AlertCircle, Clock, Trash2, Edit2, Pin, Loader2, X } from 'lucide-react';
import { notesService, Note } from '@/lib/notesService';

export const NotesTab = ({ studentId }: { studentId: string }) => {
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('Todos');
    const [isAdding, setIsAdding] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState<Note[]>([]);

    const [formData, setFormData] = useState({
        tipo: 'Geral' as Note['tipo'],
        data: new Date().toISOString().split('T')[0],
        conteudo: ''
    });

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const data = await notesService.getAllByStudent(studentId);
            setNotes(data);
        } catch (error) {
            console.error('Erro ao buscar anotações:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [studentId]);

    const handleSaveNote = async () => {
        if (!formData.conteudo) return;

        try {
            if (editingNote) {
                await notesService.update(editingNote.id, formData);
            } else {
                await notesService.create({
                    student_id: studentId,
                    ...formData
                });
            }
            setFormData({ tipo: 'Geral', data: new Date().toISOString().split('T')[0], conteudo: '' });
            setIsAdding(false);
            setEditingNote(null);
            fetchNotes();
        } catch (error) {
            console.error('Erro ao salvar anotação:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir esta anotação?')) return;
        try {
            await notesService.delete(id);
            fetchNotes();
        } catch (error) {
            console.error('Erro ao excluir anotação:', error);
        }
    };

    const handleEdit = (note: Note) => {
        setEditingNote(note);
        setFormData({
            tipo: note.tipo,
            data: note.data,
            conteudo: note.conteudo
        });
        setIsAdding(true);
    };

    const filteredNotes = notes.filter(n => {
        const matchesSearch = n.conteudo.toLowerCase().includes(search.toLowerCase());
        const matchesType = filterType === 'Todos' || n.tipo === filterType;
        return matchesSearch && matchesType;
    });

    const getTipoColor = (tipo: Note['tipo']) => {
        switch (tipo) {
            case 'Comportamental': return 'bg-amber-100 text-amber-600';
            case 'Acadêmico': return 'bg-blue-100 text-blue-600';
            case 'Saúde': return 'bg-rose-100 text-rose-600';
            case 'Família': return 'bg-purple-100 text-purple-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border-[1.5px] border-slate-100 dark:border-slate-700 shadow-sm flex flex-col xl:flex-row gap-6 items-center">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Pesquisar anotações..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border-[1.5px] border-transparent focus:border-primary/20 transition-all outline-none font-bold text-sm"
                    />
                </div>
                <div className="flex gap-4 w-full xl:w-auto">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="flex-1 xl:flex-none h-[56px] px-6 bg-slate-100 dark:bg-slate-900 rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-widest outline-none transition-all"
                    >
                        <option value="Todos">Todos os Tipos</option>
                        <option value="Geral">Geral</option>
                        <option value="Comportamental">Comportamental</option>
                        <option value="Acadêmico">Acadêmico</option>
                        <option value="Saúde">Saúde</option>
                        <option value="Família">Família</option>
                    </select>
                    <button
                        onClick={() => {
                            setIsAdding(!isAdding);
                            if (!isAdding) {
                                setEditingNote(null);
                                setFormData({ tipo: 'Geral', data: new Date().toISOString().split('T')[0], conteudo: '' });
                            }
                        }}
                        className="flex-1 xl:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all hover:scale-[1.05] border-none cursor-pointer"
                    >
                        {isAdding ? <X size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
                        {isAdding ? 'Fechar' : 'Nova Anotação'}
                    </button>
                </div>
            </div>

            {}
            {isAdding && (
                <div className="bg-primary/5 border-[1.5px] border-primary/20 p-8 rounded-[2.5rem] animate-in slide-in-from-top-4 duration-300 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Tipo de Anotação</label>
                            <select
                                value={formData.tipo}
                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                                className="w-full bg-white dark:bg-slate-900 rounded-2xl px-5 py-4 text-sm font-bold border-[1.5px] border-transparent focus:border-primary/30 outline-none shadow-sm"
                            >
                                <option value="Geral">Geral</option>
                                <option value="Comportamental">Comportamental</option>
                                <option value="Acadêmico">Acadêmico</option>
                                <option value="Saúde">Saúde</option>
                                <option value="Família">Família</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Data</label>
                            <input
                                type="date"
                                value={formData.data}
                                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                                className="w-full bg-white dark:bg-slate-900 rounded-2xl px-5 py-4 text-sm font-bold border-[1.5px] border-transparent focus:border-primary/30 outline-none shadow-sm"
                            />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                            <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Conteúdo</label>
                            <textarea
                                value={formData.conteudo}
                                onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                                placeholder="Descreva aqui os detalhes..."
                                className="w-full bg-white dark:bg-slate-900 rounded-2xl p-5 text-sm font-bold border-[1.5px] border-transparent focus:border-primary/30 outline-none shadow-sm min-h-[120px]"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-4">
                        <button onClick={() => setIsAdding(false)} className="px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600">Cancelar</button>
                        <button onClick={handleSaveNote} className="px-8 py-3 bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.05] transition-all border-none cursor-pointer">
                            {editingNote ? 'Atualizar Anotação' : 'Salvar Anotação'}
                        </button>
                    </div>
                </div>
            )}

            {}
            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="p-20 flex flex-col items-center gap-4 bg-white dark:bg-slate-800 rounded-[2.5rem]">
                        <Loader2 className="text-primary animate-spin" size={40} />
                        <p className="text-[10px] font-black uppercase text-slate-400">Carregando anotações...</p>
                    </div>
                ) : filteredNotes.length > 0 ? filteredNotes.map((note) => (
                    <div key={note.id} className="group bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border-[1.5px] border-slate-100 dark:border-slate-700 hover:border-primary/20 transition-all flex gap-8">
                        <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${getTipoColor(note.tipo)}`}>
                                        {note.tipo}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                        <Clock size={12} /> {new Date(note.data).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(note)} className="p-2 text-slate-400 hover:text-primary transition-all"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(note.id)} className="p-2 text-slate-400 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                {note.conteudo}
                            </p>
                        </div>
                    </div>
                )) : (
                    <div className="p-20 text-center bg-white dark:bg-slate-800 rounded-[2.5rem] border-[1.5px] border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-black uppercase text-slate-400">Nenhuma anotação encontrada</p>
                    </div>
                )}
            </div>
        </div>
    );
};
