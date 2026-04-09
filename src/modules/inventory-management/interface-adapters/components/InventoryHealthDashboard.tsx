/**
 * 库存健康度仪表板组件
 * 展示库存状态分布、低库存预警和仓库利用率
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Package, TrendingDown, Warehouse } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface InventoryStatus {
  status: 'healthy' | 'low' | 'critical' | 'out_of_stock' | 'overstock';
  count: number;
  percentage: number;
}

export interface LowStockItem {
  id: string;
  sku: string;
  name: string;
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  priority: 'high' | 'medium' | 'low';
}

export interface WarehouseUtilization {
  id: string;
  name: string;
  capacity: number;
  used: number;
  utilizationRate: number;
}

interface InventoryHealthDashboardProps {
  statusDistribution: InventoryStatus[];
  lowStockItems: LowStockItem[];
  warehouseUtilization?: WarehouseUtilization[];
  title?: string;
}

const STATUS_COLORS = {
  healthy: '#10b981',
  low: '#f59e0b',
  critical: '#ef4444',
  out_of_stock: '#dc2626',
  overstock: '#8b5cf6',
};

const STATUS_LABELS = {
  healthy: '正常',
  low: '低库存',
  critical: '严重不足',
  out_of_stock: '缺货',
  overstock: '积压',
};

export function InventoryHealthDashboard({
  statusDistribution,
  lowStockItems,
  warehouseUtilization,
  title = '库存健康度仪表板',
}: InventoryHealthDashboardProps) {
  // 状态分布图表数据
  const pieData = statusDistribution.map(item => ({
    name: STATUS_LABELS[item.status],
    value: item.count,
    percentage: item.percentage,
    color: STATUS_COLORS[item.status],
  }));

  // 自定义 Pie Chart Label
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    _index,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // 优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 库存状态分布饼图 */}
            <div>
              <h3 className="text-sm font-semibold mb-4">库存状态分布</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value} 件`,
                      name,
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 仓库利用率柱状图 */}
            {warehouseUtilization && warehouseUtilization.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-4">仓库利用率</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={warehouseUtilization}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tickFormatter={value => `${value}%`} />
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, '利用率']}
                    />
                    <Bar
                      dataKey="utilizationRate"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 低库存预警列表 */}
      {lowStockItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              低库存预警 ({lowStockItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.slice(0, 10).map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{item.name}</span>
                      <Badge variant={getPriorityColor(item.priority) as any}>
                        {item.priority === 'high'
                          ? '紧急'
                          : item.priority === 'medium'
                            ? '中等'
                            : '低'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-x-3">
                      <span>SKU: {item.sku}</span>
                      <span>
                        当前: <strong>{item.currentStock}</strong>
                      </span>
                      <span>安全库存: {item.safetyStock}</span>
                      <span>再订货点: {item.reorderPoint}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-red-600">
                      缺口: {item.reorderPoint - item.currentStock}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      需补货至 {item.reorderPoint}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {lowStockItems.length > 10 && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                还有 {lowStockItems.length - 10} 项未显示
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 统计摘要 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Warehouse className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">
                {statusDistribution.find(s => s.status === 'healthy')?.count ||
                  0}
              </p>
              <p className="text-xs text-muted-foreground">正常库存</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold">
                {statusDistribution.find(s => s.status === 'low')?.count || 0}
              </p>
              <p className="text-xs text-muted-foreground">低库存</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <p className="text-2xl font-bold">
                {(statusDistribution.find(s => s.status === 'critical')
                  ?.count || 0) +
                  (statusDistribution.find(s => s.status === 'out_of_stock')
                    ?.count || 0)}
              </p>
              <p className="text-xs text-muted-foreground">严重不足/缺货</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">
                {statusDistribution.find(s => s.status === 'overstock')
                  ?.count || 0}
              </p>
              <p className="text-xs text-muted-foreground">库存积压</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
