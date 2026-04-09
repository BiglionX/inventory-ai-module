import { SalesForecast } from '../entities/SalesForecast';

/**
 * 销售预测仓储接口 (Sales Forecast Repository Interface)
 */
export interface ISalesForecastRepository {
  /**
   * 根据 ID 查找预测记录
   */
  findById(id: string): Promise<SalesForecast | null>;

  /**
   * 查询特定商品在特定日期范围内的预测
   */
  findByItemAndDateRange(
    itemId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SalesForecast[]>;

  /**
   * 保存预测记录
   */
  save(forecast: SalesForecast): Promise<SalesForecast>;

  /**
   * 批量保存预测记录
   */
  saveMany(forecasts: SalesForecast[]): Promise<void>;

  /**
   * 删除过期的预测记录
   */
  deleteOlderThan(date: Date): Promise<void>;
}
