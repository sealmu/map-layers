/**
 * Generic event handler interface for pub/sub pattern
 */
export interface IEventHandler<T extends (...args: never[]) => unknown> {
  subscribe: (callback: T) => () => void;
  unsubscribe: (callback: T) => void;
  subscribers: T[];
}

/**
 * Create an event handler instance
 */
export function createEventHandler<
  T extends (...args: never[]) => unknown,
>(): IEventHandler<T> {
  const subscribers: T[] = [];

  return {
    subscribers,
    subscribe: (callback: T) => {
      subscribers.push(callback);
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
  };
}
