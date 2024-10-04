import { SelectServer } from '@/main/data/app/schema';
import { Server, ServerAttributes } from '@/types/servers';

export const buildApiBaseUrl = (server: SelectServer): string => {
  const attributes = JSON.parse(server.attributes) as ServerAttributes;
  const protocol = attributes?.insecure ? 'http' : 'https';
  return `${protocol}://${server.domain}`;
};

export const buildSynapseUrl = (server: SelectServer, deviceId: string) => {
  const attributes = JSON.parse(server.attributes) as ServerAttributes;
  const protocol = attributes?.insecure ? 'ws' : 'wss';
  return `${protocol}://${server.domain}/v1/synapse?device_id=${deviceId}`;
};
