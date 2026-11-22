import { RedisService } from '../../redis/redis.service';

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    delete process.env.REDIS_URL;
    service = new RedisService();
    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('operates in memory fallback mode when REDIS_URL is not set', () => {
    expect(service.isHealthy()).toBe(false);
    expect(service.getClient()).toBeNull();
  });

  it('stores and retrieves cache items in memory fallback mode', async () => {
    await service.set('test-key', { message: 'hello' }, 10);
    const cached = await service.get<{ message: string }>('test-key');
    expect(cached).toEqual({ message: 'hello' });
  });

  it('returns null for non-existing or expired items', async () => {
    const cached = await service.get('unknown-key');
    expect(cached).toBeNull();

    // Expired item (negative TTL)
    await service.set('expired-key', 'expired', -1);
    const expiredVal = await service.get('expired-key');
    expect(expiredVal).toBeNull();
  });

  it('deletes specific keys correctly', async () => {
    await service.set('key1', 'value1');
    await service.set('key2', 'value2');

    await service.del('key1');
    expect(await service.get('key1')).toBeNull();
    expect(await service.get('key2')).toBe('value2');
  });

  it('invalidates keys by prefix', async () => {
    await service.set('catalog:product:1', { id: 1 });
    await service.set('catalog:product:2', { id: 2 });
    await service.set('order:100', { total: 500 });

    await service.invalidateByPrefix('catalog:');
    expect(await service.get('catalog:product:1')).toBeNull();
    expect(await service.get('catalog:product:2')).toBeNull();
    expect(await service.get('order:100')).toEqual({ total: 500 });
  });

  it('flushes all cache', async () => {
    await service.set('item1', 1);
    await service.set('item2', 2);
    await service.flushAll();

    expect(await service.get('item1')).toBeNull();
    expect(await service.get('item2')).toBeNull();
  });
});
