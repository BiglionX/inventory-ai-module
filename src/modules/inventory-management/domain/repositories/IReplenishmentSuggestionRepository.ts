import { ReplenishmentSuggestion } from '../entities/ReplenishmentSuggestion';

/**
 * 补货建议仓储接口 (Replenishment Suggestion Repository Interface)
 */
export interface IReplenishmentSuggestionRepository {
  /**
   * 根据 ID 查找建议
   */
  findById(id: string): Promise<ReplenishmentSuggestion | null>;

  /**
   * 查询待处理的补货建议
   */
  findPendingSuggestions(tenantId: string): Promise<ReplenishmentSuggestion[]>;

  /**
   * 保存补货建议
   */
  save(suggestion: ReplenishmentSuggestion): Promise<ReplenishmentSuggestion>;

  /**
   * 更新建议状态
   */
  updateStatus(
    id: string,
    status: string,
    approverId?: string
  ): Promise<ReplenishmentSuggestion>;
}
