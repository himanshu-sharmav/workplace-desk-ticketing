import { useRef, useState } from 'react';
import { TextField, type TextFieldProps } from '@mui/material';

export function SelectField(props: Omit<TextFieldProps, 'select' | 'slotProps'>) {
  const root = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>();
  return (
    <TextField
      {...props}
      ref={root}
      select
      slotProps={{
        inputLabel: { shrink: true },
        select: {
          displayEmpty: true,
          onOpen: () => setWidth(root.current?.getBoundingClientRect().width),
          MenuProps: {
            disableScrollLock: true,
            slotProps: {
              paper: {
                sx: {
                  width,
                  maxWidth: 'calc(100vw - 32px)',
                  '& .MuiMenuItem-root': { whiteSpace: 'normal' },
                },
              },
            },
          },
        },
      }}
    />
  );
}
