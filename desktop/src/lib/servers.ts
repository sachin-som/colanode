import { SelectServer } from '@/electron/schemas/app';
import { Server } from '@/types/servers';

export const buildApiBaseUrl = (server: Server): string => {
  const protocol = server.attributes?.insecure ? 'http' : 'https';
  return `${protocol}://${server.domain}`;
};

export const buildSynapseUrl = (server: Server, deviceId: string) => {
  const protocol = server.attributes?.insecure ? 'ws' : 'wss';
  return `${protocol}://${server.domain}/v1/synapse?device_id=${deviceId}`;
};

export const mapServer = (row: SelectServer): Server => {
  return {
    domain: row.domain,
    name: row.name,
    avatar: row.avatar,
    attributes: JSON.parse(row.attributes),
    version: row.version,
    createdAt: new Date(row.created_at),
    lastSyncedAt: row.last_synced_at ? new Date(row.last_synced_at) : null,
  };
};
