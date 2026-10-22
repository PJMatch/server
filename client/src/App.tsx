import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/layout/NavBar';
import LoginPage from './pages/LoginPage';
import RecordSentencePage from './pages/RecordSentencePage';

// Main Application Component
function App() {
  return (
    <BrowserRouter>
      {/* Main wrapper: Full-height flex layout with hidden overflow for decorative background blobs */}
      <div className="min-h-screen bg-white text-blue-900 font-sans flex flex-col relative overflow-hidden z-0">
        
        {/* Massive decorative orange blobs matching the presentation style */}
        <div className="absolute top-1/3 -translate-y-1/2 -left-32 w-80 h-80 bg-[#fca55d] rounded-full -z-10"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#fca55d] rounded-full -z-10"></div>
        <div className="absolute -bottom-40 left-2/3 -translate-x-1/2 w-[28rem] h-[28rem] bg-[#fca55d] rounded-full -z-10"></div>

        {/* Top Navigation Bar */}
        <NavBar />

        {/* Main Content View */}
        <main className="flex-1 flex items-center justify-center p-8 z-10">
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/nagraj" element={<RecordSentencePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
