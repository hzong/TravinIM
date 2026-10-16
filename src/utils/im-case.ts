/** snake_case → camelCase（仅一层 key，嵌套对象递归） */
export function snakeToCamelKey(key: string): string {
  if (key === 'to_from_id') {
    return 'toId'
  }
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

export function deepSnakeToCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(deepSnakeToCamel)
  }
  if (obj && typeof obj === 'object' && !(obj instanceof FormData)) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[snakeToCamelKey(k)] = deepSnakeToCamel(v)
    }
    return out
  }
  return obj
}

function camelToSnakeKey(key: string): string {
  if (key === 'toId') {
    return 'to_from_id'
  }
  return key.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`)
}

/** camelCase → snake_case，供旧版 LumenIM 页面继续用 talk_mode 等字段 */
export function deepCamelToSnake(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(deepCamelToSnake)
  }
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[camelToSnakeKey(k)] = deepCamelToSnake(v)
    }
    return out
  }
  return obj
}
