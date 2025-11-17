/**
 * 全局日志 WebSocket 管理器
 * 确保整个应用只有一个 WebSocket 连接
 */

export interface LogEntry {
  id: string
  timestamp: string
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  module: string
  message: string
}

type LogCallback = (log: LogEntry) => void
type ConnectionCallback = (connected: boolean) => void

class LogWebSocketManager {
  private ws: WebSocket | null = null
  private reconnectTimeout: number | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private heartbeatInterval: number | null = null
  
  // 订阅者
  private logCallbacks: Set<LogCallback> = new Set()
  private connectionCallbacks: Set<ConnectionCallback> = new Set()
  
  private isConnected = false

  /**
   * 获取 WebSocket URL
   */
  private getWebSocketUrl(): string {
    if (import.meta.env.DEV) {
      // 开发模式：直接连接到后端端口
      return 'ws://127.0.0.1:8000/ws/logs'
    } else {
      // 生产模式：使用当前页面的 host
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      return `${protocol}//${host}/ws/logs`
    }
  }

  /**
   * 连接 WebSocket
   */
  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket 已经连接或正在连接中')
      return
    }

    const wsUrl = this.getWebSocketUrl()
    console.log('正在连接日志 WebSocket:', wsUrl)

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('✅ 日志 WebSocket 已连接')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.notifyConnection(true)
        this.startHeartbeat()
      }

      this.ws.onmessage = (event) => {
        try {
          // 忽略心跳响应
          if (event.data === 'pong') {
            return
          }
          
          const log: LogEntry = JSON.parse(event.data)
          this.notifyLog(log)
        } catch (error) {
          console.error('解析日志消息失败:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket 错误:', error)
        this.isConnected = false
        this.notifyConnection(false)
      }

      this.ws.onclose = () => {
        console.log('📡 WebSocket 已断开')
        this.isConnected = false
        this.notifyConnection(false)
        this.stopHeartbeat()
        this.attemptReconnect()
      }
    } catch (error) {
      console.error('创建 WebSocket 连接失败:', error)
      this.attemptReconnect()
    }
  }

  /**
   * 尝试重连
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ 已达到最大重连次数，请检查后端服务是否正常运行')
      return
    }

    this.reconnectAttempts += 1
    const delay = Math.min(1000 * this.reconnectAttempts, 10000)
    console.log(`将在 ${delay / 1000} 秒后尝试第 ${this.reconnectAttempts} 次重连...`)

    this.reconnectTimeout = window.setTimeout(() => {
      this.connect()
    }, delay)
  }

  /**
   * 启动心跳
   */
  private startHeartbeat() {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('ping')
      }
    }, 30000) // 每30秒发送一次心跳
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    this.stopHeartbeat()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.isConnected = false
    this.reconnectAttempts = 0
  }

  /**
   * 订阅日志消息
   */
  onLog(callback: LogCallback) {
    this.logCallbacks.add(callback)
    return () => this.logCallbacks.delete(callback)
  }

  /**
   * 订阅连接状态
   */
  onConnectionChange(callback: ConnectionCallback) {
    this.connectionCallbacks.add(callback)
    // 立即通知当前状态
    callback(this.isConnected)
    return () => this.connectionCallbacks.delete(callback)
  }

  /**
   * 通知所有订阅者新日志
   */
  private notifyLog(log: LogEntry) {
    this.logCallbacks.forEach(callback => {
      try {
        callback(log)
      } catch (error) {
        console.error('日志回调执行失败:', error)
      }
    })
  }

  /**
   * 通知所有订阅者连接状态变化
   */
  private notifyConnection(connected: boolean) {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected)
      } catch (error) {
        console.error('连接状态回调执行失败:', error)
      }
    })
  }

  /**
   * 获取当前连接状态
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }
}

// 导出单例
export const logWebSocket = new LogWebSocketManager()

// 自动连接（应用启动时）
if (typeof window !== 'undefined') {
  logWebSocket.connect()
}
