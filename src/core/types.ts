/**
 * Predefined notification type constants.
 * Use these instead of raw strings to get autocomplete and avoid typos.
 *
 * @example
 * notificationType: NotificationType.Info
 * notificationType: NotificationType.Approval
 *
 * Custom values are still accepted if your list has additional choices:
 * notificationType: "CustomType"
 */
export const NotificationType = {
  Info:     "Info",
  Warning:  "Warning",
  Error:    "Error",
  Approval: "Approval",
} as const;

/**
 * The type for the notificationType field.
 * Accepts any of the NotificationType constants or a custom string
 * for choice values not covered by the predefined set.
 */
export type NotificationTypeValue =
  | typeof NotificationType[keyof typeof NotificationType]
  | (string & Record<never, never>);

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
  notificationType: NotificationTypeValue;
  /**
   * Array of user email addresses / UPNs (e.g. "john.doe@contoso.com").
   * Each adapter is responsible for resolving these to the format SharePoint expects.
   */
  users: string[];
  /**
   * Optional URL written to the ClickUrl column.
   * Use this to link the notification to a relevant page or item.
   */
  notificationLink?: string;
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
