import * as React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  size?: string | number | undefined;
}

const Icon = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => {
  const computedSize = props.size ?? '1em';

  return (
    <svg
      ref={ref}
      stroke="currentColor"
      fill="currentColor"
      strokeWidth={0}
      height={computedSize}
      width={computedSize}
      {...props}
    >
      <use xlinkHref={`/assets/icons.svg#ri-${props.name}`} />
    </svg>
  );
});
Icon.displayName = 'Icon';

export { Icon };
