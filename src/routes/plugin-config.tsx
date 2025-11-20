import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Settings, Package, AlertCircle, CheckCircle2, RefreshCw, ExternalLink } from 'lucide-react'

export function PluginConfigPage() {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* 标题 */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">插件配置</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
              管理和配置已安装的插件
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
            <Button size="sm">
              <Settings className="h-4 w-4 mr-2" />
              全局设置
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已安装插件</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">正在加载...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已启用</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">运行中的插件</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已禁用</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
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

        {/* 插件列表占位 */}
        <Card>
          <CardHeader>
            <CardTitle>已安装的插件</CardTitle>
            <CardDescription>查看和管理已安装插件的配置</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Package className="h-16 w-16 text-muted-foreground/50" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-muted-foreground">
                  插件配置功能开发中
                </p>
                <p className="text-sm text-muted-foreground">
                  即将支持插件的启用/禁用、参数配置等功能
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
          </CardContent>
        </Card>

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
  )
}
