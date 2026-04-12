/**
 * 销量预测曲线图组件
 * 展示历史数据与预测数据的对比，包含置信区间
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface ForecastDataPoint {
  date: string;
  actual?: number;
  predicted: number;
  lowerBound?: number;
  upperBound?: number;
}

interface SalesForecastChartProps {
  data: ForecastDataPoint[];
  title?: string;
  description?: string;
  height?: number;
  showConfidenceInterval?: boolean;
}

export function SalesForecastChart({
  data,
  title = '销量预测趋势',
  description,
  height = 400,
  showConfidenceInterval = true,
}: SalesForecastChartProps) {
  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-semibold text-sm mb-2">{formatDate(label)}</p>
          {data.actual !== undefined && (
            <p className="text-blue-600 text-sm">实际销量: {data.actual}</p>
          )}
          <p className="text-green-600 text-sm">预测销量: {data.predicted}</p>
          {showConfidenceInterval && data.lowerBound && data.upperBound && (
            <>
              <p className="text-gray-500 text-xs mt-1">
                置信区间: {data.lowerBound} - {data.upperBound}
              </p>
              <p className="text-gray-400 text-xs">
                区间宽度: {data.upperBound - data.lowerBound}
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  // 分离历史数据和预测数据
  const historicalData = data.filter(d => d.actual !== undefined);
  const forecastData = data.filter(d => d.actual === undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* 置信区间阴影区域 */}
            {showConfidenceInterval && (
              <Area
                type="monotone"
                dataKey="upperBound"
                stackId="1"
                stroke="none"
                fill="#10b981"
                fillOpacity={0.1}
                name="置信区间"
              />
            )}
            {showConfidenceInterval && (
              <Area
                type="monotone"
                dataKey="lowerBound"
                stackId="1"
                stroke="none"
                fill="#ffffff"
                fillOpacity={1}
                name=""
              />
            )}

            {/* 历史数据线 */}
            {historicalData.length > 0 && (
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="实际销量"
              />
            )}

            {/* 预测数据线 */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name="预测销量"
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* 统计信息 */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground">历史数据点</p>
            <p className="text-lg font-semibold text-blue-600">
              {historicalData.length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">预测数据点</p>
            <p className="text-lg font-semibold text-green-600">
              {forecastData.length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">平均预测销量</p>
            <p className="text-lg font-semibold">
              {Math.round(
                data.reduce((sum, d) => sum + d.predicted, 0) / data.length
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
