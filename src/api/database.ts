import type { HaexHubClient } from "../client";
import type { DatabaseQueryResult } from "../types";
import { HAEXTENSION_METHODS } from "../methods";

export class DatabaseAPI {
  constructor(private client: HaexHubClient) {}

  async query<T>(query: string, params?: unknown[]): Promise<T[]> {
    const result = await this.client.request<DatabaseQueryResult>(
      HAEXTENSION_METHODS.database.query,
      {
        query,
        params: params || [],
      }
    );

    return result.rows as T[];
  }

  async queryOne<T = unknown>(
    query: string,
    params?: unknown[]
  ): Promise<T | null> {
    const rows = await this.query<T>(query, params);
    return rows.length > 0 ? rows[0] ?? null : null;
  }

  async execute(
    query: string,
    params?: unknown[]
  ): Promise<DatabaseQueryResult> {
    return this.client.request<DatabaseQueryResult>(HAEXTENSION_METHODS.database.execute, {
      query,
      params: params || [],
    });
  }

  async transaction(statements: string[]): Promise<void> {
    await this.client.request(HAEXTENSION_METHODS.database.transaction, {
      statements,
    });
  }

  async createTable(tableName: string, columns: string): Promise<void> {
    const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns})`;
    await this.execute(query);
  }

  async dropTable(tableName: string): Promise<void> {
    const query = `DROP TABLE IF EXISTS ${tableName}`;
    await this.execute(query);
  }

  /**
   * Registers extension migrations with HaexVault for CRDT synchronization
   * HaexVault will validate and execute these migrations, ensuring only
   * tables with the correct prefix are manipulated
   * @param extensionVersion - The version of the extension
   * @param migrations - Array of migration objects with name and SQL content
   * @returns Promise that resolves when migrations are registered
   */
  async registerMigrationsAsync(
    extensionVersion: string,
    migrations: Array<{ name: string; sql: string }>
  ): Promise<void> {
    await this.client.request(HAEXTENSION_METHODS.database.registerMigrations, {
      extensionVersion,
      migrations,
    });
  }

  async insert(
    tableName: string,
    data: Record<string, unknown>
  ): Promise<number> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => "?").join(", ");

    const query = `INSERT INTO ${tableName} (${keys.join(
      ", "
    )}) VALUES (${placeholders})`;
    const result = await this.execute(query, values);

    return result.lastInsertId ?? -1;
  }

  async update(
    tableName: string,
    data: Record<string, unknown>,
    where: string,
    whereParams?: unknown[]
  ): Promise<number> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key) => `${key} = ?`).join(", ");

    const query = `UPDATE ${tableName} SET ${setClause} WHERE ${where}`;
    const result = await this.execute(query, [
      ...values,
      ...(whereParams || []),
    ]);

    return result.rowsAffected;
  }

  async delete(
    tableName: string,
    where: string,
    whereParams?: unknown[]
  ): Promise<number> {
    const query = `DELETE FROM ${tableName} WHERE ${where}`;
    const result = await this.execute(query, whereParams);
    return result.rowsAffected;
  }

  async count(
    tableName: string,
    where?: string,
    whereParams?: unknown[]
  ): Promise<number> {
    const query = where
      ? `SELECT COUNT(*) as count FROM ${tableName} WHERE ${where}`
      : `SELECT COUNT(*) as count FROM ${tableName}`;

    const result = await this.queryOne<{ count: number }>(query, whereParams);
    return result?.count ?? 0;
  }

}
