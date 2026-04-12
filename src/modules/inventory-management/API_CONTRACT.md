# 进销存AI集成模块 - API契约文档

**版本**: v2.0
**最后更新**: 2026-04-08
**基础URL**: `http://localhost:3001/api/inventory`

---

## 目录

- [认证与授权](#认证与授权)
- [通用响应格式](#通用响应格式)
- [库存管理API](#库存管理api)
- [预测API](#预测api)
- [补货建议API](#补货建议api)
- [仓库管理API](#仓库管理api)
- [错误码说明](#错误码说明)

---

## 认证与授权

所有API请求需要在Header中携带JWT Token：

```http
Authorization: Bearer <your-jwt-token>
```

### 权限级别

| 角色       | 权限说明             |
| ---------- | -------------------- |
| `admin`    | 完全访问权限         |
| `manager`  | 读写权限（不能删除） |
| `viewer`   | 只读权限             |
| `operator` | 仅出入库操作权限     |

---

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-04-08T10:30:00Z",
    "requestId": "req-abc123"
  }
}
```

### 分页响应

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "请求参数无效",
    "details": [
      {
        "field": "sku",
        "message": "SKU不能为空"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-04-08T10:30:00Z",
    "requestId": "req-abc123"
  }
}
```

---

## 库存管理API

### 1. 获取库存列表

**端点**: `GET /api/inventory/items`

**查询参数**:

| 参数        | 类型   | 必填 | 说明                         |
| ----------- | ------ | ---- | ---------------------------- |
| tenantId    | string | 是   | 租户ID                       |
| page        | number | 否   | 页码，默认1                  |
| limit       | number | 否   | 每页数量，默认20，最大100    |
| status      | string | 否   | 库存状态过滤                 |
| warehouseId | string | 否   | 仓库ID过滤                   |
| search      | string | 否   | 搜索关键词(SKU/名称)         |
| sortBy      | string | 否   | 排序字段，默认updated_at     |
| sortOrder   | string | 否   | 排序方向(asc/desc)，默认desc |

**请求示例**:

```bash
curl -X GET "http://localhost:3001/api/inventory/items?tenantId=tenant-1&page=1&limit=20&status=in_stock" \
  -H "Authorization: Bearer <token>"
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "inv-001",
        "tenantId": "tenant-1",
        "sku": "SKU-001",
        "name": "测试商品A",
        "description": "商品描述",
        "category": "电子产品",
        "brand": "品牌A",
        "model": "Model-X",
        "quantity": 150,
        "reservedQuantity": 20,
        "availableQuantity": 130,
        "safetyStock": 10,
        "reorderPoint": 30,
        "unitPrice": 99.99,
        "currency": "CNY",
        "status": "in_stock",
        "warehouseId": "wh-001",
        "locationId": "loc-A1",
        "createdAt": "2026-04-01T08:00:00Z",
        "updatedAt": "2026-04-08T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 2. 获取库存详情

**端点**: `GET /api/inventory/items/:id`

**路径参数**:

| 参数 | 类型   | 必填 | 说明     |
| ---- | ------ | ---- | -------- |
| id   | string | 是   | 库存项ID |

**请求示例**:

```bash
curl -X GET "http://localhost:3001/api/inventory/items/inv-001" \
  -H "Authorization: Bearer <token>"
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "inv-001",
    "tenantId": "tenant-1",
    "sku": "SKU-001",
    "name": "测试商品A",
    "quantity": 150,
    "reservedQuantity": 20,
    "availableQuantity": 130,
    "safetyStock": 10,
    "reorderPoint": 30,
    "unitPrice": 99.99,
    "currency": "CNY",
    "status": "in_stock",
    "warehouse": {
      "id": "wh-001",
      "name": "主仓库",
      "location": "北京市朝阳区"
    },
    "location": {
      "id": "loc-A1",
      "code": "A-01-02",
      "zone": "A区"
    },
    "recentMovements": [
      {
        "id": "mov-001",
        "type": "inbound",
        "quantity": 50,
        "reason": "采购入库",
        "createdAt": "2026-04-07T14:00:00Z"
      }
    ],
    "createdAt": "2026-04-01T08:00:00Z",
    "updatedAt": "2026-04-08T10:00:00Z"
  }
}
```

---

### 3. 创建库存项

**端点**: `POST /api/inventory/items`

**请求体**:

```json
{
  "tenantId": "tenant-1",
  "sku": "SKU-002",
  "name": "测试商品B",
  "description": "商品B描述",
  "category": "电子产品",
  "brand": "品牌B",
  "model": "Model-Y",
  "quantity": 100,
  "reservedQuantity": 0,
  "safetyStock": 15,
  "reorderPoint": 35,
  "unitPrice": 199.99,
  "currency": "CNY",
  "warehouseId": "wh-001",
  "locationId": "loc-B2"
}
```

**验证规则**:

| 字段         | 规则                 |
| ------------ | -------------------- |
| sku          | 必填，唯一，3-50字符 |
| name         | 必填，2-100字符      |
| quantity     | 必填，>= 0           |
| safetyStock  | 可选，>= 0           |
| reorderPoint | 可选，>= safetyStock |
| unitPrice    | 必填，> 0            |

**请求示例**:

```bash
curl -X POST "http://localhost:3001/api/inventory/items" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "tenant-1",
    "sku": "SKU-002",
    "name": "测试商品B",
    "quantity": 100,
    "safetyStock": 15,
    "reorderPoint": 35,
    "unitPrice": 199.99,
    "currency": "CNY",
    "warehouseId": "wh-001"
  }'
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "inv-002",
    "sku": "SKU-002",
    "name": "测试商品B",
    "quantity": 100,
    "status": "in_stock",
    "createdAt": "2026-04-08T10:30:00Z"
  },
  "message": "库存项创建成功"
}
```

---

### 4. 更新库存项

**端点**: `PUT /api/inventory/items/:id`

**请求体**: (部分更新，只需提供要更新的字段)

```json
{
  "quantity": 120,
  "safetyStock": 20,
  "reorderPoint": 40
}
```

**请求示例**:

```bash
curl -X PUT "http://localhost:3001/api/inventory/items/inv-002" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 120,
    "safetyStock": 20
  }'
```

---

### 5. 删除库存项

**端点**: `DELETE /api/inventory/items/:id`

**注意**: 仅当库存数量为0且无关联订单时可删除

**请求示例**:

```bash
curl -X DELETE "http://localhost:3001/api/inventory/items/inv-002" \
  -H "Authorization: Bearer <token>"
```

**响应示例**:

```json
{
  "success": true,
  "message": "库存项删除成功"
}
```

---

### 6. 批量操作

**端点**: `POST /api/inventory/items/batch`

**请求体**:

```json
{
  "action": "delete",
  "ids": ["inv-001", "inv-002", "inv-003"]
}
```

**支持的操作**:

- `delete`: 批量删除
- `export`: 批量导出
- `update_status`: 批量更新状态

---

## 预测API

### 1. 生成销量预测

**端点**: `POST /api/inventory/forecast`

**请求体**:

```json
{
  "sku": "SKU-001",
  "days": 30,
  "confidenceLevel": 0.95,
  "includeSeasonality": true
}
```

**参数说明**:

| 参数               | 类型    | 必填 | 说明                       |
| ------------------ | ------- | ---- | -------------------------- |
| sku                | string  | 是   | 商品SKU                    |
| days               | number  | 否   | 预测天数，默认30，范围7-90 |
| confidenceLevel    | number  | 否   | 置信水平，默认0.95         |
| includeSeasonality | boolean | 否   | 是否包含季节性因素         |

**请求示例**:

```bash
curl -X POST "http://localhost:3001/api/inventory/forecast" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "SKU-001",
    "days": 30,
    "confidenceLevel": 0.95
  }'
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "sku": "SKU-001",
    "forecastPeriod": {
      "start": "2026-04-09",
      "end": "2026-05-08"
    },
    "predictions": [
      {
        "date": "2026-04-09",
        "predictedSales": 15.5,
        "lowerBound": 12.3,
        "upperBound": 18.7,
        "confidenceInterval": 0.95
      },
      {
        "date": "2026-04-10",
        "predictedSales": 16.2,
        "lowerBound": 13.0,
        "upperBound": 19.4,
        "confidenceInterval": 0.95
      }
    ],
    "summary": {
      "totalPredictedSales": 465.0,
      "averageDailySales": 15.5,
      "peakDay": "2026-04-25",
      "peakDaySales": 22.3
    },
    "modelMetrics": {
      "accuracy": 0.87,
      "mape": 0.13,
      "rmse": 2.5
    },
    "generatedAt": "2026-04-08T10:30:00Z"
  }
}
```

---

### 2. 获取历史预测记录

**端点**: `GET /api/inventory/forecast/history`

**查询参数**:

| 参数  | 类型   | 必填 | 说明             |
| ----- | ------ | ---- | ---------------- |
| sku   | string | 是   | 商品SKU          |
| limit | number | 否   | 返回数量，默认10 |

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "id": "fc-001",
      "sku": "SKU-001",
      "forecastDate": "2026-04-01",
      "predictedSales": 450.0,
      "actualSales": 445.0,
      "accuracy": 0.99,
      "createdAt": "2026-04-01T02:00:00Z"
    }
  ]
}
```

---

## 补货建议API

### 1. 获取补货建议列表

**端点**: `GET /api/inventory/replenishment/suggestions`

**查询参数**:

| 参数     | 类型   | 必填 | 说明                            |
| -------- | ------ | ---- | ------------------------------- |
| tenantId | string | 是   | 租户ID                          |
| status   | string | 否   | 状态(pending/approved/rejected) |
| priority | string | 否   | 优先级(high/medium/low)         |

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "id": "sugg-001",
      "tenantId": "tenant-1",
      "sku": "SKU-001",
      "productName": "测试商品A",
      "currentStock": 5,
      "safetyStock": 10,
      "reorderPoint": 30,
      "predictedDemand": 45.0,
      "suggestedQuantity": 50,
      "estimatedCost": 4999.5,
      "currency": "CNY",
      "priority": "high",
      "status": "pending",
      "reason": "预测未来7天销量为45件，当前库存仅5件，低于安全库存10件",
      "supplierRecommendation": {
        "supplierId": "sup-001",
        "supplierName": "供应商A",
        "leadTime": 3,
        "unitPrice": 99.99
      },
      "createdAt": "2026-04-08T02:00:00Z",
      "expiresAt": "2026-04-15T02:00:00Z"
    }
  ]
}
```

---

### 2. 审批补货建议

**端点**: `POST /api/inventory/replenishment/suggestions/:id/approve`

**请求体**:

```json
{
  "approvedQuantity": 50,
  "supplierId": "sup-001",
  "expectedDeliveryDate": "2026-04-15",
  "notes": "紧急补货"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "sugg-001",
    "status": "approved",
    "purchaseOrderId": "po-001"
  },
  "message": "补货建议已批准，采购订单已创建"
}
```

---

### 3. 拒绝补货建议

**端点**: `POST /api/inventory/replenishment/suggestions/:id/reject`

**请求体**:

```json
{
  "reason": "库存充足，暂不需要补货"
}
```

---

### 4. 从建议创建采购订单

**端点**: `POST /api/inventory/replenishment/orders`

**请求体**:

```json
{
  "suggestionId": "sugg-001",
  "supplierId": "sup-001",
  "quantity": 50,
  "unitPrice": 99.99,
  "currency": "CNY",
  "expectedDeliveryDate": "2026-04-15",
  "notes": "根据AI建议创建"
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "po-001",
    "orderNumber": "PO-20260408-001",
    "status": "pending",
    "totalAmount": 4999.5,
    "createdAt": "2026-04-08T10:30:00Z"
  },
  "message": "采购订单创建成功"
}
```

---

## 仓库管理API

### 1. 获取仓库列表

**端点**: `GET /api/inventory/warehouses`

**响应示例**:

```json
{
  "success": true,
  "data": [
    {
      "id": "wh-001",
      "name": "主仓库",
      "code": "WH-MAIN",
      "location": "北京市朝阳区XX路1号",
      "capacity": 10000,
      "utilization": 0.75,
      "status": "active",
      "manager": "张三",
      "contactPhone": "13800138000",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### 2. 获取仓库利用率统计

**端点**: `GET /api/inventory/warehouses/:id/utilization`

**响应示例**:

```json
{
  "success": true,
  "data": {
    "warehouseId": "wh-001",
    "warehouseName": "主仓库",
    "totalCapacity": 10000,
    "usedCapacity": 7500,
    "utilizationRate": 0.75,
    "byCategory": [
      {
        "category": "电子产品",
        "itemCount": 150,
        "spaceUsed": 3000
      }
    ],
    "trend": [
      {
        "date": "2026-04-01",
        "utilization": 0.72
      },
      {
        "date": "2026-04-08",
        "utilization": 0.75
      }
    ]
  }
}
```

---

## 错误码说明

### HTTP状态码

| 状态码 | 说明                |
| ------ | ------------------- |
| 200    | 请求成功            |
| 201    | 资源创建成功        |
| 400    | 请求参数错误        |
| 401    | 未认证或Token过期   |
| 403    | 权限不足            |
| 404    | 资源不存在          |
| 409    | 资源冲突(如SKU重复) |
| 422    | 数据验证失败        |
| 429    | 请求频率超限        |
| 500    | 服务器内部错误      |
| 503    | 服务暂时不可用      |

### 业务错误码

| 错误码                   | 说明              | 解决方案                 |
| ------------------------ | ----------------- | ------------------------ |
| `INVALID_REQUEST`        | 请求参数无效      | 检查请求参数格式和必填项 |
| `RESOURCE_NOT_FOUND`     | 资源不存在        | 确认ID是否正确           |
| `DUPLICATE_SKU`          | SKU已存在         | 使用不同的SKU            |
| `INSUFFICIENT_STOCK`     | 库存不足          | 先补充库存               |
| `FORECAST_SERVICE_ERROR` | 预测服务异常      | 检查预测服务状态         |
| `N8N_WORKFLOW_FAILED`    | n8n工作流执行失败 | 检查n8n服务和webhook配置 |
| `RATE_LIMIT_EXCEEDED`    | 请求频率超限      | 降低请求频率             |
| `DATABASE_ERROR`         | 数据库操作失败    | 联系技术支持             |

### 错误响应示例

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "sku",
        "message": "SKU格式不正确，应为3-50位字母数字组合",
        "value": ""
      },
      {
        "field": "quantity",
        "message": "库存数量不能为负数",
        "value": -10
      }
    ]
  },
  "meta": {
    "timestamp": "2026-04-08T10:30:00Z",
    "requestId": "req-xyz789"
  }
}
```

---

## 速率限制

| 端点                             | 限制       |
| -------------------------------- | ---------- |
| `/api/inventory/items`           | 100次/分钟 |
| `/api/inventory/forecast`        | 10次/分钟  |
| `/api/inventory/replenishment/*` | 50次/分钟  |

超出限制将返回 `429 Too Many Requests`

---

## 版本控制

API版本通过URL路径控制：

- 当前版本: `/api/inventory/v2/*`
- 旧版本: `/api/inventory/v1/*` (已废弃)

---

## Webhooks

系统支持以下webhook事件：

| 事件                      | 触发条件         | Payload      |
| ------------------------- | ---------------- | ------------ |
| `inventory.low_stock`     | 库存低于安全库存 | 库存项信息   |
| `forecast.completed`      | 预测生成完成     | 预测结果摘要 |
| `replenishment.suggested` | 补货建议生成     | 建议详情     |
| `purchase_order.created`  | 采购订单创建     | 订单信息     |

### Webhook配置

在系统设置中配置webhook URL和签名密钥。

---

**文档维护**: ProdCycleAI Team
**反馈邮箱**: api-support@prodcycleai.com
