import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ResetPassword } from './ResetPassword';
import styles from './ResetPasswordPage.module.css';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => navigate('/login');

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <ResetPassword onSuccess={handleSuccess} />
      </div>
    </div>
  );
};