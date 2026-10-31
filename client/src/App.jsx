import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import BookingPage from './pages/BookingPage';
import TokenPage from './pages/TokenPage';
import AdminPage from './pages/AdminPage';
import QrPage from './pages/QrPage';
import DisplayPage from './pages/DisplayPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import PageTransition from './components/PageTransition';
import { ToastProvider } from './components/Toast';
import { AuthProvider } from './context/AuthContext';

function AppLayout() {
  const location = useLocation();
  const isPoster = location.pathname.startsWith('/qr');
  const isDisplay = location.pathname.startsWith('/display');
  const isLogin = location.pathname === '/login';
  const hideNavbar = isPoster || isDisplay || isLogin;

  return (
    <div className="min-h-screen flex flex-col bg-cream text-ink font-sans selection:bg-brand-100 selection:text-brand-600">
      {!hideNavbar && <Navbar />}
      <main className="flex-1">
        <PageTransition key={location.pathname}>
          <Routes location={location}>
            {/* Public customer routes */}
            <Route path="/" element={<BookingPage />} />
            <Route path="/token/:tokenId" element={<TokenPage />} />
            <Route path="/display" element={<DisplayPage />} />

            {/* Auth route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['owner', 'staff']}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/qr/:serviceId"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <QrPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<BookingPage />} />
          </Routes>
        </PageTransition>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppLayout />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
