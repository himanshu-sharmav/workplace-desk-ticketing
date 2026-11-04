import { SelectField } from './SelectField';
import { useRef, useState } from 'react';
import { Alert, Button, Collapse, MenuItem, TextField, Typography } from '@mui/material';
import PersonAddAlt from '@mui/icons-material/PersonAddAlt';
import TaskAlt from '@mui/icons-material/TaskAlt';
import { api, errorMessage, fieldError } from '../api';
import type { TicketDetail, User } from '../types';

export function TicketActions({
  ticket,
  user,
  users,
  onUpdated,
}: {
  ticket: TicketDetail;
  user: User;
  users: User[];
  onUpdated: (ticket: TicketDetail, message: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [technician, setTechnician] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [submitted, setSubmitted] = useState(false);
  const commentInput = useRef<HTMLInputElement>(null);
  const technicianInput = useRef<HTMLInputElement>(null);
  const assign = ticket.allowed_actions.assign;
  if (!assign && !ticket.allowed_actions.resolve) return null;
  const technicianError =
    submitted && !technician ? 'Select a technician.' : fieldError(error, 'technician_id');
  const commentError =
    submitted && !comment.trim()
      ? 'Add a comment explaining how the issue was resolved.'
      : fieldError(error, 'comment');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setSubmitted(true);
    if (assign ? !technician : !comment.trim()) {
      (assign ? technicianInput : commentInput).current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await api<TicketDetail>(
        `/tickets/${ticket.id}/${assign ? 'assign' : 'resolve'}/`,
        user.id,
        {
          method: 'POST',
          body: JSON.stringify(
            assign ? { technician_id: Number(technician) } : { comment: comment.trim() },
          ),
        },
      );
      setExpanded(false);
      onUpdated(updated, assign ? 'Technician assigned.' : 'Ticket resolved.');
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="ticket-action-panel" aria-label="Ticket actions">
      <div className="action-panel-top">
        <div className="action-panel-message">
          {assign ? <PersonAddAlt /> : <TaskAlt />}
          <div>
            <Typography variant="body2" fontWeight={700}>
              {assign ? 'This ticket needs a technician' : 'Ready to close this issue?'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {assign
                ? 'Choose someone from your team to take it forward.'
                : user.role === 'client'
                  ? 'Mark it resolved when the issue no longer persists.'
                  : 'Add a resolution comment to let the client know what changed.'}
            </Typography>
          </div>
        </div>
        <Button
          variant="contained"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-controls="action-form"
        >
          {assign ? 'Assign technician' : 'Mark resolved'}
        </Button>
      </div>
      <Collapse
        in={expanded}
        unmountOnExit
        onEntered={() => (assign ? technicianInput : commentInput).current?.focus()}
      >
        <form id="action-form" noValidate onSubmit={submit} className="action-form">
          {assign ? (
            <SelectField
              fullWidth
              required
              inputRef={technicianInput}
              label="Technician"
              value={technician}
              onChange={(event) => setTechnician(event.target.value)}
              error={Boolean(technicianError)}
              helperText={technicianError}
            >
              {users
                .filter(
                  (member) =>
                    member.role === 'technician' && member.department?.id === ticket.department.id,
                )
                .map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.name}
                  </MenuItem>
                ))}
            </SelectField>
          ) : (
            <TextField
              required
              inputRef={commentInput}
              fullWidth
              multiline
              minRows={3}
              label="Resolution comment"
              placeholder="What was fixed or checked?"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              error={Boolean(commentError)}
              helperText={commentError ?? `${comment.length}/2000 characters`}
              slotProps={{ htmlInput: { maxLength: 2000 } }}
            />
          )}
          {Boolean(error) && <Alert severity="error">{errorMessage(error)}</Alert>}
          <div className="form-buttons">
            <Button color="inherit" onClick={() => setExpanded(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" loading={busy}>
              {assign ? 'Confirm assignment' : 'Resolve ticket'}
            </Button>
          </div>
        </form>
      </Collapse>
    </section>
  );
}
