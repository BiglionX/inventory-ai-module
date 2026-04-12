/**
 * 库存仓储接口
 * 定义库存项的数据访问契约
 */

import { InventoryItem } from '../entities/InventoryItem';

export interface IInventoryRepository {
  /**
   * 根据ID查找库存项
   */
  findById(id: string): Promise<InventoryItem | null>;

  /**
   * 根据SKU查找库存项
   */
  findBySku(sku: string): Promise<InventoryItem | null>;

  /**
   * 查询库存列表(支持分页和筛选)
   */
  findAll(options?: {
    page?: number;
    pageSize?: number;
    status?: string;
    warehouseId?: string;
    search?: string;
  }): Promise<{
    items: InventoryItem[];
    total: number;
    page: number;
    pageSize: number;
  }>;

  /**
   * 创建新库存项
   */
  create(
    item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<InventoryItem>;

  /**
   * 更新库存项
   */
  update(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem>;

  /**
   * 删除库存项
   */
  delete(id: string): Promise<void>;

  /**
   * 批量更新库存
   */
  batchUpdate(updates: Array<{ id: string; quantity: number }>): Promise<void>;

  /**
   * 查询低库存商品
   */
  findLowStockItems(): Promise<InventoryItem[]>;

  /**
   * 查询需要补货的商品
   */
  findItemsNeedingReplenishment(): Promise<InventoryItem[]>;

  /**
   * 更新库存预测信息
   */
  updateForecastInfo(
    itemId: string,
    safetyStock: number,
    reorderPoint: number,
    leadTimeDays: number
  ): Promise<void>;
}
