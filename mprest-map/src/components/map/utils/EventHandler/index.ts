import type { EventHandler } from "../../../../types";

export function createEventHandler<T>(): EventHandler<T> {
  const subscribers: T[] = [];
  return {
    subscribe: (callback: T) => {
      if (!subscribers.includes(callback)) {
        subscribers.push(callback);
      }
      return () => {
        const index = subscribers.indexOf(callback);
        if (index > -1) {
          subscribers.splice(index, 1);
        }
      };
    },
    unsubscribe: (callback: T) => {
      const index = subscribers.indexOf(callback);
      if (index > -1) {
        subscribers.splice(index, 1);
      }
    },
    subscribers,
  };
}

export function callAllSubscribers<T>(
  handler: EventHandler<T>,
  ...args: T extends (...args: infer P) => unknown ? P : never
) {
  handler.subscribers.forEach((sub) =>
    (sub as (...args: unknown[]) => unknown)(...args),
  );
}
