import { Icon } from '@/lib/icons';
import { createContext, useContext } from 'react';

interface IconPickerContextProps {
  onPick: (icon: Icon) => void;
}

export const IconPickerContext = createContext<IconPickerContextProps>(
  {} as IconPickerContextProps,
);

export const useIconPicker = () => useContext(IconPickerContext);
