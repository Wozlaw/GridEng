import type { TextFieldProps } from '@mui/material';
import { TextField } from '@mui/material';

interface NumberFieldProps extends Omit<TextFieldProps, 'type' | 'value' | 'onChange'> {
  value: string;
  onValueChange: (value: string) => void;
  min?: number;
  step?: number;
}

export function NumberField({
  value,
  onValueChange,
  min,
  step,
  ...props
}: NumberFieldProps) {
  return (
    <TextField
      {...props}
      type="number"
      value={value}
      onChange={(event) => {
        onValueChange(event.target.value);
      }}
      slotProps={{
        htmlInput: {
          min,
          step,
          inputMode: 'decimal',
        },
      }}
    />
  );
}
