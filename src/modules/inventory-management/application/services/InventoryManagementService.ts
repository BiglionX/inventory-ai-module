import {
  InventoryItem,
  InventoryStatus,
} from '../../domain/entities/InventoryItem';
import { IInventoryRepository } from '../../domain/repositories/IInventoryRepository';

/**
 * 库存管理应用服务 (Inventory Management Application Service)
 * 负责协调领域对象完成具体的业务用例
 */
export class InventoryManagementService {
  constructor(private inventoryRepo: IInventoryRepository) {}

  /**
   * 创建新的库存项
   */
  async createInventoryItem(data: {
    tenantId: string;
    sku: string;
    name: string;
    unitPrice: number;
    quantity: number;
    safetyStock?: number;
    reorderPoint?: number;
    currency?: string;
  }): Promise<InventoryItem> {
    // 检查 SKU 是否已存在
    const existing = await this.inventoryRepo.findBySku(
      data.sku,
      data.tenantId
    );
    if (existing) {
      throw new Error(`Inventory item with SKU ${data.sku} already exists.`);
    }

    const item = new InventoryItem({
      id: crypto.randomUUID(),
      ...data,
      reservedQuantity: 0,
      safetyStock: data.safetyStock || 0,
      reorderPoint: data.reorderPoint || 0,
      currency: data.currency || 'CNY',
      status:
        data.quantity > 0
          ? InventoryStatus.IN_STOCK
          : InventoryStatus.OUT_OF_STOCK,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.inventoryRepo.save(item);
  }

  /**
   * 预留库存（用于订单处理）
   */
  async reserveStock(itemId: string, quantity: number): Promise<InventoryItem> {
    const item = await this.inventoryRepo.findById(itemId);
    if (!item) {
      throw new Error('Inventory item not found.');
    }

    item.reserve(quantity);
    return this.inventoryRepo.save(item);
  }

  /**
   * 释放预留库存
   */
  async releaseStock(itemId: string, quantity: number): Promise<InventoryItem> {
    const item = await this.inventoryRepo.findById(itemId);
    if (!item) {
      throw new Error('Inventory item not found.');
    }

    item.releaseReservation(quantity);
    return this.inventoryRepo.save(item);
  }

  /**
   * 更新库存数量（入库或出库）
   */
  async updateStock(
    itemId: string,
    newQuantity: number
  ): Promise<InventoryItem> {
    const item = await this.inventoryRepo.findById(itemId);
    if (!item) {
      throw new Error('Inventory item not found.');
    }

    item.updateQuantity(newQuantity);
    return this.inventoryRepo.save(item);
  }

  /**
   * 获取低库存预警列表
   */
  async getLowStockAlerts(tenantId: string): Promise<InventoryItem[]> {
    const { items } = await this.inventoryRepo.findAll(tenantId, {
      limit: 100,
      status: InventoryStatus.LOW_STOCK,
    });
    return items;
  }
}
