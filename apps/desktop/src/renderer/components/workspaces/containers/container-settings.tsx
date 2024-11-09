import { IdType, getIdType } from '@colanode/core';
import { match } from 'ts-pattern';
import { ChannelSettings } from '@/renderer/components/channels/channel-settings';
import { PageSettings } from '@/renderer/components/pages/page-settings';
import { DatabaseSettings } from '@/renderer/components/databases/database-settings';
import { RecordSettings } from '@/renderer/components/records/record-settings';
import { FolderSettings } from '@/renderer/components/folders/folder-settings';
import { FileSettings } from '@/renderer/components/files/file-settings';

interface ContainerSettingsProps {
  nodeId: string;
}

export const ContainerSettings = ({ nodeId }: ContainerSettingsProps) => {
  const idType = getIdType(nodeId);
  return match(idType)
    .with(IdType.Channel, () => <ChannelSettings nodeId={nodeId} />)
    .with(IdType.Page, () => <PageSettings nodeId={nodeId} />)
    .with(IdType.Database, () => <DatabaseSettings nodeId={nodeId} />)
    .with(IdType.Record, () => <RecordSettings nodeId={nodeId} />)
    .with(IdType.Folder, () => <FolderSettings nodeId={nodeId} />)
    .with(IdType.File, () => <FileSettings nodeId={nodeId} />)
    .otherwise(() => null);
};
