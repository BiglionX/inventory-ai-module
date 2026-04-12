/**
 * Pinecone 向量数据库客户端
 * 用于库存知识库的向量存储和检索
 */

export interface PineconeConfig {
  apiKey: string;
  environment?: string;
  indexName: string;
}

export interface VectorRecord {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}

export interface QueryResult {
  id: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface QueryResponse {
  matches: QueryResult[];
  namespace?: string;
}

export class PineconeClient {
  private config: PineconeConfig;
  private baseUrl: string;

  constructor(config: PineconeConfig) {
    this.config = config;
    this.baseUrl = `https://${config.indexName}-${config.apiKey.split('-')[0]}.svc.${config.environment || 'us-east1-gcp'}.pinecone.io`;
  }

  /**
   * 上传向量记录
   */
  async upsert(vectors: VectorRecord[], namespace?: string): Promise<void> {
    const url = `${this.baseUrl}/vectors/upsert`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Api-Key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vectors,
        namespace,
      }),
    });

    if (!response.ok) {
      throw new Error(`Pinecone upsert error: ${response.statusText}`);
    }
  }

  /**
   * 查询相似向量
   */
  async query(
    vector: number[],
    topK: number = 10,
    filter?: Record<string, any>,
    namespace?: string
  ): Promise<QueryResponse> {
    const url = `${this.baseUrl}/query`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Api-Key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vector,
        topK,
        filter,
        includeMetadata: true,
        namespace,
      }),
    });

    if (!response.ok) {
      throw new Error(`Pinecone query error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * 删除向量记录
   */
  async delete(ids: string[], namespace?: string): Promise<void> {
    const url = `${this.baseUrl}/vectors/delete`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Api-Key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids,
        namespace,
      }),
    });

    if (!response.ok) {
      throw new Error(`Pinecone delete error: ${response.statusText}`);
    }
  }

  /**
   * 获取索引统计信息
   */
  async describeIndexStats(): Promise<any> {
    const url = `${this.baseUrl}/describe_index_stats`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Api-Key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Pinecone describe error: ${response.statusText}`);
    }

    return response.json();
  }
}

/**
 * 库存知识向量化服务
 */
export class InventoryKnowledgeEmbedder {
  private pinecone: PineconeClient;

  constructor(pinecone: PineconeClient) {
    this.pinecone = pinecone;
  }

  /**
   * 将库存项转换为向量并存储
   */
  async embedInventoryItem(item: {
    id: string;
    sku: string;
    name: string;
    description?: string;
    category?: string;
    quantity: number;
    safetyStock: number;
    reorderPoint: number;
  }): Promise<void> {
    // 构建文本内容
    const content = [
      `SKU: ${item.sku}`,
      `名称: ${item.name}`,
      item.description && `描述: ${item.description}`,
      item.category && `分类: ${item.category}`,
      `当前库存: ${item.quantity}`,
      `安全库存: ${item.safetyStock}`,
      `再订货点: ${item.reorderPoint}`,
    ]
      .filter(Boolean)
      .join('\n');

    // 调用嵌入API生成向量（这里使用模拟，实际应调用嵌入模型API）
    const embedding = await this.generateEmbedding(content);

    // 存储到 Pinecone
    await this.pinecone.upsert([
      {
        id: item.id,
        values: embedding,
        metadata: {
          sku: item.sku,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          type: 'inventory_item',
          content,
        },
      },
    ]);
  }

  /**
   * 搜索相关库存项
   */
  async searchInventory(
    query: string,
    topK: number = 5
  ): Promise<QueryResult[]> {
    // 生成查询向量
    const queryEmbedding = await this.generateEmbedding(query);

    // 查询相似向量
    const result = await this.pinecone.query(queryEmbedding, topK, {
      type: { $eq: 'inventory_item' },
    });

    return result.matches;
  }

  /**
   * 生成文本嵌入向量（模拟实现）
   * 实际项目中应调用 OpenAI、HuggingFace 等嵌入模型API
   */
  private async generateEmbedding(_text: string): Promise<number[]> {
    // TODO: 替换为实际的嵌入模型API调用
    // 示例: OpenAI embeddings API
    /*
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text,
      }),
    });
    const data = await response.json();
    return data.data[0].embedding;
    */

    // 临时返回随机向量（仅用于测试）
    console.warn(
      'Using random embedding for testing. Replace with actual embedding API.'
    );
    return Array.from({ length: 1536 }, () => Math.random());
  }

  /**
   * 批量导入库存数据
   */
  async bulkImport(
    items: Array<{
      id: string;
      sku: string;
      name: string;
      description?: string;
      category?: string;
      quantity: number;
      safetyStock: number;
      reorderPoint: number;
    }>
  ): Promise<void> {
    for (const item of items) {
      await this.embedInventoryItem(item);
    }
  }
}
