// 设置向导API调用函数

import { fetchWithAuth, getAuthHeaders } from '@/lib/fetch-with-auth'
import type {
  BotBasicConfig,
  PersonalityConfig,
  EmojiConfig,
  OtherBasicConfig,
  ModelBasicConfig,
} from './types'

// ===== 读取配置 =====

// 读取Bot基础配置
export async function loadBotBasicConfig(): Promise<BotBasicConfig> {
  const response = await fetchWithAuth('/api/webui/config/bot', {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('读取Bot配置失败')
  }

  const data = await response.json()
  const botConfig = data.config.bot || {}

  return {
    qq_account: botConfig.qq_account || 0,
    nickname: botConfig.nickname || '',
    alias_names: botConfig.alias_names || [],
  }
}

// 读取人格配置
export async function loadPersonalityConfig(): Promise<PersonalityConfig> {
  const response = await fetchWithAuth('/api/webui/config/bot', {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('读取人格配置失败')
  }

  const data = await response.json()
  const personalityConfig = data.config.personality || {}

  return {
    personality: personalityConfig.personality || '',
    reply_style: personalityConfig.reply_style || '',
    interest: personalityConfig.interest || '',
    plan_style: personalityConfig.plan_style || '',
    private_plan_style: personalityConfig.private_plan_style || '',
  }
}

// 读取表情包配置
export async function loadEmojiConfig(): Promise<EmojiConfig> {
  const response = await fetchWithAuth('/api/webui/config/bot', {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('读取表情包配置失败')
  }

  const data = await response.json()
  const emojiConfig = data.config.emoji || {}

  return {
    emoji_chance: emojiConfig.emoji_chance ?? 0.4,
    max_reg_num: emojiConfig.max_reg_num ?? 40,
    do_replace: emojiConfig.do_replace ?? true,
    check_interval: emojiConfig.check_interval ?? 10,
    steal_emoji: emojiConfig.steal_emoji ?? true,
    content_filtration: emojiConfig.content_filtration ?? false,
    filtration_prompt: emojiConfig.filtration_prompt || '',
  }
}

// 读取其他基础配置
export async function loadOtherBasicConfig(): Promise<OtherBasicConfig> {
  const response = await fetchWithAuth('/api/webui/config/bot', {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('读取其他配置失败')
  }

  const data = await response.json()
  const config = data.config

  const toolConfig = config.tool || {}
  const moodConfig = config.mood || {}
  const jargonConfig = config.jargon || {}

  return {
    enable_tool: toolConfig.enable_tool ?? true,
    enable_mood: moodConfig.enable_mood ?? false,
    mood_update_threshold: moodConfig.mood_update_threshold,
    emotion_style: moodConfig.emotion_style,
    all_global: jargonConfig.all_global ?? true,
  }
}

// 读取模型配置
export async function loadModelBasicConfig(): Promise<ModelBasicConfig> {
  const response = await fetchWithAuth('/api/webui/config/model', {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error('读取模型配置失败')
  }

  const data = await response.json()
  const modelConfig = data.config

  // 获取第一个API提供商作为默认值
  const apiProviders = modelConfig.api_providers || []
  const firstProvider = apiProviders[0] || {}

  // 获取model_task_config
  const taskConfig = modelConfig.model_task_config || {}
  const replyerConfig = taskConfig.replyer || {}
  const plannerConfig = taskConfig.planner || {}
  const utilsConfig = taskConfig.utils || {}

  return {
    api_provider_name: firstProvider.name || '',
    api_provider_base_url: firstProvider.base_url || '',
    api_provider_api_key: firstProvider.api_key || '',
    replyer_model: replyerConfig.model_list?.[0] || '',
    planner_model: plannerConfig.model_list?.[0] || '',
    utils_model: utilsConfig.model_list?.[0] || '',
  }
}

// ===== 保存配置 =====

// 保存Bot基础配置
export async function saveBotBasicConfig(config: BotBasicConfig) {
  const response = await fetchWithAuth('/api/webui/config/bot/section/bot', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(config),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '保存Bot基础配置失败')
  }

  return await response.json()
}

// 保存人格配置
export async function savePersonalityConfig(config: PersonalityConfig) {
  const response = await fetchWithAuth('/api/webui/config/bot/section/personality', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(config),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '保存人格配置失败')
  }

  return await response.json()
}

// 保存表情包配置
export async function saveEmojiConfig(config: EmojiConfig) {
  const response = await fetchWithAuth('/api/webui/config/bot/section/emoji', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(config),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '保存表情包配置失败')
  }

  return await response.json()
}

// 保存其他基础配置（工具、情绪、黑话）
export async function saveOtherBasicConfig(config: OtherBasicConfig) {
  // 需要分别保存到不同的section
  const promises = []

  // 保存tool配置
  promises.push(
    fetchWithAuth('/api/webui/config/bot/section/tool', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ enable_tool: config.enable_tool }),
    })
  )

  // 保存jargon配置
  promises.push(
    fetchWithAuth('/api/webui/config/bot/section/jargon', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ all_global: config.all_global }),
    })
  )

  // 保存mood配置
  const moodConfig: Record<string, unknown> = { enable_mood: config.enable_mood }
  if (config.enable_mood) {
    moodConfig.mood_update_threshold = config.mood_update_threshold || 1
    moodConfig.emotion_style = config.emotion_style || ''
  }
  promises.push(
    fetchWithAuth('/api/webui/config/bot/section/mood', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(moodConfig),
    })
  )

  const results = await Promise.all(promises)

  // 检查所有请求是否成功
  for (const response of results) {
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '保存其他配置失败')
    }
  }

  return { success: true }
}

// 保存模型配置
export async function saveModelBasicConfig(config: ModelBasicConfig) {
  // 1. 先保存API提供商
  const providerResponse = await fetchWithAuth('/api/webui/config/model', {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  if (!providerResponse.ok) {
    throw new Error('读取模型配置失败')
  }

  const currentModelConfig = await providerResponse.json()
  const modelConfig = currentModelConfig.config

  // 检查是否已存在同名提供商
  const apiProviders = modelConfig.api_providers || []
  const existingProviderIndex = apiProviders.findIndex(
    (p: Record<string, unknown>) => p.name === config.api_provider_name
  )

  const newProvider = {
    name: config.api_provider_name,
    base_url: config.api_provider_base_url,
    api_key: config.api_provider_api_key,
    client_type: 'openai', // 默认使用openai兼容客户端
    max_retry: 2,
    timeout: 120,
    retry_interval: 10,
  }

  if (existingProviderIndex >= 0) {
    // 更新现有提供商
    apiProviders[existingProviderIndex] = newProvider
  } else {
    // 添加新提供商
    apiProviders.push(newProvider)
  }

  // 2. 保存模型配置
  const models = modelConfig.models || []

  // 添加基础模型（如果不存在）
  const modelNames = [config.replyer_model, config.planner_model, config.utils_model]
  for (const modelName of modelNames) {
    if (modelName && !models.find((m: Record<string, unknown>) => m.name === modelName)) {
      models.push({
        model_identifier: modelName,
        name: modelName,
        api_provider: config.api_provider_name,
        price_in: 0,
        price_out: 0,
      })
    }
  }

  // 3. 更新model_task_config
  const modelTaskConfig = modelConfig.model_task_config || {}

  if (config.replyer_model) {
    modelTaskConfig.replyer = {
      model_list: [config.replyer_model],
      temperature: 0.7,
      max_tokens: 2048,
    }
  }

  if (config.planner_model) {
    modelTaskConfig.planner = {
      model_list: [config.planner_model],
      temperature: 0.3,
      max_tokens: 800,
    }
  }

  if (config.utils_model) {
    modelTaskConfig.utils = {
      model_list: [config.utils_model],
      temperature: 0.2,
      max_tokens: 2048,
    }
  }

  // 4. 保存完整配置
  const updatedConfig = {
    ...modelConfig,
    api_providers: apiProviders,
    models: models,
    model_task_config: modelTaskConfig,
  }

  const saveResponse = await fetchWithAuth('/api/webui/config/model', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(updatedConfig),
  })

  if (!saveResponse.ok) {
    const error = await saveResponse.json()
    throw new Error(error.detail || '保存模型配置失败')
  }

  return await saveResponse.json()
}

// 标记设置完成
export async function completeSetup() {
  const token = localStorage.getItem('access-token')

  const response = await fetchWithAuth('/api/webui/setup/complete', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || '标记配置完成失败')
  }

  return await response.json()
}
