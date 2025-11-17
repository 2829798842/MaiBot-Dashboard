/**
 * 人物信息管理 API
 */
import type {
  PersonListResponse,
  PersonDetailResponse,
  PersonUpdateRequest,
  PersonUpdateResponse,
  PersonDeleteResponse,
  PersonStatsResponse,
} from '@/types/person'

const API_BASE = '/api/webui/person'

/**
 * 获取认证 header
 */
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access-token')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

/**
 * 获取人物信息列表
 */
export async function getPersonList(params: {
  page?: number
  page_size?: number
  search?: string
  is_known?: boolean
  platform?: string
}): Promise<PersonListResponse> {
  const queryParams = new URLSearchParams()
  
  if (params.page) queryParams.append('page', params.page.toString())
  if (params.page_size) queryParams.append('page_size', params.page_size.toString())
  if (params.search) queryParams.append('search', params.search)
  if (params.is_known !== undefined) queryParams.append('is_known', params.is_known.toString())
  if (params.platform) queryParams.append('platform', params.platform)
  
  const response = await fetch(`${API_BASE}/list?${queryParams}`, {
    headers: getAuthHeaders(),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '获取人物列表失败')
  }
  
  return response.json()
}

/**
 * 获取人物详细信息
 */
export async function getPersonDetail(personId: string): Promise<PersonDetailResponse> {
  const response = await fetch(`${API_BASE}/${personId}`, {
    headers: getAuthHeaders(),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '获取人物详情失败')
  }
  
  return response.json()
}

/**
 * 更新人物信息（增量更新）
 */
export async function updatePerson(
  personId: string,
  data: PersonUpdateRequest
): Promise<PersonUpdateResponse> {
  const response = await fetch(`${API_BASE}/${personId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '更新人物信息失败')
  }
  
  return response.json()
}

/**
 * 删除人物信息
 */
export async function deletePerson(personId: string): Promise<PersonDeleteResponse> {
  const response = await fetch(`${API_BASE}/${personId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '删除人物信息失败')
  }
  
  return response.json()
}

/**
 * 获取人物统计数据
 */
export async function getPersonStats(): Promise<PersonStatsResponse> {
  const response = await fetch(`${API_BASE}/stats/summary`, {
    headers: getAuthHeaders(),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || '获取统计数据失败')
  }
  
  return response.json()
}
