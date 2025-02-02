import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import About from './pages/About';
import NotFound from './pages/NotFound';
import EmployeeDashboard from './pages/EmployeeDashboard'; 
import AdminDashboard from './pages/AdminDashboard'; 

function App() {
  return (
    <>
  
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/about" element={<About />} />
      <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="*" element={<NotFound />} /> {/* Catch-all for 404 */}
    </Routes>
  </>);
}

export default App;
