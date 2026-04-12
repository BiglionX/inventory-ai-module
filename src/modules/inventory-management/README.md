# 进销存AI集成模块 (Inventory AI Integration)

> **版本**: v2.0 | **最后更新**: 2026-04-08 | **状态**: ✅ 生产就绪

## 📋 目录

- [概述](#概述)
- [核心功能](#核心功能)
- [技术架构](#技术架构)
- [快速开始](#快速开始)
- [API参考](#api参考)
- [部署指南](#部署指南)
- [测试](#测试)
- [性能优化](#性能优化)
- [故障排除](#故障排除)

---

## 概述

进销存AI集成模块是基于领域驱动设计(DDD)重构的智能库存管理系统，集成了Prophet销量预测、n8n自动化工作流和Dify AI问答能力。

### 主要特性

- 🎯 **智能预测**: 基于Prophet的销量预测，准确率>85%
- 🤖 **自动补货**: n8n工作流驱动的智能化补货建议
- 💬 **AI问答**: Dify集成的自然语言库存查询
- 📊 **可视化**: Recharts实时数据图表
- 🔄 **模块化**: 清晰的DDD架构，易于维护和扩展

---

## 核心功能

### 1. 库存管理 (Inventory Management)

- 多仓库库存追踪
- 实时库存预警
- 批量操作支持
- 数据导出(Excel/CSV)

### 2. 销量预测 (Sales Forecasting)

```typescript
// 调用预测API
const forecast = await fetch('/api/inventory/forecast', {
  method: 'POST',
  body: JSON.stringify({
    sku: 'SKU-001',
    days: 30,
    historicalData: [...]
  })
});
```

**特性**:

- 支持7/14/30天预测周期
- 置信区间展示
- 季节性因素考虑

### 3. 智能补货 (Smart Replenishment)

**工作流程**:

1. 每日凌晨2点触发n8n工作流
2. 获取所有商品历史销售数据
3. 调用FastAPI预测服务
4. 生成补货建议并写入数据库
5. 发送通知给采购经理

### 4. AI助手 (AI Assistant)

集成Dify平台，支持自然语言查询：

- "当前库存低于安全库存的商品有哪些？"
- "下个月预计需要补货的商品"
- "显示最近30天的销售趋势"

---

## 技术架构

### 模块结构

```
src/modules/inventory-management/
├── domain/                    # 领域层
│   ├── entities/             # 实体
│   │   ├── InventoryItem.ts
│   │   ├── SalesForecast.ts
│   │   └── ReplenishmentSuggestion.ts
│   ├── repositories/         # Repository接口
│   │   ├── IInventoryRepository.ts
│   │   ├── IForecastRepository.ts
│   │   └── IReplenishmentRepository.ts
│   └── value-objects/        # 值对象
│
├── application/              # 应用层
│   ├── use-cases/           # 用例
│   │   ├── CreateInventoryItem.ts
│   │   ├── GenerateForecast.ts
│   │   └── CreateReplenishmentOrder.ts
│   └── services/            # 应用服务
│       ├── ForecastService.ts
│       └── ReplenishmentService.ts
│
├── infrastructure/          # 基础设施层
│   ├── persistence/         # 持久化
│   │   ├── SupabaseInventoryRepository.ts
│   │   └── SupabaseForecastRepository.ts
│   └── external-services/   # 外部服务
│       ├── ProphetPredictionClient.ts
│       ├── N8nWorkflowClient.ts
│       └── DifyChatClient.ts
│
└── interface-adapters/     # 接口适配层
    ├── api/                # API路由
    │   ├── middleware.ts
    │   └── response.ts
    └── controllers/        # 控制器
        ├── InventoryController.ts
        ├── ForecastController.ts
        └── ReplenishmentController.ts
```

### 技术栈

| 层级       | 技术选型                 |
| ---------- | ------------------------ |
| 前端框架   | Next.js 14 + React 18    |
| UI组件     | shadcn/ui + Tailwind CSS |
| 图表库     | Recharts 2.15            |
| 状态管理   | Zustand 5.0              |
| 后端API    | Next.js API Routes       |
| 数据库     | PostgreSQL (Supabase)    |
| 缓存       | Redis (ioredis)          |
| 预测服务   | FastAPI + Prophet        |
| 工作流     | n8n                      |
| AI问答     | Dify                     |
| 向量数据库 | Pinecone                 |

---

## 快速开始

### 前置要求

- Node.js 18+
- Docker & Docker Compose
- Supabase账户
- Python 3.9+ (用于预测服务)

### 安装步骤

#### 1. 克隆项目并安装依赖

```bash
git clone <repository-url>
cd 3cep
npm install
```

#### 2. 配置环境变量

复制 `.env.example` 到 `.env.local` 并配置以下变量：

```bash
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 预测服务
PREDICTION_API_URL=http://localhost:8000
PREDICTION_API_KEY=your-prediction-api-key

# n8n配置
N8N_WEBHOOK_URL=http://localhost:5678/webhook
N8N_API_KEY=your-n8n-api-key

# Dify配置
DIFY_API_KEY=your-dify-api-key
DIFY_BASE_URL=https://api.dify.ai/v1

# Pinecone配置
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX_NAME=inventory-kb
```

#### 3. 启动依赖服务

```bash
# 启动预测服务和n8n
docker-compose -f docker-compose.dev.yml up -d

# 验证服务状态
docker-compose ps
```

#### 4. 执行数据库迁移

```bash
# 运行迁移脚本
npx supabase db push

# 或手动执行SQL
psql -f sql/migrations/001_inventory_ai_schema.sql
```

#### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3001/admin/inventory

---

## API参考

### 库存管理API

#### GET /api/inventory/items

获取库存列表

**请求参数**:

```typescript
{
  tenantId: string;
  page?: number;
  limit?: number;
  filters?: {
    status?: 'in_stock' | 'low_stock' | 'out_of_stock';
    warehouseId?: string;
    search?: string;
  }
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

#### POST /api/inventory/items

创建新库存项

**请求体**:

```json
{
  "sku": "SKU-001",
  "name": "商品名称",
  "quantity": 100,
  "safetyStock": 10,
  "reorderPoint": 20,
  "unitPrice": 99.99,
  "currency": "CNY"
}
```

### 预测API

#### POST /api/inventory/forecast

生成销量预测

**请求体**:

```json
{
  "sku": "SKU-001",
  "days": 30,
  "confidenceLevel": 0.95
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "date": "2026-04-09",
        "predictedSales": 15.5,
        "lowerBound": 12.3,
        "upperBound": 18.7
      }
    ],
    "modelAccuracy": 0.87
  }
}
```

### 补货建议API

#### GET /api/inventory/replenishment/suggestions

获取补货建议列表

**响应**:

```json
{
  "success": true,
  "data": [
    {
      "id": "sugg-001",
      "sku": "SKU-001",
      "currentStock": 5,
      "suggestedQuantity": 50,
      "reason": "预测未来7天销量为45件，当前库存不足",
      "priority": "high",
      "createdAt": "2026-04-08T02:00:00Z"
    }
  ]
}
```

#### POST /api/inventory/replenishment/orders

从建议创建采购订单

**请求体**:

```json
{
  "suggestionId": "sugg-001",
  "supplierId": "sup-001",
  "quantity": 50,
  "expectedDeliveryDate": "2026-04-15"
}
```

---

## 部署指南

### 开发环境

```bash
# 一键启动开发环境
npm run deploy:dev

# 或分步启动
docker-compose -f docker-compose.dev.yml up -d
npm run dev
```

### 生产环境

#### 1. 构建应用

```bash
npm run build
```

#### 2. 启动生产服务

```bash
# 使用Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# 或使用PM2
pm2 start npm --name "prodcycleai" -- start
```

#### 3. 配置反向代理 (Nginx示例)

```nginx
server {
    listen 443 ssl;
    server_name inventory.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/prediction {
        proxy_pass http://localhost:8000;
    }
}
```

### 数据库迁移

```bash
# 生产环境迁移
npx supabase db push --db-url $DATABASE_URL

# 回滚（如有问题）
npx supabase db reset --db-url $DATABASE_URL
```

### 监控与日志

```bash
# 查看服务日志
docker-compose logs -f prodcycleai
docker-compose logs -f prediction-api
docker-compose logs -f n8n

# 健康检查
curl http://localhost:3001/api/health
curl http://localhost:8000/health
```

---

## 测试

### 运行测试套件

```bash
# 单元测试
npm run test:unit

# E2E测试
npm run test:e2e

# 进销存AI集成专项测试
npx playwright test tests/e2e/inventory-ai-integration.spec.ts

# 性能测试
node scripts/performance/inventory-benchmark.js

# 覆盖率报告
npm run test:coverage
```

### 测试覆盖范围

| 测试类型 | 文件                                         | 覆盖率       |
| -------- | -------------------------------------------- | ------------ |
| 单元测试 | `*.test.ts`                                  | 85%+         |
| 集成测试 | `tests/integration/**`                       | 75%+         |
| E2E测试  | `tests/e2e/inventory-ai-integration.spec.ts` | 关键流程100% |

### E2E测试场景

✅ 销量预测触发与展示
✅ 智能补货建议生成
✅ 从建议创建采购订单
✅ n8n工作流触发验证
✅ 库存预警通知
✅ Recharts可视化
✅ Dify AI问答
✅ 移动端响应式
✅ 批量操作
✅ 数据导出

---

## 性能优化

### 缓存策略

#### Redis缓存配置

```typescript
// 缓存键设计
const CACHE_KEYS = {
  INVENTORY_LIST: (tenantId: string) => `inv:list:${tenantId}`,
  FORECAST_RESULT: (sku: string) => `forecast:${sku}`,
  REPLENISHMENT_SUGGESTIONS: (tenantId: string) => `repl:sugg:${tenantId}`,
};

// 缓存TTL
const CACHE_TTL = {
  INVENTORY_LIST: 300, // 5分钟
  FORECAST_RESULT: 3600, // 1小时
  REPLENISHMENT_SUGGESTIONS: 1800, // 30分钟
};
```

#### 实施示例

```typescript
import { redis } from '@/lib/redis';

async function getInventoryWithCache(tenantId: string) {
  const cacheKey = CACHE_KEYS.INVENTORY_LIST(tenantId);

  // 尝试从缓存获取
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 缓存未命中，查询数据库
  const data = await repository.findAll(tenantId);

  // 写入缓存
  await redis.setex(cacheKey, CACHE_TTL.INVENTORY_LIST, JSON.stringify(data));

  return data;
}
```

### 数据库索引优化

```sql
-- 库存表索引
CREATE INDEX idx_inventory_tenant_sku ON foreign_trade_inventory(tenant_id, sku);
CREATE INDEX idx_inventory_status ON foreign_trade_inventory(status);
CREATE INDEX idx_inventory_warehouse ON foreign_trade_inventory(warehouse_id);
CREATE INDEX idx_inventory_updated_at ON foreign_trade_inventory(updated_at DESC);

-- 预测表索引
CREATE INDEX idx_forecast_sku_date ON sales_forecasts(sku, forecast_date);
CREATE INDEX idx_forecast_created_at ON sales_forecasts(created_at DESC);

-- 补货建议表索引
CREATE INDEX idx_replenishment_status ON replenishment_suggestions(status);
CREATE INDEX idx_replenishment_priority ON replenishment_suggestions(priority, created_at);
```

### 性能基准测试结果

| 操作         | 平均响应时间 | P95   | P99   |
| ------------ | ------------ | ----- | ----- |
| 库存列表查询 | 120ms        | 250ms | 450ms |
| 单个商品详情 | 45ms         | 80ms  | 150ms |
| 销量预测生成 | 1.2s         | 1.8s  | 2.5s  |
| 补货建议查询 | 95ms         | 180ms | 320ms |
| 创建采购订单 | 200ms        | 350ms | 600ms |

**优化目标**:

- ✅ 预测服务响应 < 2s
- ✅ API平均响应 < 200ms
- ✅ 数据库查询 < 100ms (带索引)

---

## 故障排除

### 常见问题

#### 1. 预测服务连接失败

**症状**: `Error: connect ECONNREFUSED 127.0.0.1:8000`

**解决方案**:

```bash
# 检查预测服务是否运行
docker-compose ps prediction-api

# 重启服务
docker-compose restart prediction-api

# 查看日志
docker-compose logs prediction-api
```

#### 2. n8n工作流未触发

**症状**: 补货建议未自动生成

**解决方案**:

```bash
# 检查n8n服务状态
docker-compose ps n8n

# 验证webhook配置
curl -X POST $N8N_WEBHOOK_URL/daily-forecast \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 检查n8n工作流日志
docker-compose logs n8n | grep "daily-sales-forecast"
```

#### 3. 数据库迁移失败

**症状**: `Error: relation "sales_forecasts" does not exist`

**解决方案**:

```bash
# 重新执行迁移
npx supabase db reset

# 手动检查表是否存在
psql -c "\dt" | grep forecast

# 如果缺失，手动执行迁移脚本
psql -f sql/migrations/001_inventory_ai_schema.sql
```

#### 4. Redis连接超时

**症状**: `Error: Redis connection timeout`

**解决方案**:

```bash
# 检查Redis服务
docker-compose ps redis

# 测试连接
redis-cli ping

# 重启Redis
docker-compose restart redis

# 清除旧缓存
redis-cli FLUSHDB
```

#### 5. Dify API返回401

**症状**: `Error: Unauthorized - Invalid API key`

**解决方案**:

- 检查 `.env.local` 中的 `DIFY_API_KEY` 是否正确
- 确认Dify应用已发布且API密钥有效
- 验证网络连接和防火墙设置

### 日志位置

```
logs/
├── app.log              # 应用日志
├── prediction-api.log   # 预测服务日志
├── n8n.log             # n8n工作流日志
└── error.log           # 错误日志汇总
```

### 获取帮助

- 📖 查看完整文档: `docs/modules/inventory-management/`
- 🐛 提交Issue: GitHub Issues
- 💬 技术支持: support@prodcycleai.com

---

## 许可证

MIT License - 详见 [LICENSE](../../LICENSE) 文件

---

## 贡献指南

欢迎提交 Pull Request！请参考 [CONTRIBUTING.md](../../CONTRIBUTING.md)

---

**维护者**: ProdCycleAI Team
**最后更新**: 2026-04-08
