name: ✨ 功能建议
description: 为这个项目提出一个想法
title: "[Feature]: "
labels: ["enhancement"]
body:

- type: markdown
  attributes:
  value: |
  感谢你提出功能建议！请描述你想要的功能。

- type: textarea
  id: problem
  attributes:
  label: 你的功能请求是否与问题相关？
  description: 请描述你遇到的问题
  placeholder: 当我尝试...时，我感到困扰...

- type: textarea
  id: solution
  attributes:
  label: 描述你想要的解决方案
  description: 请清楚地描述你希望发生什么
  placeholder: 我希望能够...
  validations:
  required: true

- type: textarea
  id: alternatives
  attributes:
  label: 描述你考虑过的替代方案
  description: 描述你考虑过的任何替代解决方案或功能

- type: dropdown
  id: priority
  attributes:
  label: 优先级
  description: 这个功能对你来说有多重要？
  options: - 低 - 有会更好 - 中 - 比较重要 - 高 - 非常需要 - 紧急 - 阻碍使用
  validations:
  required: true

- type: textarea
  id: additional-context
  attributes:
  label: 其他上下文
  description: 添加任何其他关于功能请求的上下文信息
  placeholder: 截图、mockup、相关链接等...
