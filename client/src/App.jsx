import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import BookingPage from './pages/BookingPage';
import TokenPage from './pages/TokenPage';
import AdminPage from './pages/AdminPage';
import QrPage from './pages/QrPage';
import { ToastProvider } from './components/Toast';

function AppLayout() {
  const location = useLocation();
  const isPoster = location.pathname.startsWith('/qr');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {!isPoster && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<BookingPage />} />
          <Route path="/token/:tokenId" element={<TokenPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/qr/:serviceId" element={<QrPage />} />
          {/* Fallback */}
          <Route path="*" element={<BookingPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppLayout />
      </ToastProvider>
    </BrowserRouter>
  );
}
