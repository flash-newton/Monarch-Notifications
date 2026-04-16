import type { NotificationPayload, AddNotificationResult } from "./types";

/**
 * Contract that every transport adapter must implement.
 * The adapter owns all HTTP/auth concerns; the core library only calls this interface.
 */
export interface ISharePointAdapter {
  /**
   * Write a notification entry to the Monarch Notifications SharePoint list.
   *
   * @param siteUrl  - Full URL of the SharePoint site (e.g. https://contoso.sharepoint.com/sites/mysite)
   * @param subject  - Value to write to the Subject column (provided by the init config)
   * @param payload  - The notification data (title, message, type, users)
   */
  addNotification(
    siteUrl: string,
    subject: string,
    payload: NotificationPayload
  ): Promise<AddNotificationResult>;
}
