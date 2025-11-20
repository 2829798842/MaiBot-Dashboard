import { useState, useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Package, AlertCircle, CheckCircle2, RefreshCw, ExternalLink, ArrowLeft, LayoutDashboard, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { getInstalledPlugins, getPluginConfig, updatePluginConfig } from '@/lib/plugin-api'
import type { InstalledPlugin } from '@/lib/plugin-api'
import type { PluginConfigItem } from '@/types/plugin-config'
import { PluginConfigForm, type PluginConfigFormRef } from '@/components/plugin-config-form'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function PluginConfigPage() {
  const [plugins, setPlugins] = useState<InstalledPlugin[]>([])
  const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null)
  const [configSchema, setConfigSchema] = useState<PluginConfigItem[]>([])
  const [isLoadingPlugins, setIsLoadingPlugins] = useState(false)
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { toast } = useToast()

  // 侧边栏宽度调整
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // 未保存更改检测
  const [isFormDirty, setIsFormDirty] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingPluginId, setPendingPluginId] = useState<string | null | undefined>(undefined) // undefined means no pending navigation
  const [dontRemindUnsaved, setDontRemindUnsaved] = useState(false)
  const [tempDontRemind, setTempDontRemind] = useState(false)
  const formRef = useRef<PluginConfigFormRef>(null)

  // 移动端检测
  const [isMobile, setIsMobile] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 暂存 ，从 localStorage 初始化草稿
  const [drafts, setDrafts] = useState<Record<string, Record<string, any>>>(() => {
    try {
      const saved = localStorage.getItem('plugin-config-drafts')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // 保存草稿
  const saveDraft = (pluginId: string, values: Record<string, any>) => {
    setDrafts(prev => {
      const newDrafts = { ...prev, [pluginId]: values }
      localStorage.setItem('plugin-config-drafts', JSON.stringify(newDrafts))
      return newDrafts
    })
  }

  // 清除草稿
  const clearDraft = (pluginId: string) => {
    setDrafts(prev => {
      const newDrafts = { ...prev }
      delete newDrafts[pluginId]
      localStorage.setItem('plugin-config-drafts', JSON.stringify(newDrafts))
      return newDrafts
    })
  }

  useEffect(() => {
    const saved = localStorage.getItem('plugin-config-dont-remind-unsaved')
    if (saved === 'true') {
      setDontRemindUnsaved(true)
    }
  }, [])

  const loadPlugins = async () => {
    setIsLoadingPlugins(true)
    try {
      const list = await getInstalledPlugins()
      setPlugins(list)
    } catch (error) {
      toast({
        title: "加载插件列表失败",
        description: String(error),
        variant: "destructive"
      })
    } finally {
      setIsLoadingPlugins(false)
    }
  }

  useEffect(() => {
    loadPlugins()
  }, [])

  // 侧边栏自动展开/收起逻辑
  useEffect(() => {
    if (selectedPluginId && !isMobile) {
      setIsSidebarOpen(true)
    }
  }, [selectedPluginId, isMobile])

  useEffect(() => {
    if (!selectedPluginId) {
      setConfigSchema([])
      setIsFormDirty(false)
      return
    }
    const loadConfig = async () => {
      setIsLoadingConfig(true)
      try {
        const schema = await getPluginConfig(selectedPluginId)
        
        // 检查是否有草稿并恢复
        const draft = drafts[selectedPluginId]
        if (draft) {
          let restoredCount = 0
          schema.forEach(item => {
            if (draft[item.key] !== undefined) {
              item.value = draft[item.key]
              restoredCount++
            }
          })
          
          if (restoredCount > 0) {
            toast({
              title: "已恢复未保存的草稿",
              description: "您上次编辑的内容已自动恢复。",
            })
          }
        }
        
        setConfigSchema(schema)
      } catch (error) {
        console.error(error)
        toast({
          title: "加载配置失败",
          description: "无法加载插件配置，请确认插件已启用且支持配置功能。",
          variant: "destructive"
        })
        setConfigSchema([])
      } finally {
        setIsLoadingConfig(false)
        setIsFormDirty(false) // 重置脏状态
      }
    }
    loadConfig()
  }, [selectedPluginId]) // drafts is stable enough or we can omit it to avoid re-triggering on draft save

  const handleSaveConfig = async (values: Record<string, any>) => {
    if (!selectedPluginId) return
    await updatePluginConfig(selectedPluginId, values)
    // 保存成功后清除草稿
    clearDraft(selectedPluginId)
    // toast is handled in form component
  }

  // 导航拦截逻辑
  const handleNavigation = (targetId: string | null) => {
    if (targetId === selectedPluginId && (!isMobile || mobileView === 'detail')) return

    if (isFormDirty && !dontRemindUnsaved) {
      setPendingPluginId(targetId)
      setShowUnsavedDialog(true)
    } else {
      setSelectedPluginId(targetId)
      if (isMobile) {
        setMobileView('detail')
      }
    }
  }

  const confirmNavigation = async (save: boolean) => {
    if (save && formRef.current) {
      try {
        await formRef.current.submit()
      } catch (e) {
        // 保存失败，取消导航
        setShowUnsavedDialog(false)
        return
      }
    }
    
    if (tempDontRemind) {
      setDontRemindUnsaved(true)
      localStorage.setItem('plugin-config-dont-remind-unsaved', 'true')
    }

    setShowUnsavedDialog(false)
    if (pendingPluginId !== undefined) {
      setSelectedPluginId(pendingPluginId)
      if (isMobile) {
        setMobileView('detail')
      }
      setPendingPluginId(undefined)
    }
  }

  // 侧边栏拖拽逻辑
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = e.clientX
      
      // 如果拖动小于 100px，自动折叠
      if (newWidth < 100) {
        setIsSidebarOpen(false)
        return
      }
      
      if (!isSidebarOpen && newWidth > 100) {
        setIsSidebarOpen(true)
      }

      if (newWidth > 200 && newWidth < 600) { // 限制最大宽度为 600px
        setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, isSidebarOpen])

  return (
    <div className="flex h-full flex-col md:flex-row overflow-hidden relative select-none md:select-auto">
      {/* 左侧插件列表 - 可折叠侧边栏 */}
      <div 
        ref={sidebarRef}
        style={{ width: isMobile ? '100%' : (isSidebarOpen ? sidebarWidth : 0) }}
        className={cn(
          "border-r bg-muted/10 flex flex-col h-full transition-all duration-300 ease-in-out overflow-hidden relative group",
          !isMobile && !isSidebarOpen && "w-0 border-none opacity-0",
          isMobile && mobileView === 'detail' && "hidden"
        )}
      >
        <div className="p-4 border-b flex items-center justify-between min-w-[200px]">
          <h2 className="font-semibold">插件管理</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={loadPlugins} disabled={isLoadingPlugins} title="刷新列表">
              <RefreshCw className={cn("h-4 w-4", isLoadingPlugins && "animate-spin")} />
            </Button>
            {!isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} title="收起侧边栏">
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="flex-1 min-w-[200px]">
          <div className="p-2 space-y-1">
            <Button
              variant={selectedPluginId === null ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleNavigation(null)}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span className="truncate">概览</span>
              {selectedPluginId === null && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
            </Button>
            
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground mt-2 mb-1">
              已安装插件 ({plugins.length})
            </div>
            
            {plugins.map(plugin => (
              <Button
                key={plugin.id}
                variant={selectedPluginId === plugin.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleNavigation(plugin.id)}
              >
                <Package className="mr-2 h-4 w-4" />
                <span className="truncate">{plugin.manifest.name || plugin.id}</span>
                {selectedPluginId === plugin.id && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
              </Button>
            ))}
          </div>
        </ScrollArea>
        
        {/* 拖拽手柄 */}
        {!isMobile && (
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-10"
            onMouseDown={startResizing}
          />
        )}
      </div>

      {/* 右侧内容区域 */}
      <div className={cn(
        "flex-1 flex flex-col h-full overflow-hidden bg-background relative",
        isMobile && mobileView === 'list' && "hidden"
      )}>
        {/* 顶部工具栏 (仅当侧边栏关闭时显示) */}
        {!isSidebarOpen && !isMobile && (
          <div className="flex items-center px-4 py-2 border-b bg-muted/20">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsSidebarOpen(true)} 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              title="展开侧边栏"
            >
              <PanelLeftOpen className="h-4 w-4" />
              <span>展开插件列表</span>
            </Button>
          </div>
        )}

        {selectedPluginId ? (
          <ScrollArea className="h-full">
            <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 border-b pb-4 pl-0">
                <Button 
                  variant="ghost" 
                  size={isMobile ? "sm" : "icon"}
                  onClick={() => isMobile ? setMobileView('list') : handleNavigation(null)} 
                  title="返回概览"
                  className={cn("gap-1", isMobile && "-ml-2")}
                >
                  <ArrowLeft className="h-5 w-5" />
                  {isMobile && <span className="text-sm font-normal">返回</span>}
                </Button>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Package className="h-6 w-6 text-primary" />
                    {plugins.find(p => p.id === selectedPluginId)?.manifest.name || selectedPluginId}
                    {isFormDirty && <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">未保存</span>}
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {plugins.find(p => p.id === selectedPluginId)?.manifest.description}
                  </p>
                </div>
              </div>

              {isLoadingConfig ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">正在加载配置...</p>
                </div>
              ) : (
                <PluginConfigForm 
                  ref={formRef}
                  configSchema={configSchema} 
                  onSubmit={handleSaveConfig} 
                  onChange={setIsFormDirty}
                  onValuesChange={(values) => {
                    if (selectedPluginId) {
                      saveDraft(selectedPluginId, values)
                    }
                  }}
                />
              )}
            </div>
          </ScrollArea>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              {/* Mobile Back Button for Overview */}
              {isMobile && (
                <div className="flex items-center gap-2 mb-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setMobileView('list')} 
                      className="-ml-2 gap-1"
                    >
                      <ArrowLeft className="h-5 w-5" />
                      <span className="text-sm font-normal">返回列表</span>
                    </Button>
                </div>
              )}
              {/* 标题 */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">插件配置</h1>
                  <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
                    管理和配置已安装的插件
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={loadPlugins} disabled={isLoadingPlugins}>
                    <RefreshCw className={cn("h-4 w-4 mr-2", isLoadingPlugins && "animate-spin")} />
                    刷新
                  </Button>
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    全局设置
                  </Button>
                </div>
              </div>
              
              {/* ...existing code... */}
              {/* 统计卡片 */}
              <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">已安装插件</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{plugins.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">加载完成</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">已启用</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{plugins.filter(p => p.enabled).length}</div>
                    <p className="text-xs text-muted-foreground mt-1">运行中的插件</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">已禁用</CardTitle>
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{plugins.filter(p => !p.enabled).length}</div>
                    <p className="text-xs text-muted-foreground mt-1">未激活的插件</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">可更新</CardTitle>
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-muted-foreground mt-1">有新版本可用</p>
                  </CardContent>
                </Card>
              </div>

              {/* 插件列表区域 */}
              <Card className="flex flex-col min-h-[400px]">
                <CardHeader>
                  <CardTitle>已安装的插件</CardTitle>
                  <CardDescription>查看和管理已安装插件的配置</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  {plugins.length === 0 && !isLoadingPlugins ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 space-y-4">
                      <Package className="h-16 w-16 text-muted-foreground/50" />
                      <div className="text-center space-y-2">
                        <p className="text-lg font-medium text-muted-foreground">
                          暂无已安装插件
                        </p>
                        <p className="text-sm text-muted-foreground">
                          请前往插件市场安装插件
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" asChild>
                          <a href="/plugins">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            前往插件市场
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-6">
                        {plugins.map(plugin => (
                          <Card 
                            key={plugin.id} 
                            className="cursor-pointer hover:bg-muted/50 transition-all hover:shadow-md border-muted-foreground/20"
                            onClick={() => handleNavigation(plugin.id)}
                          >
                            <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Package className="h-6 w-6 text-primary" />
                              </div>
                              <div className="space-y-1 flex-1 min-w-0">
                                <CardTitle className="text-base truncate" title={plugin.manifest.name}>
                                  {plugin.manifest.name || plugin.id}
                                </CardTitle>
                                <div className="text-xs text-muted-foreground truncate">
                                  v{plugin.manifest.version}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground line-clamp-2 h-10">
                                {plugin.manifest.description || "暂无描述"}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* 功能预览卡片 */}
              <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">即将推出的功能</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">插件启用/禁用</p>
                          <p className="text-xs text-muted-foreground">快速切换插件运行状态</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">配置参数编辑</p>
                          <p className="text-xs text-muted-foreground">可视化编辑插件配置文件</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">依赖管理</p>
                          <p className="text-xs text-muted-foreground">查看和安装插件依赖包</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">插件日志</p>
                          <p className="text-xs text-muted-foreground">查看插件运行日志和错误信息</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">开发者工具</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-blue-500/10 p-1 mt-0.5">
                          <Settings className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">热重载</p>
                          <p className="text-xs text-muted-foreground">无需重启即可重新加载插件</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-blue-500/10 p-1 mt-0.5">
                          <Settings className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">配置验证</p>
                          <p className="text-xs text-muted-foreground">检查配置文件格式和完整性</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-blue-500/10 p-1 mt-0.5">
                          <Settings className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">性能监控</p>
                          <p className="text-xs text-muted-foreground">监控插件的资源占用情况</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-blue-500/10 p-1 mt-0.5">
                          <Settings className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">调试模式</p>
                          <p className="text-xs text-muted-foreground">详细的调试信息和错误追踪</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 提示信息 */}
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        开发进行中
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        插件配置功能正在积极开发中。目前您可以通过<strong>插件市场</strong>安装和卸载插件，完整的配置管理功能即将推出。
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        )}
      </div>

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>未保存的更改</AlertDialogTitle>
            <AlertDialogDescription>
              您有未保存的配置更改。是否要保存这些更改？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Checkbox 
              id="dont-remind" 
              checked={tempDontRemind}
              onCheckedChange={(checked) => setTempDontRemind(checked as boolean)}
            />
            <Label htmlFor="dont-remind" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              不再提醒（总是自动保存）
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowUnsavedDialog(false)
              setPendingPluginId(undefined)
            }}>取消</AlertDialogCancel>
            <Button variant="destructive" onClick={() => confirmNavigation(false)}>不保存</Button>
            <AlertDialogAction onClick={() => confirmNavigation(true)}>保存</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
