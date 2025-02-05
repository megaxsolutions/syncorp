import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import About from './pages/About';
import NotFound from './pages/NotFound';
import ViewEmployee from './pages/ViewEmployee';
import Dashboard from './pages/Dashboard';
import AddEmployee from './pages/AddEmployee';
import Site from './pages/Site';
import Department from './pages/Department';
import Cluster from './pages/Cluster';
import Position from './pages/Position';
import EmployeeLevel from './pages/EmployeeLevel';
import Calendar from './pages/Calendar';
import CutOff from './pages/CutOff';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/about" element={<About />} />
        <Route path="/add-employee" element={<AddEmployee />} />
        <Route path="/view-employee" element={<ViewEmployee />} />
        <Route path="/settings/site" element={<Site />} />
        <Route path="/settings/department" element={<Department />} />
        <Route path="/settings/cluster" element={<Cluster />} />
        <Route path="/settings/position" element={<Position />} />
        <Route path="/settings/employee-level" element={<EmployeeLevel />} />
        <Route path="/settings/holiday-calendar" element={<Calendar />} />
        <Route path="/settings/cut-off" element={<CutOff />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;