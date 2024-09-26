export const compareString = (a?: string | null, b?: string | null): number => {
  if (a === b) {
    return 0;
  }

  if (a === undefined || a === null) {
    return -1;
  }

  if (b === undefined || b === null) {
    return 1;
  }

  if (a > b) {
    return 1;
  }

  return -1;
};
