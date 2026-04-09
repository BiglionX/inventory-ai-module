name: 🐛 Bug Report
description: 报告一个 bug 帮助我们改进
title: "[Bug]: "
labels: ["bug", "triage"]
body:

- type: markdown
  attributes:
  value: |
  感谢你花时间填写这个 bug 报告！请尽可能详细地描述问题。

- type: textarea
  id: what-happened
  attributes:
  label: 发生了什么？
  description: 请描述你遇到的问题
  placeholder: 告诉我们在做什么时遇到了什么问题...
  validations:
  required: true

- type: textarea
  id: expected-behavior
  attributes:
  label: 期望的行为
  description: 你期望发生什么？
  placeholder: 描述你期望的正确行为...
  validations:
  required: true

- type: textarea
  id: reproduction-steps
  attributes:
  label: 复现步骤
  description: 如何复现这个问题？
  placeholder: | 1. 进入 '...' 2. 点击 '....' 3. 看到错误 '...'
  validations:
  required: true

- type: dropdown
  id: environment
  attributes:
  label: 运行环境
  description: 你在什么环境下运行？
  options: - 开发环境 (localhost) - 生产环境 - 测试环境
  validations:
  required: true

- type: textarea
  id: logs
  attributes:
  label: 相关日志输出
  description: 请复制并粘贴任何相关的日志输出
  render: shell

- type: textarea
  id: additional-context
  attributes:
  label: 其他上下文
  description: 添加任何其他关于问题的上下文信息
  placeholder: 截图、错误信息等...
