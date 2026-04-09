/**
 * 销售预测领域实体
 */

export interface SalesForecastProps {
  id?: string;
  itemId: string;
  forecastDate: Date;
  predictedQuantity: number;
  lowerBound?: number;
  upperBound?: number;
  confidenceLevel?: number;
  modelVersion?: string;
  createdAt?: Date;
}

export class SalesForecast {
  private props: SalesForecastProps;

  constructor(props: SalesForecastProps) {
    this.props = props;
    this.validate();
  }

  private validate(): void {
    if (!this.props.itemId) {
      throw new Error('商品ID不能为空');
    }
    if (this.props.predictedQuantity < 0) {
      throw new Error('预测数量不能为负数');
    }
    if (
      this.props.confidenceLevel !== undefined &&
      (this.props.confidenceLevel < 0 || this.props.confidenceLevel > 1)
    ) {
      throw new Error('置信度必须在0-1之间');
    }
    if (
      this.props.lowerBound !== undefined &&
      this.props.upperBound !== undefined &&
      this.props.lowerBound > this.props.upperBound
    ) {
      throw new Error('置信区间下界不能大于上界');
    }
  }

  // Getters
  get id(): string | undefined {
    return this.props.id;
  }

  get itemId(): string {
    return this.props.itemId;
  }

  get forecastDate(): Date {
    return this.props.forecastDate;
  }

  get predictedQuantity(): number {
    return this.props.predictedQuantity;
  }

  get lowerBound(): number | undefined {
    return this.props.lowerBound;
  }

  get upperBound(): number | undefined {
    return this.props.upperBound;
  }

  get confidenceLevel(): number {
    return this.props.confidenceLevel ?? 0.95;
  }

  get modelVersion(): string {
    return this.props.modelVersion ?? 'prophet-1.1.5';
  }

  get createdAt(): Date {
    return this.props.createdAt ?? new Date();
  }

  /**
   * 获取预测范围(upper - lower)
   */
  get predictionRange(): number | undefined {
    if (
      this.props.lowerBound !== undefined &&
      this.props.upperBound !== undefined
    ) {
      return this.props.upperBound - this.props.lowerBound;
    }
    return undefined;
  }

  /**
   * 判断预测是否可靠(基于置信区间宽度)
   * @param threshold 阈值,默认20%
   */
  isReliable(threshold: number = 0.2): boolean {
    if (!this.predictionRange || this.props.predictedQuantity === 0) {
      return true;
    }
    const relativeRange = this.predictionRange / this.props.predictedQuantity;
    return relativeRange <= threshold;
  }

  /**
   * 转换为普通对象
   */
  toObject(): SalesForecastProps {
    return { ...this.props };
  }

  /**
   * 从普通对象创建实体
   */
  static create(props: SalesForecastProps): SalesForecast {
    return new SalesForecast(props);
  }
}
