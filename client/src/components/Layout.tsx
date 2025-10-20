import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Layout({ children, showActions = true }: { children: React.ReactNode; showActions?: boolean }) {
  const { user, logout, token } = useAuth()
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/90 backdrop-blur sticky top-0 z-30 border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 select-none">
            <span className="inline-block h-7 w-7 rounded-md bg-fuchsia-500"></span>
            <span className="inline-block h-7 w-7 rounded-md bg-emerald-400 -ml-3 rotate-12"></span>
            <span className="font-extrabold text-xl tracking-tight">Vocabulary Flashcard</span>
          </Link>
          {showActions && (
            <div className="flex items-center gap-3">
              {token && <span className="text-sm text-gray-600">{user?.username}</span>}
              {token ? (
                <button onClick={logout} className="kahoot-button bg-rose-500 px-4 py-2">Logout</button>
              ) : (
                <Link className="kahoot-button bg-indigo-600 px-4 py-2" to="/auth">Login</Link>
              )}
            </div>
          )}
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="py-6 text-center text-xs text-gray-500">Made for learning German vocabulary</footer>
    </div>
  )
}

