import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PageLayout from './components/layout/PageLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RecordSentencePage from './pages/RecordSentencePage';
import ComponentsPage from './pages/ComponentsPage';
import RecoverAccountPage from './pages/RecoverAccountPage';
import RecoveryKeysPage from './pages/RecoveryKeysPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <PageLayout fullWidth>
                <HomePage />
              </PageLayout>
            }
          />

          <Route
            path="/*"
            element={
              <PageLayout>
                <Routes>
                  <Route path="/logowanie" element={<LoginPage />} />
                  <Route path="/rejestracja" element={<RegisterPage />} />
                  <Route path="/komponenty" element={<ComponentsPage />} />
                  <Route path="/odzyskiwanie" element={<RecoverAccountPage />} />
                  <Route
                    path="/klucze"
                    element={
                      <ProtectedRoute>
                        <RecoveryKeysPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/nagraj"
                    element={
                      <ProtectedRoute>
                        <RecordSentencePage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </PageLayout>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
