import { app } from 'electron';

import { eventBus } from '@/shared/lib/event-bus';
import { AppService } from '@/main/services/app-service';

export class NotificationService {
  private readonly appService: AppService;

  constructor(appService: AppService) {
    this.appService = appService;

    if (process.platform !== 'darwin') {
      return;
    }

    eventBus.subscribe((event) => {
      if (event.type === 'radar_data_updated') {
        this.checkBadge();
      } else if (event.type === 'workspace_deleted') {
        this.checkBadge();
      } else if (event.type === 'account_deleted') {
        this.checkBadge();
      }
    });
  }

  public checkBadge() {
    if (process.platform !== 'darwin') {
      return;
    }

    const accounts = this.appService.getAccounts();
    if (accounts.length === 0) {
      app.dock.setBadge('');
      return;
    }

    let importantCount = 0;
    let hasUnseenChanges = false;

    for (const account of accounts) {
      const workspaces = account.getWorkspaces();

      for (const workspace of workspaces) {
        const radarData = workspace.radar.getData();
        importantCount += radarData.importantCount;
        hasUnseenChanges = hasUnseenChanges || radarData.hasUnseenChanges;
      }
    }

    if (importantCount > 0) {
      app.dock.setBadge(importantCount.toString());
    } else if (hasUnseenChanges) {
      app.dock.setBadge('·');
    } else {
      app.dock.setBadge('');
    }
  }
}
