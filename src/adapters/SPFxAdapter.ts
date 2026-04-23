import type { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/site-users/web";

import type { ISharePointAdapter } from "../core/ISharePointAdapter";
import type { NotificationPayload, AddNotificationResult } from "../core/types";
import { MONARCH_LIST_NAME } from "../core/constants";

/**
 * SharePoint adapter for use inside SPFx solutions.
 * Uses PnP JS (@pnp/sp) for all list operations.
 *
 * The caller is responsible for configuring the SPFI instance, e.g.:
 * ```ts
 * import { spfi } from "@pnp/sp";
 * import { SPFx } from "@pnp/sp/behaviors/spfx";
 *
 * const sp = spfi().using(SPFx(this.context));
 * const adapter = new SPFxAdapter(sp);
 * ```
 *
 * @pnp/sp is a **peer dependency** — never bundled by this library.
 */
export class SPFxAdapter implements ISharePointAdapter {
  constructor(private readonly sp: SPFI) {
    if (!sp) throw new Error("SPFxAdapter: a configured SPFI instance is required");
  }

  async addNotification(
    siteUrl: string,
    subject: string,
    payload: NotificationPayload
  ): Promise<AddNotificationResult> {
    // Resolve each email/UPN to a SharePoint internal user ID.
    // ensureUser creates the user in the site if they don't already exist.
    const userIds = await this.resolveUserIds(payload.users);

    const list = this.sp.web.lists.getByTitle(MONARCH_LIST_NAME);

    // Verify the list exists before attempting to add — PnP's raw 404 is not helpful
    const exists = await list.select("Id")().catch(() => null);
    if (!exists) {
      throw new Error(
        `SPFxAdapter: list "${MONARCH_LIST_NAME}" was not found in the site. ` +
        `Check that the list exists at ${siteUrl} and the SPFI instance is pointed at the correct site.`
      );
    }

    const result = await list.items.add({
      Title: payload.title,
      Message: payload.message,
      NotificationType: payload.notificationType,
      Subject: subject,
      // PnP v4 uses odata=nometadata — multi-person fields expect a plain array,
      // not the old verbose { results: [] } wrapper used in PnP v2/v3
      UsersId: userIds,
      ...(payload.notificationLink !== undefined && { ClickUrl: payload.notificationLink }),
    });

    return { id: result.ID as number };
  }

  /**
   * Resolves an array of email addresses / UPNs to SharePoint internal user IDs.
   * Runs all lookups in parallel.
   */
  private async resolveUserIds(emails: string[]): Promise<number[]> {
    const resolved = await Promise.all(
      emails.map(async (email) => {
        // PnP v4: ensureUser() returns ISiteUserInfo directly (no .data wrapper)
        const user = await this.sp.web.ensureUser(email);
        return user.Id as number;
      })
    );
    return resolved;
  }
}
