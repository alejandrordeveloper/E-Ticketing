import {
  startTransition,
  useDeferredValue,
  useEffect,
  useState,
} from 'react'
import type { CSSProperties, FormEvent, KeyboardEvent, MouseEvent } from 'react'
import './App.css'

type EventItem = {
  _id: string
  name: string
  description: string
  date: string
  inventory: number
  createdAt?: string
  updatedAt?: string
}

type OrderItem = {
  id: string
  eventId: string
  userId: string
  quantity: number
  status: string
  createdAt: string
}

type RegisterResponse = {
  id: number | string
  username: string
  email: string
}

type LoginResponse = {
  access: string
  refresh: string
}

type SessionState = {
  accessToken: string
  userId: string
  email: string
  username?: string
}

type ApiErrorPayload = {
  statusCode?: number
  error?: string
  message?: string | string[]
  details?: Record<string, string | string[]>
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const backstageAdminEmail = (import.meta.env.VITE_BACKSTAGE_ADMIN_EMAIL ?? 'admin@eticket.com').trim().toLowerCase()
const backstageAdminPasswordHint = 'admin123'
const sessionStorageKey = 'eticket.frontend.session'
const fullDateFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'full',
  timeStyle: 'short',
})
const shortDateFormatter = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

function getCurrentPath(): '/' | '/backstage' {
  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/'
  return normalizedPath === '/backstage' ? '/backstage' : '/'
}

function loadStoredSession(): SessionState | null {
  const rawValue = window.localStorage.getItem(sessionStorageKey)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as SessionState
  } catch {
    window.localStorage.removeItem(sessionStorageKey)
    return null
  }
}

function formatErrorPayload(payload: ApiErrorPayload): string {
  if (Array.isArray(payload.message)) {
    return payload.message.join(' ')
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message
  }

  if (payload.details) {
    const detailText = Object.entries(payload.details)
      .map(([field, value]) => {
        const description = Array.isArray(value) ? value.join(', ') : value
        return `${field}: ${description}`
      })
      .join(' | ')

    if (detailText) {
      return detailText
    }
  }

  return payload.error ?? 'La solicitud no pudo completarse.'
}

async function requestJson<T>(path: string, init?: RequestInit, accessToken?: string): Promise<T> {
  const headers = new Headers(init?.headers)

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  headers.set('Accept', 'application/json')

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  })

  const isJson = response.headers.get('content-type')?.includes('application/json') ?? false
  const payload = isJson ? ((await response.json()) as T | ApiErrorPayload) : await response.text()

  if (!response.ok) {
    if (isJson) {
      throw new Error(formatErrorPayload(payload as ApiErrorPayload))
    }

    throw new Error(typeof payload === 'string' && payload.trim() ? payload : 'La solicitud falló.')
  }

  return payload as T
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return 'Ocurrió un error inesperado.'
}

function decodeTokenPayload(accessToken: string): Record<string, unknown> | null {
  const [, payload] = accessToken.split('.')

  if (!payload) {
    return null
  }

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = window.atob(normalizedPayload)
    return JSON.parse(decoded) as Record<string, unknown>
  } catch {
    return null
  }
}

function extractUserId(accessToken: string): string {
  const payload = decodeTokenPayload(accessToken)

  if (!payload) {
    return ''
  }

  const possibleKeys = ['user_id', 'userId', 'sub', 'id']

  for (const key of possibleKeys) {
    const value = payload[key]

    if (typeof value === 'string' || typeof value === 'number') {
      return String(value)
    }
  }

  return ''
}

function formatFullDate(value: string): string {
  return fullDateFormatter.format(new Date(value))
}

function formatShortDate(value: string): string {
  return shortDateFormatter.format(new Date(value))
}

function getEventDisplayTitle(value: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  const cleaned = normalized.replace(/(?:^|\s)\d{8,}(?=$|\s)/g, '').replace(/\s+/g, ' ').trim()

  if (cleaned.length >= 3) {
    return cleaned
  }

  return normalized
}

function inferGenre(event: EventItem): string {
  const text = `${event.name} ${event.description}`.toLowerCase()

  if (/(rock|metal|guitarra|band|banda)/.test(text)) {
    return 'Rock'
  }

  if (/(dj|club|electro|techno|house|dance)/.test(text)) {
    return 'Club'
  }

  if (/(comedia|stand up|humor)/.test(text)) {
    return 'Comedy'
  }

  if (/(conferencia|summit|talk|dev|tech)/.test(text)) {
    return 'Talk'
  }

  if (/(teatro|escena|obra)/.test(text)) {
    return 'Theatre'
  }

  return 'Live'
}

function inferVenue(event: EventItem): string {
  const venues = [
    'Arena Central',
    'District Hall',
    'Pulse Room',
    'River Stage',
    'Forum 9',
    'Luna Park',
  ]

  const hash = event._id.split('').reduce((total, char) => total + char.charCodeAt(0), 0)
  return venues[hash % venues.length]
}

function getPosterTone(event: EventItem): string {
  const tones = [
    'poster--cyan',
    'poster--lime',
    'poster--orange',
    'poster--red',
  ]
  const hash = event.name.length + event._id.length
  return tones[hash % tones.length]
}

function getPosterPalette(tone: string): {
  backgroundA: string
  backgroundB: string
  accent: string
  accentSoft: string
  text: string
} {
  switch (tone) {
    case 'poster--lime':
      return {
        backgroundA: '#1a2d12',
        backgroundB: '#09110b',
        accent: '#d8ff3e',
        accentSoft: '#7affc4',
        text: '#f7ffe0',
      }
    case 'poster--orange':
      return {
        backgroundA: '#3c1c11',
        backgroundB: '#110b08',
        accent: '#ff9f43',
        accentSoft: '#ffd166',
        text: '#fff2df',
      }
    case 'poster--red':
      return {
        backgroundA: '#42131d',
        backgroundB: '#11080a',
        accent: '#ff5f72',
        accentSoft: '#ffa7b6',
        text: '#fff0f3',
      }
    default:
      return {
        backgroundA: '#0f263a',
        backgroundB: '#060d15',
        accent: '#4fb8ff',
        accentSoft: '#85fff3',
        text: '#ebf7ff',
      }
  }
}

function wrapPosterTitle(value: string, maxCharsPerLine: number, maxLines: number): string[] {
  const normalized = value.replace(/\s+/g, ' ').trim()

  if (!normalized) {
    return ['LIVE SHOW']
  }

  const words = normalized.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word

    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate
      continue
    }

    if (currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      lines.push(word.slice(0, maxCharsPerLine))
      currentLine = word.slice(maxCharsPerLine)
    }

    if (lines.length === maxLines) {
      break
    }
  }

  if (lines.length < maxLines && currentLine) {
    lines.push(currentLine)
  }

  return lines.slice(0, maxLines).map((line, index, allLines) => {
    if (index === allLines.length - 1 && allLines.length === maxLines && normalized.length > allLines.join(' ').length) {
      return `${line.slice(0, Math.max(0, maxCharsPerLine - 1)).trimEnd()}…`
    }

    return line
  })
}

function buildPosterArtwork(event: EventItem, compact: boolean, includeTitle: boolean): string {
  const tone = getPosterTone(event)
  const palette = getPosterPalette(tone)
  const genre = inferGenre(event).toUpperCase()
  const venue = inferVenue(event).toUpperCase()
  const shortDate = formatShortDate(event.date).toUpperCase()
  const title = getEventDisplayTitle(event.name).toUpperCase().replace(/&/g, 'AND')
  const titleLines = includeTitle ? wrapPosterTitle(title, compact ? 14 : 18, compact ? 2 : 3) : []
  const viewBox = compact ? '0 0 520 640' : '0 0 880 1100'
  const width = compact ? 520 : 880
  const height = compact ? 640 : 1100
  const titleStartY = compact ? 308 : 470
  const lineHeight = compact ? 60 : 84
  const venueY = compact ? 580 : 980
  const dateY = compact ? 612 : 1032
  const genreFontSize = compact ? 64 : 118
  const titleFontSize = compact ? 42 : 66

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette.backgroundA}" />
          <stop offset="100%" stop-color="${palette.backgroundB}" />
        </linearGradient>
        <radialGradient id="flare" cx="80%" cy="22%" r="60%">
          <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.95" />
          <stop offset="100%" stop-color="${palette.accent}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" />
      <rect width="100%" height="100%" fill="url(#flare)" opacity="0.9" />
      <circle cx="${compact ? 430 : 680}" cy="${compact ? 126 : 180}" r="${compact ? 112 : 180}" fill="${palette.accentSoft}" opacity="0.18" />
      <circle cx="${compact ? 130 : 170}" cy="${compact ? 142 : 220}" r="${compact ? 76 : 124}" fill="${palette.accent}" opacity="0.16" />
      <g opacity="0.16" stroke="${palette.text}" stroke-width="2">
        <path d="M0 ${compact ? 120 : 180} H${width}" />
        <path d="M0 ${compact ? 180 : 260} H${width}" />
        <path d="M0 ${compact ? 240 : 340} H${width}" />
      </g>
      <text x="${compact ? 28 : 42}" y="${compact ? 96 : 150}" fill="${palette.text}" opacity="0.12" font-size="${genreFontSize}" font-family="Arial, Helvetica, sans-serif" font-weight="700">${genre}</text>
      <text x="${compact ? 30 : 42}" y="${compact ? 56 : 72}" fill="${palette.text}" font-size="${compact ? 20 : 28}" font-family="Arial, Helvetica, sans-serif" letter-spacing="5">E.TICKET LIVE SERIES</text>
      ${titleLines
        .map(
          (line, index) =>
            `<text x="${compact ? 30 : 42}" y="${titleStartY + index * lineHeight}" fill="${palette.text}" font-size="${titleFontSize}" font-family="Arial, Helvetica, sans-serif" font-weight="700">${line}</text>`,
        )
        .join('')}
      <text x="${compact ? 30 : 42}" y="${venueY}" fill="${palette.text}" font-size="${compact ? 22 : 30}" font-family="Arial, Helvetica, sans-serif" letter-spacing="3">${venue}</text>
      <text x="${compact ? 30 : 42}" y="${dateY}" fill="${palette.accentSoft}" font-size="${compact ? 26 : 36}" font-family="Arial, Helvetica, sans-serif" font-weight="700">${shortDate}</text>
    </svg>
  `

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

function getPosterSurfaceStyle(event: EventItem, compact: boolean, includeTitle = true): CSSProperties {
  const tone = getPosterTone(event)
  const palette = getPosterPalette(tone)
  const overlay = compact
    ? `linear-gradient(180deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.22))`
    : `linear-gradient(180deg, rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0.28))`

  return {
    background: `${overlay}, ${buildPosterArtwork(event, compact, includeTitle)}, linear-gradient(180deg, ${palette.backgroundA}, ${palette.backgroundB})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}

function App() {
  const [currentPath, setCurrentPath] = useState<'/' | '/backstage'>(() => getCurrentPath())
  const [session, setSession] = useState<SessionState | null>(() => loadStoredSession())
  const [events, setEvents] = useState<EventItem[]>([])
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [latestCreatedEventId, setLatestCreatedEventId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [ticketQuantity, setTicketQuantity] = useState(2)
  const [catalogMessage, setCatalogMessage] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [checkoutMessage, setCheckoutMessage] = useState('')
  const [operationsMessage, setOperationsMessage] = useState('')
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)
  const [isOrdersLoading, setIsOrdersLoading] = useState(false)
  const [isAuthPending, setIsAuthPending] = useState(false)
  const [isCheckoutPending, setIsCheckoutPending] = useState(false)
  const [isOperationsPending, setIsOperationsPending] = useState(false)
  const [authForm, setAuthForm] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [backstagePassword, setBackstagePassword] = useState('')
  const [backstageMessage, setBackstageMessage] = useState('')
  const [isBackstageAuthPending, setIsBackstageAuthPending] = useState(false)
  const [eventForm, setEventForm] = useState({
    name: 'Concierto en la ciudad',
    description: 'Una noche para comprar tickets, validar stock y cerrar la demo sin salir del front.',
    date: '2026-08-15T20:00',
    inventory: 500,
  })
  const [stockForm, setStockForm] = useState({
    eventId: '',
    initialInventory: 120,
  })

  const deferredSearchTerm = useDeferredValue(searchTerm)
  const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase()
  const filteredEvents = events.filter((event) => {
    if (!normalizedSearchTerm) {
      return true
    }

    const searchableText = `${event.name} ${event.description}`.toLowerCase()
    return searchableText.includes(normalizedSearchTerm)
  })
  const selectedEvent = events.find((event) => event._id === selectedEventId) ?? filteredEvents[0] ?? null
  const userFirstName = session?.username?.split(' ')[0] ?? session?.email.split('@')[0] ?? 'invitado'
  const selectedGenre = selectedEvent ? inferGenre(selectedEvent) : 'Live'
  const selectedVenue = selectedEvent ? inferVenue(selectedEvent) : 'Venue pending'
  const eventCountLabel = `${filteredEvents.length} ${filteredEvents.length === 1 ? 'show' : 'shows'}`
  const isBackstageRoute = currentPath === '/backstage'
  const hasBackstageAccess = session?.email.trim().toLowerCase() === backstageAdminEmail
  const stagedEvent = events.find((event) => event._id === stockForm.eventId) ?? null
  const hasCatalogEvents = events.length > 0
  const sessionBadgeLabel = session
    ? hasBackstageAccess
      ? `Backstage admin · ${session.email}`
      : `Signed in · ${session.email}`
    : 'Guest mode'
  const selectedEventInventoryLabel = selectedEvent
    ? `${selectedEvent.inventory} seats listed in catalog`
    : 'Catalog inventory pending'
  const selectedEventDisplayTitle = selectedEvent ? getEventDisplayTitle(selectedEvent.name) : 'Select an event'

  async function fetchOrders(accessToken: string) {
    setIsOrdersLoading(true)

    try {
      const nextOrders = await requestJson<OrderItem[]>('/orders', undefined, accessToken)
      setOrders(nextOrders)
    } catch (error) {
      setCheckoutMessage(getErrorMessage(error))
    } finally {
      setIsOrdersLoading(false)
    }
  }

  async function fetchEvents() {
    setIsCatalogLoading(true)

    try {
      const catalog = await requestJson<EventItem[]>('/events')
      setEvents(catalog)
      setCatalogMessage(catalog.length ? '' : 'No live events yet. Use Backstage to publish the first one.')

      startTransition(() => {
        setSelectedEventId((currentId) => {
          if (currentId && catalog.some((event) => event._id === currentId)) {
            return currentId
          }

          return catalog[0]?._id ?? ''
        })
      })

      setStockForm((currentStock) => {
        if (currentStock.eventId) {
          return currentStock
        }

        return {
          ...currentStock,
          eventId: catalog[0]?._id ?? '',
        }
      })
    } catch (error) {
      setCatalogMessage(getErrorMessage(error))
    } finally {
      setIsCatalogLoading(false)
    }
  }

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void fetchEvents()
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [])

  useEffect(() => {
    if (session) {
      window.localStorage.setItem(sessionStorageKey, JSON.stringify(session))

      const frameId = window.requestAnimationFrame(() => {
        void fetchOrders(session.accessToken)
      })

      return () => window.cancelAnimationFrame(frameId)
    }

    window.localStorage.removeItem(sessionStorageKey)
  }, [session])

  useEffect(() => {
    function handlePopState() {
      setCurrentPath(getCurrentPath())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsAuthPending(true)
    setAuthMessage('')

    try {
      const normalizedEmail = authForm.email.trim().toLowerCase()
      const trimmedPassword = authForm.password.trim()
      let username = authForm.username.trim()

      if (authMode === 'register') {
        const registration = await requestJson<RegisterResponse>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            username,
            email: normalizedEmail,
            password: trimmedPassword,
          }),
        })

        username = registration.username
      }

      const login = await requestJson<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: normalizedEmail,
          password: trimmedPassword,
        }),
      })

      const decodedUserId = extractUserId(login.access)

      setSession({
        accessToken: login.access,
        userId: decodedUserId,
        email: normalizedEmail,
        username: username || undefined,
      })
      setAuthMode('login')
      setAuthForm((currentForm) => ({
        ...currentForm,
        password: '',
      }))
      setAuthMessage(authMode === 'register' ? 'Account created. You are in.' : 'Signed in successfully.')
    } catch (error) {
      setAuthMessage(getErrorMessage(error))
    } finally {
      setIsAuthPending(false)
    }
  }

  async function handleCheckoutSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedEvent) {
      setCheckoutMessage('Selecciona un evento antes de continuar.')
      return
    }

    if (!session?.accessToken) {
      setCheckoutMessage('Inicia sesión para generar la orden.')
      return
    }

    if (!session.userId) {
      setCheckoutMessage('No se pudo obtener el usuario desde el token. Ajusta el backend para derivarlo en el servidor.')
      return
    }

    setIsCheckoutPending(true)
    setCheckoutMessage('')

    try {
      const createdOrder = await requestJson<OrderItem>(
        '/orders',
        {
          method: 'POST',
          body: JSON.stringify({
            eventId: selectedEvent._id,
            userId: session.userId,
            quantity: ticketQuantity,
          }),
        },
        session.accessToken,
      )

      setOrders((currentOrders) => [createdOrder, ...currentOrders])
      setCheckoutMessage('Purchase confirmed. The order is now registered in the protected flow.')
    } catch (error) {
      setCheckoutMessage(getErrorMessage(error))
    } finally {
      setIsCheckoutPending(false)
    }
  }

  async function handleBackstageLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsBackstageAuthPending(true)
    setBackstageMessage('')

    try {
      const login = await requestJson<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: backstageAdminEmail,
          password: backstagePassword.trim(),
        }),
      })

      const decodedUserId = extractUserId(login.access)

      setSession({
        accessToken: login.access,
        userId: decodedUserId,
        email: backstageAdminEmail,
        username: 'Backstage Admin',
      })
      setBackstagePassword('')
      setBackstageMessage('Backstage unlocked.')
    } catch (error) {
      setBackstageMessage(getErrorMessage(error))
    } finally {
      setIsBackstageAuthPending(false)
    }
  }

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!session?.accessToken || !hasBackstageAccess) {
      setOperationsMessage('Backstage requires the demo admin session before publishing events.')
      return
    }

    setIsOperationsPending(true)
    setOperationsMessage('')

    try {
      const createdEvent = await requestJson<EventItem>(
        '/events',
        {
          method: 'POST',
          body: JSON.stringify({
            ...eventForm,
            date: new Date(eventForm.date).toISOString(),
          }),
        },
        session.accessToken,
      )

      setOperationsMessage(`Event published. Event ID ${createdEvent._id} is now ready for sellable stock.`)
      setLatestCreatedEventId(createdEvent._id)
      setSelectedEventId(createdEvent._id)
      setStockForm((currentStock) => ({
        ...currentStock,
        eventId: createdEvent._id,
      }))
      await fetchEvents()
    } catch (error) {
      setOperationsMessage(getErrorMessage(error))
    } finally {
      setIsOperationsPending(false)
    }
  }

  async function handleStockSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!session?.accessToken || !hasBackstageAccess) {
      setOperationsMessage('Backstage requires the demo admin session before loading sellable stock.')
      return
    }

    setIsOperationsPending(true)
    setOperationsMessage('')

    try {
      await requestJson<{ eventId: string; available: number }>(
        '/orders/stock',
        {
          method: 'POST',
          body: JSON.stringify(stockForm),
        },
        session.accessToken,
      )

      setOperationsMessage(`Sellable stock initialized for ${stockForm.eventId}. You can go back to Storefront and test the purchase flow.`)
    } catch (error) {
      setOperationsMessage(getErrorMessage(error))
    } finally {
      setIsOperationsPending(false)
    }
  }

  function handleLogout() {
    setOrders([])
    setSession(null)
    setAuthMessage('Signed out.')
    setCheckoutMessage('')
    setBackstageMessage('')
    setOperationsMessage('')
  }

  function navigateTo(event: MouseEvent<HTMLAnchorElement>, nextPath: '/' | '/backstage') {
    if (getCurrentPath() === nextPath) {
      return
    }

    event.preventDefault()
    window.history.pushState({}, '', nextPath)
    setCurrentPath(nextPath)
    window.scrollTo({ top: 0, left: 0 })
  }

  function focusCheckoutForEvent(eventId: string) {
    setSelectedEventId(eventId)
    document.getElementById('checkout-panel')?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleEventCardKeyDown(event: KeyboardEvent<HTMLElement>, eventId: string) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    setSelectedEventId(eventId)
  }

  const operationsPanel = (
    <section id="operations-panel" className="panel panel--operations">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">Backstage</span>
          <h2>Populate catalog and stock</h2>
          <p className="section-copy">Admin-only actions kept visible for demo speed, without touching the service boundaries.</p>
        </div>
      </div>

      <div className="backstage-guide-grid">
        <div className="session-card backstage-guide-card">
          <p className="backstage-guide-card__title">Demo flow</p>
          <div className="backstage-steps" aria-label="Backstage steps">
            <div className={`backstage-step${hasBackstageAccess ? ' backstage-step--done' : ''}`}>
              <strong>1</strong>
              <span>Unlock Backstage with the demo admin account.</span>
            </div>
            <div className={`backstage-step${stagedEvent ? ' backstage-step--done' : ''}`}>
              <strong>2</strong>
              <span>Create an event and capture its Event ID automatically.</span>
            </div>
            <div className={`backstage-step${stockForm.eventId ? ' backstage-step--done' : ''}`}>
              <strong>3</strong>
              <span>Initialize sellable stock for that event.</span>
            </div>
            <div className="backstage-step">
              <strong>4</strong>
              <span>Go back to Storefront and complete a purchase test.</span>
            </div>
          </div>
        </div>

        <div className="session-card backstage-guide-card backstage-guide-card--active">
          <p className="backstage-guide-card__title">Current event in setup</p>
          {stagedEvent ? (
            <div className="backstage-guide-summary">
              <div className="backstage-guide-summary__item backstage-guide-summary__item--highlight">
                <span className="backstage-guide-summary__label">Event</span>
                <strong>{getEventDisplayTitle(stagedEvent.name)}</strong>
              </div>
              <div className="backstage-guide-summary__item">
                <span className="backstage-guide-summary__label">Event ID</span>
                <p className="session-token">{stagedEvent._id}</p>
              </div>
              <div className="backstage-guide-summary__item">
                <span className="backstage-guide-summary__label">Catalog inventory</span>
                <p className="session-token">{stagedEvent.inventory}</p>
              </div>
            </div>
          ) : (
            <p className="session-token">Create an event first and its ID will be preloaded into stock setup automatically.</p>
          )}
        </div>
      </div>

      <div className="operations-flow">
        <form className="stack-form session-card backstage-stage" onSubmit={handleCreateEvent}>
          <div className="backstage-stage__header">
            <span className="section-kicker">Step 1</span>
            <h3>Create event</h3>
            <p className="section-copy">Publish the event to the catalog first. Once it exists, the next step unlocks automatically.</p>
          </div>
          <label>
            <span>Name</span>
            <input
              value={eventForm.name}
              onChange={(event) => setEventForm((currentForm) => ({ ...currentForm, name: event.target.value }))}
              required
            />
          </label>
          <label>
            <span>Description</span>
            <textarea
              rows={4}
              value={eventForm.description}
              onChange={(event) =>
                setEventForm((currentForm) => ({ ...currentForm, description: event.target.value }))
              }
              required
            />
          </label>
          <label>
            <span>Date</span>
            <input
              type="datetime-local"
              value={eventForm.date}
              onChange={(event) => setEventForm((currentForm) => ({ ...currentForm, date: event.target.value }))}
              required
            />
          </label>
          <label>
            <span>Catalog inventory</span>
            <input
              type="number"
              min="0"
              value={eventForm.inventory}
              onChange={(event) =>
                setEventForm((currentForm) => ({ ...currentForm, inventory: Number(event.target.value) }))
              }
              required
            />
          </label>
          <button type="submit" className="button button--secondary" disabled={isOperationsPending}>
            Publish event
          </button>
        </form>

        <form className="stack-form session-card backstage-stage" onSubmit={handleStockSubmit}>
          <div className="backstage-stage__header">
            <span className="section-kicker">Step 2</span>
            <h3>Initialize stock</h3>
            <p className="section-copy">Set the sellable inventory only after the event has been created and linked here.</p>
          </div>
          <label>
            <span>Select existing event</span>
            <select
              value={stockForm.eventId}
              onChange={(event) => setStockForm((currentForm) => ({ ...currentForm, eventId: event.target.value }))}
              disabled={!hasCatalogEvents}
            >
              {!hasCatalogEvents ? <option value="">No events available yet</option> : null}
              {events.map((eventItem) => (
                <option key={eventItem._id} value={eventItem._id}>
                  {getEventDisplayTitle(eventItem.name)} · {formatShortDate(eventItem.date)}
                  {eventItem._id === latestCreatedEventId ? ' · latest' : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Event ID</span>
            <input
              value={stockForm.eventId}
              onChange={(event) => setStockForm((currentForm) => ({ ...currentForm, eventId: event.target.value }))}
              placeholder="_id del evento en Mongo"
              disabled={!hasCatalogEvents}
              required
            />
          </label>
          <label>
            <span>Sellable inventory</span>
            <input
              type="number"
              min="0"
              value={stockForm.initialInventory}
              onChange={(event) =>
                setStockForm((currentForm) => ({ ...currentForm, initialInventory: Number(event.target.value) }))
              }
              disabled={!hasCatalogEvents}
              required
            />
          </label>
          <p className="hint-text">
            This hits <code>/orders/stock</code>, the real transactional inventory behind checkout.
          </p>
          {stagedEvent ? (
            <p className="hint-text">
              Using current event: {getEventDisplayTitle(stagedEvent.name)}
              {stagedEvent._id === latestCreatedEventId ? ' · latest created' : ''}
            </p>
          ) : (
            <p className="hint-text">Choose any existing event from the list above, or create a new one in Step 1.</p>
          )}
          <button type="submit" className="button button--secondary" disabled={isOperationsPending || !stagedEvent}>
            Load stock
          </button>
        </form>
      </div>

      {operationsMessage ? <p className="status-line">{operationsMessage}</p> : null}
    </section>
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">E</div>
          <div>
            <p className="brand-name">E-ticket</p>
            <p className="brand-subtitle">live now</p>
          </div>
        </div>

        <nav className="topbar-nav" aria-label="Primary">
          {isBackstageRoute ? (
            <a className="topbar-nav__return" href="/" onClick={(event) => navigateTo(event, '/')}>
              Storefront
            </a>
          ) : (
            <>
              <a href="#discover-grid">Discover</a>
              <a href="#checkout-panel">Tickets</a>
              <a href="#orders-panel">Orders</a>
            </>
          )}
        </nav>

        <div className="topbar-session">
          <div className="topbar-badge">{sessionBadgeLabel}</div>
          {session ? (
            <button type="button" className="button button--ghost topbar-signout" onClick={handleLogout}>
              Sign out
            </button>
          ) : null}
        </div>
      </header>

      {isBackstageRoute ? (
        <>
          <header className="masthead panel panel--hero">
            <div className="eyebrow">Operational console</div>
            <div className="backstage-hero-grid">
              <div className="hero-copy-wrap backstage-copy-wrap">
                <div className="hero-tags">
                  <span>{events.length} events loaded</span>
                  <span>Catalog publishing</span>
                  <span>Stock setup</span>
                </div>

                <h1>Backstage for demo operations.</h1>
                <p className="hero-copy">
                  This page keeps event creation and stock initialization separate from the buying flow,
                  while still hitting the same gateway and services underneath.
                </p>
                <div className="hero-actions">
                  <a className="button button--primary" href="/" onClick={(event) => navigateTo(event, '/')}>
                    Back to storefront
                  </a>
                  <a className="button button--ghost" href={`${apiBaseUrl}/api/docs`} target="_blank" rel="noreferrer">
                    API docs
                  </a>
                </div>
              </div>

              <div className="session-card backstage-note">
                <p>
                  {hasBackstageAccess
                    ? `Active demo admin session: ${session?.email ?? backstageAdminEmail}`
                    : session
                      ? `Current session: ${session.email}. Switch to the demo admin account to unlock Backstage actions.`
                      : 'Sign in with the demo admin account to publish events and initialize sellable stock.'}
                </p>
                <p className="session-token">Catalog loaded: {events.length} events</p>
                <p className="session-token">Recent orders visible in app state: {orders.length}</p>
                {!hasBackstageAccess ? <p className="session-token">Demo password: {backstageAdminPasswordHint}</p> : null}
              </div>
            </div>
          </header>

          <main className="workspace-grid workspace-grid--backstage">
            {hasBackstageAccess ? (
              operationsPanel
            ) : (
              <section className="panel panel--operations backstage-access-panel">
                <div className="panel-heading">
                  <div>
                    <span className="section-kicker">Backstage Access</span>
                    <h2>Sign in with the demo admin account</h2>
                    <p className="section-copy">
                      This route is intentionally separate from the buyer flow. Use the fixed demo credentials to unlock
                      catalog publishing and sellable stock management.
                    </p>
                  </div>
                </div>

                <div className="operations-grid backstage-access-grid">
                  <form className="stack-form backstage-access-form" onSubmit={handleBackstageLogin}>
                    <h3>Demo admin login</h3>
                    <label>
                      <span>Email</span>
                      <input value={backstageAdminEmail} disabled readOnly />
                    </label>
                    <label>
                      <span>Password</span>
                      <input
                        type="password"
                        value={backstagePassword}
                        onChange={(event) => setBackstagePassword(event.target.value)}
                        placeholder="admin123"
                        required
                      />
                    </label>
                    <button type="submit" className="button button--primary" disabled={isBackstageAuthPending}>
                      {isBackstageAuthPending ? 'Unlocking...' : 'Unlock Backstage'}
                    </button>
                  </form>

                  <div className="session-card backstage-access-card">
                    <p>
                      Demo account: <strong>{backstageAdminEmail}</strong>
                    </p>
                    <p className="session-token">Password: {backstageAdminPasswordHint}</p>
                    <p className="session-token">
                      The frontend only unlocks this view with that account, and the gateway also validates the admin
                      token before allowing operational POST routes.
                    </p>
                    {session && !hasBackstageAccess ? (
                      <button type="button" className="button button--ghost" onClick={handleLogout}>
                        Sign out current user
                      </button>
                    ) : null}
                  </div>
                </div>

                {backstageMessage ? <p className="status-line">{backstageMessage}</p> : null}
              </section>
            )}
          </main>
        </>
      ) : (
        <>
          <header className="masthead panel panel--hero">
            <div className="eyebrow">Inspired by DICE, Ticketmaster and Eventbrite patterns</div>
            <div className="hero-grid">
              <div className="hero-copy-wrap">
                <div className="hero-tags">
                  <span>{eventCountLabel}</span>
                  <span>Fast checkout</span>
                  <span>JWT protected</span>
                </div>

                <h1>Find the next show. Lock the ticket before it goes.</h1>
                <p className="hero-copy">
                  Discovery-first layout, large event focus, visible dates, strong CTAs and a darker
                  interface closer to what live-event products actually ship.
                </p>
                <div className="hero-actions">
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() => {
                      if (selectedEvent) {
                        document.getElementById('checkout-panel')?.scrollIntoView({ behavior: 'smooth' })
                      }
                    }}
                  >
                    Get tickets
                  </button>
                  <a className="button button--ghost" href={`${apiBaseUrl}/api/docs`} target="_blank" rel="noreferrer">
                    API docs
                  </a>
                  <a className="button button--ghost" href="/backstage" onClick={(event) => navigateTo(event, '/backstage')}>
                    Backstage
                  </a>
                </div>
              </div>

              <div
                className={`hero-poster ${selectedEvent ? getPosterTone(selectedEvent) : 'poster--cyan'}`}
                style={selectedEvent ? getPosterSurfaceStyle(selectedEvent, false, false) : undefined}
              >
                <div className="hero-poster__glow"></div>
                <div className="hero-poster__meta">
                  <span>{selectedGenre}</span>
                  <span>{selectedVenue}</span>
                </div>
                <div>
                  <p className="hero-poster__eyebrow">Featured event</p>
                  <h2>{selectedEventDisplayTitle}</h2>
                </div>
                <div className="hero-poster__details">
                  <p>{selectedEvent ? formatFullDate(selectedEvent.date) : 'Date pending'}</p>
                  <p>{selectedEvent?.description ?? 'Choose an event from the grid to preview it here.'}</p>
                </div>
                <div className="hero-poster__stats">
                  <div>
                    <span>Catalog</span>
                    <strong>{events.length}</strong>
                  </div>
                  <div>
                    <span>Orders</span>
                    <strong>{orders.length}</strong>
                  </div>
                  <div>
                    <span>Session</span>
                    <strong>{session ? 'ON' : 'OFF'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="workspace-grid">
        <section id="discover-grid" className="panel panel--catalog">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Discover</span>
              <h2>Trending events</h2>
              <p className="section-copy">Large cards, visible dates and fast scanning, like a real ticketing browse page.</p>
            </div>
            <label className="search-field">
              <span>Search</span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="artist, venue, city..."
              />
            </label>
          </div>

          <div className="filter-row" aria-label="Quick filters">
            <span className="filter-chip filter-chip--active">For you</span>
            <span className="filter-chip">Concerts</span>
            <span className="filter-chip">Clubbing</span>
            <span className="filter-chip">Comedy</span>
            <span className="filter-chip">Talks</span>
          </div>

          {catalogMessage ? <p className="status-line">{catalogMessage}</p> : null}
          {isCatalogLoading ? <p className="status-line">Loading catalog...</p> : null}

          <div className="event-grid">
            {filteredEvents.map((event) => {
              const isSelected = selectedEvent?._id === event._id
              const genre = inferGenre(event)
              const venue = inferVenue(event)

              return (
                <article
                  key={event._id}
                  className={`event-card${isSelected ? ' event-card--selected' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedEventId(event._id)}
                  onKeyDown={(keyboardEvent) => handleEventCardKeyDown(keyboardEvent, event._id)}
                >
                  <div
                    className={`event-card__poster ${getPosterTone(event)}`}
                    style={getPosterSurfaceStyle(event, true, true)}
                  >
                    <div className="event-card__chips">
                      <span>{genre}</span>
                      <span>{venue}</span>
                    </div>
                    <div className="event-card__poster-date">{formatShortDate(event.date)}</div>
                  </div>
                  <h3>{getEventDisplayTitle(event.name)}</h3>
                  <p>{event.description}</p>
                  <div className="event-card__footer">
                    <div className="event-card__meta">
                      <span>{event.inventory} available in catalog</span>
                      <span>#{event._id.slice(-6)}</span>
                    </div>
                    <button
                      type="button"
                      className="button button--ghost event-card__action"
                      onClick={() => focusCheckoutForEvent(event._id)}
                    >
                      Add to cart
                    </button>
                  </div>
                </article>
              )
            })}

            {!isCatalogLoading && !filteredEvents.length ? (
              <div className="empty-state">
                <h3>No results</h3>
                <p>Try another search or publish a new event from Backstage.</p>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="panel panel--account">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Account</span>
              <h2>{session ? `Hey, ${userFirstName}` : 'Sign in to unlock tickets'}</h2>
              <p className="section-copy">Keep auth close to checkout so the protected order flow feels immediate.</p>
            </div>
          </div>

          {session ? (
            <div className="session-card">
              <p>
                Session active with <strong>{session.email}</strong>
              </p>
              <p className="session-token">JWT userId: {session.userId || 'not available'}</p>
              <button type="button" className="button button--ghost" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          ) : (
            <form className="stack-form" onSubmit={handleAuthSubmit}>
              <div className="pill-switch" role="tablist" aria-label="Authentication mode">
                <button
                  type="button"
                  className={authMode === 'login' ? 'is-active' : ''}
                  onClick={() => setAuthMode('login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={authMode === 'register' ? 'is-active' : ''}
                  onClick={() => setAuthMode('register')}
                >
                  Register
                </button>
              </div>

              {authMode === 'register' ? (
                <label>
                  <span>Username</span>
                  <input
                    value={authForm.username}
                    onChange={(event) =>
                      setAuthForm((currentForm) => ({ ...currentForm, username: event.target.value }))
                    }
                    placeholder="ticketlover"
                    required
                  />
                </label>
              ) : null}

              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(event) =>
                    setAuthForm((currentForm) => ({ ...currentForm, email: event.target.value }))
                  }
                  placeholder="persona@email.com"
                  required
                />
              </label>

              <label>
                <span>Password</span>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(event) =>
                    setAuthForm((currentForm) => ({ ...currentForm, password: event.target.value }))
                  }
                  placeholder="minimum 8 characters"
                  required
                />
              </label>

              <button type="submit" className="button button--primary" disabled={isAuthPending}>
                {isAuthPending ? 'Working...' : authMode === 'register' ? 'Create account' : 'Sign in'}
              </button>
            </form>
          )}

          {authMessage ? <p className="status-line">{authMessage}</p> : null}
        </aside>

        <section id="checkout-panel" className="panel panel--checkout">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Tickets</span>
              <h2>{selectedEventDisplayTitle}</h2>
              <p className="section-copy">A compact checkout surface with just enough information to commit fast.</p>
            </div>
          </div>

          {selectedEvent ? (
            <>
              <div className="spotlight-card">
                <div className="spotlight-card__topline">
                  <span className="filter-chip filter-chip--active">{selectedGenre}</span>
                  <span className="filter-chip">{selectedVenue}</span>
                </div>
                <p className="spotlight-date">{formatFullDate(selectedEvent.date)}</p>
                <p className="spotlight-copy">{selectedEvent.description}</p>
                <div className="spotlight-meta">
                  <span>{selectedEventInventoryLabel}</span>
                  <span>Secure order route</span>
                </div>
              </div>

              <form className="checkout-form" onSubmit={handleCheckoutSubmit}>
                <label>
                  <span>Quantity</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={ticketQuantity}
                    onChange={(event) => setTicketQuantity(Number(event.target.value))}
                  />
                </label>

                <button type="submit" className="button button--primary" disabled={isCheckoutPending}>
                  {isCheckoutPending ? 'Processing...' : 'Complete purchase'}
                </button>
              </form>
            </>
          ) : (
            <div className="empty-state">
              <h3>No event selected</h3>
              <p>Pick one from the grid to activate ticket checkout.</p>
            </div>
          )}

          {checkoutMessage ? <p className="status-line">{checkoutMessage}</p> : null}
        </section>

        <section id="orders-panel" className="panel panel--orders">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">History</span>
              <h2>Recent orders</h2>
              <p className="section-copy">Quick proof that checkout reached the protected orders service.</p>
            </div>
          </div>

          {!session ? <p className="status-line">Sign in to load protected orders.</p> : null}
          {isOrdersLoading ? <p className="status-line">Loading orders...</p> : null}

          <div className="orders-list">
            {orders.map((order) => {
              const orderEvent = events.find((event) => event._id === order.eventId)

              return (
                <article key={order.id} className="order-card">
                  <div>
                    <p className="order-card__title">
                      {orderEvent ? getEventDisplayTitle(orderEvent.name) : `Event ${order.eventId}`}
                    </p>
                    <p className="order-card__meta">{formatShortDate(order.createdAt)}</p>
                  </div>
                  <div className="order-card__side">
                    <span>{order.quantity} tickets</span>
                    <strong>{order.status}</strong>
                  </div>
                </article>
              )
            })}

            {session && !isOrdersLoading && !orders.length ? (
              <div className="empty-state">
                <h3>No purchases yet</h3>
                <p>Your next completed checkout will appear here instantly.</p>
              </div>
            ) : null}
          </div>
        </section>

          </main>
        </>
      )}
    </div>
  )
}

export default App
