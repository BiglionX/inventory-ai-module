/**
 * API认证中间件
 */

import { supabase } from '@/lib/supabase';
import { NextRequest } from 'next/server';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
}

/**
 * 验证用户身份
 */
export async function authenticateUser(request: NextRequest): Promise<{
  user: AuthenticatedUser | null;
  error?: string;
}> {
  try {
    // 从cookie或header获取session
    const authHeader = request.headers.get('authorization');

    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // 尝试从cookie获取
      const cookie = request.cookies.get('sb-access-token');
      token = cookie?.value;
    }

    if (!token) {
      return {
        user: null,
        error: '未提供认证令牌',
      };
    }

    // 验证token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        user: null,
        error: '无效的认证令牌',
      };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'user',
      },
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      user: null,
      error: '认证失败',
    };
  }
}

/**
 * 权限检查中间件
 */
export function requireRole(requiredRoles: string[]) {
  return (user: AuthenticatedUser | null): boolean => {
    if (!user) {
      return false;
    }

    // admin角色拥有所有权限
    if (user.role === 'admin') {
      return true;
    }

    return requiredRoles.includes(user.role || '');
  };
}
