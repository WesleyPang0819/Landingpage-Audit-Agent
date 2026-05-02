import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Header, Toast } from './components/SharedComponents';
import Analyzer from './pages/Analyzer';
import Report from './pages/Report';
import Admin from './pages/Admin';

export default function App() {
  const [toast, setToast] = useState(null);
  const [lang, setLang] = useState('en');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative flex flex-col">
          <Header lang={lang} setLang={setLang} />
          
          <Routes>
            <Route path="/" element={<Analyzer lang={lang} showToast={showToast} />} />
            <Route path="/report" element={<Report lang={lang} showToast={showToast} />} />
            <Route path="/admin" element={<Admin showToast={showToast} />} />
          </Routes>

          {toast && <Toast message={toast.msg} type={toast.type} />}
        </div>
      </Router>
    </AuthProvider>
  );
}
