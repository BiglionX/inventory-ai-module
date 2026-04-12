# 贡献指南 - Contributing to Inventory AI Module

欢迎为进销存AI集成模块做出贡献！本指南将帮助您开始。

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境设置](#开发环境设置)
- [提交 Pull Request](#提交-pull-request)
- [代码规范](#代码规范)
- [测试要求](#测试要求)
- [文档更新](#文档更新)
- [问题报告](#问题报告)

---

## 行为准则

本项目采用 [Contributor Covenant](https://www.contributor-covenant.org/) 行为准则。参与即表示您同意遵守其条款。

---

## 如何贡献

### 1. Fork 仓库

点击 GitHub 页面右上角的 "Fork" 按钮。

### 2. 克隆您的 Fork

```bash
git clone https://github.com/YOUR_USERNAME/inventory-ai-module.git
cd inventory-ai-module
```

### 3. 添加上游远程仓库

```bash
git remote add upstream https://github.com/ProdCycleAI/inventory-ai-module.git
```

### 4. 创建功能分支

```bash
git checkout -b feature/your-feature-name
```

### 5. 进行更改

- 编写代码
- 添加测试
- 更新文档

### 6. 提交更改

```bash
git add .
git commit -m "feat: add new feature description"
```

### 7. 推送到您的 Fork

```bash
git push origin feature/your-feature-name
```

### 8. 创建 Pull Request

在 GitHub 上从您的分支向主仓库的 `main` 分支提交 PR。

---

## 开发环境设置

### 前置要求

- Node.js 18+
- npm 或 yarn
- PostgreSQL (Supabase)
- Docker & Docker Compose (可选，用于微服务)

### 安装依赖

```bash
npm install --legacy-peer-deps
```

### 配置环境变量

复制 `.env.example` 到 `.env.local` 并填写必要的配置：

```bash
cp .env.example .env.local
```

### 启动开发服务器

```bash
npm run dev
```

---

## 提交 Pull Request

### PR 标题规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` - 新功能
- `fix:` - Bug 修复
- `docs:` - 文档更新
- `style:` - 代码格式（不影响功能）
- `refactor:` - 重构
- `test:` - 测试相关
- `chore:` - 构建过程或辅助工具变动

**示例**:

```
feat: add sales forecast chart component
fix: resolve database connection timeout issue
docs: update API documentation
```

### PR 描述模板

```markdown
## 描述

简要描述此 PR 的目的和变更内容。

## 类型

- [ ] Bug 修复
- [ ] 新功能
- [ ] 文档更新
- [ ] 重构
- [ ] 其他（请说明）

## 测试

- [ ] 已添加单元测试
- [ ] 已添加 E2E 测试
- [ ] 手动测试通过

## 截图（如适用）

添加界面变化的截图。

## 相关 Issue

Closes #123
```

---

## 代码规范

### TypeScript

- 使用严格的类型检查
- 避免使用 `any` 类型
- 为所有公共 API 提供类型定义
- 使用接口而非类型别名（除非必要）

### React 组件

- 使用函数式组件和 Hooks
- 组件文件使用 PascalCase 命名
- 导出组件时同时导出 Props 类型
- 使用 TypeScript 接口定义 Props

**示例**:

```typescript
interface MyComponentProps {
  title: string;
  onClick?: () => void;
}

export function MyComponent({ title, onClick }: MyComponentProps) {
  return <button onClick={onClick}>{title}</button>;
}
```

### 代码风格

- 使用 2 空格缩进
- 使用单引号
- 语句末尾加分号
- 最大行宽 100 字符

运行 Lint 检查：

```bash
npm run lint
npm run lint:fix  # 自动修复
```

### 命名规范

- 变量/函数: `camelCase`
- 类/组件: `PascalCase`
- 常量: `UPPER_SNAKE_CASE`
- 文件名: 与导出的主要符号一致

---

## 测试要求

### 单元测试

为新功能添加单元测试：

```bash
npm run test
npm run test:coverage  # 查看覆盖率
```

**目标覆盖率**: 80%+

### E2E 测试

对于用户界面变更，添加 E2E 测试：

```bash
npm run test:e2e
```

测试文件位置: `tests/e2e/inventory-ai-integration.spec.ts`

### 性能测试

运行性能基准测试：

```bash
node scripts/performance/inventory-benchmark.js
```

---

## 文档更新

### 何时更新文档

- 添加新功能
- 修改 API
- 修复 Bug（如果影响使用方式）
- 更改配置选项

### 文档位置

- **README.md** - 模块概述和快速开始
- **API_CONTRACT.md** - API 详细文档
- **components/README.md** - 组件使用指南
- **代码注释** - JSDoc 格式的函数/类注释

### 文档规范

- 使用清晰的中文或英文
- 提供代码示例
- 包含参数说明和返回值类型
- 添加实际使用场景

---

## 问题报告

### 提交 Issue

在 GitHub Issues 中报告问题时，请包含：

1. **问题描述**: 清晰简洁地描述问题
2. **复现步骤**: 如何重现该问题
3. **预期行为**: 应该发生什么
4. **实际行为**: 实际发生了什么
5. **环境信息**:
   - 操作系统
   - Node.js 版本
   - 浏览器（如适用）
   - 相关依赖版本

### Issue 标签

- `bug` - Bug 报告
- `enhancement` - 功能增强建议
- `documentation` - 文档相关问题
- `question` - 疑问或求助
- `good first issue` - 适合新手的问题

---

## 审查流程

1. **自动化检查**: CI 将运行 lint、测试和构建
2. **代码审查**: 至少需要一名维护者审查
3. **反馈修改**: 根据审查意见进行修改
4. **合并**: 审查通过后合并到主分支

### 审查标准

- ✅ 代码质量良好
- ✅ 测试覆盖充分
- ✅ 文档已更新
- ✅ 符合项目规范
- ✅ 无安全漏洞

---

## 发布流程

维护者将定期发布新版本：

1. 更新版本号 (`package.json`)
2. 生成 CHANGELOG
3. 创建 Git Tag
4. 发布到 npm（如适用）

---

## 联系方式

- **GitHub Issues**: [提交问题](https://github.com/ProdCycleAI/inventory-ai-module/issues)
- **Email**: support@prodcycleai.com
- **Discussions**: [GitHub Discussions](https://github.com/ProdCycleAI/inventory-ai-module/discussions)

---

## 致谢

感谢所有为本项目做出贡献的开发者！🙏

您的每一次贡献都让这个项目变得更好。

---

**最后更新**: 2026-04-08
**维护者**: ProdCycleAI Team
