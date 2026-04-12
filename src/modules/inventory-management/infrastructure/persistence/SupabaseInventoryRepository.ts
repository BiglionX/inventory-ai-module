import { supabase } from '@/lib/supabase';
import {
  InventoryItem,
  InventoryStatus,
} from '../../domain/entities/InventoryItem';
import { IInventoryRepository } from '../../domain/repositories/IInventoryRepository';

/**
 * Supabase 库存仓储实现 (Supabase Inventory Repository Implementation)
 */
export class SupabaseInventoryRepository implements IInventoryRepository {
  private tableName = 'foreign_trade_inventory'; // 根据迁移脚本确定的表名

  async findById(id: string): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findBySku(
    sku: string,
    tenantId: string
  ): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('sku', sku)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async save(item: InventoryItem): Promise<InventoryItem> {
    const payload = this.mapToPayload(item);

    const { data, error } = await supabase
      .from(this.tableName)
      .upsert(payload)
      .select()
      .single();

    if (error)
      throw new Error(`Failed to save inventory item: ${error.message}`);
    return this.mapToEntity(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(this.tableName).delete().eq('id', id);

    if (error)
      throw new Error(`Failed to delete inventory item: ${error.message}`);
  }

  async findAll(
    tenantId: string,
    options?: {
      limit?: number;
      offset?: number;
      category?: string;
      status?: string;
    }
  ): Promise<{ items: InventoryItem[]; total: number }> {
    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (options?.category) {
      query = query.eq('category', options.category);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error)
      throw new Error(`Failed to fetch inventory items: ${error.message}`);

    return {
      items: (data || []).map(this.mapToEntity),
      total: count || 0,
    };
  }

  async batchUpdateStatus(
    updates: { id: string; quantity: number }[]
  ): Promise<void> {
    // Supabase 批量更新需要通过循环或 RPC 实现，这里简化为逐个更新
    for (const update of updates) {
      await supabase
        .from(this.tableName)
        .update({
          quantity: update.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', update.id);
    }
  }

  // 映射辅助函数：数据库记录 -> 领域实体
  private mapToEntity(record: any): InventoryItem {
    return new InventoryItem({
      id: record.id,
      tenantId: record.tenant_id,
      sku: record.sku,
      name: record.name,
      description: record.description,
      category: record.category,
      brand: record.brand,
      model: record.model,
      unitPrice: record.unit_price || 0,
      currency: record.currency || 'CNY',
      quantity: record.quantity || 0,
      reservedQuantity: record.reserved_quantity || 0,
      safetyStock: record.safety_stock || 0,
      reorderPoint: record.reorder_point || 0,
      status: record.status as InventoryStatus,
      locationId: record.location_id,
      warehouseId: record.warehouse_id,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    });
  }

  // 映射辅助函数：领域实体 -> 数据库负载
  private mapToPayload(item: InventoryItem): any {
    return {
      id: item.id,
      tenant_id: item.tenantId,
      sku: item.sku,
      name: item.name,
      description: item.description,
      category: item.category,
      brand: item.brand,
      model: item.model,
      unit_price: item.unitPrice,
      currency: item.currency,
      quantity: item.quantity,
      reserved_quantity: item.reservedQuantity,
      safety_stock: item.safetyStock,
      reorder_point: item.reorderPoint,
      status: item.status,
      location_id: item.locationId,
      warehouse_id: item.warehouseId,
      updated_at: new Date().toISOString(),
    };
  }
}
