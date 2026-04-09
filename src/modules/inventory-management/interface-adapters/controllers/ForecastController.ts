/**
 * 预测管理控制器
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRepositories } from '../../infrastructure/repositories';
import { authenticateUser } from '../api/middleware';
import { ErrorCodes, errorResponse, successResponse } from '../api/response';

const repositories = createRepositories();

/**
 * GET /api/forecast/:itemId - 获取商品预测历史
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    // 认证
    const { user, error: authError } = await authenticateUser(request);
    if (!user) {
      return NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, authError || '未授权'),
        { status: 401 }
      );
    }

    const itemId = params.itemId;
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    // 获取未来预测汇总
    const summary = await repositories.forecast.getFutureForecastSummary(
      itemId,
      days
    );

    // 获取预测历史
    const history = await repositories.forecast.findByItemId(itemId, {
      limit: 50,
    });

    return NextResponse.json(
      successResponse({
        summary,
        history,
      })
    );
  } catch (error: any) {
    console.error('Error fetching forecast:', error);
    return NextResponse.json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        '获取预测数据失败',
        error.message
      ),
      { status: 500 }
    );
  }
}

/**
 * POST /api/forecast/trigger - 手动触发预测
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

    // 权限检查
    if (!['admin', 'data_analyst'].includes(user.role || '')) {
      return NextResponse.json(
        errorResponse(ErrorCodes.FORBIDDEN, '没有触发预测的权限'),
        { status: 403 }
      );
    }

    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json(
        errorResponse(ErrorCodes.VALIDATION_ERROR, '缺少itemId参数'),
        { status: 400 }
      );
    }

    // TODO: 调用预测API生成新预测
    // 这里应该调用FastAPI预测服务

    return NextResponse.json(successResponse(null, '预测任务已触发'));
  } catch (error: any) {
    console.error('Error triggering forecast:', error);
    return NextResponse.json(
      errorResponse(ErrorCodes.INTERNAL_ERROR, '触发预测失败', error.message),
      { status: 500 }
    );
  }
}
