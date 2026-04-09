/* eslint-disable no-console */
/**
 * 进销存AI模块 - 性能基准测试
 * 测试库存查询、预测API、数据库索引等关键性能指标
 */

const http = require('http');
const https = require('https');

// 配置
const CONFIG = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
  predictionApiUrl: process.env.PREDICTION_API_URL || 'http://localhost:8000',
  concurrentUsers: parseInt(process.env.CONCURRENT_USERS || '10'),
  requestsPerUser: parseInt(process.env.REQUESTS_PER_USER || '50'),
  warmupRequests: parseInt(process.env.WARMUP_REQUESTS || '10'),
};

// 测试结果
const results = {
  inventoryList: [],
  forecastApi: [],
  databaseQuery: [],
  errors: 0,
  totalRequests: 0,
};

/**
 * 发送 HTTP 请求
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;

    const req = client.request(
      url,
      {
        ...options,
        method: options.method || 'GET',
        timeout: 30000, // 30秒超时
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          const duration = Date.now() - startTime;
          resolve({
            statusCode: res.statusCode,
            duration,
            data,
          });
        });
      }
    );

    req.on('error', err => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after 30000ms`));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * 测试库存列表查询
 */
async function testInventoryList(tenantId = 'test-tenant') {
  const url = `${CONFIG.baseUrl}/api/inventory/items?tenantId=${tenantId}&page=1&limit=20`;

  try {
    const response = await makeRequest(url);
    results.inventoryList.push(response.duration);
    results.totalRequests++;
    return response;
  } catch (error) {
    results.errors++;
    console.error('Inventory list test failed:', error.message);
    throw error;
  }
}

/**
 * 测试预测 API
 */
async function testForecastApi(itemId = 'test-item-001') {
  const url = `${CONFIG.predictionApiUrl}/predict`;
  const body = {
    item_id: itemId,
    historical_data: generateMockHistoricalData(90),
    forecast_days: 30,
  };

  try {
    const response = await makeRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    results.forecastApi.push(response.duration);
    results.totalRequests++;
    return response;
  } catch (error) {
    results.errors++;
    console.error('Forecast API test failed:', error.message);
    throw error;
  }
}

/**
 * 模拟历史数据
 */
function generateMockHistoricalData(days) {
  const data = [];
  const today = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toISOString().split('T')[0],
      quantity: Math.floor(Math.random() * 50) + 10,
    });
  }

  return data;
}

/**
 * 计算统计信息
 */
function calculateStats(data) {
  if (data.length === 0) return null;

  const sorted = [...data].sort((a, b) => a - b);
  const sum = data.reduce((a, b) => a + b, 0);
  const avg = sum / data.length;

  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Math.round(avg),
    p50,
    p95,
    p99,
    count: data.length,
  };
}

/**
 * 并发测试
 */
async function runConcurrentTest(testFunction, concurrency, iterations) {
  const promises = [];

  for (let i = 0; i < iterations; i++) {
    // 控制并发数
    if (i > 0 && i % concurrency === 0) {
      await Promise.all(promises);
      promises.length = 0;
    }

    promises.push(
      testFunction().catch(err => {
        console.error(`Request ${i + 1} failed:`, err.message);
      })
    );
  }

  // 等待最后一批请求完成
  if (promises.length > 0) {
    await Promise.all(promises);
  }
}

/**
 * 预热测试
 */
async function warmup() {
  console.log('\n🔥 开始预热测试...');

  for (let i = 0; i < CONFIG.warmupRequests; i++) {
    try {
      await testInventoryList();
    } catch (error) {
      // 忽略预热错误
    }
  }

  console.log('✅ 预热完成\n');
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 开始性能基准测试');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`配置:`);
  console.log(`  - 并发用户数: ${CONFIG.concurrentUsers}`);
  console.log(`  - 每用户请求数: ${CONFIG.requestsPerUser}`);
  console.log(
    `  - 总请求数: ${CONFIG.concurrentUsers * CONFIG.requestsPerUser}`
  );
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 预热
  await warmup();

  // 测试 1: 库存列表查询
  console.log('📊 测试 1: 库存列表查询性能');
  const totalInventoryRequests =
    CONFIG.concurrentUsers * CONFIG.requestsPerUser;
  await runConcurrentTest(
    () => testInventoryList(),
    CONFIG.concurrentUsers,
    totalInventoryRequests
  );
  const inventoryStats = calculateStats(results.inventoryList);
  console.log('✅ 库存列表测试完成\n');

  // 测试 2: 预测 API
  console.log('🤖 测试 2: 预测 API 性能');
  const totalForecastRequests = Math.min(CONFIG.concurrentUsers * 10, 50); // 限制预测API请求数
  await runConcurrentTest(
    () => testForecastApi(),
    Math.min(CONFIG.concurrentUsers, 5),
    totalForecastRequests
  );
  const forecastStats = calculateStats(results.forecastApi);
  console.log('✅ 预测 API 测试完成\n');

  // 打印结果
  printResults(inventoryStats, forecastStats);
}

/**
 * 打印测试结果
 */
function printResults(inventoryStats, forecastStats) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 性能测试结果');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (inventoryStats) {
    console.log('📦 库存列表查询:');
    console.log(`  平均响应时间: ${inventoryStats.avg}ms`);
    console.log(`  P50: ${inventoryStats.p50}ms`);
    console.log(`  P95: ${inventoryStats.p95}ms`);
    console.log(`  P99: ${inventoryStats.p99}ms`);
    console.log(`  最小值: ${inventoryStats.min}ms`);
    console.log(`  最大值: ${inventoryStats.max}ms`);
    console.log(`  总请求数: ${inventoryStats.count}`);

    // 性能评估
    const performance =
      inventoryStats.avg < 200
        ? '✅ 优秀'
        : inventoryStats.avg < 500
          ? '⚠️ 良好'
          : '❌ 需要优化';
    console.log(`  评级: ${performance}\n`);
  }

  if (forecastStats) {
    console.log('🤖 预测 API:');
    console.log(`  平均响应时间: ${forecastStats.avg}ms`);
    console.log(`  P50: ${forecastStats.p50}ms`);
    console.log(`  P95: ${forecastStats.p95}ms`);
    console.log(`  P99: ${forecastStats.p99}ms`);
    console.log(`  最小值: ${forecastStats.min}ms`);
    console.log(`  最大值: ${forecastStats.max}ms`);
    console.log(`  总请求数: ${forecastStats.count}`);

    // 性能评估
    const performance =
      forecastStats.avg < 2000
        ? '✅ 优秀'
        : forecastStats.avg < 5000
          ? '⚠️ 良好'
          : '❌ 需要优化';
    console.log(`  评级: ${performance}\n`);
  }

  console.log('📊 总体统计:');
  console.log(`  总请求数: ${results.totalRequests}`);
  console.log(`  失败请求: ${results.errors}`);
  const successRate =
    results.totalRequests > 0
      ? ((1 - results.errors / results.totalRequests) * 100).toFixed(2)
      : '0.00';
  console.log(`  成功率: ${successRate}%`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 生成报告文件
  generateReport(inventoryStats, forecastStats);
}

/**
 * 生成测试报告
 */
function generateReport(inventoryStats, forecastStats) {
  const fs = require('fs');
  const path = require('path');

  const report = {
    timestamp: new Date().toISOString(),
    config: CONFIG,
    results: {
      inventoryList: inventoryStats,
      forecastApi: forecastStats,
      totalRequests: results.totalRequests,
      errors: results.errors,
      successRate:
        results.totalRequests > 0
          ? `${((1 - results.errors / results.totalRequests) * 100).toFixed(2)}%`
          : '0.00%',
    },
  };

  const reportPath = path.join(__dirname, '../../logs/performance-report.json');
  const logsDir = path.dirname(reportPath);

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 详细报告已保存至: ${reportPath}\n`);
}

// 执行测试
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  testInventoryList,
  testForecastApi,
  runAllTests,
  calculateStats,
};
