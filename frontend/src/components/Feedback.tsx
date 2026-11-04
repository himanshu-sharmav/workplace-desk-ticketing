import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import InboxOutlined from '@mui/icons-material/InboxOutlined';

export function Loading({ label = 'Loading tickets…' }: { label?: string }) {
  return (
    <Box className="state-panel" role="status">
      <CircularProgress size={26} />
      <Typography color="text.secondary">{label}</Typography>
    </Box>
  );
}

export function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <Box className="state-panel">
      <Alert severity="error">{message}</Alert>
      <Button variant="outlined" onClick={retry}>
        Try again
      </Button>
    </Box>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Box className="state-panel">
      <Box className="empty-icon">
        <InboxOutlined />
      </Box>
      <Typography variant="h2">{title}</Typography>
      <Typography color="text.secondary" align="center">
        {description}
      </Typography>
      {action}
    </Box>
  );
}
