// Minimal typing for @rails/actioncable (ships no types). Only the surface
// NotificationService uses.
declare module "@rails/actioncable" {
  export interface Subscription {
    unsubscribe(): void;
    perform(action: string, data?: object): void;
    send(data: object): void;
  }

  export interface ChannelNameWithParams {
    channel: string;
    [key: string]: unknown;
  }

  export interface SubscriptionCallbacks {
    connected?(): void;
    disconnected?(): void;
    rejected?(): void;
    received?(data: unknown): void;
  }

  export interface Subscriptions {
    create(channel: string | ChannelNameWithParams, callbacks?: SubscriptionCallbacks): Subscription;
  }

  export interface Consumer {
    subscriptions: Subscriptions;
    connect(): void;
    disconnect(): void;
  }

  /** A function is called again on every (re)connect — see NotificationService. */
  export function createConsumer(url?: string | (() => string)): Consumer;
}
