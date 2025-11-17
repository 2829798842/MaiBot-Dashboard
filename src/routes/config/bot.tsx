import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Save, Plus, Trash2, Eye, Clock } from 'lucide-react'
import { getBotConfig, updateBotConfig, updateBotConfigSection } from '@/lib/config-api'
import { useToast } from '@/hooks/use-toast'

interface BotConfig {
  platform: string
  qq_account: string | number
  nickname: string
  platforms: string[]
  alias_names: string[]
}

interface PersonalityConfig {
  personality: string
  reply_style: string
  interest: string
  plan_style: string
  visual_style: string
  private_plan_style: string
  states: string[]
  state_probability: number
}

interface ChatConfig {
  talk_value: number
  mentioned_bot_reply: number
  max_context_size: number
  planner_smooth: number
  enable_talk_value_rules: boolean
  talk_value_rules: Array<{
    target: string
    time: string
    value: number
  }>
  include_planner_reasoning: boolean
}

interface ExpressionConfig {
  learning_list: Array<[string, string, string, string]>
  expression_groups: Array<string[]>
}

interface EmojiConfig {
  emoji_chance: number
  max_reg_num: number
  do_replace: boolean
  check_interval: number
  steal_emoji: boolean
  content_filtration: boolean
  filtration_prompt: string
}

interface MemoryConfig {
  max_agent_iterations: number
}

interface ToolConfig {
  enable_tool: boolean
}

interface MoodConfig {
  enable_mood: boolean
  mood_update_threshold: number
  emotion_style: string
}

interface VoiceConfig {
  enable_asr: boolean
}

interface LPMMKnowledgeConfig {
  enable: boolean
  lpmm_mode: string
  rag_synonym_search_top_k: number
  rag_synonym_threshold: number
  info_extraction_workers: number
  qa_relation_search_top_k: number
  qa_relation_threshold: number
  qa_paragraph_search_top_k: number
  qa_paragraph_node_weight: number
  qa_ent_filter_top_k: number
  qa_ppr_damping: number
  qa_res_top_k: number
  embedding_dimension: number
}

export function BotConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const { toast } = useToast()

  // 配置状态
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null)
  const [personalityConfig, setPersonalityConfig] = useState<PersonalityConfig | null>(null)
  const [chatConfig, setChatConfig] = useState<ChatConfig | null>(null)
  const [expressionConfig, setExpressionConfig] = useState<ExpressionConfig | null>(null)
  const [emojiConfig, setEmojiConfig] = useState<EmojiConfig | null>(null)
  const [memoryConfig, setMemoryConfig] = useState<MemoryConfig | null>(null)
  const [toolConfig, setToolConfig] = useState<ToolConfig | null>(null)
  const [moodConfig, setMoodConfig] = useState<MoodConfig | null>(null)
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig | null>(null)
  const [lpmmConfig, setLpmmConfig] = useState<LPMMKnowledgeConfig | null>(null)

  // 用于防抖的定时器
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialLoadRef = useRef(true)
  const configRef = useRef<Record<string, unknown>>({})

  // 加载配置
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true)
      const config = await getBotConfig()
      configRef.current = config

      setBotConfig(config.bot as BotConfig)
      setPersonalityConfig(config.personality as PersonalityConfig)
      
      // 确保 talk_value_rules 有默认值
      const chatConfigData = config.chat as ChatConfig
      if (!chatConfigData.talk_value_rules) {
        chatConfigData.talk_value_rules = []
      }
      setChatConfig(chatConfigData)
      
      setExpressionConfig(config.expression as ExpressionConfig)
      setEmojiConfig(config.emoji as EmojiConfig)
      setMemoryConfig(config.memory as MemoryConfig)
      setToolConfig(config.tool as ToolConfig)
      setMoodConfig(config.mood as MoodConfig)
      setVoiceConfig(config.voice as VoiceConfig)
      setLpmmConfig(config.lpmm_knowledge as LPMMKnowledgeConfig)

      setHasUnsavedChanges(false)
      initialLoadRef.current = false
    } catch (error) {
      console.error('加载配置失败:', error)
      toast({
        title: '加载失败',
        description: '无法加载配置文件',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  // 自动保存某个配置节
  const autoSaveSection = useCallback(async (sectionName: string, sectionData: unknown) => {
    if (initialLoadRef.current) return

    try {
      setAutoSaving(true)
      await updateBotConfigSection(sectionName, sectionData)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error(`自动保存 ${sectionName} 失败:`, error)
      setHasUnsavedChanges(true)
    } finally {
      setAutoSaving(false)
    }
  }, [])

  // 触发自动保存
  const triggerAutoSave = useCallback(
    (sectionName: string, sectionData: unknown) => {
      if (initialLoadRef.current) return

      setHasUnsavedChanges(true)

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      autoSaveTimerRef.current = setTimeout(() => {
        autoSaveSection(sectionName, sectionData)
      }, 2000)
    },
    [autoSaveSection]
  )

  // 监听配置变化
  useEffect(() => {
    if (botConfig && !initialLoadRef.current) {
      triggerAutoSave('bot', botConfig)
    }
  }, [botConfig, triggerAutoSave])

  useEffect(() => {
    if (personalityConfig && !initialLoadRef.current) {
      triggerAutoSave('personality', personalityConfig)
    }
  }, [personalityConfig, triggerAutoSave])

  useEffect(() => {
    if (chatConfig && !initialLoadRef.current) {
      triggerAutoSave('chat', chatConfig)
    }
  }, [chatConfig, triggerAutoSave])

  useEffect(() => {
    if (expressionConfig && !initialLoadRef.current) {
      triggerAutoSave('expression', expressionConfig)
    }
  }, [expressionConfig, triggerAutoSave])

  useEffect(() => {
    if (emojiConfig && !initialLoadRef.current) {
      triggerAutoSave('emoji', emojiConfig)
    }
  }, [emojiConfig, triggerAutoSave])

  useEffect(() => {
    if (memoryConfig && !initialLoadRef.current) {
      triggerAutoSave('memory', memoryConfig)
    }
  }, [memoryConfig, triggerAutoSave])

  useEffect(() => {
    if (toolConfig && !initialLoadRef.current) {
      triggerAutoSave('tool', toolConfig)
    }
  }, [toolConfig, triggerAutoSave])

  useEffect(() => {
    if (moodConfig && !initialLoadRef.current) {
      triggerAutoSave('mood', moodConfig)
    }
  }, [moodConfig, triggerAutoSave])

  useEffect(() => {
    if (voiceConfig && !initialLoadRef.current) {
      triggerAutoSave('voice', voiceConfig)
    }
  }, [voiceConfig, triggerAutoSave])

  useEffect(() => {
    if (lpmmConfig && !initialLoadRef.current) {
      triggerAutoSave('lpmm_knowledge', lpmmConfig)
    }
  }, [lpmmConfig, triggerAutoSave])

  // 手动保存
  const saveConfig = async () => {
    try {
      setSaving(true)

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      const fullConfig = {
        ...configRef.current,
        bot: botConfig,
        personality: personalityConfig,
        chat: chatConfig,
        expression: expressionConfig,
        emoji: emojiConfig,
        memory: memoryConfig,
        tool: toolConfig,
        mood: moodConfig,
        voice: voiceConfig,
        lpmm_knowledge: lpmmConfig,
      }

      await updateBotConfig(fullConfig)
      setHasUnsavedChanges(false)
      toast({
        title: '保存成功',
        description: '麦麦主程序配置已保存',
      })
    } catch (error) {
      console.error('保存配置失败:', error)
      toast({
        title: '保存失败',
        description: (error as Error).message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
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
          <h1 className="text-3xl font-bold">麦麦主程序配置</h1>
          <p className="text-muted-foreground mt-2">管理麦麦的核心功能和行为设置</p>
        </div>
        <Button
          onClick={saveConfig}
          disabled={saving || autoSaving || !hasUnsavedChanges}
          size="sm"
        >
          <Save className="mr-2 h-4 w-4" strokeWidth={2} fill="none" />
          {saving ? '保存中...' : autoSaving ? '自动保存中...' : hasUnsavedChanges ? '保存配置' : '已保存'}
        </Button>
      </div>

      {/* 标签页 */}
      <Tabs defaultValue="bot" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="bot">基本信息</TabsTrigger>
          <TabsTrigger value="personality">人格</TabsTrigger>
          <TabsTrigger value="chat">聊天</TabsTrigger>
          <TabsTrigger value="expression">表达</TabsTrigger>
          <TabsTrigger value="emoji">表情</TabsTrigger>
          <TabsTrigger value="memory">记忆</TabsTrigger>
          <TabsTrigger value="tool">工具</TabsTrigger>
          <TabsTrigger value="mood">情绪</TabsTrigger>
          <TabsTrigger value="voice">语音</TabsTrigger>
          <TabsTrigger value="lpmm">知识库</TabsTrigger>
        </TabsList>

        {/* 基本信息 */}
        <TabsContent value="bot" className="space-y-4">
          {botConfig && <BotInfoSection config={botConfig} onChange={setBotConfig} />}
        </TabsContent>

        {/* 人格配置 */}
        <TabsContent value="personality" className="space-y-4">
          {personalityConfig && (
            <PersonalitySection config={personalityConfig} onChange={setPersonalityConfig} />
          )}
        </TabsContent>

        {/* 聊天配置 */}
        <TabsContent value="chat" className="space-y-4">
          {chatConfig && <ChatSection config={chatConfig} onChange={setChatConfig} />}
        </TabsContent>

        {/* 表达配置 */}
        <TabsContent value="expression" className="space-y-4">
          {expressionConfig && (
            <ExpressionSection config={expressionConfig} onChange={setExpressionConfig} />
          )}
        </TabsContent>

        {/* 表情配置 */}
        <TabsContent value="emoji" className="space-y-4">
          {emojiConfig && <EmojiSection config={emojiConfig} onChange={setEmojiConfig} />}
        </TabsContent>

        {/* 记忆配置 */}
        <TabsContent value="memory" className="space-y-4">
          {memoryConfig && <MemorySection config={memoryConfig} onChange={setMemoryConfig} />}
        </TabsContent>

        {/* 工具配置 */}
        <TabsContent value="tool" className="space-y-4">
          {toolConfig && <ToolSection config={toolConfig} onChange={setToolConfig} />}
        </TabsContent>

        {/* 情绪配置 */}
        <TabsContent value="mood" className="space-y-4">
          {moodConfig && <MoodSection config={moodConfig} onChange={setMoodConfig} />}
        </TabsContent>

        {/* 语音配置 */}
        <TabsContent value="voice" className="space-y-4">
          {voiceConfig && <VoiceSection config={voiceConfig} onChange={setVoiceConfig} />}
        </TabsContent>

        {/* 知识库配置 */}
        <TabsContent value="lpmm" className="space-y-4">
          {lpmmConfig && <LPMMSection config={lpmmConfig} onChange={setLpmmConfig} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// 基本信息组件
function BotInfoSection({
  config,
  onChange,
}: {
  config: BotConfig
  onChange: (config: BotConfig) => void
}) {
  const addPlatform = () => {
    onChange({ ...config, platforms: [...config.platforms, ''] })
  }

  const removePlatform = (index: number) => {
    onChange({
      ...config,
      platforms: config.platforms.filter((_, i) => i !== index),
    })
  }

  const updatePlatform = (index: number, value: string) => {
    const newPlatforms = [...config.platforms]
    newPlatforms[index] = value
    onChange({ ...config, platforms: newPlatforms })
  }

  const addAlias = () => {
    onChange({ ...config, alias_names: [...config.alias_names, ''] })
  }

  const removeAlias = (index: number) => {
    onChange({
      ...config,
      alias_names: config.alias_names.filter((_, i) => i !== index),
    })
  }

  const updateAlias = (index: number, value: string) => {
    const newAliases = [...config.alias_names]
    newAliases[index] = value
    onChange({ ...config, alias_names: newAliases })
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">基本信息</h3>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="platform">平台</Label>
            <Input
              id="platform"
              value={config.platform}
              onChange={(e) => onChange({ ...config, platform: e.target.value })}
              placeholder="qq"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="qq_account">QQ账号</Label>
            <Input
              id="qq_account"
              value={config.qq_account}
              onChange={(e) => onChange({ ...config, qq_account: e.target.value })}
              placeholder="123456789"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="nickname">昵称</Label>
            <Input
              id="nickname"
              value={config.nickname}
              onChange={(e) => onChange({ ...config, nickname: e.target.value })}
              placeholder="麦麦"
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>其他平台账号</Label>
              <Button onClick={addPlatform} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                添加
              </Button>
            </div>
            <div className="space-y-2">
              {config.platforms.map((platform, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={platform}
                    onChange={(e) => updatePlatform(index, e.target.value)}
                    placeholder="wx:114514"
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除平台账号 "{platform || '(空)'}" 吗？此操作无法撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removePlatform(index)}>
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
              {config.platforms.length === 0 && (
                <p className="text-sm text-muted-foreground">暂无其他平台账号</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>别名</Label>
              <Button onClick={addAlias} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                添加
              </Button>
            </div>
            <div className="space-y-2">
              {config.alias_names.map((alias, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={alias}
                    onChange={(e) => updateAlias(index, e.target.value)}
                    placeholder="小麦"
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除别名 "{alias || '(空)'}" 吗？此操作无法撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeAlias(index)}>
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
              {config.alias_names.length === 0 && (
                <p className="text-sm text-muted-foreground">暂无别名</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 人格配置组件
function PersonalitySection({
  config,
  onChange,
}: {
  config: PersonalityConfig
  onChange: (config: PersonalityConfig) => void
}) {
  const addState = () => {
    onChange({ ...config, states: [...config.states, ''] })
  }

  const removeState = (index: number) => {
    onChange({
      ...config,
      states: config.states.filter((_, i) => i !== index),
    })
  }

  const updateState = (index: number, value: string) => {
    const newStates = [...config.states]
    newStates[index] = value
    onChange({ ...config, states: newStates })
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">人格设置</h3>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="personality">人格特质</Label>
            <Textarea
              id="personality"
              value={config.personality}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...config, personality: e.target.value })}
              placeholder="描述人格特质和身份特征（建议120字以内）"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              建议120字以内，描述人格特质和身份特征
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reply_style">表达风格</Label>
            <Textarea
              id="reply_style"
              value={config.reply_style}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...config, reply_style: e.target.value })}
              placeholder="描述说话的表达风格和习惯"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="interest">兴趣</Label>
            <Textarea
              id="interest"
              value={config.interest}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...config, interest: e.target.value })}
              placeholder="会影响麦麦对什么话题进行回复"
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="plan_style">说话规则与行为风格</Label>
            <Textarea
              id="plan_style"
              value={config.plan_style}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...config, plan_style: e.target.value })}
              placeholder="麦麦的说话规则和行为风格"
              rows={5}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="visual_style">识图规则</Label>
            <Textarea
              id="visual_style"
              value={config.visual_style}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...config, visual_style: e.target.value })}
              placeholder="识图时的处理规则"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="private_plan_style">私聊规则</Label>
            <Textarea
              id="private_plan_style"
              value={config.private_plan_style}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...config, private_plan_style: e.target.value })}
              placeholder="私聊的说话规则和行为风格"
              rows={4}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>状态列表（人格多样性）</Label>
              <Button onClick={addState} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                添加状态
              </Button>
            </div>
            <div className="space-y-2">
              {config.states.map((state, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={state}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateState(index, e.target.value)}
                    placeholder="描述一个人格状态"
                    rows={2}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除这个人格状态吗？此操作无法撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeState(index)}>
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="state_probability">状态替换概率</Label>
            <Input
              id="state_probability"
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={config.state_probability}
              onChange={(e) =>
                onChange({ ...config, state_probability: parseFloat(e.target.value) })
              }
            />
            <p className="text-xs text-muted-foreground">
              每次构建人格时替换 personality 的概率（0.0-1.0）
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// 聊天配置组件
function ChatSection({
  config,
  onChange,
}: {
  config: ChatConfig
  onChange: (config: ChatConfig) => void
}) {
  // 添加发言频率规则
  const addTalkValueRule = () => {
    onChange({
      ...config,
      talk_value_rules: [
        ...config.talk_value_rules,
        { target: '', time: '00:00-23:59', value: 1.0 },
      ],
    })
  }

  // 删除发言频率规则
  const removeTalkValueRule = (index: number) => {
    onChange({
      ...config,
      talk_value_rules: config.talk_value_rules.filter((_, i) => i !== index),
    })
  }

  // 更新发言频率规则
  const updateTalkValueRule = (
    index: number,
    field: 'target' | 'time' | 'value',
    value: string | number
  ) => {
    const newRules = [...config.talk_value_rules]
    newRules[index] = {
      ...newRules[index],
      [field]: value,
    }
    onChange({
      ...config,
      talk_value_rules: newRules,
    })
  }

  // 时间选择组件
  const TimeRangePicker = ({
    value,
    onChange,
  }: {
    value: string
    onChange: (value: string) => void
  }) => {
    const [startHour, setStartHour] = useState('00')
    const [startMinute, setStartMinute] = useState('00')
    const [endHour, setEndHour] = useState('23')
    const [endMinute, setEndMinute] = useState('59')

    useEffect(() => {
      const parts = value.split('-')
      if (parts.length === 2) {
        const [start, end] = parts
        const [sh, sm] = start.split(':')
        const [eh, em] = end.split(':')
        if (sh) setStartHour(sh.padStart(2, '0'))
        if (sm) setStartMinute(sm.padStart(2, '0'))
        if (eh) setEndHour(eh.padStart(2, '0'))
        if (em) setEndMinute(em.padStart(2, '0'))
      }
    }, [value])

    const updateTime = (
      newStartHour: string,
      newStartMinute: string,
      newEndHour: string,
      newEndMinute: string
    ) => {
      const newValue = `${newStartHour}:${newStartMinute}-${newEndHour}:${newEndMinute}`
      onChange(newValue)
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start font-mono text-sm">
            <Clock className="h-4 w-4 mr-2" />
            {value || '选择时间段'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-3">开始时间</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">小时</Label>
                  <Select
                    value={startHour}
                    onValueChange={(v) => {
                      setStartHour(v)
                      updateTime(v, startMinute, endHour, endMinute)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                        <SelectItem key={h} value={h.toString().padStart(2, '0')}>
                          {h.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">分钟</Label>
                  <Select
                    value={startMinute}
                    onValueChange={(v) => {
                      setStartMinute(v)
                      updateTime(startHour, v, endHour, endMinute)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                        <SelectItem key={m} value={m.toString().padStart(2, '0')}>
                          {m.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-3">结束时间</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">小时</Label>
                  <Select
                    value={endHour}
                    onValueChange={(v) => {
                      setEndHour(v)
                      updateTime(startHour, startMinute, v, endMinute)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                        <SelectItem key={h} value={h.toString().padStart(2, '0')}>
                          {h.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">分钟</Label>
                  <Select
                    value={endMinute}
                    onValueChange={(v) => {
                      setEndMinute(v)
                      updateTime(startHour, startMinute, endHour, v)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                        <SelectItem key={m} value={m.toString().padStart(2, '0')}>
                          {m.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // 预览窗口组件
  const RulePreview = ({ rule }: { rule: { target: string; time: string; value: number } }) => {
    const previewText = `{ target = "${rule.target}", time = "${rule.time}", value = ${rule.value.toFixed(1)} }`
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            预览
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">配置预览</h4>
            <div className="rounded-md bg-muted p-3 font-mono text-xs break-all">
              {previewText}
            </div>
            <p className="text-xs text-muted-foreground">
              这是保存到 bot_config.toml 文件中的格式
            </p>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">聊天设置</h3>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="talk_value">聊天频率（基础值）</Label>
            <Input
              id="talk_value"
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={config.talk_value}
              onChange={(e) => onChange({ ...config, talk_value: parseFloat(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">越小越沉默，范围 0-1</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mentioned_bot_reply">提及回复增幅</Label>
            <Input
              id="mentioned_bot_reply"
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={config.mentioned_bot_reply}
              onChange={(e) =>
                onChange({ ...config, mentioned_bot_reply: parseFloat(e.target.value) })
              }
            />
            <p className="text-xs text-muted-foreground">
              提及时回复概率增幅，1 为 100% 回复
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="max_context_size">上下文长度</Label>
            <Input
              id="max_context_size"
              type="number"
              min="1"
              value={config.max_context_size}
              onChange={(e) =>
                onChange({ ...config, max_context_size: parseInt(e.target.value) })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="planner_smooth">规划器平滑</Label>
            <Input
              id="planner_smooth"
              type="number"
              step="1"
              min="0"
              value={config.planner_smooth}
              onChange={(e) =>
                onChange({ ...config, planner_smooth: parseFloat(e.target.value) })
              }
            />
            <p className="text-xs text-muted-foreground">
              增大数值会减小 planner 负荷，推荐 1-5，0 为关闭
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="enable_talk_value_rules"
              checked={config.enable_talk_value_rules}
              onCheckedChange={(checked) =>
                onChange({ ...config, enable_talk_value_rules: checked })
              }
            />
            <Label htmlFor="enable_talk_value_rules" className="cursor-pointer">
              启用动态发言频率规则
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="include_planner_reasoning"
              checked={config.include_planner_reasoning}
              onCheckedChange={(checked) =>
                onChange({ ...config, include_planner_reasoning: checked })
              }
            />
            <Label htmlFor="include_planner_reasoning" className="cursor-pointer">
              将 planner 推理加入 replyer
            </Label>
          </div>
        </div>
      </div>

      {/* 动态发言频率规则配置 */}
      {config.enable_talk_value_rules && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-semibold">动态发言频率规则</h4>
              <p className="text-xs text-muted-foreground mt-1">
                按时段或聊天流ID调整发言频率，优先匹配具体聊天，再匹配全局规则
              </p>
            </div>
            <Button onClick={addTalkValueRule} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              添加规则
            </Button>
          </div>

          {config.talk_value_rules && config.talk_value_rules.length > 0 ? (
            <div className="space-y-4">
              {config.talk_value_rules.map((rule, index) => (
                <div key={index} className="rounded-lg border p-4 bg-muted/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      规则 #{index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <RulePreview rule={rule} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除规则 #{index + 1} 吗？此操作无法撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeTalkValueRule(index)}>
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* 目标聊天流 */}
                    <div className="grid gap-2">
                      <Label htmlFor={`rule-target-${index}`} className="text-xs font-medium">
                        目标聊天流 (Target)
                      </Label>
                      <Input
                        id={`rule-target-${index}`}
                        placeholder='留空=全局，或填 "platform:id:type"'
                        value={rule.target}
                        onChange={(e) =>
                          updateTalkValueRule(index, 'target', e.target.value)
                        }
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        示例：qq:1919810:group 或 qq:114514:private
                      </p>
                    </div>

                    {/* 时间段选择器 */}
                    <div className="grid gap-2">
                      <Label className="text-xs font-medium">时间段 (Time)</Label>
                      <TimeRangePicker
                        value={rule.time}
                        onChange={(v) => updateTalkValueRule(index, 'time', v)}
                      />
                      <p className="text-xs text-muted-foreground">
                        支持跨夜区间，例如 23:00-02:00
                      </p>
                    </div>

                    {/* 发言频率滑块 */}
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`rule-value-${index}`} className="text-xs font-medium">
                          发言频率值 (Value)
                        </Label>
                        <Input
                          id={`rule-value-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={rule.value}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value)
                            if (!isNaN(val)) {
                              updateTalkValueRule(index, 'value', Math.max(0, Math.min(1, val)))
                            }
                          }}
                          className="w-20 h-8 text-xs"
                        />
                      </div>
                      <Slider
                        value={[rule.value]}
                        onValueChange={(values) =>
                          updateTalkValueRule(index, 'value', values[0])
                        }
                        min={0}
                        max={1}
                        step={0.01}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0 (完全沉默)</span>
                        <span>0.5</span>
                        <span>1.0 (正常)</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">暂无规则，点击"添加规则"按钮创建</p>
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📝 规则说明
            </h5>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <strong>Target 为空</strong>：全局规则，对所有聊天生效</li>
              <li>• <strong>Target 指定</strong>：仅对特定聊天流生效（格式：platform:id:type）</li>
              <li>• <strong>优先级</strong>：先匹配具体聊天流规则，再匹配全局规则</li>
              <li>• <strong>时间支持跨夜</strong>：例如 23:00-02:00 表示晚上11点到次日凌晨2点</li>
              <li>• <strong>数值范围</strong>：建议 0-1，0 表示完全沉默，1 表示正常发言</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

// 表达配置组件
function ExpressionSection({
  config,
  onChange,
}: {
  config: ExpressionConfig
  onChange: (config: ExpressionConfig) => void
}) {
  // 添加学习规则
  const addLearningRule = () => {
    onChange({
      ...config,
      learning_list: [...config.learning_list, ['', 'enable', 'enable', '1.0']],
    })
  }

  // 删除学习规则
  const removeLearningRule = (index: number) => {
    onChange({
      ...config,
      learning_list: config.learning_list.filter((_, i) => i !== index),
    })
  }

  // 更新学习规则
  const updateLearningRule = (
    index: number,
    field: 0 | 1 | 2 | 3,
    value: string
  ) => {
    const newList = [...config.learning_list]
    newList[index][field] = value
    onChange({
      ...config,
      learning_list: newList,
    })
  }

  // 预览组件
  const LearningRulePreview = ({ rule }: { rule: [string, string, string, string] }) => {
    const previewText = `["${rule[0]}", "${rule[1]}", "${rule[2]}", "${rule[3]}"]`
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            预览
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">配置预览</h4>
            <div className="rounded-md bg-muted p-3 font-mono text-xs break-all">
              {previewText}
            </div>
            <p className="text-xs text-muted-foreground">
              这是保存到 bot_config.toml 文件中的格式
            </p>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // 添加表达组
  const addExpressionGroup = () => {
    onChange({
      ...config,
      expression_groups: [...config.expression_groups, []],
    })
  }

  // 删除表达组
  const removeExpressionGroup = (index: number) => {
    onChange({
      ...config,
      expression_groups: config.expression_groups.filter((_, i) => i !== index),
    })
  }

  // 添加组成员
  const addGroupMember = (groupIndex: number) => {
    const newGroups = [...config.expression_groups]
    newGroups[groupIndex] = [...newGroups[groupIndex], '']
    onChange({
      ...config,
      expression_groups: newGroups,
    })
  }

  // 删除组成员
  const removeGroupMember = (groupIndex: number, memberIndex: number) => {
    const newGroups = [...config.expression_groups]
    newGroups[groupIndex] = newGroups[groupIndex].filter((_, i) => i !== memberIndex)
    onChange({
      ...config,
      expression_groups: newGroups,
    })
  }

  // 更新组成员
  const updateGroupMember = (groupIndex: number, memberIndex: number, value: string) => {
    const newGroups = [...config.expression_groups]
    newGroups[groupIndex][memberIndex] = value
    onChange({
      ...config,
      expression_groups: newGroups,
    })
  }

  return (
    <div className="space-y-6">
      {/* 表达学习配置 */}
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">表达学习配置</h3>
              <p className="text-sm text-muted-foreground mt-1">
                配置麦麦如何学习和使用表达方式
              </p>
            </div>
            <Button onClick={addLearningRule} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              添加规则
            </Button>
          </div>

          <div className="space-y-4">
            {config.learning_list.map((rule, index) => (
              <div key={index} className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    规则 {index + 1} {rule[0] === '' && '（全局配置）'}
                  </span>
                  <div className="flex items-center gap-2">
                    <LearningRulePreview rule={rule} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除</AlertDialogTitle>
                          <AlertDialogDescription>
                            确定要删除学习规则 {index + 1} 吗？此操作无法撤销。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeLearningRule(index)}>
                            删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* 聊天流 ID */}
                  <div className="grid gap-2">
                    <Label className="text-xs font-medium">聊天流 ID</Label>
                    <Input
                      value={rule[0]}
                      onChange={(e) => updateLearningRule(index, 0, e.target.value)}
                      placeholder="留空表示全局配置，例如：qq:1919810:group"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      格式：platform:id:type（group/private）
                    </p>
                  </div>

                  {/* 使用学到的表达 - 改为开关 */}
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-medium">使用学到的表达</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          允许麦麦使用从聊天中学到的表达方式
                        </p>
                      </div>
                      <Switch
                        checked={rule[1] === 'enable'}
                        onCheckedChange={(checked) =>
                          updateLearningRule(index, 1, checked ? 'enable' : 'disable')
                        }
                      />
                    </div>
                  </div>

                  {/* 学习表达 - 改为开关 */}
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-medium">学习表达</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          允许麦麦从聊天中学习新的表达方式
                        </p>
                      </div>
                      <Switch
                        checked={rule[2] === 'enable'}
                        onCheckedChange={(checked) =>
                          updateLearningRule(index, 2, checked ? 'enable' : 'disable')
                        }
                      />
                    </div>
                  </div>

                  {/* 学习强度 - 改为滑块+输入框 */}
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">学习强度</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={rule[3]}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          if (!isNaN(val)) {
                            updateLearningRule(index, 3, Math.max(0, Math.min(5, val)).toFixed(1))
                          }
                        }}
                        className="w-20 h-8 text-xs"
                      />
                    </div>
                    <Slider
                      value={[parseFloat(rule[3]) || 1.0]}
                      onValueChange={(values) =>
                        updateLearningRule(index, 3, values[0].toFixed(1))
                      }
                      min={0}
                      max={5}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0 (不学习)</span>
                      <span>2.5</span>
                      <span>5.0 (快速学习)</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      影响学习频率，最短学习间隔 = 300/学习强度（秒）
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {config.learning_list.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                暂无学习规则，点击"添加规则"开始配置
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 表达共享组配置 */}
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">表达共享组配置</h3>
              <p className="text-sm text-muted-foreground mt-1">
                配置不同聊天流之间如何共享学到的表达方式
              </p>
            </div>
            <Button onClick={addExpressionGroup} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              添加共享组
            </Button>
          </div>

          <div className="space-y-4">
            {config.expression_groups.map((group, groupIndex) => (
              <div key={groupIndex} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    共享组 {groupIndex + 1}
                    {group.length === 1 && group[0] === '*' && '（全局共享）'}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => addGroupMember(groupIndex)}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除</AlertDialogTitle>
                          <AlertDialogDescription>
                            确定要删除共享组 {groupIndex + 1} 吗？此操作无法撤销。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeExpressionGroup(groupIndex)}>
                            删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="space-y-2">
                  {group.map((member, memberIndex) => (
                    <div key={memberIndex} className="flex gap-2">
                      <Input
                        value={member}
                        onChange={(e) =>
                          updateGroupMember(groupIndex, memberIndex, e.target.value)
                        }
                        placeholder='输入 "*" 表示全局共享，或 "qq:123456:group"'
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除组成员 "{member || '(空)'}" 吗？此操作无法撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => removeGroupMember(groupIndex, memberIndex)}
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  提示：输入 "*" 启用全局共享；或输入具体 chat_id（如
                  qq:114514:private）组成互通组
                </p>
              </div>
            ))}

            {config.expression_groups.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                暂无共享组，点击"添加共享组"开始配置
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 表情配置组件
function EmojiSection({
  config,
  onChange,
}: {
  config: EmojiConfig
  onChange: (config: EmojiConfig) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h3 className="text-lg font-semibold">表情包设置</h3>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>表情包激活概率</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={config.emoji_chance}
            onChange={(e) => onChange({ ...config, emoji_chance: parseFloat(e.target.value) })}
          />
        </div>
        <div className="grid gap-2">
          <Label>最大注册数量</Label>
          <Input
            type="number"
            min="1"
            value={config.max_reg_num}
            onChange={(e) => onChange({ ...config, max_reg_num: parseInt(e.target.value) })}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={config.do_replace}
            onCheckedChange={(checked) => onChange({ ...config, do_replace: checked })}
          />
          <Label className="cursor-pointer">达到最大数量时替换表情包</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={config.steal_emoji}
            onCheckedChange={(checked) => onChange({ ...config, steal_emoji: checked })}
          />
          <Label className="cursor-pointer">偷取表情包</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={config.content_filtration}
            onCheckedChange={(checked) => onChange({ ...config, content_filtration: checked })}
          />
          <Label className="cursor-pointer">启用表情包过滤</Label>
        </div>
        {config.content_filtration && (
          <div className="grid gap-2">
            <Label>过滤要求</Label>
            <Input
              value={config.filtration_prompt}
              onChange={(e) => onChange({ ...config, filtration_prompt: e.target.value })}
              placeholder="符合公序良俗"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function MemorySection({
  config,
  onChange,
}: {
  config: MemoryConfig
  onChange: (config: MemoryConfig) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h3 className="text-lg font-semibold">记忆设置</h3>
      <div className="grid gap-2">
        <Label>记忆思考深度</Label>
        <Input
          type="number"
          min="1"
          value={config.max_agent_iterations}
          onChange={(e) =>
            onChange({ ...config, max_agent_iterations: parseInt(e.target.value) })
          }
        />
        <p className="text-xs text-muted-foreground">最低为 1（不深入思考）</p>
      </div>
    </div>
  )
}

function ToolSection({
  config,
  onChange,
}: {
  config: ToolConfig
  onChange: (config: ToolConfig) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h3 className="text-lg font-semibold">工具设置</h3>
      <div className="flex items-center space-x-2">
        <Switch
          checked={config.enable_tool}
          onCheckedChange={(checked) => onChange({ ...config, enable_tool: checked })}
        />
        <Label className="cursor-pointer">启用工具系统</Label>
      </div>
    </div>
  )
}

function MoodSection({
  config,
  onChange,
}: {
  config: MoodConfig
  onChange: (config: MoodConfig) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h3 className="text-lg font-semibold">情绪设置</h3>
      <div className="grid gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={config.enable_mood}
            onCheckedChange={(checked) => onChange({ ...config, enable_mood: checked })}
          />
          <Label className="cursor-pointer">启用情绪系统</Label>
        </div>
        {config.enable_mood && (
          <>
            <div className="grid gap-2">
              <Label>情绪更新阈值</Label>
              <Input
                type="number"
                min="1"
                value={config.mood_update_threshold}
                onChange={(e) =>
                  onChange({ ...config, mood_update_threshold: parseInt(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground">越高，更新越慢</p>
            </div>
            <div className="grid gap-2">
              <Label>情感特征</Label>
              <Textarea
                value={config.emotion_style}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...config, emotion_style: e.target.value })}
                placeholder="影响情绪的变化情况"
                rows={2}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function VoiceSection({
  config,
  onChange,
}: {
  config: VoiceConfig
  onChange: (config: VoiceConfig) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h3 className="text-lg font-semibold">语音设置</h3>
      <div className="flex items-center space-x-2">
        <Switch
          checked={config.enable_asr}
          onCheckedChange={(checked) => onChange({ ...config, enable_asr: checked })}
        />
        <Label className="cursor-pointer">启用语音识别</Label>
      </div>
      <p className="text-xs text-muted-foreground">
        启用后麦麦可以识别语音消息，需要配置语音识别模型
      </p>
    </div>
  )
}

function LPMMSection({
  config,
  onChange,
}: {
  config: LPMMKnowledgeConfig
  onChange: (config: LPMMKnowledgeConfig) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h3 className="text-lg font-semibold">LPMM 知识库设置</h3>
      <div className="grid gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={config.enable}
            onCheckedChange={(checked) => onChange({ ...config, enable: checked })}
          />
          <Label className="cursor-pointer">启用 LPMM 知识库</Label>
        </div>

        {config.enable && (
          <>
            <div className="grid gap-2">
              <Label>LPMM 模式</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={config.lpmm_mode}
                onChange={(e) => onChange({ ...config, lpmm_mode: e.target.value })}
              >
                <option value="classic">经典模式</option>
                <option value="agent">Agent 模式</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>同义词搜索 TopK</Label>
                <Input
                  type="number"
                  min="1"
                  value={config.rag_synonym_search_top_k}
                  onChange={(e) =>
                    onChange({ ...config, rag_synonym_search_top_k: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>同义词阈值</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={config.rag_synonym_threshold}
                  onChange={(e) =>
                    onChange({ ...config, rag_synonym_threshold: parseFloat(e.target.value) })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>实体提取线程数</Label>
                <Input
                  type="number"
                  min="1"
                  value={config.info_extraction_workers}
                  onChange={(e) =>
                    onChange({ ...config, info_extraction_workers: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>嵌入向量维度</Label>
                <Input
                  type="number"
                  min="1"
                  value={config.embedding_dimension}
                  onChange={(e) =>
                    onChange({ ...config, embedding_dimension: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

