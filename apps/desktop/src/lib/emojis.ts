import { EmojiData, Emoji } from '@/types/emojis';

export const getEmojiUrl = (id: string): string => {
  return `asset://emojis/${id}.svg`;
};

export const searchEmojis = (query: string, data: EmojiData): Emoji[] => {
  const lowercaseQuery = query.toLowerCase().trim();
  if (lowercaseQuery.length === 0) {
    return [];
  }

  const results: Emoji[] = [];
  for (const emoji of Object.values(data.emojis)) {
    if (
      emoji.code.includes(lowercaseQuery) ||
      emoji.tags?.some((tag) => tag.includes(lowercaseQuery))
    ) {
      results.push(emoji);
      if (results.length >= 50) {
        return results;
      }
    }
  }

  return results;
};
