import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2, Save } from 'lucide-react'
import { getModelConfig, updateModelConfig } from '@/lib/config-api'

interface APIProvider {
  name: string
  base_url: string
  api_key: string
  client_type: string
  max_retry: number
  timeout: number
  retry_interval: number
}

export function ModelProviderConfigPage() {
  const [providers, setProviders] = useState<APIProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<APIProvider | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  // 加载配置
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const config = await getModelConfig()
      setProviders((config.api_providers as APIProvider[]) || [])
    } catch (error) {
      console.error('加载配置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 保存配置
  const saveConfig = async () => {
    try {
      setSaving(true)
      const config = await getModelConfig()
      config.api_providers = providers
      await updateModelConfig(config)
      alert('配置已保存')
    } catch (error) {
      console.error('保存配置失败:', error)
      alert('保存失败: ' + (error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // 打开编辑对话框
  const openEditDialog = (provider: APIProvider | null, index: number | null) => {
    setEditingProvider(
      provider || {
        name: '',
        base_url: '',
        api_key: '',
        client_type: 'openai',
        max_retry: 2,
        timeout: 30,
        retry_interval: 10,
      }
    )
    setEditingIndex(index)
    setEditDialogOpen(true)
  }

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editingProvider) return

    if (editingIndex !== null) {
      // 更新现有提供商
      const newProviders = [...providers]
      newProviders[editingIndex] = editingProvider
      setProviders(newProviders)
    } else {
      // 添加新提供商
      setProviders([...providers, editingProvider])
    }

    setEditDialogOpen(false)
    setEditingProvider(null)
    setEditingIndex(null)
  }

  // 删除提供商
  const handleDelete = (index: number) => {
    if (confirm('确定要删除这个提供商吗？')) {
      const newProviders = providers.filter((_, i) => i !== index)
      setProviders(newProviders)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">模型提供商配置</h1>
          <p className="text-muted-foreground mt-2">管理 API 提供商配置</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openEditDialog(null, null)} size="sm">
            <Plus className="mr-2 h-4 w-4" strokeWidth={2} fill="none" />
            添加提供商
          </Button>
          <Button onClick={saveConfig} disabled={saving} size="sm" variant="default">
            <Save className="mr-2 h-4 w-4" strokeWidth={2} fill="none" />
            {saving ? '保存中...' : '保存配置'}
          </Button>
        </div>
      </div>

      {/* 提供商列表表格 */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>基础URL</TableHead>
              <TableHead>客户端类型</TableHead>
              <TableHead className="text-right">最大重试</TableHead>
              <TableHead className="text-right">超时(秒)</TableHead>
              <TableHead className="text-right">重试间隔(秒)</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  暂无提供商配置，点击"添加提供商"开始配置
                </TableCell>
              </TableRow>
            ) : (
              providers.map((provider, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{provider.name}</TableCell>
                  <TableCell className="max-w-xs truncate" title={provider.base_url}>
                    {provider.base_url}
                  </TableCell>
                  <TableCell>{provider.client_type}</TableCell>
                  <TableCell className="text-right">{provider.max_retry}</TableCell>
                  <TableCell className="text-right">{provider.timeout}</TableCell>
                  <TableCell className="text-right">{provider.retry_interval}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(provider, index)}
                      >
                        <Pencil className="h-4 w-4" strokeWidth={2} fill="none" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(index)}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} fill="none" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 编辑对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? '编辑提供商' : '添加提供商'}
            </DialogTitle>
            <DialogDescription>
              配置 API 提供商的连接信息和参数
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">名称 *</Label>
              <Input
                id="name"
                value={editingProvider?.name || ''}
                onChange={(e) =>
                  setEditingProvider((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                placeholder="例如: DeepSeek, SiliconFlow"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="base_url">基础 URL *</Label>
              <Input
                id="base_url"
                value={editingProvider?.base_url || ''}
                onChange={(e) =>
                  setEditingProvider((prev) =>
                    prev ? { ...prev, base_url: e.target.value } : null
                  )
                }
                placeholder="https://api.example.com/v1"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="api_key">API Key *</Label>
              <Input
                id="api_key"
                type="password"
                value={editingProvider?.api_key || ''}
                onChange={(e) =>
                  setEditingProvider((prev) =>
                    prev ? { ...prev, api_key: e.target.value } : null
                  )
                }
                placeholder="sk-..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="client_type">客户端类型</Label>
              <Select
                value={editingProvider?.client_type || 'openai'}
                onValueChange={(value) =>
                  setEditingProvider((prev) =>
                    prev ? { ...prev, client_type: value } : null
                  )
                }
              >
                <SelectTrigger id="client_type">
                  <SelectValue placeholder="选择客户端类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="max_retry">最大重试</Label>
                <Input
                  id="max_retry"
                  type="number"
                  min="0"
                  value={editingProvider?.max_retry || 2}
                  onChange={(e) =>
                    setEditingProvider((prev) =>
                      prev ? { ...prev, max_retry: parseInt(e.target.value) } : null
                    )
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="timeout">超时(秒)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min="1"
                  value={editingProvider?.timeout || 30}
                  onChange={(e) =>
                    setEditingProvider((prev) =>
                      prev ? { ...prev, timeout: parseInt(e.target.value) } : null
                    )
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="retry_interval">重试间隔(秒)</Label>
                <Input
                  id="retry_interval"
                  type="number"
                  min="1"
                  value={editingProvider?.retry_interval || 10}
                  onChange={(e) =>
                    setEditingProvider((prev) =>
                      prev
                        ? { ...prev, retry_interval: parseInt(e.target.value) }
                        : null
                    )
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
