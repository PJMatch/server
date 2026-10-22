import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PageLayout from './components/layout/PageLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RecordSentencePage from './pages/RecordSentencePage';
import ComponentsPage from './pages/ComponentsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PageLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/logowanie" element={<LoginPage />} />
            <Route path="/nagraj" element={<RecordSentencePage />} />
            <Route path="/komponenty" element={<ComponentsPage />} />
          </Routes>
        </PageLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}
