/**
 * 智能补货建议卡片组件
 * 展示AI生成的补货建议，支持一键审批
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  TrendingUp,
  XCircle,
} from 'lucide-react';

export interface ReplenishmentSuggestion {
  id: string;
  itemId: string;
  sku: string;
  productName: string;
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  predictedDemand: number;
  suggestedQuantity: number;
  estimatedCost: number;
  currency: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'ordered';
  reason: string;
  supplierName?: string;
  leadTime?: number;
  createdAt: string;
  expiresAt?: string;
}

interface ReplenishmentSuggestionsCardProps {
  suggestions: ReplenishmentSuggestion[];
  title?: string;
  onApprove?: (id: string, quantity: number) => Promise<void>;
  onReject?: (id: string, reason?: string) => Promise<void>;
  loading?: boolean;
}

const PRIORITY_CONFIG = {
  urgent: {
    label: '紧急',
    color: 'destructive' as const,
    icon: AlertTriangle,
  },
  high: {
    label: '高',
    color: 'destructive' as const,
    icon: TrendingUp,
  },
  medium: {
    label: '中',
    color: 'default' as const,
    icon: Package,
  },
  low: {
    label: '低',
    color: 'secondary' as const,
    icon: Clock,
  },
};

const STATUS_CONFIG = {
  pending: {
    label: '待审批',
    color: 'outline' as const,
    icon: Clock,
  },
  approved: {
    label: '已批准',
    color: 'default' as const,
    icon: CheckCircle,
  },
  rejected: {
    label: '已拒绝',
    color: 'secondary' as const,
    icon: XCircle,
  },
  ordered: {
    label: '已下单',
    color: 'default' as const,
    icon: Package,
  },
};

export function ReplenishmentSuggestionsCard({
  suggestions,
  title = '智能补货建议',
  onApprove,
  onReject,
  loading = false,
}: ReplenishmentSuggestionsCardProps) {
  // 按优先级排序
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // 处理审批
  const handleApprove = async (suggestion: ReplenishmentSuggestion) => {
    if (onApprove && !loading) {
      await onApprove(suggestion.id, suggestion.suggestedQuantity);
    }
  };

  // 处理拒绝
  const handleReject = async (suggestion: ReplenishmentSuggestion) => {
    if (onReject && !loading) {
      await onReject(suggestion.id, '暂不需要补货');
    }
  };

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p>暂无补货建议</p>
            <p className="text-sm">库存状态良好</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Badge variant="outline">{suggestions.length} 条建议</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedSuggestions.map(suggestion => {
            const PriorityIcon = PRIORITY_CONFIG[suggestion.priority].icon;
            const StatusIcon = STATUS_CONFIG[suggestion.status].icon;

            return (
              <div
                key={suggestion.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                {/* 头部信息 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">
                        {suggestion.productName}
                      </h4>
                      <Badge
                        variant={PRIORITY_CONFIG[suggestion.priority].color}
                      >
                        <PriorityIcon className="h-3 w-3 mr-1" />
                        {PRIORITY_CONFIG[suggestion.priority].label}
                      </Badge>
                      <Badge variant={STATUS_CONFIG[suggestion.status].color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {STATUS_CONFIG[suggestion.status].label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      SKU: {suggestion.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      {suggestion.suggestedQuantity} 件
                    </p>
                    <p className="text-xs text-muted-foreground">
                      预计费用: ¥{suggestion.estimatedCost.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* 库存信息 */}
                <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">当前库存</p>
                    <p
                      className={`font-semibold ${
                        suggestion.currentStock <= suggestion.safetyStock
                          ? 'text-red-600'
                          : ''
                      }`}
                    >
                      {suggestion.currentStock}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">安全库存</p>
                    <p className="font-semibold">{suggestion.safetyStock}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">预测需求</p>
                    <p className="font-semibold text-green-600">
                      {suggestion.predictedDemand}
                    </p>
                  </div>
                </div>

                {/* 推荐理由 */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-3 rounded">
                  <p className="text-sm text-blue-900">{suggestion.reason}</p>
                </div>

                {/* 供应商信息 */}
                {suggestion.supplierName && (
                  <div className="text-xs text-muted-foreground mb-3">
                    <span>推荐供应商: {suggestion.supplierName}</span>
                    {suggestion.leadTime && (
                      <span className="ml-3">
                        交货期: {suggestion.leadTime} 天
                      </span>
                    )}
                  </div>
                )}

                {/* 时间信息 */}
                <div className="text-xs text-muted-foreground mb-3 flex items-center gap-3">
                  <span>生成时间: {formatDate(suggestion.createdAt)}</span>
                  {suggestion.expiresAt && (
                    <span>过期时间: {formatDate(suggestion.expiresAt)}</span>
                  )}
                </div>

                {/* 操作按钮 */}
                {suggestion.status === 'pending' && onApprove && onReject && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(suggestion)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      批准
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(suggestion)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      拒绝
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 批量操作提示 */}
        {suggestions.length > 5 && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            显示前 {Math.min(suggestions.length, 10)} 条建议，共{' '}
            {suggestions.length} 条
          </div>
        )}
      </CardContent>
    </Card>
  );
}
