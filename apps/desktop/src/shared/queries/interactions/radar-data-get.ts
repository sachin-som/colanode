import { WorkspaceRadarData } from '@/shared/types/radars';

export type RadarDataGetQueryInput = {
  type: 'radar_data_get';
};

export type RadarDataGetQueryOutput = Record<
  string,
  Record<string, WorkspaceRadarData>
>;

declare module '@/shared/queries' {
  interface QueryMap {
    radar_data_get: {
      input: RadarDataGetQueryInput;
      output: RadarDataGetQueryOutput;
    };
  }
}
