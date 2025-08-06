import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to ClosetAssistant
        </h1>
        <p className="text-gray-600">
          Make faster outfit decisions with what you already own
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/add-item" className="card hover:shadow-md transition-shadow">
          <div className="text-center">
            <div className="text-4xl mb-3">📸</div>
            <h2 className="text-xl font-semibold mb-2">Add Item</h2>
            <p className="text-gray-600">
              Take a photo and tag your clothing
            </p>
          </div>
        </Link>

        <Link to="/wardrobe" className="card hover:shadow-md transition-shadow">
          <div className="text-center">
            <div className="text-4xl mb-3">👗</div>
            <h2 className="text-xl font-semibold mb-2">My Wardrobe</h2>
            <p className="text-gray-600">
              Browse and filter your clothes
            </p>
          </div>
        </Link>

        <Link to="/suggestions" className="card hover:shadow-md transition-shadow">
          <div className="text-center">
            <div className="text-4xl mb-3">✨</div>
            <h2 className="text-xl font-semibold mb-2">Get Suggestions</h2>
            <p className="text-gray-600">
              AI-powered outfit recommendations
            </p>
          </div>
        </Link>

        <Link to="/history" className="card hover:shadow-md transition-shadow">
          <div className="text-center">
            <div className="text-4xl mb-3">📅</div>
            <h2 className="text-xl font-semibold mb-2">Wear History</h2>
            <p className="text-gray-600">
              Track what you've worn
            </p>
          </div>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-3">Your Wardrobe Stats</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary-500">0</div>
            <div className="text-sm text-gray-600">Items</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-500">0</div>
            <div className="text-sm text-gray-600">Outfits</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary-500">0</div>
            <div className="text-sm text-gray-600">Worn Today</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;