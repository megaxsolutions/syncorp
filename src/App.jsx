import React from 'react';
import { BrowserRouter as Router, Routes, Route, BrowserRouter } from 'react-router-dom';
import Login from './pages/Login';
import About from './pages/About';
import NotFound from './pages/NotFound';
import ViewEmployee from './pages/ViewEmployee';
import Dashboard from './pages/Dashboard';
import AddEmployee from './pages/AddEmployee';


function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} /> {/* Catch-all for 404 */}
        <Route path="/add-employee" element={<AddEmployee />} />
        <Route path="/view-employee" element={<ViewEmployee />} />
      </Routes>
      </>
  );
}

export default App;