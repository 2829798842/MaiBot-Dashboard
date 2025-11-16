import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

export function useAuthGuard() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('access-token')
    
    if (!token) {
      navigate({ to: '/auth' })
    }
  }, [navigate])
}

export function checkAuth(): boolean {
  return !!localStorage.getItem('access-token')
}
