# monarch-notifications

A TypeScript library that provides a simple, consistent way to write notification entries to the **Monarch Notifications** SharePoint list. Works in both SPFx solutions and standalone web applications via an adapter pattern.

---

## Table of Contents

- [SharePoint List Setup](#sharepoint-list-setup)
- [Installation](#installation)
- [How It Works](#how-it-works)
- [Notification Types](#notification-types)
- [Using in an SPFx Solution](#using-in-an-spfx-solution)
- [Using in a Web Application](#using-in-a-web-application)
- [API Reference](#api-reference)
- [Required Permissions](#required-permissions)

---

## SharePoint List Setup

The library writes to a list named **Monarch Notifications**. The list must exist at the target site with the following columns:

| Column             | Type                    |
|--------------------|-------------------------|
| `Title`            | Single line text        |
| `Message`          | Multi-line text         |
| `NotificationType` | Choice                  |
| `Subject`          | Single line text        |
| `Users`            | Person (multi-value)    |

> The `Subject` column is set once at initialisation and automatically stamped on every notification your application writes.

---

## Installation

```bash
npm install monarch-notifications
```

---

## How It Works

The library uses a **two-step pattern**:

### Step 1 — Initialise once

Do this in your web part's `onInit` or your app's entry point:

```ts
const notifier = MonarchNotifier.create({
  siteUrl: "https://contoso.sharepoint.com/sites/mysite",
  subject:  "HR Portal",
  adapter:  new SPFxAdapter(sp),
});
```

### Step 2 — Add notifications anywhere

```ts
await notifier.add({
  title:            "Leave Request Approved",
  message:          "Your 5-day leave request has been approved.",
  notificationType: NotificationType.Approval,
  users:            ["john.doe@contoso.com"],
});
```

The core API is identical regardless of environment — you only swap the adapter at initialisation time.

---

## Notification Types

The library exports a `NotificationType` constant object with predefined choice values. Use these instead of raw strings to get autocomplete and prevent typos:

| Constant                   | Value        |
|----------------------------|--------------|
| `NotificationType.Info`    | `"Info"`     |
| `NotificationType.Warning` | `"Warning"`  |
| `NotificationType.Error`   | `"Error"`    |
| `NotificationType.Approval`| `"Approval"` |

If your list has additional custom choice values, you can pass a plain string:

```ts
notificationType: "CustomValue"
```

---

## Using in an SPFx Solution

### 1. Install

```bash
npm install monarch-notifications
```

### 2. Initialise in `onInit`

```ts
import { spfi } from "@pnp/sp";
import { SPFx } from "@pnp/sp/behaviors/spfx";
import { MonarchNotifier, SPFxAdapter } from "monarch-notifications";

protected async onInit(): Promise<void> {
  await super.onInit();

  const sp = spfi().using(SPFx(this.context));

  this.notifier = MonarchNotifier.create({
    siteUrl: "https://contoso.sharepoint.com/sites/mysite",
    subject:  "HR Portal",
    adapter:  new SPFxAdapter(sp),
  });
}
```

### 3. Provide via React Context

Rather than drilling the notifier through props, use the built-in React context:

```tsx
// In your web part's render()
import { NotifierContext } from "monarch-notifications";

<NotifierContext.Provider value={this.notifier}>
  <MyRootComponent />
</NotifierContext.Provider>
```

Then consume it in any sub-component with the built-in hook:

```tsx
import { useNotifier, NotificationType } from "monarch-notifications";

const MyComponent: React.FC = () => {
  const notifier = useNotifier();

  const handleApprove = async () => {
    await notifier.add({
      title:            "Request Approved",
      message:          "The request has been approved.",
      notificationType: NotificationType.Approval,
      users:            ["requestor@contoso.com"],
    });
  };
};
```

> **Note for Command Sets:** Errors thrown inside a command set's `onInit` are silently swallowed by SPFx. Always wrap `notifier.add()` calls in a `try/catch` so failures are visible during development:
>
> ```ts
> try {
>   await notifier.add({ ... });
> } catch (err) {
>   console.error("Notification failed:", err);
> }
> ```

---

## Using in a Web Application

### 1. Install

```bash
npm install monarch-notifications
```

### 2. Create a singleton notifier module

```ts
// src/services/notifier.ts
import { PublicClientApplication } from "@azure/msal-browser";
import { MonarchNotifier, GraphAdapter } from "monarch-notifications";

const msalInstance = new PublicClientApplication({
  auth: {
    clientId: "your-azure-ad-client-id",
    authority: "https://login.microsoftonline.com/your-tenant-id",
  },
});

export const notifier = MonarchNotifier.create({
  siteUrl: "https://contoso.sharepoint.com/sites/mysite",
  subject:  "Finance App",
  adapter: new GraphAdapter({
    accessToken: () =>
      msalInstance
        .acquireTokenSilent({ scopes: ["https://graph.microsoft.com/.default"] })
        .then(r => r.accessToken),
  }),
});
```

> The callback form of `accessToken` is recommended so tokens are refreshed automatically.

### 3. Use anywhere in the app

```ts
import { notifier } from "../services/notifier";
import { NotificationType } from "monarch-notifications";

await notifier.add({
  title:            "Invoice Approved",
  message:          "Invoice #4521 has been approved for payment.",
  notificationType: NotificationType.Approval,
  users:            ["accounts@contoso.com"],
});
```

React Context works the same as in SPFx — wrap your app root with `NotifierContext.Provider` and use `useNotifier()` in sub-components.

---

## API Reference

### `MonarchNotifier.create(config)`

| Property  | Type                 | Description                                         |
|-----------|----------------------|-----------------------------------------------------|
| `siteUrl` | `string`             | Full URL of the SharePoint site                     |
| `subject` | `string`             | Value written to the `Subject` column on every entry|
| `adapter` | `ISharePointAdapter` | `SPFxAdapter` or `GraphAdapter`                     |

### `notifier.add(payload)`

| Property           | Type                  | Description                                        |
|--------------------|-----------------------|----------------------------------------------------|
| `title`            | `string`              | Written to the `Title` column                      |
| `message`          | `string`              | Written to the `Message` column                    |
| `notificationType` | `NotificationTypeValue` | Written to the `NotificationType` column         |
| `users`            | `string[]`            | Array of email addresses written to the `Users` column |

Returns `Promise<{ id: number }>` — the SharePoint item ID of the created entry.

### `SPFxAdapter(sp)`

Accepts a pre-configured `SPFI` instance. Handles user resolution via `ensureUser()` internally.

### `GraphAdapter({ accessToken })`

Accepts a static token string or an async callback `() => Promise<string>`.

---

## Required Permissions

| Adapter        | Permission needed                                              |
|----------------|----------------------------------------------------------------|
| `SPFxAdapter`  | None — uses the signed-in user's SharePoint session via PnP   |
| `GraphAdapter` | `Sites.ReadWrite.All` (or `Sites.Selected`) on Microsoft Graph |
