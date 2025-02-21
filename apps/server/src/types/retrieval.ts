export type SearchResult = {
  id: string;
  text: string;
  score: number;
  type: 'semantic' | 'keyword';
  createdAt?: Date;
  createdBy?: string;
  chunkIndex: number;
};
