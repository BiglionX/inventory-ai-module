/**
 * Supabase库存仓储实现
 */

import { supabase } from '@/lib/supabase';
import { InventoryItem } from '../../domain/entities/InventoryItem';
import { IInventoryRepository } from '../../domain/repositories/IInventoryRepository';

export class SupabaseInventoryRepository implements IInventoryRepository {
  private readonly tableName = 'foreign_trade_inventory';

  /**
   * 根据ID查找库存项
   */
  async findById(id: string): Promise<InventoryItem | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error finding inventory item by ID:', error);
      return null;
    }
  }

  /**
   * 根据SKU查找库存项
   */
  async findBySku(sku: string): Promise<InventoryItem | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('sku', sku)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error finding inventory item by SKU:', error);
      return null;
    }
  }

  /**
   * 查询库存列表(支持分页和筛选)
   */
  async findAll(options?: {
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
  }> {
    try {
      const page = options?.page ?? 1;
      const pageSize = options?.pageSize ?? 20;
      const offset = (page - 1) * pageSize;

      let query = supabase.from(this.tableName).select('*', { count: 'exact' });

      // 应用筛选条件
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.warehouseId) {
        query = query.eq('warehouse_id', options.warehouseId);
      }
      if (options?.search) {
        query = query.or(
          `sku.ilike.%${options.search}%,product_name.ilike.%${options.search}%`
        );
      }

      // 应用分页
      query = query
        .range(offset, offset + pageSize - 1)
        .order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const items = (data || []).map((item: any) => this.mapToEntity(item));

      return {
        items,
        total: count || 0,
        page,
        pageSize,
      };
    } catch (error) {
      console.error('Error fetching inventory list:', error);
      throw error;
    }
  }

  /**
   * 创建新库存项
   */
  async create(
    item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<InventoryItem> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          sku: item.sku,
          product_name: item.productName,
          quantity: item.quantity,
          warehouse_id: item.warehouseId,
          status: item.status,
          safety_stock: item.safetyStock,
          reorder_point: item.reorderPoint,
          lead_time_days: item.leadTimeDays,
          forecast_enabled: item.forecastEnabled,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  /**
   * 更新库存项
   */
  async update(
    id: string,
    updates: Partial<InventoryItem>
  ): Promise<InventoryItem> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.sku !== undefined) updateData.sku = updates.sku;
      if (updates.productName !== undefined)
        updateData.product_name = updates.productName;
      if (updates.quantity !== undefined)
        updateData.quantity = updates.quantity;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.safetyStock !== undefined)
        updateData.safety_stock = updates.safetyStock;
      if (updates.reorderPoint !== undefined)
        updateData.reorder_point = updates.reorderPoint;
      if (updates.leadTimeDays !== undefined)
        updateData.lead_time_days = updates.leadTimeDays;
      if (updates.forecastEnabled !== undefined)
        updateData.forecast_enabled = updates.forecastEnabled;

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  /**
   * 删除库存项
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }

  /**
   * 批量更新库存
   */
  async batchUpdate(
    updates: Array<{ id: string; quantity: number }>
  ): Promise<void> {
    try {
      // Supabase不支持批量更新,需要逐个执行
      const promises = updates.map(async ({ id, quantity }) => {
        await supabase
          .from(this.tableName)
          .update({
            quantity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Error batch updating inventory:', error);
      throw error;
    }
  }

  /**
   * 查询低库存商品
   */
  async findLowStockItems(): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .lte('quantity', supabase.raw('COALESCE(safety_stock, 0)'))
        .gt('quantity', 0);

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map((item: any) => this.mapToEntity(item));
    } catch (error) {
      console.error('Error finding low stock items:', error);
      return [];
    }
  }

  /**
   * 查询需要补货的商品
   */
  async findItemsNeedingReplenishment(): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .lte('quantity', supabase.raw('COALESCE(reorder_point, 0)'));

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map((item: any) => this.mapToEntity(item));
    } catch (error) {
      console.error('Error finding items needing replenishment:', error);
      return [];
    }
  }

  /**
   * 更新库存预测信息
   */
  async updateForecastInfo(
    itemId: string,
    safetyStock: number,
    reorderPoint: number,
    leadTimeDays: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          safety_stock: safetyStock,
          reorder_point: reorderPoint,
          lead_time_days: leadTimeDays,
          last_forecast_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error updating forecast info:', error);
      throw error;
    }
  }

  /**
   * 将数据库记录映射为领域实体
   */
  private mapToEntity(record: any): InventoryItem {
    return InventoryItem.create({
      id: record.id,
      sku: record.sku,
      productName: record.product_name,
      quantity: record.quantity,
      warehouseId: record.warehouse_id,
      status: record.status,
      safetyStock: record.safety_stock,
      reorderPoint: record.reorder_point,
      leadTimeDays: record.lead_time_days,
      forecastEnabled: record.forecast_enabled,
      lastForecastDate: record.last_forecast_date
        ? new Date(record.last_forecast_date)
        : undefined,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    });
  }
}
