import { useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import Close from '@mui/icons-material/Close';
import BoltOutlined from '@mui/icons-material/BoltOutlined';
import { api, errorMessage, fieldError } from '../api';
import { ErrorState, Loading } from './Feedback';
import { useResource } from '../useResource';
import type { IssueType, TicketDetail, User } from '../types';

export function CreateTicketDialog({
  user,
  onClose,
  onCreated,
  draft,
  onDraftChange,
}: {
  user: User;
  onClose: () => void;
  onCreated: (ticket: TicketDetail) => void;
  draft: { issue: string; description: string };
  onDraftChange: (draft: { issue: string; description: string }) => void;
}) {
  const issues = useResource<IssueType[]>('/issues/');
  const { issue, description } = draft;
  const setIssue = (value: string) => onDraftChange({ ...draft, issue: value });
  const setDescription = (value: string) => onDraftChange({ ...draft, description: value });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [submitted, setSubmitted] = useState(false);
  const issueInput = useRef<HTMLInputElement>(null);
  const issueError =
    submitted && issue.trim().length < 3
      ? 'Enter an issue with at least 3 characters.'
      : fieldError(error, 'issue');
  const department =
    issues.data?.find((item) => item.title.toLowerCase() === issue.trim().toLowerCase())?.department
      .name ?? 'Facilities';
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setSubmitted(true);
    if (issue.trim().length < 3) {
      issueInput.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const ticket = await api<TicketDetail>('/tickets/', user.id, {
        method: 'POST',
        body: JSON.stringify({ issue: issue.trim(), description: description.trim() }),
      });
      onCreated(ticket);
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="create-title"
    >
      <form noValidate onSubmit={submit}>
        <DialogTitle id="create-title" className="dialog-heading">
          Create new ticket
          <IconButton aria-label="Close create ticket" disabled={busy} onClick={onClose}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" className="dialog-intro">
            Tell us what needs attention at {user.client?.name}.
          </Typography>
          {issues.loading ? (
            <Loading label="Loading issue suggestions…" />
          ) : issues.error ? (
            <ErrorState message={issues.error} retry={issues.retry} />
          ) : (
            <>
              <Box className="quick-issues">
                <Typography variant="body2" fontWeight={650}>
                  <BoltOutlined fontSize="small" />
                  Quick issues <span>— select to autofill</span>
                </Typography>
                <div className="quick-issue-buttons">
                  {issues.data?.slice(0, 4).map((item) => (
                    <Chip
                      key={item.id}
                      label={item.title}
                      variant={issue === item.title ? 'filled' : 'outlined'}
                      color={issue === item.title ? 'primary' : 'default'}
                      onClick={() => {
                        setIssue(item.title);
                        issueInput.current?.focus();
                      }}
                    />
                  ))}
                </div>
              </Box>
              <Autocomplete
                freeSolo
                options={issues.data?.map((item) => item.title) ?? []}
                inputValue={issue}
                onInputChange={(_, value) => setIssue(value)}
                onChange={(_, value) => setIssue(value ?? '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    inputRef={issueInput}
                    label="Issue"
                    required
                    autoFocus
                    error={Boolean(issueError)}
                    helperText={issueError ?? 'Choose a common issue or describe your own.'}
                    slotProps={{ htmlInput: { ...params.inputProps, maxLength: 160 } }}
                  />
                )}
              />
              <TextField
                label="Description (optional)"
                multiline
                minRows={4}
                fullWidth
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="description-field"
                placeholder="Where is the issue? When did it start? Add anything that helps the team."
                slotProps={{ htmlInput: { maxLength: 4000 } }}
                helperText={
                  fieldError(error, 'description') ?? `${description.length}/4000 characters`
                }
                error={Boolean(fieldError(error, 'description'))}
              />
              <div className="routing-note">
                <span className="status-dot" />
                Will route to the {department} team
              </div>
            </>
          )}
          {Boolean(error) && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorMessage(error)}
            </Alert>
          )}
        </DialogContent>
        <DialogActions className="dialog-actions">
          <span className="draft-hint">Draft kept in this tab until you reload.</span>
          <Button color="inherit" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={busy} disabled={!issues.data}>
            Create ticket
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
