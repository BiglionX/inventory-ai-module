/**
 * Dify AI 聊天助手组件
 * 提供自然语言库存查询功能
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Loader2, Send, Sparkles, User, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{
    title: string;
    score: number;
  }>;
}

interface AIChatAssistantProps {
  title?: string;
  placeholder?: string;
  onSendMessage?: (message: string) => Promise<string>;
  suggestedQuestions?: string[];
  isOpen?: boolean;
  onClose?: () => void;
}

const DEFAULT_SUGGESTED_QUESTIONS = [
  '当前库存低于安全库存的商品有哪些？',
  '下个月预计需要补货的商品',
  '显示最近30天的销售趋势',
  '哪些商品库存积压严重？',
];

export function AIChatAssistant({
  title = 'AI 库存助手',
  placeholder = '输入您的问题...',
  onSendMessage,
  suggestedQuestions = DEFAULT_SUGGESTED_QUESTIONS,
  isOpen = true,
  onClose,
}: AIChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // 调用API或回调
      let response: string;
      if (onSendMessage) {
        response = await onSendMessage(inputValue);
      } else {
        // 模拟响应（实际应调用Dify API）
        await new Promise(resolve => setTimeout(resolve, 1000));
        response = generateMockResponse(inputValue);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，处理您的请求时出现错误。请稍后重试。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 点击建议问题
  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  // 清空对话
  const handleClear = () => {
    setMessages([]);
  };

  // 生成模拟响应（仅用于演示）
  const generateMockResponse = (query: string): string => {
    if (query.includes('库存') && query.includes('低')) {
      return '目前有以下商品库存低于安全库存：\n\n1. SKU-001 (商品A) - 当前库存: 5, 安全库存: 10\n2. SKU-002 (商品B) - 当前库存: 8, 安全库存: 15\n\n建议尽快补货。';
    }
    if (query.includes('补货')) {
      return '根据预测分析，以下商品预计下月需要补货：\n\n• SKU-001: 建议补货 50 件\n• SKU-003: 建议补货 30 件\n\n已为您生成补货建议，可在"智能补货"页面查看。';
    }
    if (query.includes('销售') || query.includes('趋势')) {
      return '最近30天销售趋势显示整体增长15%。热销商品包括：\n\n1. SKU-005 - 销量 230 件\n2. SKU-002 - 销量 185 件\n3. SKU-008 - 销量 167 件';
    }
    if (query.includes('积压')) {
      return '发现以下商品库存积压：\n\n• SKU-010 - 当前库存 500, 月均销量 20\n• SKU-015 - 当前库存 350, 月均销量 15\n\n建议考虑促销活动或减少采购。';
    }
    return '我理解您的问题。基于当前库存数据，我可以帮您查询相关信息。请问您需要了解哪个具体方面？';
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-purple-600" />
            {title}
            <Badge variant="outline" className="text-xs">
              AI
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* 消息列表 */}
        <ScrollArea ref={scrollRef} className="h-[400px] p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                <Bot className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  您好！我是库存AI助手
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  我可以帮您查询库存、分析销售趋势、提供补货建议等
                </p>
              </div>

              {/* 建议问题 */}
              <div className="w-full space-y-2">
                <p className="text-xs text-muted-foreground">您可以问我：</p>
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    <Sparkles className="h-3 w-3 mr-2 text-purple-600 flex-shrink-0" />
                    <span className="text-sm truncate">{question}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  {/* 头像 */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>

                  {/* 消息内容 */}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    <div
                      className={`text-xs mt-1 ${
                        message.role === 'user'
                          ? 'text-blue-100'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>

                    {/* 引用来源 */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground mb-1">
                          参考来源：
                        </p>
                        {message.sources.map((source, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-muted-foreground"
                          >
                            • {source.title} (相关度:{' '}
                            {(source.score * 100).toFixed(0)}%)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* 加载指示器 */}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      思考中...
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* 输入框 */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            AI 助手基于库存数据提供建议，重要决策请人工确认
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
