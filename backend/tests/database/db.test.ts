import { initializeDatabase, getDatabase, closeDatabase } from '../../src/database';

describe('Database Connection', () => {
  afterAll(async () => {
    await closeDatabase();
  });

  test('should initialize database connection', () => {
    const db = initializeDatabase();
    expect(db).toBeDefined();
  });

  test('should return same database instance on multiple calls', () => {
    const db1 = initializeDatabase();
    const db2 = getDatabase();
    expect(db1).toBe(db2);
  });

  test('should throw error if getDatabase called before initialization', async () => {
    await closeDatabase();
    expect(() => getDatabase()).toThrow('Database not initialized');
  });

  test('should close database connection', async () => {
    initializeDatabase();
    await closeDatabase();
    expect(() => getDatabase()).toThrow('Database not initialized');
  });
});
