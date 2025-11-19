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

/**
 * 检查是否需要首次配置
 */
export async function checkFirstSetup(): Promise<boolean> {
  try {
    const token = localStorage.getItem('access-token')
    if (!token) {
      return false
    }

    const response = await fetch('/api/webui/setup/status', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (response.ok) {
      return data.is_first_setup
    }

    return false
  } catch (error) {
    console.error('检查首次配置状态失败:', error)
    return false
  }
}
