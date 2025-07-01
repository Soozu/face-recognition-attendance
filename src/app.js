import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AttendancePage from './components/AttendancePage';
import './styles/global.css';

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AttendancePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />); 