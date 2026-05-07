import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, Receipt, History, BarChart3, LogOut, Scissors, CalendarDays, Users, Settings } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useSalon } from '../contexts/SalonContext'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth()
  const { salon, role, canManage } = useSalon()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const nav = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true, show: true },
    { to: '/diary', label: 'Diary', icon: CalendarDays, show: true },
    { to: '/log', label: 'Log Sale', icon: PlusCircle, show: true },
    { to: '/expenses', label: 'Expenses', icon: Receipt, show: canManage },
    { to: '/history', label: 'History', icon: History, show: canManage },
    { to: '/reports', label: 'Reports', icon: BarChart3, show: canManage },
    { to: '/staff', label: 'Staff', icon: Users, show: canManage },
    { to: '/settings', label: 'Settings', icon: Settings, show: role === 'owner' },
  ].filter(n => n.show)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-200 fixed h-full z-10">
        <div className="flex flex-col px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Scissors className="text-pink-500 shrink-0" size={22} />
            <span className="font-semibold text-gray-800 text-lg truncate">{salon?.name || 'SalonManager'}</span>
          </div>
          {role && (
            <span className={`mt-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit ${
              role === 'owner' ? 'bg-pink-100 text-pink-700' :
              role === 'manager' ? 'bg-purple-100 text-purple-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
          )}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to} to={to} end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-pink-50 text-pink-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-200">
          <button onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 w-full transition-colors">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10 flex">
        {nav.slice(0, 5).map(({ to, label, icon: Icon, exact }) => (
          <NavLink key={to} to={to} end={exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-pink-600' : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            <Icon size={20} />
            <span className="mt-0.5">{label}</span>
          </NavLink>
        ))}
        <button onClick={handleSignOut} className="flex-1 flex flex-col items-center py-2 text-xs font-medium text-gray-500">
          <LogOut size={20} />
          <span className="mt-0.5">Out</span>
        </button>
      </nav>

      {/* Main content */}
      <main className="flex-1 md:ml-60 pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
