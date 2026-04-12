/**
 * 库存管理控制器
 * 处理库存相关的HTTP请求
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRepositories } from '../../infrastructure/repositories';
import { authenticateUser } from '../api/middleware';
import { ErrorCodes, errorResponse, successResponse } from '../api/response';

const repositories = createRepositories();

/**
 * GET /api/inventory - 获取库存列表
 */
export async function GET(request: NextRequest) {
  try {
    // 认证
    const { user, error: authError } = await authenticateUser(request);
    if (!user) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, authError || '未授权'),
        { status: 401 }
      );
    }

    // 解析查询参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status') || undefined;
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const search = searchParams.get('search') || undefined;

    // 查询库存
    const result = await repositories.inventory.findAll({
      page,
      pageSize,
      status,
      warehouseId,
      search,
    });

    return NextResponse.json(successResponse(result));
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        '获取库存列表失败',
        error.message
      ),
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory - 创建新库存项
 */
export async function POST(request: NextRequest) {
  try {
    // 认证
    const { user, error: authError } = await authenticateUser(request);
    if (!user) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, authError || '未授权'),
        { status: 401 }
      );
    }

    // 权限检查(仅admin和warehouse_manager可以创建)
    if (!['admin', 'warehouse_manager'].includes(user.role || '')) {
      return NextResponse.json(
        errorResponse(ErrorCodes.FORBIDDEN, '没有创建库存的权限'),
        { status: 403 }
      );
    }

    // 解析请求体
    const body = await request.json();

    // 验证必填字段
    if (!body.sku || !body.productName || body.quantity === undefined) {
      return NextResponse.json(
        errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          '缺少必填字段: sku, productName, quantity'
        ),
        { status: 400 }
      );
    }

    // 创建库存项
    const item = await repositories.inventory.create({
      sku: body.sku,
      productName: body.productName,
      quantity: Number(body.quantity),
      warehouseId: body.warehouseId,
      status: body.status || 'normal',
      safetyStock: body.safetyStock ? Number(body.safetyStock) : undefined,
      reorderPoint: body.reorderPoint ? Number(body.reorderPoint) : undefined,
      leadTimeDays: body.leadTimeDays ? Number(body.leadTimeDays) : undefined,
      forecastEnabled: body.forecastEnabled ?? true,
    } as any);

    return NextResponse.json(successResponse(item, '库存项创建成功'), {
      status: 201,
    });
  } catch (error: any) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, '创建库存项失败', error.message),
      { status: 500 }
    );
  }
}
