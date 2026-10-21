import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Rocket } from 'lucide-react';

// Main Application Component
function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Rocket className="w-16 h-16 text-blue-500 mb-6 animate-bounce" />
        <h1 className="text-4xl font-bold mb-4">PJMatch Frontend test</h1>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<p className="text-slate-400">opa</p>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;