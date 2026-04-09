/**
 * 预测仓储接口
 * 定义销售预测数据访问契约
 */

import { SalesForecast } from '../entities/SalesForecast';

export interface IForecastRepository {
  /**
   * 根据ID查找预测记录
   */
  findById(id: string): Promise<SalesForecast | null>;

  /**
   * 查询商品的预测历史
   */
  findByItemId(
    itemId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<SalesForecast[]>;

  /**
   * 创建新的预测记录
   */
  create(
    forecast: Omit<SalesForecast, 'id' | 'createdAt'>
  ): Promise<SalesForecast>;

  /**
   * 批量创建预测记录
   */
  batchCreate(
    forecasts: Array<Omit<SalesForecast, 'id' | 'createdAt'>>
  ): Promise<void>;

  /**
   * 删除指定日期之前的旧预测
   */
  deleteOldForecasts(beforeDate: Date): Promise<number>;

  /**
   * 获取最新的预测
   */
  getLatestForecast(itemId: string): Promise<SalesForecast | null>;

  /**
   * 获取未来N天的预测汇总
   */
  getFutureForecastSummary(
    itemId: string,
    days: number
  ): Promise<{
    totalPredicted: number;
    averageDaily: number;
    peakDay: Date | null;
    peakQuantity: number;
  }>;
}
