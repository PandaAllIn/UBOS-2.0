import { Link, NavLink, Outlet } from 'react-router-dom'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold">EUFM Consultant Portal</Link>
          <nav className="space-x-4 text-sm">
            <NavLink to="/upload" className={({isActive})=> isActive? 'font-medium text-blue-600':'text-gray-700'}>Upload</NavLink>
            <NavLink to="/analysis" className={({isActive})=> isActive? 'font-medium text-blue-600':'text-gray-700'}>Analysis</NavLink>
            <NavLink to="/opportunities" className={({isActive})=> isActive? 'font-medium text-blue-600':'text-gray-700'}>Opportunities</NavLink>
            <NavLink to="/pricing" className={({isActive})=> isActive? 'font-medium text-blue-600':'text-gray-700'}>Pricing</NavLink>
            <NavLink to="/contact" className={({isActive})=> isActive? 'font-medium text-blue-600':'text-gray-700'}>Contact</NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 text-sm text-gray-500">© {new Date().getFullYear()} EUFM</div>
      </footer>
    </div>
  )
}


