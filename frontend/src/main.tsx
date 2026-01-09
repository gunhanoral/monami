import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import VRFList from './pages/VRFList';
import VRFDetail from './pages/VRFDetail';
import EasyLeak from './pages/EasyLeak';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="vrfs" element={<VRFList />} />
          <Route path="vrfs/:namespace/:name" element={<VRFDetail />} />
          <Route path="easy-leak" element={<EasyLeak />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
