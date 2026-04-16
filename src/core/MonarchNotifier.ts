import type { MonarchNotifierConfig, NotificationPayload, AddNotificationResult } from "./types";

/**
 * Main library class.
 *
 * Usage is a two-step pattern:
 *
 * **Step 1 — Initialise once** (e.g. in your app entry point or web part constructor):
 * ```ts
 * const notifier = MonarchNotifier.create({
 *   siteUrl: "https://contoso.sharepoint.com/sites/mysite",
 *   subject:  "HR Portal",
 *   adapter:  new SPFxAdapter(sp),   // or new GraphAdapter({ accessToken })
 * });
 * ```
 *
 * **Step 2 — Add notifications anywhere in the app**:
 * ```ts
 * await notifier.add({
 *   title:            "Leave Request Approved",
 *   message:          "Your 5-day leave request has been approved.",
 *   notificationType: "Approval",
 *   users:            ["john.doe@contoso.com"],
 * });
 * ```
 */
export class MonarchNotifier {
  private constructor(private readonly config: MonarchNotifierConfig) {}

  /**
   * Creates and returns a configured MonarchNotifier instance.
   * The private constructor enforces use of this factory.
   */
  static create(config: MonarchNotifierConfig): MonarchNotifier {
    if (!config.siteUrl) throw new Error("MonarchNotifier: siteUrl is required");
    if (!config.subject) throw new Error("MonarchNotifier: subject is required");
    if (!config.adapter) throw new Error("MonarchNotifier: adapter is required");
    return new MonarchNotifier(config);
  }

  /**
   * Adds a notification entry to the Monarch Notifications list.
   * The `subject` from the init config is automatically stamped on every entry.
   */
  async add(payload: NotificationPayload): Promise<AddNotificationResult> {
    if (!payload.title) throw new Error("MonarchNotifier.add: title is required");
    if (!payload.message) throw new Error("MonarchNotifier.add: message is required");
    if (!payload.notificationType) throw new Error("MonarchNotifier.add: notificationType is required");
    if (!payload.users?.length) throw new Error("MonarchNotifier.add: at least one user is required");

    return this.config.adapter.addNotification(
      this.config.siteUrl,
      this.config.subject,
      payload
    );
  }
}
