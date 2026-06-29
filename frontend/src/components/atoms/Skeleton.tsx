import React from 'react';
import { twMerge } from 'tailwind-merge';

export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={twMerge('animate-pulse rounded-md bg-muted/60 dark:bg-muted/30', className)}
      {...props}
    />
  );
};

export default Skeleton;
