/**
 * 补货建议仓储接口
 */

import { ReplenishmentSuggestion } from '../entities/ReplenishmentSuggestion';

export interface IReplenishmentRepository {
  /**
   * 根据ID查找补货建议
   */
  findById(id: string): Promise<ReplenishmentSuggestion | null>;

  /**
   * 查询商品的待处理补货建议
   */
  findByItemId(
    itemId: string,
    status?: string
  ): Promise<ReplenishmentSuggestion[]>;

  /**
   * 创建新的补货建议
   */
  create(
    suggestion: Omit<ReplenishmentSuggestion, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ReplenishmentSuggestion>;

  /**
   * 更新补货建议状态
   */
  updateStatus(
    id: string,
    status: string,
    approvedBy?: string
  ): Promise<ReplenishmentSuggestion>;

  /**
   * 关联采购订单
   */
  linkPurchaseOrder(id: string, purchaseOrderId: string): Promise<void>;

  /**
   * 查询待审批的补货建议
   */
  findPendingSuggestions(options?: {
    limit?: number;
    priority?: string;
  }): Promise<ReplenishmentSuggestion[]>;

  /**
   * 删除补货建议
   */
  delete(id: string): Promise<void>;
}
