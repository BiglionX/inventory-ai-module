/**
 * Dify AI 聊天客户端
 * 用于与 Dify 平台进行自然语言对话
 */

export interface DifyMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DifyChatRequest {
  inputs?: Record<string, any>;
  query: string;
  response_mode?: 'blocking' | 'streaming';
  conversation_id?: string;
  user?: string;
}

export interface DifyChatResponse {
  event: string;
  message_id: string;
  conversation_id: string;
  answer: string;
  metadata?: {
    retriever_resources?: Array<{
      position: number;
      dataset_id: string;
      dataset_name: string;
      document_id: string;
      document_name: string;
      segment_id: string;
      score: number;
      content: string;
    }>;
  };
}

export interface DifyConfig {
  apiKey: string;
  baseUrl: string;
  userId?: string;
}

export class DifyChatClient {
  private config: DifyConfig;
  private conversationId?: string;

  constructor(config: DifyConfig) {
    this.config = config;
  }

  /**
   * 发送聊天消息
   */
  async chat(
    query: string,
    inputs?: Record<string, any>
  ): Promise<DifyChatResponse> {
    const url = `${this.config.baseUrl}/chat-messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: inputs || {},
        query,
        response_mode: 'blocking',
        conversation_id: this.conversationId,
        user: this.config.userId || 'anonymous',
      }),
    });

    if (!response.ok) {
      throw new Error(`Dify API error: ${response.statusText}`);
    }

    const data = await response.json();

    // 保存会话ID用于后续对话
    if (data.conversation_id) {
      this.conversationId = data.conversation_id;
    }

    return data as DifyChatResponse;
  }

  /**
   * 流式聊天（支持实时响应）
   */
  async *chatStream(
    query: string,
    inputs?: Record<string, any>
  ): AsyncGenerator<DifyChatResponse> {
    const url = `${this.config.baseUrl}/chat-messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: inputs || {},
        query,
        response_mode: 'streaming',
        conversation_id: this.conversationId,
        user: this.config.userId || 'anonymous',
      }),
    });

    if (!response.ok) {
      throw new Error(`Dify API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.conversation_id) {
              this.conversationId = data.conversation_id;
            }
            yield data as DifyChatResponse;
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    }
  }

  /**
   * 停止当前对话
   */
  async stop(taskId: string): Promise<void> {
    const url = `${this.config.baseUrl}/chat-messages/${taskId}/stop`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to stop conversation: ${response.statusText}`);
    }
  }

  /**
   * 获取对话历史
   */
  async getConversationHistory(limit: number = 20): Promise<DifyMessage[]> {
    // 注意: Dify API 可能需要根据实际版本调整
    const url = `${this.config.baseUrl}/messages?conversation_id=${this.conversationId}&limit=${limit}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get conversation history: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * 清除当前会话
   */
  clearConversation(): void {
    this.conversationId = undefined;
  }

  /**
   * 设置用户ID
   */
  setUserId(userId: string): void {
    this.config.userId = userId;
  }
}
