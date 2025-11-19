// 带自动认证处理的 fetch 封装

/**
 * 增强的 fetch 函数，自动处理 401 错误并跳转到登录页
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init)

  // 检测 401 未授权错误
  if (response.status === 401) {
    // 清除本地存储的 token
    localStorage.removeItem('access-token')

    // 跳转到登录页
    window.location.href = '/auth'

    // 抛出错误以便调用者可以处理
    throw new Error('认证失败，请重新登录')
  }

  return response
}

/**
 * 获取带认证头的请求配置
 */
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access-token')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}
