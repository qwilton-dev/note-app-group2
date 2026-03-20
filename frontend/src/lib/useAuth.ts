import { useEffect, useState } from 'react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000'
const LANDING_URL = import.meta.env.VITE_LANDING_URL ?? 'http://localhost:5173'

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar: string | null
  theme: string
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BACKEND_URL}/users/me`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized')
        return res.json()
      })
      .then(setUser)
      .catch(() => {
        window.location.href = LANDING_URL
      })
      .finally(() => setLoading(false))
  }, [])

  return { user, loading }
}
