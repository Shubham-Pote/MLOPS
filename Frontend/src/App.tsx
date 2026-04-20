import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Experiment from './pages/Experiment';
import Results from './pages/Results';
import Models from './pages/Models';
import Deploy from './pages/Deploy';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/experiment" element={<Experiment />} />
        <Route path="/results" element={<Results />} />
        <Route path="/models" element={<Models />} />
        <Route path="/deploy" element={<Deploy />} />
      </Routes>
    </Layout>
  );
}
