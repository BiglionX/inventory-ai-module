# n8n工作流部署指南

## 工作流列表

### 1. 每日销量预测 (daily-sales-forecast.json)

**功能**: 每天凌晨2点自动执行所有活跃商品的销量预测

**触发方式**: 定时触发(Cron: 每天02:00)

**工作流程**:

```
定时触发
→ 获取活跃商品列表
→ 逐个获取90天销售历史
→ 调用预测API
→ 保存预测结果到数据库
→ 记录执行日志
→ 发送执行报告邮件
```

**需要的凭证**:

- `supabase-postgres`: Supabase PostgreSQL连接
- `prediction-api-auth`: 预测API认证(HTTP Header Auth)
- `smtp-credentials`: SMTP邮件服务

---

### 2. 智能补货预警 (replenishment-alert.json)

**功能**: 当库存低于再订货点时,自动生成补货建议并通知相关人员

**触发方式**: Webhook (`POST /webhook/inventory-alert`)

**工作流程**:

```
Webhook触发(库存变更)
→ 查询库存项信息
→ 检查是否低于再订货点
→ 获取未来30天预测需求
→ 计算补货建议(考虑lead_time)
→ 保存补货建议到数据库
→ 根据优先级发送通知:
   - 紧急: 邮件 + 等待2分钟 + 短信
   - 普通: 邮件 + 钉钉
```

**需要的凭证**:

- `supabase-postgres`: Supabase PostgreSQL连接
- `prediction-api-auth`: 预测API认证
- `smtp-credentials`: SMTP邮件服务
- 钉钉机器人Token(可选)
- SMS服务提供商API(可选)

---

## 部署步骤

### 方法1: 通过n8n UI导入(推荐)

1. **启动n8n服务**

   ```bash
   docker-compose up -d dev-n8n
   ```

2. **访问n8n界面**

   ```
   http://localhost:5678
   ```

3. **导入工作流**
   - 点击右上角 "+" → "Import from File"
   - 选择 `daily-sales-forecast.json` 或 `replenishment-alert.json`
   - 点击 "Import"

4. **配置凭证**

   a. **Supabase PostgreSQL**:
   - Type: PostgreSQL
   - Host: `db.hrjqzbhqueleszkvnsen.supabase.co`
   - Database: `postgres`
   - User: `postgres`
   - Password: (从.env获取SUPABASE_SERVICE_ROLE_KEY对应的密码)
   - Port: 5432
   - SSL: true

   b. **Prediction API Auth**:
   - Type: HTTP Header Auth
   - Name: `X-API-Key`
   - Value: (从.env获取PREDICTION_API_KEY)

   c. **SMTP Email**:
   - Type: SMTP
   - Host: (你的SMTP服务器)
   - Port: 587
   - User: (邮箱地址)
   - Password: (邮箱密码/授权码)

5. **激活工作流**
   - 打开工作流
   - 点击右上角 "Activate" 开关
   - 确认激活

---

### 方法2: 通过n8n CLI

```bash
# 安装n8n CLI
npm install n8n -g

# 导入工作流
n8n import:workflow --input=n8n-workflows/inventory-ai/daily-sales-forecast.json
n8n import:workflow --input=n8n-workflows/inventory-ai/replenishment-alert.json

# 启动n8n
n8n start
```

---

### 方法3: 通过API导入

```bash
# 获取n8n API Token
N8N_API_TOKEN="your_n8n_api_token"

# 导入每日预测工作流
curl -X POST http://localhost:5678/rest/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $N8N_API_TOKEN" \
  -d @n8n-workflows/inventory-ai/daily-sales-forecast.json

# 导入补货预警工作流
curl -X POST http://localhost:5678/rest/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $N8N_API_TOKEN" \
  -d @n8n-workflows/inventory-ai/replenishment-alert.json
```

---

## 测试工作流

### 测试每日预测工作流

1. 在n8n UI中打开 "每日销量预测" 工作流
2. 点击 "Execute Workflow" 按钮
3. 查看执行结果:
   - 检查每个节点的输出
   - 确认数据库中创建了预测记录
   - 查收执行报告邮件

### 测试补货预警工作流

1. **手动触发Webhook**:

   ```bash
   curl -X POST http://localhost:5678/webhook/inventory-alert \
     -H "Content-Type: application/json" \
     -d '{
       "itemId": "your-inventory-item-uuid"
     }'
   ```

2. **验证结果**:
   - 检查 `replenishment_suggestions` 表是否有新记录
   - 查收通知邮件
   - 如果优先级为urgent,等待2分钟后检查短信

3. **通过库存变更自动触发**:
   - 在应用中修改库存数量
   - 确保库存变更API调用了webhook

---

## 环境变量配置

在 `.env` 文件中添加:

```env
# n8n配置
N8N_API_URL=http://localhost:5678
N8N_API_TOKEN=your_n8n_api_token_here
N8N_INVENTORY_WEBHOOK_URL=http://localhost:5678/webhook/inventory-alert

# 预测API
PREDICTION_API_URL=http://localhost:8000
PREDICTION_API_KEY=dev_prediction_key_12345

# 邮件服务
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# 钉钉机器人(可选)
DINGTALK_WEBHOOK_URL=https://oapi.dingtalk.com/robot/send?access_token=YOUR_TOKEN

# SMS服务(可选)
SMS_API_KEY=your_sms_api_key
SMS_API_SECRET=your_sms_api_secret
```

---

## 监控和维护

### 查看执行历史

1. 在n8n UI中点击左侧 "Executions"
2. 筛选特定工作流
3. 查看成功/失败的执行记录
4. 点击具体执行查看详细日志

### 错误处理

- 工作流已配置错误检查节点
- 失败的预测会记录到 `inventory_predictions_log` 表
- 可以设置错误工作流进行告警

### 性能优化

1. **批量处理**: 每日预测工作流使用分批处理,避免一次性加载所有商品
2. **超时设置**: API调用设置了30秒超时
3. **缓存**: 预测API已有缓存机制,减少重复计算

### 备份工作流

```bash
# 导出所有工作流
n8n export:workflow --all --output=backups/workflows-backup-$(date +%Y%m%d).json

# 定期备份(添加到crontab)
0 2 * * 0 cd /path/to/project && n8n export:workflow --all --output=backups/workflows-$(date +\%Y\%m\%d).json
```

---

## 常见问题

### Q: 工作流无法触发?

A: 检查:

1. 工作流是否已激活(绿色开关)
2. 凭证是否正确配置
3. n8n服务是否正常运行

### Q: 预测API连接失败?

A: 确认:

1. 预测API服务已启动: `docker-compose up prediction-api`
2. PREDICTION_API_URL配置正确
3. 网络连通性正常

### Q: 邮件发送失败?

A: 检查:

1. SMTP配置是否正确
2. 邮箱是否开启了SMTP服务
3. 防火墙是否阻止了587端口

### Q: 如何修改触发时间?

A:

1. 打开工作流
2. 编辑 "定时触发" 节点
3. 修改小时设置为其他时间
4. 保存并重新激活

---

## 下一步

工作流部署完成后:

1. ✅ 测试端到端流程
2. ⏸️ 集成到前端应用(Phase 5)
3. ⏸️ 配置生产环境凭证
4. ⏸️ 设置监控告警

---

**文档版本**: 1.0
**最后更新**: 2026-04-08
**维护者**: DevOps Team
