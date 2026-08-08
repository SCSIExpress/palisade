import { Module } from "@nestjs/common";
import { DbBackupService } from "./dbbackup.service";
import { ManagerSettingsModule } from "../manager-settings/manager-settings.module";

@Module({
  imports: [ManagerSettingsModule],
  providers: [DbBackupService],
})
export class DbBackupModule {}
