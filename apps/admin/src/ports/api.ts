import type { IpcChannel, IpcInput, IpcOutput } from '../core/ipcSchema';

export async function api<C extends IpcChannel>(
  channel: C,
  input?: IpcInput<C>,
): Promise<IpcOutput<C>> {
  return (await window.adminApi.invoke(channel, input)) as IpcOutput<C>;
}
