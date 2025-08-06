import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddItem from './pages/AddItem';
import Wardrobe from './pages/Wardrobe';
import Suggestions from './pages/Suggestions';
import History from './pages/History';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add-item" element={<AddItem />} />
          <Route path="/wardrobe" element={<Wardrobe />} />
          <Route path="/suggestions" element={<Suggestions />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;