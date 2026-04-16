// Main class
export { MonarchNotifier } from "./core/MonarchNotifier";


// Adapters
export { SPFxAdapter } from "./adapters/SPFxAdapter";
export { GraphAdapter } from "./adapters/GraphAdapter";

// Types — re-exported so consumers can reference them without digging into internals
export type { GraphAdapterOptions } from "./adapters/GraphAdapter";
export type { ISharePointAdapter } from "./core/ISharePointAdapter";
// NotificationType is a value (const object) — exported without `type`
export { NotificationType } from "./core/types";
export type {
  MonarchNotifierConfig,
  NotificationPayload,
  NotificationTypeValue,
  AddNotificationResult,
} from "./core/types";
