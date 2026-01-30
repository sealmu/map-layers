import type { IEventHandler } from "../../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createEventHandler<T extends (...args: any[]) => unknown>(): IEventHandler<T> {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function callAllSubscribers<T extends (...args: any[]) => unknown>(
  handler: IEventHandler<T>,
  ...args: Parameters<T>
): boolean {
  for (const sub of handler.subscribers) {
    const result = sub(...args);
    if (result === false) return false; // Stop propagation
  }
  return true;
}
