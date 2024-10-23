import { SelectServer } from '@/main/data/app/schema';
import { ServerAttributes } from '@/types/servers';

export const buildSynapseUrl = (server: SelectServer, deviceId: string) => {
  const attributes = JSON.parse(server.attributes) as ServerAttributes;
  const protocol = attributes?.insecure ? 'ws' : 'wss';
  return `${protocol}://${server.domain}/v1/synapse?device_id=${deviceId}`;
};
