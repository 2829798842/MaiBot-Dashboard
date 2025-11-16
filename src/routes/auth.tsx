import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Key, Lock, AlertCircle, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WavesBackground } from '@/components/waves-background'
import { useAnimation } from '@/hooks/use-animation'
import { useTheme } from '@/components/use-theme'
import { checkAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

export function AuthPage() {
  const [token, setToken] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { enableAnimations } = useAnimation()
  const { theme, setTheme } = useTheme()

  // 如果已经认证，直接跳转到首页
  useEffect(() => {
    if (checkAuth()) {
      navigate({ to: '/' })
    }
  }, [navigate])

  // 获取实际应用的主题（处理 system 情况）
  const getActualTheme = () => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  }

  const actualTheme = getActualTheme()

  // 主题切换（无动画）
  const toggleTheme = () => {
    const newTheme = actualTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token.trim()) {
      setError('请输入 Access Token')
      return
    }

    setIsValidating(true)

    try {
      // 向后端发送请求验证 token
      const response = await fetch('/api/webui/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token.trim() }),
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        // Token 验证成功，保存到 localStorage
        localStorage.setItem('access-token', token.trim())
        
        // 跳转到首页
        navigate({ to: '/' })
      } else {
        setError(data.message || 'Token 验证失败，请检查后重试')
      }
    } catch (err) {
      console.error('Token 验证错误:', err)
      setError('连接服务器失败，请检查网络连接')
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* 波浪背景 - 仅在启用动画时显示 */}
      {enableAnimations && <WavesBackground />}

      {/* 认证卡片 - 磨砂玻璃效果 */}
      <Card className="relative z-10 w-full max-w-md shadow-2xl backdrop-blur-xl bg-card/80 border-border/50">
        {/* 主题切换按钮 */}
        <button
          onClick={toggleTheme}
          className="absolute right-4 top-4 rounded-lg p-2 hover:bg-accent transition-colors z-10 text-foreground"
          title={actualTheme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
        >
          {actualTheme === 'dark' ? (
            <Sun className="h-5 w-5" strokeWidth={2.5} fill="none" />
          ) : (
            <Moon className="h-5 w-5" strokeWidth={2.5} fill="none" />
          )}
        </button>

        <CardHeader className="space-y-4 text-center">
          {/* Logo/Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">欢迎使用 MaiBot</CardTitle>
            <CardDescription className="text-base">
              请输入您的 Access Token 以继续访问系统
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Token 输入框 */}
            <div className="space-y-2">
              <Label htmlFor="token" className="text-sm font-medium">
                Access Token
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="token"
                  type="password"
                  placeholder="请输入您的 Access Token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className={cn('pl-10', error && 'border-red-500 focus-visible:ring-red-500')}
                  disabled={isValidating}
                  autoFocus
                />
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 提交按钮 */}
            <Button type="submit" className="w-full" disabled={isValidating}>
              {isValidating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  验证中...
                </>
              ) : (
                '验证并进入'
              )}
            </Button>

            {/* 帮助文本 */}
            <p className="text-center text-xs text-muted-foreground">
              如果您还没有 Access Token，请联系管理员获取
            </p>
          </form>
        </CardContent>
      </Card>

      {/* 页脚信息 */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground">
        <p>MaiBot Dashboard v1.0.0</p>
      </div>
    </div>
  )
}
