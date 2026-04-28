import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../Logo';
import styles from '../../../styles/App.module.css';
import swashDark from '../../assets/images/rabisco_escuro.svg';
import swashLight from '../../assets/images/rabisco_claro.svg';
import puzzleIllustration from '../../assets/images/icon2.png';

export const ErrorPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.container}>
            <div className={styles.logoArea}>
                <Logo />
            </div>

            <div className={styles.swashRight}>
                <img src={swashDark} alt="Decorative Swash" />
            </div>

            <div className={styles.illustrationMain}>
                <div style={{ animation: 'fadeIn 1s ease-out' }}>
                    <h2 className={styles.illustrationTitle}>
                        Página de Recurso <br /> Não Encontrada.
                    </h2>
                </div>
                <img src={puzzleIllustration} alt="Illustration" />
            </div>

            <main className={styles.mainPane}>
                <div className={styles.loginCard}>
                    <div className={styles.swashTop}>
                        <img src={swashLight} alt="Decorative Swash" />
                    </div>
                    <h1 className={styles.cardTitle} style={{ fontSize: '4rem' }}>404</h1>
                    <h2 style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: 700, 
                        color: '#0f0c26', 
                        textAlign: 'center',
                        marginBottom: '1.5rem' 
                    }}>
                        Ops! Algo deu errado.
                    </h2>
                    <p style={{ 
                        fontSize: '0.9rem', 
                        color: '#455a85', 
                        textAlign: 'center', 
                        marginBottom: '2.5rem',
                        lineHeight: '1.6'
                    }}>
                        A página que você está procurando não existe ou foi movida. 
                        Verifique a URL ou retorne ao painel principal.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button 
                            onClick={() => navigate('/')}
                            style={{
                                background: '#0f0c26',
                                color: 'white',
                                border: 'none',
                                padding: '1rem 2rem',
                                borderRadius: '1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(15, 12, 38, 0.2)'
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            Voltar para o Início
                        </button>
                    </div>
                </div>
            </main>

            <footer className={styles.footerBar} />
        </div>
    );
};
