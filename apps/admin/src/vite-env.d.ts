export {};

declare global {
  interface Window {
    adminApi: {
      invoke: (channel: string, input?: unknown) => Promise<unknown>;
    };
  }
}
