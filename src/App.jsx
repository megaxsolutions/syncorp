import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import About from './pages/About';
import NotFound from './pages/NotFound';


function App() {
  return (
    <>
  
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/about" element={<About />} />
      <Route path="*" element={<NotFound />} /> {/* Catch-all for 404 */}
    </Routes>
  </>);
}

export default App;
