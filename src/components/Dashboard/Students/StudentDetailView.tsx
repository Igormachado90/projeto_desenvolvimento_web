import { useState } from 'react';
import { 
  ArrowLeft, Edit3, Trash2, Calendar, BookOpen, FileText, 
  ClipboardList, Info, GraduationCap, Building2, User, 
  Activity, Clock, Loader2 
} from 'lucide-react';
import styles from './StudentDetailView.module.css';
import { PEIsTab } from './Tabs/PEIsTab';
import { NotesTab } from './Tabs/NotesTab';
import { DisciplinesTab } from './Tabs/DisciplinesTab';
import { DetailsTab } from './Tabs/DetailsTab';
import { ExecutionTab } from './Tabs/ExecutionTab';
import { PEIWizard } from './wizards/PEIWizard';
import { StudentRegistrationWizard } from './wizards/StudentRegistrationWizard';
import { studentService } from '@/lib/studentService';
import { AgendaView } from './components/AgendaView';
import logo from '../../../assets/images/logo.png';

interface Student {
    id: string;
    nome: string;
    escola: string;
    status: 'Ativo' | 'Inativo';
    responsavel: string;
    foto?: string;
    cid?: string;
    serie: string;
    dataNascimento: string;
    genero: string;
    dataCadastro: string;
    detalhes?: any;
    escola_id: number;
    familia_id: number;
}

interface Props {
    student: Student;
    onBack: (refresh?: boolean) => void;
}

const StatCard = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className={styles.statCard}>
        <div className={styles.statLabel}>
            <Icon size={14} />
            <span>{label}</span>
        </div>
        <div className={styles.statValue}>{value || '---'}</div>
    </div>
);

export const StudentDetailView = ({ student: initialStudent, onBack }: Props) => {
    const [activeTab, setActiveTab] = useState<'peis' | 'notes' | 'disciplines' | 'details' | 'accompaniment' | 'agenda'>('peis');
    const [refreshKey, setRefreshKey] = useState(0);
    const [isCreatingPEI, setIsCreatingPEI] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [student, setStudent] = useState(initialStudent);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (confirm(`Tem certeza que deseja excluir o prontuário de ${student.nome}? Esta ação não pode ser desfeita.`)) {
            setIsDeleting(true);
            try {
                await studentService.delete(student.id);
                alert('Prontuário excluído com sucesso!');
                onBack(true);
            } catch (error) {
                console.error('Erro ao excluir aluno:', error);
                alert('Erro na exclusão.');
            } finally {
                setIsDeleting(false);
            }
        }
    };

    if (isEditing) {
        return (
            <StudentRegistrationWizard
                initialData={student}
                onCancel={() => setIsEditing(false)}
                onComplete={(updatedData) => {
                    setStudent({ ...student, ...updatedData });
                    setIsEditing(false);
                }}
            />
        );
    }

    return (
        <div className={styles.detailWrapper}>
            {/* Header Actions */}
            <div className={styles.headerActions}>
                <button onClick={() => onBack()} className={styles.backBtn}>
                    <ArrowLeft size={16} />
                    <span>Voltar para Listagem</span>
                </button>
                <div className={styles.actionGroup}>
                    <button onClick={() => setIsEditing(true)} className={styles.editBtn}>
                        <Edit3 size={18} />
                        <span>Editar Prontuário</span>
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className={styles.deleteBtn}
                        title="Excluir Prontuário"
                    >
                        {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                </div>
            </div>

            {/* Profile Hero Section */}
            <div className={styles.profileHero}>
                <div className={styles.heroBranding}>
                    <img src={logo} alt="VinculoTEA" />
                </div>
                <div className={styles.bgDecoration} />
                <div className={styles.heroContent}>
                    <div className={styles.photoContainer}>
                        <div className={styles.photoBox}>
                            {student.foto ? (
                                <img src={student.foto} alt={student.nome} className={styles.photoImg} />
                            ) : (
                                <span>{student.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}</span>
                            )}
                        </div>
                        <div className={`${styles.statusBadge} ${student.status === 'Inativo' ? styles.statusInactive : ''}`}>
                            {student.status}
                        </div>
                    </div>

                    <div className={styles.mainInfo}>
                        <h1 className={styles.studentName}>{student.nome}</h1>
                        <div className={styles.tagsRow}>
                            <span className={styles.tagItem}>Condição: TEA / Autismo</span>
                            <span className={`${styles.tagItem} ${styles.tagId}`}>ID: #{String(student.id).slice(0, 8)}</span>
                            <span className={styles.tagItem}>Inscrito em: {student.dataCadastro}</span>
                        </div>

                        <div className={styles.statsGrid}>
                            <StatCard icon={Building2} label="Escola" value={student.escola} />
                            <StatCard icon={Activity} label="CID Principal" value={student.cid || 'N/A'} />
                            <StatCard icon={GraduationCap} label="Série / Ciclo" value={student.serie} />
                            <StatCard icon={User} label="Responsável" value={student.responsavel} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className={styles.tabsContainer}>
                <button 
                  className={`${styles.tabBtn} ${activeTab === 'peis' ? styles.tabBtnActive : ''}`} 
                  onClick={() => setActiveTab('peis')}
                >
                    <BookOpen size={16} />
                    <span>Planos (PEIs)</span>
                </button>
                <button 
                  className={`${styles.tabBtn} ${activeTab === 'notes' ? styles.tabBtnActive : ''}`} 
                  onClick={() => setActiveTab('notes')}
                >
                    <FileText size={16} />
                    <span>Anotações</span>
                </button>
                <button 
                  className={`${styles.tabBtn} ${activeTab === 'disciplines' ? styles.tabBtnActive : ''}`} 
                  onClick={() => setActiveTab('disciplines')}
                >
                    <ClipboardList size={16} />
                    <span>Disciplinas</span>
                </button>
                <button 
                  className={`${styles.tabBtn} ${activeTab === 'details' ? styles.tabBtnActive : ''}`} 
                  onClick={() => setActiveTab('details')}
                >
                    <Info size={16} />
                    <span>Detalhes</span>
                </button>
                <button 
                  className={`${styles.tabBtn} ${activeTab === 'accompaniment' ? styles.tabBtnActive : ''}`} 
                  onClick={() => setActiveTab('accompaniment')}
                >
                    <Activity size={16} />
                    <span>Acompanhamento</span>
                </button>
                <button 
                  className={`${styles.tabBtn} ${activeTab === 'agenda' ? styles.tabBtnActive : ''}`} 
                  onClick={() => setActiveTab('agenda')}
                >
                    <Calendar size={16} />
                    <span>Agenda</span>
                </button>
            </div>

            {/* Tab Content Rendering */}
            <div className={styles.contentArea}>
                {activeTab === 'peis' && (
                    <PEIsTab
                        key={`peis-${refreshKey}`}
                        studentId={student.id}
                        studentName={student.nome}
                        studentData={{ ...student }}
                        onOpenWizard={() => setIsCreatingPEI(true)}
                    />
                )}
                {activeTab === 'notes' && <NotesTab key={`notes-${refreshKey}`} studentId={student.id} />}
                {activeTab === 'disciplines' && <DisciplinesTab key={`disc-${refreshKey}`} studentId={student.id} studentName={student.nome} studentData={student} />}
                {activeTab === 'details' && <DetailsTab student={student} />}
                {activeTab === 'accompaniment' && <ExecutionTab key={`exec-${refreshKey}`} studentId={student.id} />}
                {activeTab === 'agenda' && <AgendaView key={`agenda-${refreshKey}`} studentId={student.id} />}
            </div>

            {/* Overlay Wizards */}
            {isCreatingPEI && (
                <PEIWizard
                    studentName={student.nome}
                    studentData={student}
                    onCancel={() => setIsCreatingPEI(false)}
                    onComplete={() => {
                        setIsCreatingPEI(false);
                        setRefreshKey(prev => prev + 1);
                    }}
                />
            )}
        </div>
    );
};
