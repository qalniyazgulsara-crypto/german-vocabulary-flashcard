import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

type Card = { id: string; word: string; translation: string }

type ViewMode = 'grid' | 'single'

export default function CategoryPage() {
  const { id } = useParams()
  const { token } = useAuth()
  const [cards, setCards] = useState<Card[]>([])
  const [word, setWord] = useState('')
  const [translation, setTranslation] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(`view:${id}`)
    return (saved as ViewMode) || 'grid'
  })
  const [editing, setEditing] = useState(false)
  const [editingName, setEditingName] = useState('')
  const [manage, setManage] = useState(false)
  const [editCardId, setEditCardId] = useState<string | null>(null)
  const [editWord, setEditWord] = useState('')
  const [editTranslation, setEditTranslation] = useState('')

  async function load() {
    const [cardsRes, catRes] = await Promise.all([
      fetch(`${API_BASE}/categories/${id}/cards`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/categories/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
    const items = await cardsRes.json()
    const cat = await catRes.json()
    setCards(items)
    setCategoryName(cat?.name || '')
  }

  useEffect(() => { load() }, [id])
  useEffect(() => { if (id) localStorage.setItem(`view:${id}`, view) }, [id, view])

  async function onAdd(e: FormEvent) {
    e.preventDefault()
    await fetch(`${API_BASE}/categories/${id}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ word, translation }),
    })
    setWord('')
    setTranslation('')
    setShowForm(false)
    await load()
  }

  function startEditCard(c: Card) {
    setEditCardId(c.id)
    setEditWord(c.word)
    setEditTranslation(c.translation)
  }

  async function saveCardEdit(e: FormEvent) {
    e.preventDefault()
    if (!editCardId) return
    await fetch(`${API_BASE}/cards/${editCardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ word: editWord, translation: editTranslation }),
    })
    setEditCardId(null)
    await load()
  }

  async function deleteCard(idToDelete: string) {
    const res = await fetch(`${API_BASE}/cards/${idToDelete}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) await load()
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      <header className="flex items-center justify-between mb-4">
        <div>
          {editing ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const newName = editingName.trim()
                if (!newName) { setEditing(false); return }
                await fetch(`${API_BASE}/categories/${id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ name: newName }),
                })
                setCategoryName(newName)
                setEditing(false)
              }}
              className="flex items-center gap-2"
            >
              <input
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false) }}
                className="rounded-lg border-2 border-black/10 px-3 py-2 text-xl font-bold"
              />
              <button className="kahoot-button bg-emerald-500 px-3 py-2">Save</button>
              <button type="button" onClick={() => setEditing(false)} className="kahoot-button bg-gray-500 px-3 py-2">Cancel</button>
            </form>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight">{categoryName || 'Category'}</h1>
              <p className="text-sm text-gray-600">Click a card to flip</p>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white rounded-xl border p-1 flex">
            <button
              onClick={() => setManage(false)}
              className={`px-3 py-1 rounded-lg text-sm ${!manage ? 'bg-emerald-500 text-white' : 'text-gray-700'}`}
            >View</button>
            <button
              onClick={() => setManage(true)}
              className={`px-3 py-1 rounded-lg text-sm ${manage ? 'bg-emerald-500 text-white' : 'text-gray-700'}`}
            >Manage</button>
          </div>
          {!editing && (
            <button
              onClick={() => { setEditing(true); setEditingName(categoryName) }}
              className="kahoot-button bg-gray-800 px-3 py-2"
            >Rename</button>
          )}
          <div className="bg-white rounded-xl border p-1 flex">
            <button
              onClick={() => setView('grid')}
              className={`px-3 py-1 rounded-lg text-sm ${view === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-700'}`}
            >Grid</button>
            <button
              onClick={() => setView('single')}
              className={`px-3 py-1 rounded-lg text-sm ${view === 'single' ? 'bg-emerald-500 text-white' : 'text-gray-700'}`}
            >Slide</button>
          </div>
          <Link to="/" className="kahoot-button bg-indigo-600 px-4 py-2">← Back</Link>
        </div>
      </header>

      {view === 'grid' ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <li key={c.id}>
              {manage && editCardId === c.id ? (
                <div className="kahoot-card p-4">
                  <form className="space-y-2" onSubmit={saveCardEdit}>
                    <input
                      className="w-full rounded-lg border-2 border-black/10 px-3 py-2"
                      value={editWord}
                      onChange={(e) => setEditWord(e.target.value)}
                      placeholder="German word"
                      required
                    />
                    <input
                      className="w-full rounded-lg border-2 border-black/10 px-3 py-2"
                      value={editTranslation}
                      onChange={(e) => setEditTranslation(e.target.value)}
                      placeholder="Kazakh translation"
                      required
                    />
                    <div className="flex gap-2">
                      <button className="kahoot-button bg-emerald-500 px-3 py-2" type="submit">Save</button>
                      <button className="kahoot-button bg-gray-500 px-3 py-2" type="button" onClick={() => setEditCardId(null)}>Cancel</button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="relative">
                  <FlipCard front={c.word} back={c.translation} />
                  {manage && (
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        className="bg-white/95 hover:bg-white rounded-full p-2 shadow"
                        aria-label="Edit card"
                        onClick={() => startEditCard(c)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04a1.004 1.004 0 0 0 0-1.42l-2.5-2.5a1.004 1.004 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.99-1.66z"/></svg>
                      </button>
                      <button
                        className="bg-white/95 hover:bg-white rounded-full p-2 shadow"
                        aria-label="Delete card"
                        onClick={() => deleteCard(c.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <SingleCardCarousel
          items={cards}
          manage={manage}
          onEdit={startEditCard}
          onDelete={(idDel) => deleteCard(idDel)}
          editingId={editCardId}
          editWord={editWord}
          editTranslation={editTranslation}
          setEditWord={setEditWord}
          setEditTranslation={setEditTranslation}
          onSave={saveCardEdit}
          onCancel={() => setEditCardId(null)}
        />
      )}

      <button
        onClick={() => setShowForm((s) => !s)}
        title="Add Card"
        className="fixed bottom-8 right-8 kahoot-button bg-amber-400 w-14 h-14 rounded-full text-3xl"
        aria-label="Add card"
      >
        +
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg kahoot-card p-5">
            <h3 className="text-lg font-bold mb-3">Add Card</h3>
            <form onSubmit={onAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                className="rounded-xl border-2 border-black/10 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-indigo-200"
                placeholder="German word"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                required
              />
              <input
                className="rounded-xl border-2 border-black/10 px-3 py-2 focus:outline-none focus:ring-4 focus:ring-indigo-200"
                placeholder="Kazakh translation"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                required
              />
              <button className="kahoot-button bg-amber-400 px-4 py-2">Add</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function FlipCard({ front, back }: { front: string; back: string }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <button onClick={() => setFlipped((f) => !f)} className="relative h-40 w-full perspective" aria-label="flip card">
      <div className={`transition-transform duration-500 preserve-3d h-full w-full ${flipped ? 'rotate-y-180' : ''}`}>
        <div className="absolute inset-0 backface-hidden rounded-2xl border-2 border-black/10 bg-white shadow-[0_8px_0_#00000022] flex items-center justify-center text-2xl font-extrabold">
          {front}
        </div>
        <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border-2 border-black/10 bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-[0_8px_0_#00000022] flex items-center justify-center text-2xl font-extrabold">
          {back}
        </div>
      </div>
    </button>
  )
}

function SingleCardCarousel({
  items,
  manage,
  onEdit,
  onDelete,
  editingId,
  editWord,
  editTranslation,
  setEditWord,
  setEditTranslation,
  onSave,
  onCancel,
}: {
  items: Card[]
  manage: boolean
  onEdit: (c: Card) => void
  onDelete: (id: string) => void
  editingId: string | null
  editWord: string
  editTranslation: string
  setEditWord: (v: string) => void
  setEditTranslation: (v: string) => void
  onSave: (e: FormEvent) => void
  onCancel: () => void
}) {
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState<'left' | 'right'>('right')
  const curr = items[index]

  function prev() {
    setDir('left')
    setIndex((i) => (i - 1 + items.length) % Math.max(items.length, 1))
  }
  function next() {
    setDir('right')
    setIndex((i) => (i + 1) % Math.max(items.length, 1))
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [items.length])

  if (items.length === 0) return <p className="text-gray-600">No cards yet.</p>

  const animClass = dir === 'right' ? 'animate-slide-right' : 'animate-slide-left'

  return (
    <div className="flex items-center justify-center gap-3">
      <button onClick={prev} className="kahoot-button bg-indigo-600 p-3 rounded-full" aria-label="Previous">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6 text-white fill-current">
          <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
        </svg>
      </button>
      <div className={`w-full max-w-md ${animClass}`} key={curr.id}>
        {manage && editingId === curr.id ? (
          <div className="kahoot-card p-4">
            <form className="space-y-2" onSubmit={onSave}>
              <input
                className="w-full rounded-lg border-2 border-black/10 px-3 py-2"
                value={editWord}
                onChange={(e) => setEditWord(e.target.value)}
                placeholder="German word"
                required
              />
              <input
                className="w-full rounded-lg border-2 border-black/10 px-3 py-2"
                value={editTranslation}
                onChange={(e) => setEditTranslation(e.target.value)}
                placeholder="Kazakh translation"
                required
              />
              <div className="flex gap-2 justify-center">
                <button className="kahoot-button bg-emerald-500 px-3 py-2" type="submit">Save</button>
                <button className="kahoot-button bg-gray-500 px-3 py-2" type="button" onClick={onCancel}>Cancel</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="relative">
            <FlipCard key={curr.id} front={curr.word} back={curr.translation} />
            {manage && (
              <div className="absolute top-2 right-2 flex gap-2">
                <button className="bg-white/95 hover:bg-white rounded-full p-2 shadow" aria-label="Edit" onClick={() => onEdit(curr)}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04a1.004 1.004 0 0 0 0-1.42l-2.5-2.5a1.004 1.004 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.99-1.66z"/></svg>
                </button>
                <button className="bg-white/95 hover:bg-white rounded-full p-2 shadow" aria-label="Delete" onClick={() => onDelete(curr.id)}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </div>
            )}
          </div>
        )}
        <p className="text-center text-sm text-gray-600 mt-2">{index + 1} / {items.length}</p>
      </div>
      <button onClick={next} className="kahoot-button bg-indigo-600 p-3 rounded-full" aria-label="Next">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6 text-white fill-current">
          <path d="m8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
        </svg>
      </button>
    </div>
  )
}
