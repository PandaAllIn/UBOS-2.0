import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '@components/Navbar';
import Footer from '@components/Footer';
import Home from '@pages/Home';
import Upload from '@pages/Upload';
import Analysis from '@pages/Analysis';
import Opportunities from '@pages/Opportunities';
import Pricing from '@pages/Pricing';
import Contact from '@pages/Contact';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;

