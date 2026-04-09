/**
 * Repository模块导出
 */

// 接口
export type { IForecastRepository } from '../../domain/repositories/IForecastRepository';
export type { IInventoryRepository } from '../../domain/repositories/IInventoryRepository';
export type { IReplenishmentRepository } from '../../domain/repositories/IReplenishmentRepository';

// Supabase实现
export { SupabaseForecastRepository } from './SupabaseForecastRepository';
export { SupabaseInventoryRepository } from './SupabaseInventoryRepository';
export { SupabaseReplenishmentRepository } from './SupabaseReplenishmentRepository';

// 工厂函数 - 用于创建Repository实例
import { SupabaseForecastRepository } from './SupabaseForecastRepository';
import { SupabaseInventoryRepository } from './SupabaseInventoryRepository';
import { SupabaseReplenishmentRepository } from './SupabaseReplenishmentRepository';

export function createRepositories() {
  return {
    inventory: new SupabaseInventoryRepository(),
    forecast: new SupabaseForecastRepository(),
    replenishment: new SupabaseReplenishmentRepository(),
  };
}
