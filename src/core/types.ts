/**
 * Valid notification types — mirrors the choices in the NotificationType
 * column of the Monarch Notifications list. Extend this union or use `string`
 * to allow values not covered here.
 */
export type NotificationType =
  | "Info"
  | "Warning"
  | "Error"
  | "Approval"
  | (string & Record<never, never>); // keeps autocomplete while accepting any string

/**
 * The payload for a single notification entry.
 * Maps directly to the Monarch Notifications list schema:
 *   Title            -> Single line text
 *   Message          -> Multi-line text
 *   NotificationType -> Choice field
 *   Subject          -> Single line text  (injected from init config, not supplied here)
 *   Users            -> Multi-person field
 */
export interface NotificationPayload {
  /** Maps to the Title column */
  title: string;
  /** Maps to the Message column (multi-line text) */
  message: string;
  /** Maps to the NotificationType choice column */
  notificationType: NotificationType;
  /**
   * Array of user email addresses / UPNs (e.g. "john.doe@contoso.com").
   * Each adapter is responsible for resolving these to the format SharePoint expects.
   */
  users: string[];
}

/**
 * Config supplied once when initialising the library.
 * `subject` is stamped onto every notification written by this instance.
 */
export interface MonarchNotifierConfig {
  /** Full URL of the SharePoint site that hosts the Monarch Notifications list */
  siteUrl: string;
  /**
   * The value to write to the Subject column for every notification from this instance.
   * Typically the name of the consuming application (e.g. "HR Portal", "Finance App").
   */
  subject: string;
  /** Transport adapter — either SPFxAdapter or GraphAdapter */
  adapter: import("./ISharePointAdapter").ISharePointAdapter;
}

/** Shape returned after successfully adding a notification */
export interface AddNotificationResult {
  /** The SharePoint list item ID assigned to the new entry */
  id: number;
}
