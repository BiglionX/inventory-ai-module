/**
 * Redis缓存服务 - 进销存AI集成模块
 *
 * 提供统一的缓存接口，支持:
 * - 库存列表缓存
 * - 预测结果缓存
 * - 补货建议缓存
 * - 自动过期管理
 */

import { redis } from '@/lib/redis';

// 缓存键前缀
const CACHE_PREFIX = 'inventory:';

// 缓存键生成器
export const CacheKeys = {
  // 库存列表
  inventoryList: (tenantId: string, filters?: any) => {
    const filterStr = filters ? JSON.stringify(filters) : 'all';
    return `${CACHE_PREFIX}list:${tenantId}:${filterStr}`;
  },

  // 库存项详情
  inventoryItem: (itemId: string) => {
    return `${CACHE_PREFIX}item:${itemId}`;
  },

  // 销量预测
  forecast: (sku: string, days: number) => {
    return `${CACHE_PREFIX}forecast:${sku}:${days}`;
  },

  // 补货建议
  replenishmentSuggestions: (tenantId: string) => {
    return `${CACHE_PREFIX}replenishment:${tenantId}`;
  },

  // 仓库信息
  warehouse: (warehouseId: string) => {
    return `${CACHE_PREFIX}warehouse:${warehouseId}`;
  },

  // 仓库利用率
  warehouseUtilization: (warehouseId: string) => {
    return `${CACHE_PREFIX}warehouse-util:${warehouseId}`;
  },
};

// 缓存TTL配置(秒)
export const CacheTTL = {
  INVENTORY_LIST: 300, // 5分钟
  INVENTORY_ITEM: 180, // 3分钟
  FORECAST_RESULT: 3600, // 1小时
  REPLENISHMENT_SUGGESTIONS: 1800, // 30分钟
  WAREHOUSE_INFO: 600, // 10分钟
  WAREHOUSE_UTILIZATION: 900, // 15分钟
};

/**
 * 从缓存获取数据
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as T;
  } catch (error) {
    console.error(`[Cache] 读取缓存失败 [${key}]:`, error);
    return null;
  }
}

/**
 * 将数据写入缓存
 */
export async function setToCache<T>(
  key: string,
  data: T,
  ttl: number = CacheTTL.INVENTORY_LIST
): Promise<void> {
  try {
    const serialized = JSON.stringify(data);
    await redis.setex(key, ttl, serialized);
  } catch (error) {
    console.error(`[Cache] 写入缓存失败 [${key}]:`, error);
  }
}

/**
 * 删除缓存
 */
export async function deleteFromCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error(`[Cache] 删除缓存失败 [${key}]:`, error);
  }
}

/**
 * 批量删除匹配模式的缓存
 */
export async function deletePatternCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(`${CACHE_PREFIX}${pattern}`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error(`[Cache] 批量删除缓存失败 [${pattern}]:`, error);
  }
}

/**
 * 带缓存的数据获取函数装饰器
 *
 * @param cacheKey 缓存键
 * @param ttl 缓存过期时间(秒)
 * @param fetchFn 数据获取函数
 */
export async function withCache<T>(
  cacheKey: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // 尝试从缓存获取
  const cached = await getFromCache<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // 缓存未命中，执行查询
  const data = await fetchFn();

  // 写入缓存
  await setToCache(cacheKey, data, ttl);

  return data;
}

/**
 * 使库存相关缓存失效
 */
export async function invalidateInventoryCache(
  tenantId?: string,
  itemId?: string
): Promise<void> {
  if (itemId) {
    // 删除单个商品缓存
    await deleteFromCache(CacheKeys.inventoryItem(itemId));
  }

  if (tenantId) {
    // 删除租户下所有库存列表缓存
    await deletePatternCache(`list:${tenantId}:*`);
    // 删除补货建议缓存
    await deleteFromCache(CacheKeys.replenishmentSuggestions(tenantId));
  }
}

/**
 * 使预测缓存失效
 */
export async function invalidateForecastCache(sku: string): Promise<void> {
  // 删除所有天数的预测缓存
  await deletePatternCache(`forecast:${sku}:*`);
}

/**
 * 清理所有库存缓存(谨慎使用)
 */
export async function clearAllInventoryCache(): Promise<void> {
  try {
    const keys = await redis.keys(`${CACHE_PREFIX}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[Cache] 已清理 ${keys.length} 个库存缓存键`);
    }
  } catch (error) {
    console.error('[Cache] 清理所有缓存失败:', error);
  }
}

/**
 * 获取缓存统计信息
 */
export async function getCacheStats(): Promise<{
  totalKeys: number;
  memoryUsage: string;
}> {
  try {
    const keys = await redis.keys(`${CACHE_PREFIX}*`);
    const info = await redis.info('memory');

    // 解析内存使用情况
    const memoryMatch = info.match(/used_memory_human:(.+)/);
    const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'unknown';

    return {
      totalKeys: keys.length,
      memoryUsage,
    };
  } catch (error) {
    console.error('[Cache] 获取统计信息失败:', error);
    return {
      totalKeys: 0,
      memoryUsage: 'error',
    };
  }
}
