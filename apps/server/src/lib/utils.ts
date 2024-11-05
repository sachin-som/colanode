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

export const getNameFromEmail = (email: string): string => {
  // Extract the part before the @ symbol
  const namePart = email.split('@')[0];
  if (!namePart) {
    return '';
  }

  // Split by dots, underscores, and dashes, then capitalize each part
  const displayName = namePart
    .split(/[._-]+/) // Split by dot, underscore, or dash
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1)) // Capitalize each part
    .join(' '); // Join the parts with a space

  return displayName;
};

export const uuid = () => {
  return crypto.randomUUID().replace(/-/g, '');
};
