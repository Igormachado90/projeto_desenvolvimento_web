import React, { useEffect, useState, lazy, Suspense } from 'react'
import { Logo } from "./src/components/Logo"
import { supabase } from "./src/lib/supabase";
import styles from "./styles/App.module.css";
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import illustration1 from '/home/stella_karolina/.gemini/antigravity/brain/d001437f-33a3-4351-a72a-1cdc550ca0d7/ecosystem_connection_illustration_1777143672957.png';
import illustration2 from '/home/stella_karolina/.gemini/antigravity/brain/d001437f-33a3-4351-a72a-1cdc550ca0d7/app_development_illustration_1777143333893.png';
import puzzleIllustration from './src/assets/images/icon2.png';
import swashDark from './src/assets/images/rabisco_escuro.svg';
import swashLight from './src/assets/images/rabisco_claro.svg';

const LoginForm = lazy(() => import('./src/components/LoginForm/LoginForm').then(m => ({ default: m.LoginForm })));
const Dashboard = lazy(() => import('./src/components/Dashboard').then(m => ({ default: m.Dashboard })));
const ErrorPage = lazy(() => import('./src/components/ErrorPage/ErrorPage').then(m => ({ default: m.ErrorPage })));
const CadastroPage = lazy(() => import('./src/components/Cadastro/CadastroPage').then(m => ({ default: m.CadastroPage })));
const ResetPasswordPage = lazy(() => import('./src/components/ResetPassword/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const ForgotPasswordPage = lazy(() => import('./src/components/ForgotPassword/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));

const slides = [
  {
    title: <>Transforme o Desenvolvimento Atípico <br /> com Dados, não Apenas Intuição.</>,
    image: puzzleIllustration
  },
  {
    title: <>Conectando Família, Escola <br /> e Terapeutas em um só lugar.</>,
    image: puzzleIllustration
  },
  {
    title: <>Acompanhamento em Tempo Real <br /> para Evolução Garantida.</>,
    image: puzzleIllustration
  }
];



const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        if (location.pathname === '/' || location.pathname === '/login') {
          navigate('/dashboard');
        }
      }
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        if (location.pathname === '/login') {
          navigate('/dashboard');
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);


  if (loadingAuth) return null;

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={
          <div className={styles.container}>
            <div className={styles.logoArea}>
              <Logo />
            </div>

            <div className={styles.swashRight}>
              <img src={swashDark} alt="Decorative Swash" />
            </div>

            <div className={styles.illustrationMain}>
              <div key={currentSlide} style={{ animation: 'fadeIn 1s ease-out' }}>
                <h2 className={styles.illustrationTitle}>
                  {slides[currentSlide].title}
                </h2>
              </div>
              <img src={puzzleIllustration} alt="Illustration" />
            </div>

            <main className={styles.mainPane}>
              <div className={styles.loginCard}>
                <div className={styles.swashTop}>
                  <img src={swashLight} alt="Decorative Swash" />
                </div>
                <h1 className={styles.cardTitle}>Bem-vindo de volta!</h1>
                <p className={styles.cardSubtitle}></p>

                {/* <Suspense fallback={null}> */}
                <LoginForm onForgotPassword={() => navigate('/forgot-password')} />
                {/* </Suspense> */}
              </div>
            </main>

            <footer className={styles.footerBar} />

            <div className={styles.navControls}>
              <button className={styles.navButton} onClick={prevSlide}>
                <ChevronLeft size={18} />
              </button>
              <button className={styles.navButton} onClick={nextSlide}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        } />

        <Route path="/dashboard/*" element={
          user ? (
            // <Suspense fallback={null}>
            <Dashboard user={user} onLogout={() => navigate('/login')} />
            // </Suspense>
          ) : <Navigate to="/login" replace />
        } />

        <Route path="/forgot-password" element={
          // <Suspense fallback={null}>
          <ForgotPasswordPage />
          // </Suspense>
        } />

        <Route path="/reset-password" element={
          // <Suspense fallback={null}>
          <ResetPasswordPage />
          // </Suspense>
        } />

        <Route path="/cadastro" element={
          // <Suspense fallback={null}>
          <CadastroPage />
          // </Suspense>
        } />

        <Route path="*" element={
          // <Suspense fallback={null}>
          <ErrorPage />
          // </Suspense>
        } />
      </Routes>
    </Suspense>
  );
};

export default App;
