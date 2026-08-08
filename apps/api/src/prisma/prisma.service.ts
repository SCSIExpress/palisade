import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await this.$connect();
    // WAL mode: readers never block the writer (and vice versa) and a crash
    // mid-write can't corrupt the main file — the right journal mode for a
    // long-running service on SQLite. synchronous=NORMAL is the standard WAL
    // pairing (fsync on checkpoint, not every commit); busy_timeout stops
    // "database is locked" errors under concurrent access bursts.
    // Both of these pragmas RETURN a row, so they must go through $queryRaw —
    // $executeRaw rejects result-returning statements on SQLite.
    const [mode] = await this.$queryRawUnsafe<{ journal_mode: string }[]>("PRAGMA journal_mode=WAL;");
    await this.$queryRawUnsafe("PRAGMA busy_timeout=5000;");
    await this.$executeRawUnsafe("PRAGMA synchronous=NORMAL;");
    this.logger.log(`Connected to SQLite database (journal_mode=${mode?.journal_mode ?? "?"})`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
