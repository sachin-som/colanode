import { SelectServer } from '@/main/data/app/schema';
import { ServerAttributes } from '@/types/servers';
import axios, { AxiosInstance } from 'axios';

export const buildSynapseUrl = (server: SelectServer, deviceId: string) => {
  const attributes = JSON.parse(server.attributes) as ServerAttributes;
  const protocol = attributes?.insecure ? 'ws' : 'wss';
  return `${protocol}://${server.domain}/v1/synapse?device_id=${deviceId}`;
};

export const buildAxiosInstance = (
  domain: string,
  attributes: string | ServerAttributes,
  token?: string,
): AxiosInstance => {
  const parsedAttributes: ServerAttributes =
    typeof attributes === 'string' ? JSON.parse(attributes) : attributes;
  const protocol = parsedAttributes?.insecure ? 'http' : 'https';
  const baseURL = `${protocol}://${domain}`;
  const instance = axios.create({ baseURL });

  if (token) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  return instance;
};
