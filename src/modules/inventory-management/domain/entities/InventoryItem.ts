/**
 * 库存项领域实体
 * 包含核心业务逻辑和验证规则
 */

export interface InventoryItemProps {
  id: string;
  sku: string;
  productName: string;
  quantity: number;
  warehouseId?: string;
  status: InventoryStatus;
  safetyStock?: number;
  reorderPoint?: number;
  leadTimeDays?: number;
  forecastEnabled?: boolean;
  lastForecastDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type InventoryStatus =
  | 'normal' // 正常
  | 'low_stock' // 低库存
  | 'out_of_stock' // 缺货
  | 'overstock'; // 积压

export class InventoryItem {
  private props: InventoryItemProps;

  constructor(props: InventoryItemProps) {
    this.props = props;
    this.validate();
  }

  /**
   * 验证库存项数据的完整性
   */
  private validate(): void {
    if (!this.props.sku || this.props.sku.trim().length === 0) {
      throw new Error('SKU不能为空');
    }
    if (!this.props.productName || this.props.productName.trim().length === 0) {
      throw new Error('商品名称不能为空');
    }
    if (this.props.quantity < 0) {
      throw new Error('库存数量不能为负数');
    }
    if (this.props.safetyStock !== undefined && this.props.safetyStock < 0) {
      throw new Error('安全库存不能为负数');
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get sku(): string {
    return this.props.sku;
  }

  get productName(): string {
    return this.props.productName;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get warehouseId(): string | undefined {
    return this.props.warehouseId;
  }

  get status(): InventoryStatus {
    return this.props.status;
  }

  get safetyStock(): number | undefined {
    return this.props.safetyStock;
  }

  get reorderPoint(): number | undefined {
    return this.props.reorderPoint;
  }

  get leadTimeDays(): number | undefined {
    return this.props.leadTimeDays;
  }

  get forecastEnabled(): boolean {
    return this.props.forecastEnabled ?? true;
  }

  get lastForecastDate(): Date | undefined {
    return this.props.lastForecastDate;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * 判断是否为低库存状态
   */
  isLowStock(): boolean {
    if (this.props.safetyStock === undefined) {
      return false;
    }
    return this.props.quantity <= this.props.safetyStock;
  }

  /**
   * 判断是否需要补货
   */
  needsReplenishment(): boolean {
    if (this.props.reorderPoint === undefined) {
      return false;
    }
    return this.props.quantity <= this.props.reorderPoint;
  }

  /**
   * 判断是否缺货
   */
  isOutOfStock(): boolean {
    return this.props.quantity <= 0;
  }

  /**
   * 判断是否积压
   */
  isOverstock(): boolean {
    if (this.props.reorderPoint === undefined) {
      return false;
    }
    return this.props.quantity > this.props.reorderPoint * 2;
  }

  /**
   * 计算建议补货数量
   * @param forecastedDemand 预测需求量
   * @returns 建议补货数量
   */
  calculateSuggestedQuantity(forecastedDemand: number): number {
    const targetStock = this.props.reorderPoint || this.props.safetyStock || 0;
    const suggested = Math.max(
      0,
      targetStock + forecastedDemand - this.props.quantity
    );
    return Math.ceil(suggested);
  }

  /**
   * 更新库存数量
   * @param newQuantity 新库存数量
   */
  updateQuantity(newQuantity: number): void {
    if (newQuantity < 0) {
      throw new Error('库存数量不能为负数');
    }
    this.props.quantity = newQuantity;
    this.updateStatus();
    this.props.updatedAt = new Date();
  }

  /**
   * 入库操作
   * @param amount 入库数量
   */
  stockIn(amount: number): void {
    if (amount <= 0) {
      throw new Error('入库数量必须大于0');
    }
    this.props.quantity += amount;
    this.updateStatus();
    this.props.updatedAt = new Date();
  }

  /**
   * 出库操作
   * @param amount 出库数量
   */
  stockOut(amount: number): void {
    if (amount <= 0) {
      throw new Error('出库数量必须大于0');
    }
    if (amount > this.props.quantity) {
      throw new Error('出库数量不能超过当前库存');
    }
    this.props.quantity -= amount;
    this.updateStatus();
    this.props.updatedAt = new Date();
  }

  /**
   * 更新预测相关字段
   */
  updateForecastInfo(
    safetyStock: number,
    reorderPoint: number,
    leadTimeDays: number
  ): void {
    this.props.safetyStock = safetyStock;
    this.props.reorderPoint = reorderPoint;
    this.props.leadTimeDays = leadTimeDays;
    this.props.lastForecastDate = new Date();
    this.updateStatus();
    this.props.updatedAt = new Date();
  }

  /**
   * 根据当前库存自动更新状态
   */
  private updateStatus(): void {
    if (this.isOutOfStock()) {
      this.props.status = 'out_of_stock';
    } else if (this.isLowStock()) {
      this.props.status = 'low_stock';
    } else if (this.isOverstock()) {
      this.props.status = 'overstock';
    } else {
      this.props.status = 'normal';
    }
  }

  /**
   * 转换为普通对象
   */
  toObject(): InventoryItemProps {
    return { ...this.props };
  }

  /**
   * 从普通对象创建实体
   */
  static create(props: InventoryItemProps): InventoryItem {
    return new InventoryItem(props);
  }
}
