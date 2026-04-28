import { useState, useEffect } from 'react';
import {
    Plus, FileCheck, Calendar, Copy, Download, Printer,
    Edit2, Archive, Loader2, X, Eye, Search, Filter,
    ClipboardCopy, SortAsc, SortDesc, Trash2, User, Brain, Layout, History
} from 'lucide-react';
import { peisService, PEI } from '@/lib/peisService';
import { PEIWizard } from '../wizards/PEIWizard';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import { fetchSchoolPDFData, renderModernHeader, renderModernFooter } from '@/lib/pdfUtils';
import logoUrl from '@/assets/images/logotipo_Horizontal.svg';

interface PEIsTabProps {
    studentId: string;
    studentName: string;
    studentData: any;
    onOpenWizard: () => void;
}

export const PEIsTab = ({ studentId, studentName, studentData, onOpenWizard }: PEIsTabProps) => {
    const [peis, setPeis] = useState<PEI[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingPEI, setViewingPEI] = useState<PEI | null>(null);
    const [editingPEI, setEditingPEI] = useState<PEI | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'Ativo' | 'Arquivado' | 'Todos'>('Ativo');
    const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');
    const { user: authUser } = useAuth();
    const [schoolInfo, setSchoolInfo] = useState<{ logo?: string; nome?: string; cnpj?: string; telefone?: string } | null>(null);

    const fetchPEIs = async () => {
        setLoading(true);
        try {
            const data = await peisService.getAllByStudent(studentId);
            setPeis(data);
        } catch (error) {
            console.error('Erro ao buscar PEIs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPEIs();

        const fetchSchoolInfo = async () => {
            if (authUser?.escola_id) {
                const { data: schoolData } = await supabase
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

    const handleArchive = async (id: string, currentStatus: string) => {
        const action = currentStatus === 'Arquivado' ? 'desarquivar' : 'arquivar';
        if (!confirm(`Deseja ${action} este PEI?`)) return;
        try {
            await peisService.update(id, { status: currentStatus === 'Arquivado' ? 'Ativo' : 'Arquivado' });
            fetchPEIs();
        } catch (error) {
            console.error('Erro ao alternar status do PEI:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('TEM CERTEZA QUE DESEJA EXCLUIR ESTE PEI? ESTA AÇÃO NÃO PODE SER DESFEITA!')) return;
        try {
            await peisService.delete(id);
            alert('PEI excluído com sucesso!');
            fetchPEIs();
        } catch (error) {
            console.error('Erro ao excluir PEI:', error);
            alert('Erro ao excluir PEI.');
        }
    };

    const handleCopyRecord = async (pei: PEI) => {
        if (!confirm('Deseja criar uma cópia deste PEI no banco de dados?')) return;
        try {
            const copyDados = { ...pei.dados, anoLetivo: `${pei.dados.anoLetivo} (Cópia)` };
            await peisService.create(studentId, copyDados);
            alert('Cópia criada com sucesso!');
            fetchPEIs();
        } catch (error) {
            console.error('Erro ao copiar PEI:', error);
        }
    };

    const handleCopyToClipboard = (pei: PEI) => {
        const d = pei.dados;
        const text = `
PLANO EDUCACIONAL INDIVIDUALIZADO (PEI)

1. IDENTIFICAÇÃO
Nome: ${d.nomeCompleto}
Série/Ano: ${d.serieAno}
Escola: ${d.escola}
Ano Letivo: ${d.anoLetivo}
Diagnóstico: ${d.diagnosticoMedico}
CID: ${d.cid}

... [conteúdo truncado para brevidade] ...
        `.trim();
        navigator.clipboard.writeText(text);
        alert('Texto do PEI copiado!');
    };

    const generatePDF = async (pei: PEI) => {
        // Lazy load PDF libraries
        const [jsPDFModule, autoTableModule] = await Promise.all([
            import('jspdf'),
            import('jspdf-autotable')
        ]);
        const jsPDF = jsPDFModule.default;
        const autoTable = autoTableModule.default;

        const doc = new jsPDF();
        const d = pei.dados;

        const schoolData = authUser?.escola_id ? await fetchSchoolPDFData(authUser.escola_id) : null;

        let currentY = 55;

        if (schoolData) {
            currentY = await renderModernHeader(doc, schoolData);
        } else {
            // Fallback Header
            const primaryColor = [37, 99, 235];
            const secondaryColor = [30, 41, 59];
            const lightBg = [248, 250, 252];

            doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
            doc.rect(0, 0, 210, 45, 'F');

            try {
                const img = new Image();
                img.src = schoolInfo?.logo || logoUrl;
                const ext = (schoolInfo?.logo?.split('.').pop()?.toUpperCase() || 'SVG') as any;
                doc.addImage(img, ext === 'SVG' ? 'SVG' : ext, 15, 12, 45, 15);
            } catch (e) {
                doc.setFontSize(16);
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.text("VINCULO TEA", 15, 22);
            }

            doc.setFontSize(18);
            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            doc.setFont("helvetica", "bold");
            doc.text("PLANO EDUCACIONAL INDIVIDUALIZADO", 200, 22, { align: "right" });

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 116, 139);
            doc.text(`Documento emitido em: ${new Date().toLocaleDateString('pt-BR')}`, 200, 30, { align: "right" });
            doc.text(`Aluno: ${d.nomeCompleto} | Ano Letivo: ${d.anoLetivo}`, 200, 35, { align: "right" });
            currentY = 55;
        }

        // Ensure some spacing
        currentY += 10;

        // If modern header is used, we might want to add the PEI title explicitly if it wasn't in the fallback
        if (schoolData) {
            doc.setFontSize(18);
            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "bold");
            doc.text("PLANO EDUCACIONAL INDIVIDUALIZADO", 105, currentY, { align: "center" });

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.setFont("helvetica", "normal");
            doc.text(`Aluno: ${d.nomeCompleto} • Ano Letivo: ${d.anoLetivo}`, 105, currentY + 6, { align: "center" });

            currentY += 20;
        }

        const sections = [
            {
                title: "1. IDENTIFICAÇÃO DO ALUNO",
                icon: 'User',
                content: [
                    ["Nome Completo", d.nomeCompleto, "Data Nasc.", d.dataNascimento],
                    ["Gênero/Sexo", d.sexo, "Série/Ano", d.serieAno],
                    ["Unidade Escolar", d.escola, "Ano Letivo", d.anoLetivo],
                    ["Diagnóstico", d.diagnosticoMedico, "CID", d.cid]
                ]
            },
            {
                title: "2. HISTÓRICO E DESENVOLVIMENTO",
                content: [["Histórico", d.historicoDesenvolvimento], ["Pontos Fortes", d.pontosFortes], ["Interesses", d.interessesPreferencias]]
            },
            {
                title: "3. HABILIDADES E SENSIBILIDADES",
                content: [["Acadêmicas", d.habilidadesAcademicas], ["Comunicação", d.habilidadesComunicacao], ["Sensoriais", d.sensibilidadesSensoriais]]
            },
            {
                title: "4. PLANEJAMENTO E METAS",
                content: [["Metas Curto Prazo", d.metasCurtoPrazo], ["Metodologia", d.metodologiasPraticas], ["Recursos", d.recursosMateriais]]
            },
            {
                title: "5. AVALIAÇÃO E REVISÃO",
                content: [["Avaliação", d.instrumentosAvaliacao], ["Periodicidade", d.periodicidadeReavaliacoes], ["Obs.", d.observacoesAdicionais]]
            }
        ];

        const primaryColor = [37, 99, 235];

        sections.forEach((section, index) => {

            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(14, currentY, 182, 8, "F");
            doc.setFontSize(10);
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.text(section.title, 18, currentY + 5.5);

            autoTable(doc, {
                startY: currentY + 8.5,
                body: section.content,
                theme: 'grid',
                styles: {
                    fontSize: 8.5,
                    cellPadding: 3,
                    overflow: 'linebreak',
                    valign: 'middle',
                    textColor: [30, 41, 59],
                    lineColor: [226, 232, 240]
                },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 40, fillColor: [248, 250, 252] },
                    2: { fontStyle: 'bold', cellWidth: 40, fillColor: [248, 250, 252] }
                },
                margin: { left: 14, right: 14 }
            });

            currentY = (doc as any).lastAutoTable.finalY + 12;

            if (currentY > 250 && index < sections.length - 1) {
                doc.addPage();
                currentY = 25;
            }
        });


        if (schoolData) {
            renderModernFooter(doc, schoolData);
        } else {
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);

                // Institutional Data
                const footerInfo = [
                    schoolInfo?.nome,
                    schoolInfo?.telefone,
                    schoolInfo?.cnpj ? `CNPJ: ${schoolInfo.cnpj}` : null
                ].filter(Boolean).join('  •  ');

                if (footerInfo) {
                    doc.text(footerInfo, 105, 278, { align: "center" });
                }

                doc.text("Este documento é confidencial e destinado exclusivamente ao acompanhamento pedagógico do aluno.", 105, 285, { align: "center" });
                doc.text(`Página ${i} de ${pageCount} — VínculoTEA`, 105, 290, { align: "center" });

                doc.setDrawColor(226, 232, 240);
                doc.line(14, 280, 196, 280);
            }
        }

        return doc;
    };

    const handleDownloadPDF = async (pei: PEI) => {
        const doc = await generatePDF(pei);
        const fileName = pei.dados?.nomeCompleto
            ? `PEI_${pei.dados.nomeCompleto.replace(/\s+/g, '_')}_${pei.dados.anoLetivo}.pdf`
            : `PEI_${pei.dados?.anoLetivo || 'Documento'}.pdf`;
        doc.save(fileName);
    };

    const handlePrint = async (pei: PEI) => {
        const doc = await generatePDF(pei);
        window.open(doc.output('bloburl'), '_blank');
    };

    const filteredPeis = peis
        .filter(p => {
            const matchesSearch = p.dados?.nomeCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.dados?.anoLetivo?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'Todos' || p.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            const dateA = new Date(a.dados?.dataInicio || a.data_criacao || '').getTime();
            const dateB = new Date(b.dados?.dataInicio || b.data_criacao || '').getTime();
            return sortBy === 'recent' ? dateB - dateA : dateA - dateB;
        });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            { }
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border-[1.5px] border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight italic">Histórico de <span className="text-primary italic">PEIs</span></h3>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Documentação pedagógica completa</p>
                </div>
                <button
                    onClick={onOpenWizard}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/25 hover:scale-[1.05] hover:shadow-primary/40 transition-all border-none cursor-pointer"
                >
                    <Plus size={20} strokeWidth={3} />
                    Novo PEI Completo
                </button>
            </div>

            { }
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-800 border-[1.5px] border-slate-100 dark:border-slate-700 shadow-sm outline-none focus:border-primary/50 transition-all font-bold text-sm dark:text-white"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-slate-800 border-[1.5px] border-slate-100 dark:border-slate-700 font-black text-[9px] uppercase tracking-widest outline-none shadow-sm cursor-pointer dark:text-white"
                >
                    <option value="Ativo" className="dark:bg-slate-800">Apenas Ativos</option>
                    <option value="Arquivado" className="dark:bg-slate-800">Arquivados</option>
                    <option value="Todos" className="dark:bg-slate-800">Todos</option>
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-slate-800 border-[1.5px] border-slate-100 dark:border-slate-700 font-black text-[9px] uppercase tracking-widest outline-none shadow-sm cursor-pointer"
                >
                    <option value="recent">Mais Recentes</option>
                    <option value="oldest">Mais Antigos</option>
                </select>
            </div>

            {loading ? (
                <div className="p-20 flex flex-col items-center gap-4 bg-white dark:bg-slate-800 rounded-[2.5rem]">
                    <Loader2 className="text-primary animate-spin" size={40} />
                    <p className="text-[10px] font-black uppercase text-slate-400">Buscando planos...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPeis.map((pei) => (
                        <div key={pei.id} className="group bg-white dark:bg-slate-800 p-1 rounded-[3.5rem] border-[1.5px] border-slate-100 dark:border-slate-700 hover:border-primary/40 transition-all relative flex flex-col h-full shadow-lg shadow-slate-200/50 dark:shadow-none hover:shadow-primary/10">
                            <div className="bg-slate-50/50 dark:bg-slate-900/50 m-2 p-8 rounded-[3rem] space-y-6 flex-1">
                                <div className="flex justify-between items-start">
                                    <div className="size-16 rounded-3xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform bounce-in">
                                        <FileCheck size={32} />
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${pei.status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                                        {pei.status}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h4 className="font-black text-slate-900 dark:text-white text-xl tracking-tight italic group-hover:text-primary transition-colors">
                                        PEI — {(() => {
                                            const d = pei.dados?.dataInicio || pei.data_criacao;
                                            if (!d) return pei.dados?.anoLetivo || 'Sem data';
                                            const date = new Date(d);
                                            const mes = date.toLocaleString('pt-BR', { month: 'long' });
                                            const ano = date.getFullYear();
                                            return `${mes.charAt(0).toUpperCase() + mes.slice(1)}/${ano}`;
                                        })()}
                                    </h4>
                                    {pei.dados?.nomeCompleto && (
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                            {pei.dados.nomeCompleto}
                                        </p>
                                    )}
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Calendar size={12} className="text-primary" /> {new Date(pei.dados?.dataInicio || pei.data_criacao || '').toLocaleDateString('pt-BR')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                                    <ActionButton icon={Eye} label="Ver" onClick={() => setViewingPEI(pei)} />
                                    <ActionButton icon={Edit2} label="Editar" onClick={() => setEditingPEI(pei)} />
                                    <ActionButton icon={ClipboardCopy} label="Texto" onClick={() => handleCopyToClipboard(pei)} />
                                    <ActionButton icon={Copy} label="Duplicar" onClick={() => handleCopyRecord(pei)} />
                                    <ActionButton icon={Printer} label="Imprimir" onClick={() => handlePrint(pei)} />
                                    <ActionButton icon={Download} label="PDF" onClick={() => handleDownloadPDF(pei)} />
                                    <ActionButton icon={Archive} label={pei.status === 'Arquivado' ? 'Ativar' : 'Arquivar'} onClick={() => handleArchive(pei.id, pei.status)} />
                                    <ActionButton icon={Trash2} label="Excluir" onClick={() => handleDelete(pei.id)} variant="danger" />
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={onOpenWizard}
                        className="group border-[2px] border-dashed border-slate-200 dark:border-slate-700 rounded-[3.5rem] p-12 flex flex-col items-center justify-center text-center hover:border-primary/50 hover:bg-primary/5 transition-all"
                    >
                        <div className="size-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:scale-110 transition-all mb-4">
                            <Plus size={40} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 group-hover:text-primary uppercase tracking-[0.3em]">Criar Novo Plano</p>
                    </button>
                </div>
            )}

            { }
            {viewingPEI && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-5xl max-h-[95vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-10 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-primary/10 text-primary rounded-2xl shadow-inner">
                                    <FileCheck size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">PEI COMPLETO - {viewingPEI.dados?.anoLetivo}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documentação oficial de acompanhamento do aluno</p>
                                </div>
                            </div>
                            <button onClick={() => setViewingPEI(null)} className="p-5 hover:bg-white dark:hover:bg-slate-700 rounded-3xl transition-all shadow-sm">
                                <X size={28} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar pb-20">
                            <CategorySection title="1. Identificação do Aluno" icon={User}>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <ViewField label="Nome Completo" value={viewingPEI.dados?.nomeCompleto} />
                                    <ViewField label="Data de Nascimento" value={viewingPEI.dados?.dataNascimento} />
                                    <ViewField label="Sexo" value={viewingPEI.dados?.sexo} />
                                    <ViewField label="Escola" value={viewingPEI.dados?.escola} />
                                    <ViewField label="Série/Ano" value={viewingPEI.dados?.serieAno} />
                                    <ViewField label="Ano Letivo" value={viewingPEI.dados?.anoLetivo} />
                                    <ViewField label="CID" value={viewingPEI.dados?.cid} />
                                    <ViewField label="Início do Plano" value={viewingPEI.dados?.dataInicio} />
                                    <div className="md:col-span-3">
                                        <ViewField label="Diagnóstico Médico" value={viewingPEI.dados?.diagnosticoMedico} />
                                    </div>
                                    <div className="md:col-span-3">
                                        <ViewField label="Profissionais que Acompanham" value={viewingPEI.dados?.profissionaisAcompanham} />
                                    </div>
                                </div>
                            </CategorySection>

                            <CategorySection title="2. Histórico e Desenvolvimento" icon={History}>
                                <div className="space-y-6">
                                    <SectionDetail label="Histórico de Desenvolvimento" content={viewingPEI.dados?.historicoDesenvolvimento} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <SectionDetail label="Pontos Fortes" content={viewingPEI.dados?.pontosFortes} />
                                        <SectionDetail label="Áreas de Desenvolvimento" content={viewingPEI.dados?.areasDesenvolvimento} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <SectionDetail label="Interesses e Preferências" content={viewingPEI.dados?.interessesPreferencias} />
                                        <ViewField label="Estilo de Aprendizagem" value={viewingPEI.dados?.estiloAprendizagem} />
                                    </div>
                                </div>
                            </CategorySection>

                            <CategorySection title="3. Análise de Habilidades" icon={Brain}>
                                <div className="space-y-6">
                                    <SectionDetail label="Habilidades Acadêmicas" content={viewingPEI.dados?.habilidadesAcademicas} />
                                    <SectionDetail label="Habilidades de Comunicação" content={viewingPEI.dados?.habilidadesComunicacao} />
                                    <SectionDetail label="Habilidades Sociais e Emocionais" content={viewingPEI.dados?.habilidadesSociais} />
                                    <SectionDetail label="Habilidades Motoras" content={viewingPEI.dados?.habilidadesMotoras} />
                                    <SectionDetail label="Autonomia e AVDs" content={viewingPEI.dados?.habilidadesAutonomia} />
                                </div>
                            </CategorySection>

                            <CategorySection title="4. Sensibilidades e Barreiras" icon={Filter}>
                                <div className="space-y-6">
                                    <SectionDetail label="Sensibilidades Sensoriais" content={viewingPEI.dados?.sensibilidadesSensoriais} />
                                    <SectionDetail label="Preferências e Reforçadores" content={viewingPEI.dados?.preferenciasReforcadores} />
                                    <SectionDetail label="Barreiras para Aprendizagem" content={viewingPEI.dados?.barreirasAprendizagem} />
                                    <SectionDetail label="Apoios Necessários" content={viewingPEI.dados?.apoiosNecessarios} />
                                    <SectionDetail label="Estratégias Favoráveis" content={viewingPEI.dados?.estrategiasFavoraveis} />
                                </div>
                            </CategorySection>

                            <CategorySection title="5. Definição de Metas" icon={Plus}>
                                <div className="space-y-6">
                                    <SectionDetail label="Metas de Curto Prazo (Trimestral)" content={viewingPEI.dados?.metasCurtoPrazo} />
                                    <SectionDetail label="Metas de Médio Prazo (Semestral)" content={viewingPEI.dados?.metasMedioPrazo} />
                                    <SectionDetail label="Metas de Longo Prazo (Anual)" content={viewingPEI.dados?.metasLongoPrazo} />
                                </div>
                            </CategorySection>

                            <CategorySection title="6. Planejamento e Recursos" icon={Layout}>
                                <div className="space-y-6">
                                    <SectionDetail label="Metodologias e Práticas Pedagógicas" content={viewingPEI.dados?.metodologiasPraticas} />
                                    <SectionDetail label="Adaptações Curriculares" content={viewingPEI.dados?.adaptacoesCurriculares} />
                                    <SectionDetail label="Recursos e Materiais Necessários" content={viewingPEI.dados?.recursosMateriais} />
                                    <SectionDetail label="Rotinas e Previsibilidade" content={viewingPEI.dados?.rotinasPrevisibilidade} />
                                    <SectionDetail label="Participação em Atividades Coletivas" content={viewingPEI.dados?.atividadesColetivas} />
                                    <SectionDetail label="Envolvimento da Família" content={viewingPEI.dados?.envolvimentoFamilia} />
                                </div>
                            </CategorySection>

                            <CategorySection title="7. Avaliação e Revisão" icon={Search}>
                                <div className="space-y-6">
                                    <SectionDetail label="Instrumentos de Avaliação" content={viewingPEI.dados?.instrumentosAvaliacao} />
                                    <SectionDetail label="Critérios de Sucesso" content={viewingPEI.dados?.criteriosSucesso} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <ViewField label="Periodicidade das Reavaliações" value={viewingPEI.dados?.periodicidadeReavaliacoes} />
                                        <ViewField label="Frequência de Revisão" value={viewingPEI.dados?.frequenciaRevisao} />
                                        <ViewField label="Fim Previsto" value={viewingPEI.dados?.dataFimPrevista} />
                                    </div>
                                    <SectionDetail label="Observações Adicionais" content={viewingPEI.dados?.observacoesAdicionais} />
                                </div>
                            </CategorySection>
                        </div>

                        <div className="p-10 border-t border-slate-100 dark:border-slate-700 flex justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
                            <button
                                onClick={() => { if (confirm('Excluir este PEI?')) { handleDelete(viewingPEI.id); setViewingPEI(null); } }}
                                className="px-6 py-5 bg-white dark:bg-slate-700 text-red-500 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all border border-red-100 dark:border-red-900/30 shadow-sm flex items-center gap-3"
                            >
                                <Trash2 size={18} /> Excluir
                            </button>
                            <div className="flex gap-4">
                                <button onClick={() => handlePrint(viewingPEI)} className="px-8 py-5 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100 dark:border-slate-600 shadow-sm flex items-center gap-3">
                                    <Printer size={18} /> Imprimir Relatório
                                </button>
                                <button onClick={() => { setViewingPEI(null); setEditingPEI(viewingPEI); }} className="px-10 py-5 bg-gradient-to-r from-[#004183] to-[#cce5ff] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/25 hover:scale-[1.05] hover:shadow-primary/40 transition-all flex items-center gap-3 border-none cursor-pointer">
                                    <Edit2 size={18} /> Editar Plano Completo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {editingPEI && (
                <PEIWizard
                    studentName={studentName}
                    studentData={studentData}
                    initialData={editingPEI}
                    onCancel={() => setEditingPEI(null)}
                    onComplete={() => {
                        setEditingPEI(null);
                        fetchPEIs();
                    }}
                />
            )}
        </div>
    );
};

const ActionButton = ({ icon: Icon, label, onClick, variant = 'default' }: { icon: any, label: string, onClick: () => void, variant?: 'default' | 'danger' }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all group ${variant === 'danger'
            ? 'hover:bg-red-50 dark:hover:bg-red-900/10 text-slate-400 hover:text-red-500'
            : 'hover:bg-primary/5 dark:hover:bg-primary/10 text-slate-400 hover:text-primary'
            }`}
    >
        <div className={`p-2.5 rounded-xl transition-colors ${variant === 'danger' ? 'group-hover:bg-red-100 dark:group-hover:bg-red-900/20' : 'group-hover:bg-primary/10'
            }`}>
            <Icon size={16} className="group-hover:scale-125 transition-transform" />
        </div>
        <span className="text-[7.5px] font-black uppercase tracking-tight text-center">{label}</span>
    </button>
);

const ViewField = ({ label, value }: { label: string, value: string }) => (
    <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-800 dark:text-white">{value || '---'}</p>
    </div>
);

const SectionDetail = ({ label, content }: { label: string, content: string }) => (
    <div className="space-y-2">
        <p className="text-[10px] font-black text-primary uppercase tracking-widest">{label}</p>
        <div className="bg-white dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                {content || 'Indisponível'}
            </p>
        </div>
    </div>
);

const CategorySection = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <Icon size={20} />
            </div>
            <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">
                {title}
            </h4>
        </div>
        {children}
    </div>
);
