/**
 * Supabase预测仓储实现
 */

import { supabase } from '@/lib/supabase';
import { SalesForecast } from '../../domain/entities/SalesForecast';
import { IForecastRepository } from '../../domain/repositories/IForecastRepository';

export class SupabaseForecastRepository implements IForecastRepository {
  private readonly tableName = 'sales_forecasts';

  /**
   * 根据ID查找预测记录
   */
  async findById(id: string): Promise<SalesForecast | null> {
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
      console.error('Error finding forecast by ID:', error);
      return null;
    }
  }

  /**
   * 查询商品的预测历史
   */
  async findByItemId(
    itemId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<SalesForecast[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .eq('item_id', itemId);

      if (options?.startDate) {
        query = query.gte(
          'forecast_date',
          options.startDate.toISOString().split('T')[0]
        );
      }
      if (options?.endDate) {
        query = query.lte(
          'forecast_date',
          options.endDate.toISOString().split('T')[0]
        );
      }

      query = query.order('forecast_date', { ascending: true });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return (data || []).map((item: any) => this.mapToEntity(item));
    } catch (error) {
      console.error('Error finding forecasts by item ID:', error);
      return [];
    }
  }

  /**
   * 创建新的预测记录
   */
  async create(
    forecast: Omit<SalesForecast, 'id' | 'createdAt'>
  ): Promise<SalesForecast> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          item_id: forecast.itemId,
          forecast_date: forecast.forecastDate.toISOString().split('T')[0],
          predicted_quantity: forecast.predictedQuantity,
          lower_bound: forecast.lowerBound,
          upper_bound: forecast.upperBound,
          confidence_level: forecast.confidenceLevel,
          model_version: forecast.modelVersion,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error creating forecast:', error);
      throw error;
    }
  }

  /**
   * 批量创建预测记录
   */
  async batchCreate(
    forecasts: Array<Omit<SalesForecast, 'id' | 'createdAt'>>
  ): Promise<void> {
    try {
      const records = forecasts.map(forecast => ({
        item_id: forecast.itemId,
        forecast_date: forecast.forecastDate.toISOString().split('T')[0],
        predicted_quantity: forecast.predictedQuantity,
        lower_bound: forecast.lowerBound,
        upper_bound: forecast.upperBound,
        confidence_level: forecast.confidenceLevel,
        model_version: forecast.modelVersion,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from(this.tableName).insert(records);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error batch creating forecasts:', error);
      throw error;
    }
  }

  /**
   * 删除指定日期之前的旧预测
   */
  async deleteOldForecasts(beforeDate: Date): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(this.tableName)
        .delete()
        .lt('forecast_date', beforeDate.toISOString().split('T')[0])
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw new Error(error.message);
      }

      return count || 0;
    } catch (error) {
      console.error('Error deleting old forecasts:', error);
      throw error;
    }
  }

  /**
   * 获取最新的预测
   */
  async getLatestForecast(itemId: string): Promise<SalesForecast | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('item_id', itemId)
        .gte('forecast_date', new Date().toISOString().split('T')[0])
        .order('forecast_date', { ascending: true })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return this.mapToEntity(data);
    } catch (error) {
      console.error('Error getting latest forecast:', error);
      return null;
    }
  }

  /**
   * 获取未来N天的预测汇总
   */
  async getFutureForecastSummary(
    itemId: string,
    days: number
  ): Promise<{
    totalPredicted: number;
    averageDaily: number;
    peakDay: Date | null;
    peakQuantity: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from(this.tableName)
        .select('forecast_date, predicted_quantity')
        .eq('item_id', itemId)
        .gte('forecast_date', today)
        .lte('forecast_date', futureDateStr)
        .order('forecast_date', { ascending: true });

      if (error || !data || data.length === 0) {
        return {
          totalPredicted: 0,
          averageDaily: 0,
          peakDay: null,
          peakQuantity: 0,
        };
      }

      const totalPredicted = data.reduce(
        (sum: number, item: any) => sum + item.predicted_quantity,
        0
      );
      const averageDaily = Math.round(totalPredicted / data.length);

      const peakItem = data.reduce((max: any, item: any) =>
        item.predicted_quantity > max.predicted_quantity ? item : max
      );

      return {
        totalPredicted,
        averageDaily,
        peakDay: new Date(peakItem.forecast_date),
        peakQuantity: peakItem.predicted_quantity,
      };
    } catch (error) {
      console.error('Error getting forecast summary:', error);
      return {
        totalPredicted: 0,
        averageDaily: 0,
        peakDay: null,
        peakQuantity: 0,
      };
    }
  }

  /**
   * 将数据库记录映射为领域实体
   */
  private mapToEntity(record: any): SalesForecast {
    return SalesForecast.create({
      id: record.id,
      itemId: record.item_id,
      forecastDate: new Date(record.forecast_date),
      predictedQuantity: record.predicted_quantity,
      lowerBound: record.lower_bound,
      upperBound: record.upper_bound,
      confidenceLevel: record.confidence_level,
      modelVersion: record.model_version,
      createdAt: new Date(record.created_at),
    });
  }
}
