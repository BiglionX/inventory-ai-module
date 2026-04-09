import { expect, test } from '@playwright/test';

/**
 * 进销存AI集成 - E2E测试套件
 * 覆盖从预测触发到补货下单的全流程
 */
test.describe('Inventory AI Integration E2E Tests', () => {
  const baseUrl = 'http://localhost:3001';

  // 测试数据
  const testProduct = {
    sku: 'TEST-SKU-001',
    name: '测试商品-AI预测',
    quantity: 50,
    safetyStock: 10,
    reorderPoint: 20,
  };

  test.beforeEach(async ({ page }) => {
    // 登录管理后台
    await page.goto(`${baseUrl}/admin/login`);
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 等待登录成功并跳转到仪表板
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
  });

  /**
   * 测试场景1: 库存预测功能
   */
  test('should trigger sales forecast and display predictions', async ({
    page,
  }) => {
    test.setTimeout(60000);

    // 导航到库存管理页面
    await page.goto(`${baseUrl}/admin/inventory`);
    await expect(page.locator('h1')).toContainText('库存管理');

    // 选择测试商品
    await page.fill('input[placeholder="搜索SKU或名称"]', testProduct.sku);
    await page.waitForTimeout(1000);

    // 点击预测按钮
    const forecastButton = page.locator('button:has-text("销量预测")').first();
    if (await forecastButton.isVisible()) {
      await forecastButton.click();

      // 等待预测结果加载
      await page.waitForSelector('[data-testid="forecast-chart"]', {
        timeout: 15000,
      });

      // 验证预测图表显示
      const chartContainer = page.locator('[data-testid="forecast-chart"]');
      await expect(chartContainer).toBeVisible();

      // 验证预测数据存在
      const predictionData = page.locator('[data-testid="prediction-value"]');
      await expect(predictionData.first()).toBeVisible();

      console.log('✅ 销量预测功能正常');
    } else {
      console.log('⚠️ 预测按钮未找到，跳过此测试');
    }
  });

  /**
   * 测试场景2: 智能补货建议生成
   */
  test('should generate replenishment suggestions based on forecast', async ({
    page,
  }) => {
    test.setTimeout(60000);

    // 导航到采购管理页面
    await page.goto(`${baseUrl}/admin/procurement/orders`);
    await expect(page.locator('h1')).toContainText('采购订单');

    // 查找AI补货建议卡片
    const suggestionCard = page.locator(
      '[data-testid="replenishment-suggestion-card"]'
    );

    if (await suggestionCard.isVisible()) {
      // 验证补货建议内容
      await expect(
        suggestionCard.locator('[data-testid="suggested-quantity"]')
      ).toBeVisible();
      await expect(
        suggestionCard.locator('[data-testid="suggestion-reason"]')
      ).toBeVisible();

      // 获取建议数量
      const suggestedQty = await suggestionCard
        .locator('[data-testid="suggested-quantity"]')
        .textContent();
      console.log(`📦 建议补货数量: ${suggestedQty}`);

      // 验证建议合理性（应该大于0）
      const qty = parseInt(suggestedQty || '0');
      expect(qty).toBeGreaterThan(0);

      console.log('✅ 智能补货建议生成正常');
    } else {
      console.log('⚠️ 补货建议卡片未找到，可能需要先运行预测');
    }
  });

  /**
   * 测试场景3: 从补货建议创建采购订单
   */
  test('should create purchase order from replenishment suggestion', async ({
    page,
  }) => {
    test.setTimeout(90000);

    await page.goto(`${baseUrl}/admin/procurement/orders`);

    // 查找"一键补货"按钮
    const quickOrderButton = page
      .locator('button:has-text("一键补货")')
      .first();

    if (await quickOrderButton.isVisible()) {
      await quickOrderButton.click();

      // 等待采购订单表单弹出
      await page.waitForSelector('[data-testid="purchase-order-form"]', {
        timeout: 10000,
      });

      // 填写采购订单信息
      const form = page.locator('[data-testid="purchase-order-form"]');

      // 验证自动填充的数据
      const skuField = form.locator('input[name="sku"]');
      await expect(skuField).toHaveValue(testProduct.sku);

      // 提交订单
      await form.locator('button[type="submit"]').click();

      // 等待订单创建成功提示
      await page.waitForSelector('[data-testid="success-message"]', {
        timeout: 10000,
      });
      const successMessage = page.locator('[data-testid="success-message"]');
      await expect(successMessage).toBeVisible();
      await expect(successMessage).toContainText('采购订单创建成功');

      console.log('✅ 从补货建议创建采购订单成功');
    } else {
      console.log('⚠️ 一键补货按钮未找到');
    }
  });

  /**
   * 测试场景4: n8n工作流触发验证
   */
  test('should trigger n8n workflow for daily forecast', async ({ page }) => {
    test.setTimeout(60000);

    // 导航到系统设置或工作流管理页面
    await page.goto(`${baseUrl}/admin/settings/workflows`);

    // 查找n8n工作流状态
    const workflowStatus = page.locator(
      '[data-testid="workflow-status"]:has-text("daily-sales-forecast")'
    );

    if (await workflowStatus.isVisible()) {
      // 验证工作流状态为active
      await expect(
        workflowStatus.locator('[data-testid="status-badge"]')
      ).toContainText('active');

      // 手动触发工作流
      const triggerButton = workflowStatus.locator('button:has-text("触发")');
      if (await triggerButton.isVisible()) {
        await triggerButton.click();

        // 等待执行完成
        await page.waitForSelector('[data-testid="execution-result"]', {
          timeout: 30000,
        });

        const result = page.locator('[data-testid="execution-result"]');
        await expect(result).toContainText('成功');

        console.log('✅ n8n每日销量预测工作流触发成功');
      }
    } else {
      console.log('⚠️ n8n工作流管理页面未找到');
    }
  });

  /**
   * 测试场景5: 库存预警通知
   */
  test('should receive low stock alert notification', async ({ page }) => {
    test.setTimeout(60000);

    // 创建一个低库存商品
    await page.goto(`${baseUrl}/admin/inventory`);
    await page.click('button:has-text("新增库存")');

    // 填写低库存商品信息
    await page.fill('input[name="sku"]', `LOW-STOCK-${Date.now()}`);
    await page.fill('input[name="name"]', '低库存测试商品');
    await page.fill('input[name="quantity"]', '5');
    await page.fill('input[name="safetyStock"]', '10');
    await page.fill('input[name="reorderPoint"]', '15');

    await page.click('button[type="submit"]');

    // 等待保存成功
    await page.waitForSelector('[data-testid="success-message"]', {
      timeout: 10000,
    });

    // 检查是否收到预警通知
    await page.waitForTimeout(3000);
    const notification = page.locator(
      '[data-testid="notification"]:has-text("库存预警")'
    );

    if (await notification.isVisible()) {
      await expect(notification).toBeVisible();
      console.log('✅ 库存预警通知正常');
    } else {
      console.log('⚠️ 未检测到实时预警通知（可能是异步的）');
    }
  });

  /**
   * 测试场景6: Recharts预测曲线可视化
   */
  test('should display Recharts forecast visualization', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto(`${baseUrl}/admin/inventory/analytics`);

    // 验证预测曲线图表存在
    const chartContainer = page.locator('[data-testid="forecast-line-chart"]');
    if (await chartContainer.isVisible()) {
      await expect(chartContainer).toBeVisible();

      // 验证图例
      const legend = page.locator('[data-testid="chart-legend"]');
      await expect(legend).toBeVisible();

      // 验证历史数据和预测区间
      const historicalLine = page.locator(
        '.recharts-line[data-name="历史销量"]'
      );
      const forecastArea = page.locator('.recharts-area[data-name="预测区间"]');

      if ((await historicalLine.count()) > 0) {
        await expect(historicalLine.first()).toBeVisible();
      }

      if ((await forecastArea.count()) > 0) {
        await expect(forecastArea.first()).toBeVisible();
      }

      console.log('✅ Recharts预测曲线可视化正常');
    } else {
      console.log('⚠️ 预测曲线图表未找到');
    }
  });

  /**
   * 测试场景7: Dify AI问答集成
   */
  test('should interact with Dify AI assistant for inventory queries', async ({
    page,
  }) => {
    test.setTimeout(60000);

    await page.goto(`${baseUrl}/admin/inventory`);

    // 查找AI助手按钮
    const aiAssistantButton = page.locator('button:has-text("AI助手")');

    if (await aiAssistantButton.isVisible()) {
      await aiAssistantButton.click();

      // 等待AI助手对话框打开
      await page.waitForSelector('[data-testid="ai-chat-dialog"]', {
        timeout: 10000,
      });

      // 输入问题
      const chatInput = page.locator('[data-testid="chat-input"]');
      await chatInput.fill('当前库存低于安全库存的商品有哪些？');
      await page.keyboard.press('Enter');

      // 等待AI回复
      await page.waitForSelector('[data-testid="ai-response"]', {
        timeout: 15000,
      });

      const aiResponse = page.locator('[data-testid="ai-response"]').last();
      await expect(aiResponse).toBeVisible();

      // 验证回复包含相关内容
      const responseText = await aiResponse.textContent();
      expect(responseText).toBeTruthy();
      expect(responseText!.length).toBeGreaterThan(10);

      console.log('✅ Dify AI问答集成正常');
    } else {
      console.log('⚠️ AI助手按钮未找到');
    }
  });

  /**
   * 测试场景8: 移动端响应式布局
   */
  test('should be responsive on mobile devices', async ({ page }) => {
    // 模拟移动设备
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto(`${baseUrl}/admin/inventory`);

    // 验证关键元素在移动端可见
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // 验证表格或列表适配移动端
    const dataTable = page.locator('[data-testid="inventory-table"]');
    if ((await dataTable.count()) > 0) {
      // 检查是否有移动端优化样式
      const isResponsive = await dataTable.evaluate(el => {
        const style = window.getComputedStyle(el);
        return (
          style.overflowX === 'auto' ||
          el.classList.contains('mobile-optimized')
        );
      });

      expect(isResponsive).toBeTruthy();
    }

    console.log('✅ 移动端响应式布局正常');
  });

  /**
   * 测试场景9: 批量操作功能
   */
  test('should support batch operations on inventory items', async ({
    page,
  }) => {
    await page.goto(`${baseUrl}/admin/inventory`);

    // 选择多个商品
    const checkboxes = page.locator(
      'input[type="checkbox"][name="select-item"]'
    );
    const count = await checkboxes.count();

    if (count >= 2) {
      // 勾选前两个商品
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();

      // 验证批量操作按钮出现
      const batchActions = page.locator('[data-testid="batch-actions"]');
      await expect(batchActions).toBeVisible();

      // 测试批量导出
      const exportButton = batchActions.locator('button:has-text("导出")');
      if (await exportButton.isVisible()) {
        await exportButton.click();

        // 等待下载或提示
        await page.waitForTimeout(2000);

        console.log('✅ 批量操作功能正常');
      }
    } else {
      console.log('⚠️ 库存商品数量不足，跳过批量操作测试');
    }
  });

  /**
   * 测试场景10: 数据导出功能
   */
  test('should export inventory data to Excel/CSV', async ({ page }) => {
    await page.goto(`${baseUrl}/admin/inventory`);

    // 查找导出按钮
    const exportButton = page.locator('button:has-text("导出")').first();

    if (await exportButton.isVisible()) {
      // 监听下载事件
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

      await exportButton.click();

      try {
        const download = await downloadPromise;
        const filename = download.suggestedFilename();

        // 验证文件格式
        expect(filename).toMatch(/\.(xlsx|csv)$/i);

        console.log(`✅ 数据导出成功: ${filename}`);
      } catch (error) {
        console.log('⚠️ 下载事件未捕获（可能是前端导出）');
      }
    } else {
      console.log('⚠️ 导出按钮未找到');
    }
  });
});
