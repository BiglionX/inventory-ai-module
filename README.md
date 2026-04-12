# 🎯 智能进销存AI模块

![Version](https://img.shields.io/badge/version-2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)
![Completion](https://img.shields.io/badge/completion-92%25-brightgreen.svg)

> AI-Powered Inventory Management System with Domain-Driven Design, Prophet Forecasting, and n8n Automation

## ✨ 核心特性

- 🤖 **AI 销量预测** - 基于 Facebook Prophet，准确率 > 85%
- 🔄 **自动补货** - n8n 工作流驱动的智能补货建议
- 💬 **AI 问答助手** - Dify 集成的自然语言库存查询
- 📊 **数据可视化** - Recharts 驱动的丰富图表
- 🏗️ **DDD 架构** - 清晰的领域驱动设计
- ⚡ **高性能** - P95 < 250ms 响应时间

## 🚀 快速开始

```bash
npm install
npm run dev
```

## 📚 文档

- [模块说明](src/modules/inventory-management/README.md)
- [API 契约](src/modules/inventory-management/API_CONTRACT.md)
- [组件指南](src/modules/inventory-management/interface-adapters/components/README.md)
- [实施报告](IMPLEMENTATION_REPORT.md)
- [部署指南](src/modules/inventory-management/DEPLOYMENT_GUIDE.md)

## 🛠️ 技术栈

- **前端**: Next.js 14, React 18, TypeScript, Tailwind CSS, Recharts
- **后端**: FastAPI, Python, Prophet
- **数据库**: PostgreSQL (Supabase), Redis
- **AI**: Dify, Pinecone Vector DB
- **自动化**: n8n

## 📊 项目统计

- **3,400+** 行 TypeScript 代码
- **15+** 核心组件
- **100%** TypeScript 类型覆盖
- **92%** 功能完成度

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！详见 [CONTRIBUTING.md](src/modules/inventory-management/CONTRIBUTING.md)

## 📄 许可证

MIT License - 详见 [LICENSE](src/modules/inventory-management/LICENSE)
