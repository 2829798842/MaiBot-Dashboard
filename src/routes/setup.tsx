import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  SkipForward,
  Bot,
  User,
  Smile,
  Settings,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/lib/version'
import { useToast } from '@/hooks/use-toast'
import type {
  SetupStep,
  BotBasicConfig,
  PersonalityConfig,
  EmojiConfig,
  OtherBasicConfig,
} from './setup/types'
import {
  BotBasicForm,
  PersonalityForm,
  EmojiForm,
  OtherBasicForm,
} from './setup/StepForms'
import {
  loadBotBasicConfig,
  loadPersonalityConfig,
  loadEmojiConfig,
  loadOtherBasicConfig,
  saveBotBasicConfig,
  savePersonalityConfig,
  saveEmojiConfig,
  saveOtherBasicConfig,
  completeSetup,
} from './setup/api'

export function SetupPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 步骤1：Bot基础信息
  const [botBasic, setBotBasic] = useState<BotBasicConfig>({
    qq_account: 0,
    nickname: '',
    alias_names: [],
  })

  // 步骤2：人格配置
  const [personality, setPersonality] = useState<PersonalityConfig>({
    personality: '是一个女大学生，现在在读大二，会刷贴吧。',
    reply_style:
      '请回复的平淡一些，简短一些，说中文，不要刻意突出自身学科背景。可以参考贴吧，知乎和微博的回复风格。',
    interest:
      '对技术相关话题，游戏和动漫相关话题感兴趣，也对日常话题感兴趣，不喜欢太过沉重严肃的话题',
    plan_style:
      '1.思考**所有**的可用的action中的**每个动作**是否符合当下条件，如果动作使用条件符合聊天内容就使用\n2.如果相同的内容已经被执行，请不要重复执行\n3.请控制你的发言频率，不要太过频繁的发言\n4.如果有人对你感到厌烦，请减少回复\n5.如果有人对你进行攻击，或者情绪激动，请你以合适的方法应对',
    private_plan_style:
      '1.思考**所有**的可用的action中的**每个动作**是否符合当下条件，如果动作使用条件符合聊天内容就使用\n2.如果相同的内容已经被执行，请不要重复执行\n3.某句话如果已经被回复过，不要重复回复',
  })

  // 步骤3：表情包配置
  const [emoji, setEmoji] = useState<EmojiConfig>({
    emoji_chance: 0.4,
    max_reg_num: 40,
    do_replace: true,
    check_interval: 10,
    steal_emoji: true,
    content_filtration: false,
    filtration_prompt: '符合公序良俗',
  })

  // 步骤4：其他基础配置
  const [otherBasic, setOtherBasic] = useState<OtherBasicConfig>({
    enable_tool: true,
    enable_mood: false,
    mood_update_threshold: 1,
    emotion_style: '情绪较为稳定，但遭遇特定事件的时候起伏较大',
    all_global: true,
  })

  const steps: SetupStep[] = [
    {
      id: 'bot-basic',
      title: 'Bot基础',
      description: '配置机器人的基本信息',
      icon: Bot,
    },
    {
      id: 'personality',
      title: '人格配置',
      description: '定义机器人的性格和说话风格',
      icon: User,
    },
    {
      id: 'emoji',
      title: '表情包',
      description: '配置表情包相关设置',
      icon: Smile,
    },
    {
      id: 'other',
      title: '其他设置',
      description: '工具、情绪系统等配置',
      icon: Settings,
    },
    {
      id: 'complete',
      title: '完成设置',
      description: '后续配置提示',
      icon: Zap,
    },
  ]

  const progress = ((currentStep + 1) / steps.length) * 100

  // 加载现有配置
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        setIsLoading(true)

        // 并行加载所有配置
        const [bot, personality, emoji, other] = await Promise.all([
          loadBotBasicConfig(),
          loadPersonalityConfig(),
          loadEmojiConfig(),
          loadOtherBasicConfig(),
        ])

        setBotBasic(bot)
        setPersonality(personality)
        setEmoji(emoji)
        setOtherBasic(other)
      } catch (error) {
        toast({
          title: '加载配置失败',
          description:
            error instanceof Error
              ? error.message
              : '无法加载现有配置，将使用默认值',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadConfigs()
  }, [toast])

  // 保存当前步骤配置
  const saveCurrentStep = async () => {
    setIsSaving(true)
    try {
      switch (currentStep) {
        case 0: // Bot基础
          await saveBotBasicConfig(botBasic)
          break
        case 1: // 人格配置
          await savePersonalityConfig(personality)
          break
        case 2: // 表情包
          await saveEmojiConfig(emoji)
          break
        case 3: // 其他设置
          await saveOtherBasicConfig(otherBasic)
          break
      }

      toast({
        title: '保存成功',
        description: `${steps[currentStep].title}配置已保存`,
      })
      return true
    } catch (error) {
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleNext = async () => {
    // 保存当前步骤
    const saved = await saveCurrentStep()
    if (!saved) return

    // 进入下一步
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    setIsCompleting(true)

    try {
      // 保存最后一步的配置
      const saved = await saveCurrentStep()
      if (!saved) {
        setIsCompleting(false)
        return
      }

      // 标记设置完成
      await completeSetup()

      toast({
        title: '配置完成',
        description: '所有配置已保存，正在跳转...',
      })

      setTimeout(() => {
        navigate({ to: '/' })
      }, 500)
    } catch (error) {
      toast({
        title: '完成失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    } finally {
      setIsCompleting(false)
    }
  }

  const handleSkip = async () => {
    try {
      await completeSetup()
      navigate({ to: '/' })
    } catch (error) {
      toast({
        title: '跳过失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      })
    }
  }

  // 渲染当前步骤的表单
  const renderStepForm = () => {
    switch (currentStep) {
      case 0:
        return <BotBasicForm config={botBasic} onChange={setBotBasic} />
      case 1:
        return (
          <PersonalityForm config={personality} onChange={setPersonality} />
        )
      case 2:
        return <EmojiForm config={emoji} onChange={setEmoji} />
      case 3:
        return <OtherBasicForm config={otherBasic} onChange={setOtherBasic} />
      case 4:
        return (
          <div className="space-y-6 text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="h-8 w-8 text-primary" strokeWidth={2} />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">模型配置</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                为了让机器人正常工作，您需要配置 AI 模型提供商和模型。
              </p>
            </div>
            <div className="rounded-lg border bg-muted/50 p-6 max-w-md mx-auto text-left space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold">1</div>
                </div>
                <div>
                  <p className="font-medium">配置 API 提供商</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    在"系统设置 → 模型配置 → API 提供商"中添加您的 API 提供商信息
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold">2</div>
                </div>
                <div>
                  <p className="font-medium">添加模型</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    在"系统设置 → 模型配置 → 模型列表"中添加需要使用的模型
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold">3</div>
                </div>
                <div>
                  <p className="font-medium">配置模型任务</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    在"系统设置 → 模型配置 → 模型任务配置"中为不同任务分配模型
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              💡 提示：完成向导后，您可以在系统设置中进行详细的模型配置
            </p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 md:p-6">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 md:h-96 md:w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-64 w-64 md:h-96 md:w-96 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      {/* 加载状态 */}
      {isLoading ? (
        <div className="relative z-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
          <p className="text-lg font-medium">加载配置中...</p>
          <p className="text-sm text-muted-foreground mt-2">
            正在读取现有配置
          </p>
        </div>
      ) : (
        <>
          {/* 主要内容 */}
          <div className="relative z-10 w-full max-w-4xl">
        {/* 头部 */}
        <div className="mb-6 md:mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles
              className="h-6 w-6 md:h-8 md:w-8 text-primary"
              strokeWidth={2}
              fill="none"
            />
          </div>
          <h1 className="mb-2 text-2xl md:text-3xl font-bold">
            首次配置向导
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            让我们一起完成 {APP_NAME} 的初始配置
          </p>
        </div>

        {/* 进度条 */}
        <div className="mb-6 md:mb-8">
          <div className="mb-2 flex items-center justify-between text-xs md:text-sm">
            <span className="text-muted-foreground">
              步骤 {currentStep + 1} / {steps.length}
            </span>
            <span className="font-medium text-primary">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* 步骤指示器 */}
        <div className="mb-6 md:mb-8 flex justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={step.id}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 md:gap-2',
                  index < steps.length - 1 && 'relative'
                )}
              >
                {/* 连接线 */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-1/2 top-3 md:top-4 h-0.5 w-full',
                      index < currentStep ? 'bg-primary' : 'bg-border'
                    )}
                  />
                )}

                {/* 步骤圆圈 */}
                <div
                  className={cn(
                    'relative z-10 flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full border-2 transition-all',
                    index === currentStep
                      ? 'border-primary bg-primary text-primary-foreground'
                      : index < currentStep
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-muted-foreground'
                  )}
                >
                  {index < currentStep ? (
                    <CheckCircle2
                      className="h-3 w-3 md:h-4 md:w-4"
                      strokeWidth={2.5}
                      fill="none"
                    />
                  ) : (
                    <Icon className="h-3 w-3 md:h-4 md:w-4" />
                  )}
                </div>

                {/* 步骤标题 */}
                <span
                  className={cn(
                    'text-[10px] md:text-xs text-center max-w-[60px] md:max-w-none truncate md:whitespace-normal',
                    index === currentStep
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground'
                  )}
                  title={step.title}
                >
                  {step.title}
                </span>
              </div>
            )
          })}
        </div>

        {/* 步骤内容卡片 */}
        <Card className="mb-6 md:mb-8 shadow-lg">
          <CardContent className="p-4 md:p-8">
            <div className="min-h-[300px] md:min-h-[400px]">
              <div className="mb-4 md:mb-6">
                <h2 className="mb-2 text-xl md:text-2xl font-semibold">
                  {steps[currentStep].title}
                </h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  {steps[currentStep].description}
                </p>
              </div>

              {/* 表单内容 */}
              <ScrollArea className="h-[400px] md:h-[500px]">
                <div className="pr-2">
                  {renderStepForm()}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0 || isSaving}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            上一步
          </Button>

          <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex-1 sm:flex-none gap-2"
                  disabled={isSaving || isCompleting}
                >
                  <SkipForward className="h-4 w-4" strokeWidth={2} fill="none" />
                  跳过向导
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认跳过配置向导</AlertDialogTitle>
                  <AlertDialogDescription>
                    您可以随时在系统设置中重新进入配置向导。确定要跳过吗？
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSkip}>
                    确认跳过
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {currentStep === steps.length - 1 ? (
              <Button
                onClick={handleComplete}
                disabled={isCompleting || isSaving}
                className="flex-1 sm:flex-none"
              >
                {isCompleting || isSaving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {isSaving ? '保存中...' : '完成中...'}
                  </>
                ) : (
                  <>
                    完成配置
                    <CheckCircle2
                      className="ml-2 h-4 w-4"
                      strokeWidth={2}
                      fill="none"
                    />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={isSaving}
                className="flex-1 sm:flex-none"
              >
                {isSaving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    保存中...
                  </>
                ) : (
                  <>
                    下一步
                    <ArrowRight
                      className="ml-2 h-4 w-4"
                      strokeWidth={2}
                      fill="none"
                    />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 页脚提示 */}
      <div className="relative z-10 mt-6 md:mt-8 text-center text-xs text-muted-foreground">
        <p>您可以随时在设置中修改这些配置</p>
      </div>
        </>
      )}
    </div>
  )
}
