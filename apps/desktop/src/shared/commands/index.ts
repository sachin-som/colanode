export interface CommandMap {}

export type CommandInput = CommandMap[keyof CommandMap]['input'];
