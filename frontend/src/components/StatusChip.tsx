import { Chip } from '@mui/material';
import type { TicketStatus } from '../types';

const labels = {
  pending_assignment: 'Pending Technician Assignment',
  pending_resolution: 'Pending Resolution',
  resolved: 'Resolved',
};

export function StatusChip({ status }: { status: TicketStatus }) {
  return (
    <Chip
      size="small"
      className={`status-chip status-${status}`}
      label={
        <>
          <span className="status-dot" />
          {labels[status]}
        </>
      }
    />
  );
}
