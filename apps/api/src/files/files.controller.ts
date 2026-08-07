import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { createReadStream } from "node:fs";

/** The slice of Express's Response we use (avoids a @types/express dependency). */
type Response = {
  setHeader(name: string, value: string): void;
};
import { MinRole } from "../auth/min-role.decorator";
import { FilesService } from "./files.service";

type Upload = { originalname: string; buffer: Buffer };
// Uploads through the file manager share the backups cap (the web proxy allows 1 GiB).
const UPLOAD = { limits: { fileSize: 1024 * 1024 * 1024 } };

/**
 * Per-server file manager. Everything — including reads — requires operator:
 * instance files hold join/admin passwords and tokens, which viewers must not see.
 */
@Controller("servers/:id/files")
@MinRole("operator")
export class FilesController {
  constructor(private readonly files: FilesService) {}

  /** List a directory ({ path, entries, truncated }). */
  @Get()
  list(@Param("id") id: string, @Query("path") path?: string) {
    return this.files.list(id, path ?? ".");
  }

  /** Text content for the in-browser editor (400 for binary/oversized files). */
  @Get("content")
  read(@Param("id") id: string, @Query("path") path = "") {
    return this.files.readText(id, path);
  }

  /** Save edited text content. */
  @Put("content")
  write(@Param("id") id: string, @Body() body: { path: string; content: string }) {
    return this.files.writeText(id, String(body?.path ?? ""), String(body?.content ?? ""));
  }

  /** Stream any file as a download. */
  @Get("download")
  async download(@Param("id") id: string, @Query("path") path = "", @Res() res: Response) {
    const { file, name, size } = await this.files.downloadPath(id, path);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Length", String(size));
    res.setHeader("Content-Disposition", `attachment; filename="${name.replace(/"/g, "")}"`);
    createReadStream(file).pipe(res as unknown as NodeJS.WritableStream);
  }

  /** Upload a file into a directory (multipart field "file", ?path= the dir). */
  @Post("upload")
  @UseInterceptors(FileInterceptor("file", UPLOAD))
  upload(@Param("id") id: string, @Query("path") path = ".", @UploadedFile() file?: Upload) {
    if (!file) throw new Error("No file uploaded");
    return this.files.upload(id, path, file.originalname, file.buffer);
  }

  @Post("mkdir")
  mkdir(@Param("id") id: string, @Body() body: { path: string }) {
    return this.files.mkdir(id, String(body?.path ?? ""));
  }

  @Post("rename")
  rename(@Param("id") id: string, @Body() body: { from: string; to: string }) {
    return this.files.rename(id, String(body?.from ?? ""), String(body?.to ?? ""));
  }

  @Delete()
  remove(@Param("id") id: string, @Query("path") path = "") {
    return this.files.remove(id, path);
  }
}
