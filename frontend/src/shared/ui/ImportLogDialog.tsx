import type { ReactNode } from 'react';

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

export interface ImportLogDialogSection {
  id: string;
  title: string;
  content: ReactNode;
}

interface ImportLogDialogProps {
  open: boolean;
  title: string;
  subtitle?: string | null;
  emptyState?: ReactNode;
  sections: ImportLogDialogSection[];
  closeLabel: string;
  onClose: () => void;
}

export function ImportLogDialog({
  open,
  title,
  subtitle,
  emptyState,
  sections,
  closeLabel,
  onClose,
}: ImportLogDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Stack spacing={0.5}>
          <Typography variant="h6">{title}</Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {sections.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderStyle: 'dashed',
            }}
          >
            {emptyState}
          </Paper>
        ) : (
          <Stack spacing={2}>
            {sections.map((section) => (
              <Paper key={section.id} variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1.25}>
                  <Typography variant="subtitle2">{section.title}</Typography>
                  {section.content}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>{closeLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}
