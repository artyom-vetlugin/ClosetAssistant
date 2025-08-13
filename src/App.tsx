import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import AddItem from './pages/AddItem';
import Wardrobe from './pages/Wardrobe';
import Suggestions from './pages/Suggestions';
import SavedOutfits from './pages/SavedOutfits';
import History from './pages/History';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './App.css';

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected routes */}
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/add-item" element={<AddItem />} />
                  <Route path="/wardrobe" element={<Wardrobe />} />
                  <Route path="/suggestions" element={<Suggestions />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/saved" element={<SavedOutfits />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;