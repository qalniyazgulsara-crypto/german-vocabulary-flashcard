import express from 'express'
import cors from 'cors'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const USERS_DB_PATH = path.join(__dirname, 'users.json')
const DATA_DIR = path.join(__dirname, 'data')
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'
const PORT = process.env.PORT || 4001

const app = express()
app.use(cors())
app.use(express.json())

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

// Users store (auth only)
async function readUsers() {
  try {
    const raw = await fs.readFile(USERS_DB_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { users: [] }
  }
}

async function writeUsers(db) {
  await fs.writeFile(USERS_DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
}

// Per-user data store (categories/cards)
function userDataPath(userId) {
  return path.join(DATA_DIR, `${userId}.json`)
}

async function readUserData(userId) {
  try {
    const raw = await fs.readFile(userDataPath(userId), 'utf-8')
    return JSON.parse(raw)
  } catch {
    return { categories: [], cards: [] }
  }
}

async function writeUserData(userId, data) {
  await fs.writeFile(userDataPath(userId), JSON.stringify(data, null, 2), 'utf-8')
}

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' })
}

function auth(req, res, next) {
  const hdr = req.headers.authorization || ''
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Missing token' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

function seededData() {
  const now = new Date().toISOString()
  const catFoodId = uuidv4()
  const catFurnitureId = uuidv4()
  const catTravelId = uuidv4()
  const catAnimalsId = uuidv4()
  return {
    categories: [
      { id: catFoodId, name: 'Food | Еда | Ас', createdAt: now },
      { id: catFurnitureId, name: 'Furniture | Мебель | Жиһаз', createdAt: now },
      { id: catTravelId, name: 'Travel | Путешествия | Саяхат', createdAt: now },
      { id: catAnimalsId, name: 'Animals | Животные | Жануарлар', createdAt: now },
    ],
    cards: [
      // Food — 6 items
      { id: uuidv4(), categoryId: catFoodId, word: 'Brot', translation: 'Нан', createdAt: now },
      { id: uuidv4(), categoryId: catFoodId, word: 'Apfel', translation: 'Алма', createdAt: now },
      { id: uuidv4(), categoryId: catFoodId, word: 'Wasser', translation: 'Су', createdAt: now },
      { id: uuidv4(), categoryId: catFoodId, word: 'Käse', translation: 'Ірімшік', createdAt: now },
      { id: uuidv4(), categoryId: catFoodId, word: 'Milch', translation: 'Сүт', createdAt: now },
      { id: uuidv4(), categoryId: catFoodId, word: 'Suppe', translation: 'Сорпа', createdAt: now },
      // Furniture — 6 items
      { id: uuidv4(), categoryId: catFurnitureId, word: 'Stuhl', translation: 'Орындық', createdAt: now },
      { id: uuidv4(), categoryId: catFurnitureId, word: 'Tisch', translation: 'Үстел', createdAt: now },
      { id: uuidv4(), categoryId: catFurnitureId, word: 'Bett', translation: 'Төсек', createdAt: now },
      { id: uuidv4(), categoryId: catFurnitureId, word: 'Schrank', translation: 'Шкаф', createdAt: now },
      { id: uuidv4(), categoryId: catFurnitureId, word: 'Sofa', translation: 'Диван', createdAt: now },
      { id: uuidv4(), categoryId: catFurnitureId, word: 'Lampe', translation: 'Шам', createdAt: now },
      // Travel — 6 items
      { id: uuidv4(), categoryId: catTravelId, word: 'Bahnhof', translation: 'Вокзал', createdAt: now },
      { id: uuidv4(), categoryId: catTravelId, word: 'Flughafen', translation: 'Әуежай', createdAt: now },
      { id: uuidv4(), categoryId: catTravelId, word: 'Ticket', translation: 'Билет', createdAt: now },
      { id: uuidv4(), categoryId: catTravelId, word: 'Karte', translation: 'Карта', createdAt: now },
      { id: uuidv4(), categoryId: catTravelId, word: 'Hotel', translation: 'Қонақүй', createdAt: now },
      { id: uuidv4(), categoryId: catTravelId, word: 'Bus', translation: 'Автобус', createdAt: now },
      // Animals — 6 items
      { id: uuidv4(), categoryId: catAnimalsId, word: 'Hund', translation: 'Ит', createdAt: now },
      { id: uuidv4(), categoryId: catAnimalsId, word: 'Katze', translation: 'Мысық', createdAt: now },
      { id: uuidv4(), categoryId: catAnimalsId, word: 'Vogel', translation: 'Құс', createdAt: now },
      { id: uuidv4(), categoryId: catAnimalsId, word: 'Pferd', translation: 'Жылқы', createdAt: now },
      { id: uuidv4(), categoryId: catAnimalsId, word: 'Fisch', translation: 'Балық', createdAt: now },
      { id: uuidv4(), categoryId: catAnimalsId, word: 'Schaf', translation: 'Қой', createdAt: now },
    ],
  }
}

app.post('/auth/register', async (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ message: 'username and password required' })
  const usersDb = await readUsers()
  const exists = usersDb.users.find((u) => u.username.toLowerCase() === String(username).toLowerCase())
  if (exists) return res.status(400).json({ message: 'Username already exists' })
  const user = {
    id: uuidv4(),
    username: String(username),
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString(),
  }
  usersDb.users.push(user)
  await writeUsers(usersDb)
  // Create a fresh per-user JSON with seeded content
  await ensureDataDir()
  await writeUserData(user.id, seededData())
  const token = signToken(user)
  return res.json({ token, user: { id: user.id, username: user.username } })
})

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body || {}
  const usersDb = await readUsers()
  const user = usersDb.users.find((u) => u.username.toLowerCase() === String(username).toLowerCase())
  if (!user) return res.status(401).json({ message: 'Invalid credentials' })
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' })
  const token = signToken(user)
  return res.json({ token, user: { id: user.id, username: user.username } })
})

app.get('/me', auth, async (req, res) => {
  res.json({ id: req.user.id, username: req.user.username })
})

app.get('/categories', auth, async (req, res) => {
  const data = await readUserData(req.user.id)
  res.json(data.categories)
})

app.get('/categories/:id', auth, async (req, res) => {
  const data = await readUserData(req.user.id)
  const cat = data.categories.find((c) => c.id === req.params.id)
  if (!cat) return res.status(404).json({ message: 'Not found' })
  res.json(cat)
})

app.post('/categories', auth, async (req, res) => {
  let { name } = req.body || {}
  name = typeof name === 'string' ? name.trim() : ''
  if (!name) return res.status(400).json({ message: 'name required' })
  const data = await readUserData(req.user.id)
  const cat = { id: uuidv4(), name, createdAt: new Date().toISOString() }
  data.categories.push(cat)
  await writeUserData(req.user.id, data)
  res.status(201).json(cat)
})

app.put('/categories/:id', auth, async (req, res) => {
  let { name } = req.body || {}
  name = typeof name === 'string' ? name.trim() : ''
  if (!name) return res.status(400).json({ message: 'name required' })
  const data = await readUserData(req.user.id)
  const cat = data.categories.find((c) => c.id === req.params.id)
  if (!cat) return res.status(404).json({ message: 'Not found' })
  cat.name = name
  await writeUserData(req.user.id, data)
  res.json(cat)
})

app.delete('/categories/:id', auth, async (req, res) => {
  const data = await readUserData(req.user.id)
  const idx = data.categories.findIndex((c) => c.id === req.params.id)
  if (idx === -1) return res.status(404).json({ message: 'Not found' })
  const catId = data.categories[idx].id
  data.categories.splice(idx, 1)
  data.cards = data.cards.filter((card) => card.categoryId !== catId)
  await writeUserData(req.user.id, data)
  res.json({ ok: true })
})

app.get('/categories/:id/cards', auth, async (req, res) => {
  const data = await readUserData(req.user.id)
  const items = data.cards.filter((c) => c.categoryId === req.params.id)
  res.json(items)
})

app.post('/categories/:id/cards', auth, async (req, res) => {
  let { word, translation } = req.body || {}
  word = typeof word === 'string' ? word.trim() : ''
  translation = typeof translation === 'string' ? translation.trim() : ''
  if (!word || !translation) return res.status(400).json({ message: 'word and translation required' })
  const data = await readUserData(req.user.id)
  const cat = data.categories.find((c) => c.id === req.params.id)
  if (!cat) return res.status(404).json({ message: 'Category not found' })
  const card = { id: uuidv4(), categoryId: cat.id, word, translation, createdAt: new Date().toISOString() }
  data.cards.push(card)
  await writeUserData(req.user.id, data)
  res.status(201).json(card)
})

app.put('/cards/:id', auth, async (req, res) => {
  let { word, translation } = req.body || {}
  const data = await readUserData(req.user.id)
  const card = data.cards.find((c) => c.id === req.params.id)
  if (!card) return res.status(404).json({ message: 'Not found' })
  if (typeof word === 'string') {
    const w = word.trim()
    if (!w) return res.status(400).json({ message: 'word cannot be empty' })
    card.word = w
  }
  if (typeof translation === 'string') {
    const t = translation.trim()
    if (!t) return res.status(400).json({ message: 'translation cannot be empty' })
    card.translation = t
  }
  if (typeof word !== 'string' && typeof translation !== 'string') {
    return res.status(400).json({ message: 'nothing to update' })
  }
  await writeUserData(req.user.id, data)
  res.json(card)
})

app.delete('/cards/:id', auth, async (req, res) => {
  const data = await readUserData(req.user.id)
  const idx = data.cards.findIndex((c) => c.id === req.params.id)
  if (idx === -1) return res.status(404).json({ message: 'Not found' })
  data.cards.splice(idx, 1)
  await writeUserData(req.user.id, data)
  res.json({ ok: true })
})

app.get('/', (_req, res) => {
  res.json({ ok: true })
})

;(async () => {
  await ensureDataDir()
  // Ensure users file exists
  const users = await readUsers()
  await writeUsers(users)
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`))
})()
