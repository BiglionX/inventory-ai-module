/**
 * 补货建议领域实体
 */

export type ReplenishmentPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ReplenishmentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'ordered';

export interface ReplenishmentSuggestionProps {
  id?: string;
  itemId: string;
  suggestedQuantity: number;
  reason?: string;
  priority?: ReplenishmentPriority;
  status?: ReplenishmentStatus;
  forecastData?: any;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  purchaseOrderId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ReplenishmentSuggestion {
  private props: ReplenishmentSuggestionProps;

  constructor(props: ReplenishmentSuggestionProps) {
    this.props = props;
    this.validate();
  }

  private validate(): void {
    if (!this.props.itemId) {
      throw new Error('商品ID不能为空');
    }
    if (this.props.suggestedQuantity <= 0) {
      throw new Error('建议补货数量必须大于0');
    }
    const validPriorities: ReplenishmentPriority[] = [
      'low',
      'medium',
      'high',
      'urgent',
    ];
    if (this.props.priority && !validPriorities.includes(this.props.priority)) {
      throw new Error('无效的优先级');
    }
    const validStatuses: ReplenishmentStatus[] = [
      'pending',
      'approved',
      'rejected',
      'ordered',
    ];
    if (this.props.status && !validStatuses.includes(this.props.status)) {
      throw new Error('无效的状态');
    }
  }

  // Getters
  get id(): string | undefined {
    return this.props.id;
  }

  get itemId(): string {
    return this.props.itemId;
  }

  get suggestedQuantity(): number {
    return this.props.suggestedQuantity;
  }

  get reason(): string | undefined {
    return this.props.reason;
  }

  get priority(): ReplenishmentPriority {
    return this.props.priority ?? 'medium';
  }

  get status(): ReplenishmentStatus {
    return this.props.status ?? 'pending';
  }

  get forecastData(): any {
    return this.props.forecastData;
  }

  get createdBy(): string | undefined {
    return this.props.createdBy;
  }

  get approvedBy(): string | undefined {
    return this.props.approvedBy;
  }

  get approvedAt(): Date | undefined {
    return this.props.approvedAt;
  }

  get purchaseOrderId(): string | undefined {
    return this.props.purchaseOrderId;
  }

  get createdAt(): Date {
    return this.props.createdAt ?? new Date();
  }

  get updatedAt(): Date {
    return this.props.updatedAt ?? new Date();
  }

  /**
   * 判断是否为紧急补货
   */
  isUrgent(): boolean {
    return this.props.priority === 'urgent';
  }

  /**
   * 判断是否可以审批
   */
  canApprove(): boolean {
    return this.props.status === 'pending';
  }

  /**
   * 批准补货建议
   * @param approvedBy 审批人ID
   */
  approve(approvedBy: string): void {
    if (!this.canApprove()) {
      throw new Error('只有待审批状态的建议才能被批准');
    }
    this.props.status = 'approved';
    this.props.approvedBy = approvedBy;
    this.props.approvedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * 拒绝补货建议
   * @param rejectedBy 拒绝人ID
   */
  reject(rejectedBy: string): void {
    if (!this.canApprove()) {
      throw new Error('只有待审批状态的建议才能被拒绝');
    }
    this.props.status = 'rejected';
    this.props.approvedBy = rejectedBy;
    this.props.approvedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * 标记为已下单
   * @param purchaseOrderId 采购订单ID
   */
  markAsOrdered(purchaseOrderId: string): void {
    if (this.props.status !== 'approved') {
      throw new Error('只有已批准的建议才能标记为已下单');
    }
    this.props.status = 'ordered';
    this.props.purchaseOrderId = purchaseOrderId;
    this.props.updatedAt = new Date();
  }

  /**
   * 更新推荐理由
   */
  updateReason(reason: string): void {
    this.props.reason = reason;
    this.props.updatedAt = new Date();
  }

  /**
   * 获取优先级数值(用于排序)
   */
  getPriorityValue(): number {
    const priorityMap: Record<ReplenishmentPriority, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return priorityMap[this.priority];
  }

  /**
   * 转换为普通对象
   */
  toObject(): ReplenishmentSuggestionProps {
    return { ...this.props };
  }

  /**
   * 从普通对象创建实体
   */
  static create(props: ReplenishmentSuggestionProps): ReplenishmentSuggestion {
    return new ReplenishmentSuggestion(props);
  }
}
