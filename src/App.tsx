import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ClosetAssistant
          </h1>
          <p className="text-lg text-gray-600">
            Make faster outfit decisions with what you already own
          </p>
        </header>
        
        <div className="max-w-md mx-auto">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
            <p className="text-gray-600 mb-4">
              Welcome to ClosetAssistant! This app will help you organize your wardrobe and get outfit suggestions.
            </p>
            <div className="space-y-2">
              <button className="btn-primary w-full">
                Add Your First Item
              </button>
              <button className="btn-secondary w-full">
                Browse Wardrobe
              </button>
            </div>
          </div>
        </div>
        
        <footer className="text-center mt-8 text-sm text-gray-500">
          Built with React + TypeScript + Tailwind CSS
        </footer>
      </div>
    </div>
  )
}

export default App