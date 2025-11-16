import { Menu, Moon, Sun, ChevronLeft, Home, Settings, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Link, useMatchRoute, useNavigate } from '@tanstack/react-router'
import { useTheme, toggleThemeWithTransition } from './use-theme'
import { useAuthGuard } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  useAuthGuard() // 检查认证状态
  
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const matchRoute = useMatchRoute()
  const navigate = useNavigate()

  // 菜单项配置
  const menuItems = [
    { icon: Home, label: '首页', path: '/' },
    { icon: Settings, label: '系统设置', path: '/settings' },
  ]

  // 获取实际应用的主题（处理 system 情况）
  const getActualTheme = () => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  }

  const actualTheme = getActualTheme()

  // 登出处理
  const handleLogout = () => {
    localStorage.removeItem('access-token')
    navigate({ to: '/auth' })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-all duration-300 lg:relative lg:z-0',
          sidebarOpen ? 'w-64' : 'w-16',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo 区域 */}
        <div className="flex h-16 items-center border-b px-4">
          <div
            className={cn(
              'relative flex items-center justify-center flex-1 transition-all',
              !sidebarOpen && 'flex-none w-8'
            )}
          >
            {sidebarOpen ? (
              <div className="relative inline-block">
                <span className="font-bold text-2xl text-primary">MaiBot</span>
                <span className="absolute -top-1 -right-10 text-[10px] font-medium text-muted-foreground">
                  v1.0.0
                </span>
              </div>
            ) : (
              <span className="font-bold text-primary text-2xl">M</span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden rounded-lg p-2 hover:bg-accent lg:block flex-shrink-0 ml-2"
          >
            <ChevronLeft
              className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')}
            />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = matchRoute({ to: item.path })
              const Icon = item.icon

              return (
                <li key={item.path} className="relative">
                  <Link
                    to={item.path}
                    className={cn(
                      'relative flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      isActive
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                      !sidebarOpen && 'justify-center px-0'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {/* 左侧高亮条 */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                    )}
                    <Icon
                      className={cn(
                        'h-5 w-5 flex-shrink-0',
                        !sidebarOpen && 'mx-auto',
                        isActive && 'text-primary'
                      )}
                    />
                    {sidebarOpen && (
                      <span className={cn('text-sm font-medium', isActive && 'font-semibold')}>
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-4">
          <div className="flex items-center gap-4">
            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 hover:bg-accent lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* 主题切换按钮 */}
            <button
              onClick={(e) => {
                const newTheme = actualTheme === 'dark' ? 'light' : 'dark'
                toggleThemeWithTransition(newTheme, setTheme, e)
              }}
              className="rounded-lg p-2 hover:bg-accent"
              title={actualTheme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            >
              {actualTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* 分隔线 */}
            <div className="h-6 w-px bg-border" />

            {/* 登出按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
              title="登出系统"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">登出</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
      </div>
    </div>
  )
}
