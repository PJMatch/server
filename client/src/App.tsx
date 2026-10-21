import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Main Application Component
function App() {
  return (
    <BrowserRouter>
      {/* Main wrapper: Flex layout to split the screen into two columns with hidden overflow for large blobs */}
      <div className="min-h-screen bg-white text-blue-900 font-sans flex flex-col md:flex-row p-8 gap-12 items-center justify-center relative overflow-hidden z-0">
        
        {/* Massive decorative orange blobs matching the presentation style */}
        <div className="absolute top-1/3 -translate-y-1/2 -left-32 w-80 h-80 bg-[#fca55d] rounded-full -z-10"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#fca55d] rounded-full -z-10"></div>
        <div className="absolute -bottom-40 left-2/3 -translate-x-1/2 w-[28rem] h-[28rem] bg-[#fca55d] rounded-full -z-10"></div>

        {/* Left Column: Login Box */}
        <div className="w-full max-w-md bg-white border-4 border-blue-900 rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(30,58,138,1)] flex-shrink-0 z-10">
          <h2 className="text-3xl font-extrabold mb-8 text-center tracking-tight">
            Logowanie
          </h2>
          <form className="flex flex-col gap-5">
            <input 
              type="email" 
              placeholder="Email" 
              className="border-2 border-blue-900 rounded-xl p-4 font-medium focus:outline-none focus:ring-4 focus:ring-blue-900/20"
            />
            <input 
              type="password" 
              placeholder="Hasło" 
              className="border-2 border-blue-900 rounded-xl p-4 font-medium focus:outline-none focus:ring-4 focus:ring-blue-900/20"
            />
            <button 
              type="button" 
              className="bg-blue-900 text-white font-bold py-4 mt-4 rounded-xl hover:bg-blue-800 transition-colors text-lg"
            >
              Zaloguj się
            </button>
          </form>
        </div>

        {/* Right Column: Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl z-10">
          
          <div className="mb-4 flex flex-col items-center">
            <img 
              src="/logo.png" 
              alt="PJMatch Logo" 
              className="w-80 h-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Project Title */}
          <h2 className="text-7xl font-black mb-12 tracking-tighter">PJMatch</h2>

          {/* Text Box */}
          <div className="border-4 border-blue-900 rounded-2xl p-8 w-full text-center bg-white shadow-[8px_8px_0px_0px_rgba(30,58,138,0.1)]">
            <Routes>
              {/* Public routes setup */}
              <Route 
                path="/" 
                element={
                  <p className="text-xl font-bold leading-relaxed">
                    Witaj na stronie internetowej PJMatch, projektu studentów wydziału ETI Politechniki Gdańskiej!
                  </p>
                } 
              />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;