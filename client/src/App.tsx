import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PageLayout from './components/layout/PageLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RecordSentencePage from './pages/RecordSentencePage';
import ComponentsPage from './pages/ComponentsPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PageLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/logowanie" element={<LoginPage />} />
            <Route path="/komponenty" element={<ComponentsPage />} />

            {/* Protected routes */}
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
      </AuthProvider>
    </BrowserRouter>
  );
}
