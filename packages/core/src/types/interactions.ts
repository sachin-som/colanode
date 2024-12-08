export type InteractionAttributes = {
  lastReceivedTransactionId?: string | null;
  lastSeenTransactionId?: string | null;
  firstSeenAt?: Date | null;
  lastSeenAt?: Date | null;
  lastOpenedAt?: Date | null;
  lastOpenedTransactionId?: string | null;
};

export type InteractionAttribute = keyof InteractionAttributes;

export type InteractionEvent = {
  attribute: InteractionAttribute;
  value: string;
  createdAt: string;
};
