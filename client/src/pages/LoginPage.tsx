export default function LoginPage() {
  return (
    <div className="w-full max-w-6xl flex flex-col md:flex-row gap-12 items-center justify-center z-10">
      {/* Left Column: Login Box */}
      <div className="w-full max-w-md bg-white border-4 border-blue-900 rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(30,58,138,1)] flex-shrink-0">
        <h2 className="text-3xl font-extrabold mb-8 text-center tracking-tight text-blue-900">
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
            className="bg-blue-900 text-white font-bold py-4 mt-4 rounded-xl hover:bg-blue-800 transition-colors text-lg cursor-pointer"
          >
            Zaloguj się
          </button>
        </form>
      </div>

      {/* Right Column: Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl text-center">
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
        <h2 className="text-7xl font-black mb-12 tracking-tighter text-blue-900">
          PJMatch
        </h2>

        {/* Text Box */}
        <div className="border-4 border-blue-900 rounded-2xl p-8 w-full text-center bg-white shadow-[8px_8px_0px_0px_rgba(30,58,138,0.1)]">
          <p className="text-xl font-bold leading-relaxed text-blue-900">
            Witaj na stronie internetowej PJMatch, projektu studentów wydziału ETI Politechniki Gdańskiej!
          </p>
        </div>
      </div>
    </div>
  );
}
