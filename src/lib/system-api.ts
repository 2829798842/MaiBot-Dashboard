import apiClient from './api'

/**
 * 系统控制 API
 */

/**
 * 重启麦麦主程序
 */
export async function restartMaiBot(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiClient.post('/api/webui/system/restart')
    return response.data
  } catch (error) {
    console.error('重启麦麦失败:', error)
    throw error
  }
}

/**
 * 检查麦麦运行状态
 */
export async function getMaiBotStatus(): Promise<{
  running: boolean
  uptime: number
  version: string
}> {
  try {
    const response = await apiClient.get('/api/webui/system/status')
    return response.data
  } catch (error) {
    console.error('获取麦麦状态失败:', error)
    throw error
  }
}
