import type { ISharePointAdapter } from "../core/ISharePointAdapter";
import type { NotificationPayload, AddNotificationResult } from "../core/types";
import { MONARCH_LIST_NAME } from "../core/constants";

export interface GraphAdapterOptions {
  /**
   * A valid Microsoft Graph bearer token, or an async function that returns one.
   * Use the callback form when you need token refresh (e.g. MSAL's acquireTokenSilent).
   *
   * Required scopes: Sites.ReadWrite.All (or Sites.Selected + appropriate site permission)
   */
  accessToken: string | (() => Promise<string>);
}

/**
 * SharePoint adapter for use in standalone web applications.
 * Uses the Microsoft Graph REST API directly (no SDK dependency).
 *
 * The caller is responsible for obtaining a valid access token, e.g. via MSAL.js:
 * ```ts
 * const adapter = new GraphAdapter({
 *   accessToken: () => msalInstance
 *     .acquireTokenSilent({ scopes: ["https://graph.microsoft.com/.default"] })
 *     .then(r => r.accessToken),
 * });
 * ```
 */
export class GraphAdapter implements ISharePointAdapter {
  private readonly getToken: () => Promise<string>;

  // Cached Graph IDs to avoid redundant lookups on repeat calls
  private siteId?: string;
  private listId?: string;

  constructor(options: GraphAdapterOptions) {
    if (!options.accessToken) throw new Error("GraphAdapter: accessToken is required");
    this.getToken =
      typeof options.accessToken === "string"
        ? () => Promise.resolve(options.accessToken as string)
        : options.accessToken;
  }

  async addNotification(
    siteUrl: string,
    subject: string,
    payload: NotificationPayload
  ): Promise<AddNotificationResult> {
    const token = await this.getToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // Resolve site and list IDs (cached after first call)
    if (!this.siteId) {
      this.siteId = await this.resolveSiteId(siteUrl, headers);
    }
    if (!this.listId) {
      this.listId = await this.resolveListId(this.siteId, headers);
    }

    // Resolve user emails to Graph user IDs for the person field
    const userIds = await this.resolveUserIds(payload.users, headers);

    const body = {
      fields: {
        Title: payload.title,
        Message: payload.message,
        NotificationType: payload.notificationType,
        Subject: subject,
        ...(payload.notificationLink !== undefined && { ClickUrl: payload.notificationLink }),
        // Graph multi-person fields expect an array of objects with @odata.type + id
        Users: userIds.map((id) => ({
          "@odata.type": "#microsoft.graph.user",
          id,
        })),
      },
    };

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${this.siteId}/lists/${this.listId}/items`,
      { method: "POST", headers, body: JSON.stringify(body) }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GraphAdapter: failed to add item (${response.status}): ${errorText}`);
    }

    const item = await response.json();
    // Graph returns the SharePoint item ID in fields.id (as a string)
    return { id: parseInt(item.fields?.id ?? item.id, 10) };
  }

  /** Derives the Graph site ID from the SharePoint site URL */
  private async resolveSiteId(siteUrl: string, headers: Record<string, string>): Promise<string> {
    const url = new URL(siteUrl);
    // Graph site path format: {hostname}:{relative-path}
    const graphPath = `${url.hostname}:${url.pathname}`;

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${graphPath}`,
      { headers }
    );
    if (!response.ok) {
      throw new Error(`GraphAdapter: could not resolve site "${siteUrl}" (${response.status})`);
    }
    const site = await response.json();
    return site.id as string;
  }

  /** Looks up the Monarch Notifications list ID within the site */
  private async resolveListId(siteId: string, headers: Record<string, string>): Promise<string> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${siteId}/lists?$filter=displayName eq '${MONARCH_LIST_NAME}'&$select=id,displayName`,
      { headers }
    );
    if (!response.ok) {
      throw new Error(`GraphAdapter: could not retrieve lists (${response.status})`);
    }
    const data = await response.json();
    const list = data.value?.[0];
    if (!list) {
      throw new Error(`GraphAdapter: list "${MONARCH_LIST_NAME}" was not found in the site`);
    }
    return list.id as string;
  }

  /**
   * Resolves UPNs/emails to Graph user object IDs.
   * Graph person fields require the user's Azure AD object ID, not the UPN.
   */
  private async resolveUserIds(emails: string[], headers: Record<string, string>): Promise<string[]> {
    const resolved = await Promise.all(
      emails.map(async (email) => {
        const response = await fetch(
          `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email)}?$select=id`,
          { headers }
        );
        if (!response.ok) {
          throw new Error(`GraphAdapter: could not resolve user "${email}" (${response.status})`);
        }
        const user = await response.json();
        return user.id as string;
      })
    );
    return resolved;
  }
}
