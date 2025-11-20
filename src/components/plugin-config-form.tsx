import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import type { PluginConfigItem } from '@/types/plugin-config';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2 } from 'lucide-react';

export interface PluginConfigFormRef {
  submit: () => Promise<void>;
}

interface PluginConfigFormProps {
  configSchema: PluginConfigItem[];
  onSubmit: (values: Record<string, any>) => Promise<void>;
  onChange?: (isDirty: boolean) => void;
  onValuesChange?: (values: Record<string, any>) => void;
}

// 获取默认值
const getDefaultValue = (type: string, _elementType?: string) => {
  if (type === 'array') return [];
  if (type === 'object') return {};
  if (type === 'switch' || type === 'bool') return false;
  if (type === 'number' || type === 'int' || type === 'float') return 0;
  return '';
};

// 递归渲染配置项
const ConfigItemRenderer = ({ 
  item, 
  value, 
  onChange, 
  disabled = false 
}: { 
  item: PluginConfigItem; 
  value: any; 
  onChange: (val: any) => void;
  disabled?: boolean;
}) => {
  const type = item.type as string;

  if (type === 'switch' || type === 'bool') {
    return (
      <Switch
        checked={Boolean(value)}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    );
  }

  if (type === 'select' && item.options) {
    return (
      <Select
        value={String(value || '')}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="请选择" />
        </SelectTrigger>
        <SelectContent>
          {item.options.map((opt: any) => (
            <SelectItem key={String(opt)} value={String(opt)}>
              {String(opt)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (type === 'array') {
    return (
      <SmartArrayInput
        value={value}
        onChange={onChange}
        itemSchema={item}
        disabled={disabled}
      />
    );
  }

  if (type === 'object' || item.element_type === 'object') {
    return (
      <ObjectInput
        value={value}
        onChange={onChange}
        schema={item.field_schema}
        disabled={disabled}
      />
    );
  }

  if (type === 'number' || type === 'int' || type === 'float') {
    return (
      <Input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
      />
    );
  }

  // Default to text input
  return (
    <Input
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  );
};

// 智能数组输入组件
const SmartArrayInput = ({ 
  value, 
  onChange, 
  itemSchema,
  disabled 
}: { 
  value: any[]; 
  onChange: (val: any[]) => void;
  itemSchema: PluginConfigItem;
  disabled?: boolean;
}) => {
  const list = Array.isArray(value) ? value : [];
  const elementType = itemSchema.element_type || 'string';
  const isComplex = elementType === 'object' || itemSchema.is_complex;

  const handleAdd = () => {
    const defaultValue = isComplex 
      ? (itemSchema.field_schema ? {} : {}) // 如果有 schema，应该根据 schema 生成默认值，这里简化处理
      : getDefaultValue(elementType);
    
    // 如果是对象且有 schema，预填充默认值
    if (isComplex && itemSchema.field_schema) {
       const newObj: Record<string, any> = {};
       Object.entries(itemSchema.field_schema).forEach(([key, schema]) => {
          newObj[key] = schema.default ?? getDefaultValue(schema.type, schema.element_type);
       });
       onChange([...list, newObj]);
    } else {
       onChange([...list, defaultValue]);
    }
  };

  const handleRemove = (index: number) => {
    const newList = [...list];
    newList.splice(index, 1);
    onChange(newList);
  };

  const handleItemChange = (index: number, val: any) => {
    const newList = [...list];
    newList[index] = val;
    onChange(newList);
  };

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {list.map((item, index) => (
          <div key={index} className="flex items-start gap-2 group relative">
            <div className="flex-1">
              {isComplex ? (
                <Card className="p-3 bg-muted/30">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-muted-foreground">项目 {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemove(index)}
                        disabled={disabled}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                   </div>
                   <ConfigItemRenderer
                      item={{ ...itemSchema, type: 'object' }} // 强制渲染为对象
                      value={item}
                      onChange={(val) => handleItemChange(index, val)}
                      disabled={disabled}
                   />
                </Card>
              ) : (
                <div className="flex items-center gap-2">
                   <div className="flex-1">
                      <ConfigItemRenderer
                        item={{ ...itemSchema, type: elementType as any }} // 临时构造一个 item 用于渲染子项
                        value={item}
                        onChange={(val) => handleItemChange(index, val)}
                        disabled={disabled}
                      />
                   </div>
                   <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(index)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        添加项
      </Button>
    </div>
  );
};

// 对象输入组件
const ObjectInput = ({ 
  value, 
  onChange, 
  schema,
  disabled 
}: { 
  value: Record<string, any>; 
  onChange: (val: Record<string, any>) => void;
  schema?: Record<string, PluginConfigItem>;
  disabled?: boolean;
}) => {
  const objValue = value || {};

  if (!schema) {
    return (
      <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
        复杂对象暂不支持无 Schema 编辑，请直接编辑配置文件。
        <pre className="text-xs mt-1 overflow-auto max-h-20">{JSON.stringify(objValue, null, 2)}</pre>
      </div>
    );
  }

  const handleFieldChange = (key: string, val: any) => {
    onChange({ ...objValue, [key]: val });
  };

  return (
    <div className="grid gap-4 p-1">
      {Object.entries(schema).map(([key, fieldItem]) => (
        <div key={key} className="grid gap-1.5">
          <Label className="text-xs font-medium flex items-center gap-1">
            {fieldItem.label || key}
            {fieldItem.required && <span className="text-red-500">*</span>}
          </Label>
          {fieldItem.description && (
            <p className="text-[10px] text-muted-foreground">{fieldItem.description}</p>
          )}
          <ConfigItemRenderer
            item={fieldItem}
            value={objValue[key]}
            onChange={(val) => handleFieldChange(key, val)}
            disabled={disabled}
          />
        </div>
      ))}
    </div>
  );
};

export const PluginConfigForm = forwardRef<PluginConfigFormRef, PluginConfigFormProps>(({ configSchema, onSubmit, onChange, onValuesChange }, ref) => {
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [initialValues, setInitialValues] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // 初始化表单值
  useEffect(() => {
    const initVals: Record<string, any> = {};
    configSchema.forEach(item => {
      initVals[item.key] = item.value;
    });
    setFormValues(initVals);
    setInitialValues(initVals);
    onChange?.(false);
  }, [configSchema]);

  const handleChange = (key: string, value: any) => {
    setFormValues(prev => {
      const next = { ...prev, [key]: value };
      // 检查是否变脏
      const isDirty = JSON.stringify(next) !== JSON.stringify(initialValues);
      onChange?.(isDirty);
      onValuesChange?.(next);
      return next;
    });
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(formValues);
      // 更新初始值，重置脏状态
      setInitialValues(formValues);
      onChange?.(false);
      toast({
        title: "配置已保存",
        description: "插件配置更新成功",
      });
    } catch (error) {
      toast({
        title: "保存失败",
        description: String(error),
        variant: "destructive",
      });
      throw error; // Re-throw to let caller know it failed
    } finally {
      setIsSubmitting(false);
    }
  };

  useImperativeHandle(ref, () => ({
    submit: submitForm
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm();
  };

  // 提取插件启用开关
  // 后端返回 key 是 "section.field"，label 是 "field"
  const pluginEnabledItem = configSchema.find(item => item.section === 'plugin' && item.label === 'enabled');
  
  // 提取 plugin section 下的其他信息项（只读显示）
  const pluginInfoItems = configSchema.filter(item => item.section === 'plugin' && item.label !== 'enabled');

  // 过滤掉已特殊处理的项 (enabled) 和不需要显示的项 (config_version)
  // 实际上，整个 plugin section 都已经在上方处理了，所以这里直接过滤掉整个 plugin section
  const mainConfigSchema = configSchema.filter(item => item.section !== 'plugin');

  // 按 section 分组
  const sections = Array.from(new Set(mainConfigSchema.map(item => item.section)));

  if (configSchema.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4 text-muted-foreground">
        <div className="p-4 bg-muted/50 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings-2"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
        </div>
        <div className="text-center">
          <p className="font-medium">此插件没有可配置项</p>
          <p className="text-sm mt-1">该插件可能未定义 config_schema 或使用了非标准的配置方式。</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 插件状态开关 - 独立显示 */}
      {pluginEnabledItem && (
        <Card className="border-primary/20 shadow-sm bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              插件状态
              <span className={`text-xs px-2 py-0.5 rounded-full ${formValues[pluginEnabledItem.key] ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                {formValues[pluginEnabledItem.key] ? '已启用' : '已禁用'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor={pluginEnabledItem.key} className="text-base font-medium">
                  {pluginEnabledItem.label || "启用插件"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {pluginEnabledItem.description || "控制插件是否加载和运行"}
                </p>
              </div>
              <Switch
                id={pluginEnabledItem.key}
                checked={formValues[pluginEnabledItem.key] || false}
                onCheckedChange={(checked) => handleChange(pluginEnabledItem.key, checked)}
              />
            </div>
            
            {/* 显示 plugin section 下的其他只读信息 */}
            {pluginInfoItems.length > 0 && (
              <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pluginInfoItems.map(item => (
                  <div key={item.key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground font-normal">
                      {item.label}
                    </Label>
                    <div className="text-sm font-medium">
                      {String(item.value)}
                    </div>
                    {item.description && (
                      <p className="text-[10px] text-muted-foreground/70 truncate" title={item.description}>
                        {item.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {sections.map(section => (
        <Card key={section}>
          <CardHeader>
            <CardTitle className="text-lg font-medium capitalize">{section}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mainConfigSchema
              .filter(item => item.section === section)
              .map(item => (
                <div key={item.key} className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={item.key} className="text-sm font-medium flex items-center gap-1">
                      {item.label}
                      {item.required && <span className="text-red-500">*</span>}
                    </Label>
                    {/* 如果是 switch 类型，直接在标题行显示开关 */}
                    {item.type === 'switch' && (
                      <Switch
                        id={item.key}
                        checked={formValues[item.key] || false}
                        onCheckedChange={(checked) => handleChange(item.key, checked)}
                      />
                    )}
                  </div>
                  
                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}

                  {/* 使用通用的渲染器 */}
                  {item.type !== 'switch' && (
                    <ConfigItemRenderer
                      item={item}
                      value={formValues[item.key]}
                      onChange={(val) => handleChange(item.key, val)}
                    />
                  )}
                </div>
              ))}
          </CardContent>
        </Card>
      ))}
      
      <div className="flex justify-end sticky bottom-0 bg-background p-4 border-t z-10 shadow-[0_-1px_4px_rgba(0,0,0,0.1)] dark:shadow-[0_-1px_4px_rgba(0,0,0,0.5)]">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '保存中...' : '保存配置'}
        </Button>
      </div>
    </form>
  );
});
PluginConfigForm.displayName = "PluginConfigForm";
