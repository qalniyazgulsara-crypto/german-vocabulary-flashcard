import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

type Category = { id: string; name: string; createdAt: string }

const colorClasses = [
  'from-indigo-500 to-fuchsia-500',
  'from-emerald-400 to-cyan-500',
  'from-amber-400 to-rose-500',
  'from-sky-500 to-indigo-600',
  'from-violet-500 to-purple-600',
]

export default function Dashboard() {
  const { token, user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch(`${API_BASE}/categories`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setCategories(data)
    setLoading(false)
  }

  useEffect(() => { load().catch((e) => setError(String(e))) }, [])

  async function onCreateCategory(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) {
      const msg = (await res.json()).message || 'Failed to create category'
      setError(msg)
      return
    }
    setName('')
    setShowForm(false)
    await load()
  }

  async function onRenameCategory(id: string, currentName: string) {
    setEditingId(id)
    setEditingName(currentName)
  }

  async function saveRename() {
    if (!editingId) return
    const newName = editingName.trim()
    if (newName.length === 0) { setEditingId(null); return }
    const res = await fetch(`${API_BASE}/categories/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newName }),
    })
    if (res.ok) {
      await load()
    }
    setEditingId(null)
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      <section className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {user?.username}!</h1>
        <p className="text-gray-600">Your categories are private to you.</p>
      </section>

      <section className="relative">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Categories</h2>
        </div>
        {error && <p className="text-sm text-rose-600 mb-2">{error}</p>}
        {loading ? (
          <p className="text-sm text-gray-600">Loading…</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-gray-600">No categories yet. Click the + button to add one!</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c, idx) => (
              <li key={c.id}>
                <div className="relative">
                  {editingId === c.id ? (
                    <div className="block kahoot-card overflow-hidden">
                      <div className={`h-28 bg-gradient-to-br ${colorClasses[idx % colorClasses.length]}`}></div>
                      <div className="p-4">
                        <form
                          className="flex items-center gap-2"
                          onSubmit={(e) => { e.preventDefault(); saveRename() }}
                        >
                          <input
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null) }}
                            className="flex-1 rounded-lg border-2 border-black/10 px-3 py-2"
                          />
                          <button type="submit" className="kahoot-button bg-emerald-500 px-3 py-2" aria-label="Save">Save</button>
                          <button type="button" onClick={() => setEditingId(null)} className="kahoot-button bg-gray-500 px-3 py-2" aria-label="Cancel">Cancel</button>
                        </form>
                        <div className="text-xs text-gray-500 mt-2">Created {new Date(c.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ) : (
                    <Link to={`/category/${c.id}`} className="block kahoot-card overflow-hidden">
                      <div className={`h-28 bg-gradient-to-br ${colorClasses[idx % colorClasses.length]}`}></div>
                      <div className="p-4">
                        <div className="text-lg font-bold pr-10">{c.name}</div>
                        <div className="text-xs text-gray-500">Created {new Date(c.createdAt).toLocaleDateString()}</div>
                      </div>
                    </Link>
                  )}
                  {editingId !== c.id && (
                    <button
                      title="Rename"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRenameCategory(c.id, c.name) }}
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-2 shadow"
                      aria-label="Rename category"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04a1.004 1.004 0 0 0 0-1.42l-2.5-2.5a1.004 1.004 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.99-1.66z"/></svg>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => setShowForm((s) => !s)}
          title="Add Category"
          className="fixed bottom-8 right-8 kahoot-button bg-emerald-500 w-14 h-14 rounded-full text-3xl leading-[52px]"
          aria-label="Add category"
        >
          +
        </button>

        {showForm && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md kahoot-card p-5">
              <h3 className="text-lg font-bold mb-3">Create New Category</h3>
              <form onSubmit={onCreateCategory} className="flex gap-2">
                <input
                  className="flex-1 rounded-xl border-2 border-black/10 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                  placeholder="Category name (e.g., Food)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <button className="kahoot-button bg-emerald-500 px-4 py-2">Add</button>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
