# Recharts 可视化组件使用指南

**版本**: v1.0
**最后更新**: 2026-04-08

---

## 📦 安装依赖

```bash
npm install recharts --legacy-peer-deps
```

---

## 🎨 可用组件

### 1. SalesForecastChart - 销量预测曲线图

展示历史数据与预测数据的对比，包含置信区间。

#### 使用示例

```tsx
import { SalesForecastChart } from '@/modules/inventory-management/interface-adapters/components';

// 准备数据
const forecastData = [
  // 历史数据
  { date: '2026-04-01', actual: 120, predicted: 118 },
  { date: '2026-04-02', actual: 135, predicted: 132 },
  { date: '2026-04-03', actual: 128, predicted: 125 },
  // 预测数据
  {
    date: '2026-04-09',
    predicted: 145,
    lowerBound: 130,
    upperBound: 160,
  },
  {
    date: '2026-04-10',
    predicted: 152,
    lowerBound: 135,
    upperBound: 169,
  },
];

// 渲染组件
<SalesForecastChart
  data={forecastData}
  title="SKU-001 销量预测"
  description="基于过去90天数据的30天预测"
  height={400}
  showConfidenceInterval={true}
/>;
```

#### Props

| 属性                   | 类型                  | 默认值         | 说明             |
| ---------------------- | --------------------- | -------------- | ---------------- |
| data                   | `ForecastDataPoint[]` | 必填           | 预测数据数组     |
| title                  | `string`              | "销量预测趋势" | 图表标题         |
| description            | `string`              | -              | 图表描述         |
| height                 | `number`              | 400            | 图表高度(px)     |
| showConfidenceInterval | `boolean`             | true           | 是否显示置信区间 |

#### 数据类型

```typescript
interface ForecastDataPoint {
  date: string; // 日期 (YYYY-MM-DD)
  actual?: number; // 实际销量（历史数据）
  predicted: number; // 预测销量
  lowerBound?: number; // 置信区间下界
  upperBound?: number; // 置信区间上界
}
```

---

### 2. InventoryHealthDashboard - 库存健康度仪表板

展示库存状态分布、低库存预警和仓库利用率。

#### 使用示例

```tsx
import { InventoryHealthDashboard } from '@/modules/inventory-management/interface-adapters/components';

// 状态分布数据
const statusDistribution = [
  { status: 'healthy', count: 150, percentage: 75 },
  { status: 'low', count: 30, percentage: 15 },
  { status: 'critical', count: 10, percentage: 5 },
  { status: 'out_of_stock', count: 5, percentage: 2.5 },
  { status: 'overstock', count: 5, percentage: 2.5 },
];

// 低库存商品
const lowStockItems = [
  {
    id: 'item-001',
    sku: 'SKU-001',
    name: '商品A',
    currentStock: 5,
    safetyStock: 10,
    reorderPoint: 30,
    priority: 'high' as const,
  },
  // ...更多商品
];

// 仓库利用率
const warehouseUtilization = [
  {
    id: 'wh-001',
    name: '主仓库',
    capacity: 10000,
    used: 7500,
    utilizationRate: 75,
  },
  // ...更多仓库
];

// 渲染组件
<InventoryHealthDashboard
  statusDistribution={statusDistribution}
  lowStockItems={lowStockItems}
  warehouseUtilization={warehouseUtilization}
  title="库存健康度监控"
/>;
```

#### Props

| 属性                 | 类型                     | 默认值             | 说明           |
| -------------------- | ------------------------ | ------------------ | -------------- |
| statusDistribution   | `InventoryStatus[]`      | 必填               | 库存状态分布   |
| lowStockItems        | `LowStockItem[]`         | 必填               | 低库存商品列表 |
| warehouseUtilization | `WarehouseUtilization[]` | -                  | 仓库利用率数据 |
| title                | `string`                 | "库存健康度仪表板" | 仪表板标题     |

#### 数据类型

```typescript
interface InventoryStatus {
  status: 'healthy' | 'low' | 'critical' | 'out_of_stock' | 'overstock';
  count: number;
  percentage: number;
}

interface LowStockItem {
  id: string;
  sku: string;
  name: string;
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  priority: 'high' | 'medium' | 'low';
}

interface WarehouseUtilization {
  id: string;
  name: string;
  capacity: number;
  used: number;
  utilizationRate: number; // 百分比 (0-100)
}
```

---

### 3. ReplenishmentSuggestionsCard - 智能补货建议卡片

展示AI生成的补货建议，支持一键审批。

#### 使用示例

```tsx
import { ReplenishmentSuggestionsCard } from '@/modules/inventory-management/interface-adapters/components';

// 补货建议数据
const suggestions = [
  {
    id: 'sugg-001',
    itemId: 'item-001',
    sku: 'SKU-001',
    productName: '商品A',
    currentStock: 5,
    safetyStock: 10,
    reorderPoint: 30,
    predictedDemand: 45,
    suggestedQuantity: 50,
    estimatedCost: 4999.5,
    currency: 'CNY',
    priority: 'high' as const,
    status: 'pending' as const,
    reason: '预测未来7天销量为45件，当前库存仅5件，低于安全库存10件',
    supplierName: '供应商A',
    leadTime: 3,
    createdAt: '2026-04-08T02:00:00Z',
    expiresAt: '2026-04-15T02:00:00Z',
  },
  // ...更多建议
];

// 处理审批
const handleApprove = async (id: string, quantity: number) => {
  console.log(`批准补货建议 ${id}, 数量: ${quantity}`);
  // 调用API...
};

const handleReject = async (id: string, reason?: string) => {
  console.log(`拒绝补货建议 ${id}, 原因: ${reason}`);
  // 调用API...
};

// 渲染组件
<ReplenishmentSuggestionsCard
  suggestions={suggestions}
  title="智能补货建议"
  onApprove={handleApprove}
  onReject={handleReject}
  loading={false}
/>;
```

#### Props

| 属性        | 类型                              | 默认值         | 说明         |
| ----------- | --------------------------------- | -------------- | ------------ |
| suggestions | `ReplenishmentSuggestion[]`       | 必填           | 补货建议列表 |
| title       | `string`                          | "智能补货建议" | 卡片标题     |
| onApprove   | `(id, quantity) => Promise<void>` | -              | 批准回调     |
| onReject    | `(id, reason?) => Promise<void>`  | -              | 拒绝回调     |
| loading     | `boolean`                         | false          | 加载状态     |

#### 数据类型

```typescript
interface ReplenishmentSuggestion {
  id: string;
  itemId: string;
  sku: string;
  productName: string;
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  predictedDemand: number;
  suggestedQuantity: number;
  estimatedCost: number;
  currency: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'ordered';
  reason: string;
  supplierName?: string;
  leadTime?: number;
  createdAt: string;
  expiresAt?: string;
}
```

---

## 🎯 完整页面示例

```tsx
'use client';

import { useState, useEffect } from 'react';
import {
  SalesForecastChart,
  InventoryHealthDashboard,
  ReplenishmentSuggestionsCard,
} from '@/modules/inventory-management/interface-adapters/components';

export default function InventoryDashboardPage() {
  const [forecastData, setForecastData] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取数据
    const fetchData = async () => {
      try {
        const [forecast, health, items, sugg] = await Promise.all([
          fetch('/api/inventory/forecast/history?sku=SKU-001').then(r =>
            r.json()
          ),
          fetch('/api/inventory/health/status').then(r => r.json()),
          fetch('/api/inventory/items?status=low').then(r => r.json()),
          fetch('/api/inventory/replenishment/suggestions?status=pending').then(
            r => r.json()
          ),
        ]);

        setForecastData(forecast.data);
        setStatusDistribution(health.data.statusDistribution);
        setLowStockItems(items.data.items);
        setSuggestions(sugg.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">进销存AI仪表板</h1>

      {/* 销量预测 */}
      <SalesForecastChart
        data={forecastData}
        title="SKU-001 销量预测趋势"
        description="基于Prophet模型的30天预测"
      />

      {/* 库存健康度 */}
      <InventoryHealthDashboard
        statusDistribution={statusDistribution}
        lowStockItems={lowStockItems}
        title="库存健康度监控"
      />

      {/* 补货建议 */}
      <ReplenishmentSuggestionsCard
        suggestions={suggestions}
        title="智能补货建议"
        onApprove={async (id, quantity) => {
          // 调用审批API
          await fetch(`/api/inventory/replenishment/${id}/approve`, {
            method: 'POST',
            body: JSON.stringify({ quantity }),
          });
        }}
        onReject={async (id, reason) => {
          // 调用拒绝API
          await fetch(`/api/inventory/replenishment/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
          });
        }}
      />
    </div>
  );
}
```

---

## 🎨 自定义样式

所有组件都使用 Tailwind CSS，可以通过以下方式自定义：

### 修改颜色主题

```tsx
// 在组件中覆盖默认颜色
<SalesForecastChart data={data} className="custom-chart" />
```

```css
/* globals.css */
.custom-chart .recharts-line-dot {
  fill: #your-color;
}
```

### 调整尺寸

```tsx
<SalesForecastChart
  data={data}
  height={500} // 自定义高度
/>
```

---

## 📊 性能优化建议

1. **数据缓存**: 使用 React Query 或 SWR 缓存API数据
2. **懒加载**: 对于大型数据集，考虑虚拟滚动
3. **防抖**: 在用户交互时使用防抖
4. **Memoization**: 使用 `React.memo` 避免不必要的重渲染

```tsx
import { useMemo } from 'react';

const processedData = useMemo(() => {
  return rawData.map(item => ({
    ...item,
    formatted: formatValue(item.value),
  }));
}, [rawData]);
```

---

## 🐛 常见问题

### Q: 图表不显示？

A: 确保：

1. Recharts 已正确安装
2. 数据格式正确
3. 容器有明确的高度

### Q: Tooltip 不显示？

A: 检查数据是否正确传递，确保 `active` 和 `payload` 存在。

### Q: 响应式布局问题？

A: 使用 `ResponsiveContainer` 包裹图表，并确保父容器有明确的高度。

---

## 📚 相关资源

- [Recharts 官方文档](https://recharts.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [shadcn/ui 组件库](https://ui.shadcn.com/)

---

**维护者**: ProdCycleAI Team
**最后更新**: 2026-04-08
