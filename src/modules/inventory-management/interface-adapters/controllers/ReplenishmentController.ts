/**
 * 补货建议控制器
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRepositories } from '../../infrastructure/repositories';
import { authenticateUser } from '../api/middleware';
import { ErrorCodes, errorResponse, successResponse } from '../api/response';

const repositories = createRepositories();

/**
 * GET /api/replenishment - 获取待审批的补货建议列表
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

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const priority = searchParams.get('priority') || undefined;

    // 查询待审批建议
    const suggestions = await repositories.replenishment.findPendingSuggestions(
      {
        limit,
        priority: priority as any,
      }
    );

    return NextResponse.json(successResponse(suggestions));
  } catch (error: any) {
    console.error('Error fetching replenishment suggestions:', error);
    return NextResponse.json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        '获取补货建议失败',
        error.message
      ),
      { status: 500 }
    );
  }
}

/**
 * POST /api/replenishment/:id/approve - 批准补货建议
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // 权限检查
    if (!['admin', 'procurement_manager'].includes(user.role || '')) {
      return NextResponse.json(
        errorResponse(ErrorCodes.FORBIDDEN, '没有审批权限'),
        { status: 403 }
      );
    }

    const id = params.id;

    // 更新状态为已批准
    const suggestion = await repositories.replenishment.updateStatus(
      id,
      'approved',
      user.id
    );

    return NextResponse.json(successResponse(suggestion, '补货建议已批准'));
  } catch (error: any) {
    console.error('Error approving replenishment suggestion:', error);
    return NextResponse.json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        '批准补货建议失败',
        error.message
      ),
      { status: 500 }
    );
  }
}

/**
 * POST /api/replenishment/:id/reject - 拒绝补货建议
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // 权限检查
    if (!['admin', 'procurement_manager'].includes(user.role || '')) {
      return NextResponse.json(
        errorResponse(ErrorCodes.FORBIDDEN, '没有审批权限'),
        { status: 403 }
      );
    }

    const id = params.id;

    // 更新状态为已拒绝
    const suggestion = await repositories.replenishment.updateStatus(
      id,
      'rejected',
      user.id
    );

    return NextResponse.json(successResponse(suggestion, '补货建议已拒绝'));
  } catch (error: any) {
    console.error('Error rejecting replenishment suggestion:', error);
    return NextResponse.json(
      errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        '拒绝补货建议失败',
        error.message
      ),
      { status: 500 }
    );
  }
}
