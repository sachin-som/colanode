import { Server } from '@/types/servers';

export const buildApiBaseUrl = (server: Server): string => {
  const protocol = server.attributes?.insecure ? 'http' : 'https';
  return `${protocol}://${server.domain}`;
};

export const buildSynapseUrl = (server: Server, deviceId: string) => {
  const protocol = server.attributes?.insecure ? 'ws' : 'wss';
  return `${protocol}://${server.domain}/v1/synapse?device_id=${deviceId}`;
};
