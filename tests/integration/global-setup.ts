import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export default function setup() {
  const databaseDirectory = mkdtempSync(
    path.join(tmpdir(), "star-integration-")
  );
  const databaseUrl = `file:${path.join(databaseDirectory, "test.db")}`;

  process.env.DATABASE_URL = databaseUrl;

  const database = new DatabaseSync(path.join(databaseDirectory, "test.db"));
  const migrationsDirectory = path.join(process.cwd(), "prisma", "migrations");
  try {
    const migrationDirectories = readdirSync(migrationsDirectory, {
      withFileTypes: true
    })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    for (const migrationName of migrationDirectories) {
      const migrationPath = path.join(
        migrationsDirectory,
        migrationName,
        "migration.sql"
      );

      database.exec(readFileSync(migrationPath, "utf8"));
    }
  } catch (error) {
    database.close();
    rmSync(databaseDirectory, { force: true, recursive: true });
    throw error;
  }

  database.close();

  return () => {
    rmSync(databaseDirectory, { force: true, recursive: true });
  };
}
