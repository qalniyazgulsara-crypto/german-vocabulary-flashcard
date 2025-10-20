import type { FormEvent } from 'react'
import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Request failed')
      login(data.token, data.user)
      window.location.href = '/'
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px-72px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white kahoot-card p-6">
        <div className="flex justify-center gap-2 mb-3">
          <span className="h-3 w-3 rounded-full bg-rose-500"></span>
          <span className="h-3 w-3 rounded-full bg-amber-400"></span>
          <span className="h-3 w-3 rounded-full bg-emerald-400"></span>
        </div>
        <h1 className="text-2xl font-extrabold text-center tracking-tight">German Vocabulary</h1>
        <p className="text-center text-sm text-gray-600 mb-6">Flashcards (DE → KZ)</p>

        <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-2xl">
          <button
            className={`flex-1 py-2 rounded-xl ${mode === 'login' ? 'bg-indigo-600 text-white shadow' : 'text-gray-700'}`}
            onClick={() => setMode('login')}
          >Login</button>
          <button
            className={`flex-1 py-2 rounded-xl ${mode === 'register' ? 'bg-fuchsia-600 text-white shadow' : 'text-gray-700'}`}
            onClick={() => setMode('register')}
          >Register</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Username</label>
            <input
              className="mt-1 w-full rounded-xl border-2 border-black/10 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-indigo-200"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border-2 border-black/10 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-indigo-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button type="submit" className={`w-full kahoot-button px-4 py-3 ${mode === 'login' ? 'bg-indigo-600' : 'bg-fuchsia-600'}`}>
            {mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
