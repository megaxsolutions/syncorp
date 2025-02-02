import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav>
      <Link to="/">Login</Link> | <Link to="/about">About</Link>
    </nav>
  );
}

export default Navbar;
