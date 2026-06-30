import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserForm } from '../../components/Usuarios/UserForm';
import styles from './CadastroPage.module.css';

export const CadastroPage: React.FC = () => {
    const navigate = useNavigate();

    const handleSuccess = () => {
        setTimeout(() => {
            navigate('/login');
        }, 1500);
    };

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.pageContainer}>
                <div className={styles.logoArea}>
                    <h1 className={styles.logoTitle}>Vínculo<span className={styles.logoHighlight}>TEA</span></h1>
                    <p className={styles.subtitle}>Crie sua conta para começar</p>
                </div>

                <UserForm
                    onClose={() => navigate('/login')}
                    onSuccess={handleSuccess}
                    currentUser={null}
                    showSchoolField={false}
                    showPlanField={false}
                />
            </div>
        </div>
    );
};

export default CadastroPage;