import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Studio from './pages/Studio';
import Modules from './pages/Modules';
import ShortFactory from './pages/ShortFactory';
import LaunchPad from './pages/LaunchPad';
import Export from './pages/Export';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Studio />} />
          <Route path="/modules" element={<Modules />} />
          <Route path="/shorts" element={<ShortFactory />} />
          <Route path="/launchpad" element={<LaunchPad />} />
          <Route path="/export" element={<Export />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
