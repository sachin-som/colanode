import { IconData, Icon } from '@/shared/types/icons';
import { createContext, useContext } from 'react';

interface IconPickerContextProps {
  data: IconData;
  onPick: (icon: Icon) => void;
}

export const IconPickerContext = createContext<IconPickerContextProps>(
  {} as IconPickerContextProps
);

export const useIconPicker = () => useContext(IconPickerContext);
