import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ForgotPassword } from './ForgotPassword';
import styles from './ForgotPasswordPage.module.css';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/login');
  };

  const handleSuccess = () => {
    // Redireciona para o login após envio do email
    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <ForgotPassword onBack={handleBack} onSuccess={handleSuccess} />
      </div>
    </div>
  );
};