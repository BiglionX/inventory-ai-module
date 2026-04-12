import { supabase } from '@/lib/supabase';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  InventoryItem,
  InventoryStatus,
} from '../../domain/entities/InventoryItem';
import { SupabaseInventoryRepository } from './SupabaseInventoryRepository';

vi.mock('@/lib/supabase', () => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
  };

  return {
    supabase: {
      from: vi.fn(() => ({ ...mockChain })),
    },
  };
});

describe('SupabaseInventoryRepository', () => {
  let repository: SupabaseInventoryRepository;
  const mockTable = 'foreign_trade_inventory';

  beforeEach(() => {
    repository = new SupabaseInventoryRepository();
    vi.clearAllMocks();
  });

  const createMockItem = (): InventoryItem => {
    return new InventoryItem({
      id: 'test-id-1',
      tenantId: 'tenant-1',
      sku: 'SKU-001',
      name: 'Test Item',
      unitPrice: 100,
      currency: 'CNY',
      quantity: 50,
      reservedQuantity: 10,
      safetyStock: 5,
      reorderPoint: 10,
      status: InventoryStatus.IN_STOCK,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const createMockRecord = () => ({
    id: 'test-id-1',
    tenant_id: 'tenant-1',
    sku: 'SKU-001',
    name: 'Test Item',
    description: null,
    category: null,
    brand: null,
    model: null,
    unit_price: 100,
    currency: 'CNY',
    quantity: 50,
    reserved_quantity: 10,
    safety_stock: 5,
    reorder_point: 10,
    status: 'in_stock',
    location_id: null,
    warehouse_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  it('should find an item by ID', async () => {
    const mockSelect = {
      eq: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: createMockRecord(), error: null }),
    };
    (supabase.from as any).mockReturnValue(mockSelect);

    const result = await repository.findById('test-id-1');

    expect(supabase.from).toHaveBeenCalledWith(mockTable);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('test-id-1');
    expect(result?.sku).toBe('SKU-001');
  });

  it('should return null if item not found by ID', async () => {
    const mockSelect = {
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    (supabase.from as any).mockReturnValue(mockSelect);

    const result = await repository.findById('non-existent');
    expect(result).toBeNull();
  });

  it('should save a new or existing item', async () => {
    const item = createMockItem();
    const mockUpsert = {
      select: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({ data: createMockRecord(), error: null }),
    };
    (supabase.from as any).mockReturnValue(mockUpsert);

    const result = await repository.save(item);

    expect(supabase.from).toHaveBeenCalledWith(mockTable);
    expect(result.id).toBe(item.id);
  });

  it('should delete an item by ID', async () => {
    const mockDelete = { eq: vi.fn().mockResolvedValue({ error: null }) };
    (supabase.from as any).mockReturnValue(mockDelete);

    await repository.delete('test-id-1');

    expect(supabase.from).toHaveBeenCalledWith(mockTable);
    expect(mockDelete.eq).toHaveBeenCalledWith('id', 'test-id-1');
  });

  it('should find all items for a tenant with pagination', async () => {
    const mockQuery = {
      eq: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({
        data: [createMockRecord()],
        count: 1,
        error: null,
      }),
    };
    (supabase.from as any).mockReturnValue(mockQuery);

    const result = await repository.findAll('tenant-1', {
      limit: 10,
      offset: 0,
    });

    expect(result.items.length).toBe(1);
    expect(result.total).toBe(1);
    expect(result.items[0].tenantId).toBe('tenant-1');
  });
});
