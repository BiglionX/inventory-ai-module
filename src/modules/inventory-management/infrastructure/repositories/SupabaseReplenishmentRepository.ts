/**
 * Supabase补货建议仓储实现
 */

import { supabase } from '@/lib/supabase';
import { ReplenishmentSuggestion } from '../../domain/entities/ReplenishmentSuggestion';
import { IReplenishmentRepository } from '../../domain/repositories/IReplenishmentRepository';

export class SupabaseReplenishmentRepository implements IReplenishmentRepository {
  private readonly tableName = 'replenishment_suggestions';

  /**
   * 根据ID查找补货建议
   */
  async findById(id: string): Promise<ReplenishmentSuggestion | null> {
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
      console.error('Error finding replenishment suggestion by ID:', error);
      return null;
    }
  }

  /**
   * 查询商品的待处理补货建议
   */
  async findByItemId(
    itemId: string,
    status?: string
  ): Promise<ReplenishmentSuggestion[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .eq('item_id', itemId);

      if (status) {
        query = query.eq('status', status);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map((item: any) => this.mapToEntity(item));
    } catch (error) {
      console.error(
        'Error finding replenishment suggestions by item ID:',
        error
      );
      return [];
    }
  }

  /**
   * 创建新的补货建议
   */
  async create(
    suggestion: Omit<ReplenishmentSuggestion, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ReplenishmentSuggestion> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          item_id: suggestion.itemId,
          suggested_quantity: suggestion.suggestedQuantity,
          reason: suggestion.reason,
          priority: suggestion.priority,
          status: suggestion.status,
          forecast_data: suggestion.forecastData,
          created_by: suggestion.createdBy,
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
      console.error('Error creating replenishment suggestion:', error);
      throw error;
    }
  }

  /**
   * 更新补货建议状态
   */
  async updateStatus(
    id: string,
    status: string,
    approvedBy?: string
  ): Promise<ReplenishmentSuggestion> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (approvedBy) {
        updateData.approved_by = approvedBy;
        updateData.approved_at = new Date().toISOString();
      }

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
      console.error('Error updating replenishment suggestion status:', error);
      throw error;
    }
  }

  /**
   * 关联采购订单
   */
  async linkPurchaseOrder(id: string, purchaseOrderId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          purchase_order_id: purchaseOrderId,
          status: 'ordered',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error linking purchase order:', error);
      throw error;
    }
  }

  /**
   * 查询待审批的补货建议
   */
  async findPendingSuggestions(options?: {
    limit?: number;
    priority?: string;
  }): Promise<ReplenishmentSuggestion[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .eq('status', 'pending');

      if (options?.priority) {
        query = query.eq('priority', options.priority);
      }

      // 按优先级降序排列(urgent > high > medium > low)
      query = query
        .order('priority', { ascending: false })
        .limit(options?.limit || 50);

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map((item: any) => this.mapToEntity(item));
    } catch (error) {
      console.error('Error finding pending suggestions:', error);
      return [];
    }
  }

  /**
   * 删除补货建议
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
      console.error('Error deleting replenishment suggestion:', error);
      throw error;
    }
  }

  /**
   * 将数据库记录映射为领域实体
   */
  private mapToEntity(record: any): ReplenishmentSuggestion {
    return ReplenishmentSuggestion.create({
      id: record.id,
      itemId: record.item_id,
      suggestedQuantity: record.suggested_quantity,
      reason: record.reason,
      priority: record.priority,
      status: record.status,
      forecastData: record.forecast_data,
      createdBy: record.created_by,
      approvedBy: record.approved_by,
      approvedAt: record.approved_at ? new Date(record.approved_at) : undefined,
      purchaseOrderId: record.purchase_order_id,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    });
  }
}
