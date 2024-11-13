import * as React from 'react';

import { getIconUrl } from '@/shared/lib/icons';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  id: string;
}

export const IconElement = React.forwardRef<HTMLImageElement, Props>(
  (props, ref) => (
    <img
      src={getIconUrl(props.id)}
      {...props}
      alt="Icon"
      ref={ref}
      loading="lazy"
    />
  )
);

IconElement.displayName = 'IconElement';
