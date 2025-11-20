/**
 * 插件配置项类型定义
 */
export interface PluginConfigItem {
  key: string;
  label: string;
  value: any;
  description: string;
  section: string;
  required: boolean;
  default: any;
  type: 'input' | 'number' | 'switch' | 'select' | 'array' | 'object';
  options?: any[];
  element_type?: string; // 数组元素的类型: 'string', 'number', 'object' 等
  field_schema?: Record<string, PluginConfigItem>; // 当 type 或 element_type 为 'object' 时的字段定义
  is_complex?: boolean; // 是否为复杂类型
}

/**
 * 插件配置响应类型
 */
export interface PluginConfigResponse {
  success: boolean;
  data: PluginConfigItem[];
  error?: string;
}
