import { Link, NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/upload', label: 'Upload' },
  { to: '/analysis', label: 'Analysis' },
  { to: '/opportunities', label: 'Opportunities' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/contact', label: 'Contact' },
];

function Navbar() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container-max h-16 flex items-center justify-between">
        <Link to="/" className="font-semibold text-eufm-dark">
          EUFM Consultant Portal
        </Link>
        <nav className="flex gap-4 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-2 py-1 rounded hover:text-eufm-primary ${isActive ? 'text-eufm-primary font-medium' : 'text-gray-700'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;

