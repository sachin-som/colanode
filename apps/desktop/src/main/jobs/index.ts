// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface JobMap {}

export type JobInput = JobMap[keyof JobMap]['input'];

export interface JobHandler<T extends JobInput> {
  triggerDebounce: number;
  interval: number;
  handleJob: (input: T) => Promise<void>;
}
