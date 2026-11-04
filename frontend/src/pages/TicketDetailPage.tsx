import { useEffect, useRef, useState } from 'react';
import { Alert, Avatar, Button, TextField, Typography } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import SendOutlined from '@mui/icons-material/SendOutlined';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api, errorMessage, fieldError } from '../api';
import { ActivityFeed } from '../components/ActivityFeed';
import { ErrorState, Loading } from '../components/Feedback';
import { StatusChip } from '../components/StatusChip';
import { TicketActions } from '../components/TicketActions';
import { formatDate, initials } from '../format';
import { useResource } from '../useResource';
import type { TicketDetail, User } from '../types';

export function TicketDetailPage({
  user,
  users,
  notify,
  comment,
  onCommentChange: setComment,
}: {
  user: User;
  users: User[];
  notify: (message: string) => void;
  comment: string;
  onCommentChange: (value: string) => void;
}) {
  const { id } = useParams();
  const location = useLocation();
  const resource = useResource<TicketDetail>(`/tickets/${id}/`, user.id);
  const ticket = resource.data;
  useEffect(() => {
    document.title = `${ticket ? ticket.reference + ' · ' + ticket.issue : 'Ticket'} · Workplace Desk`;
  }, [ticket]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [submitted, setSubmitted] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const commentError =
    submitted && !comment.trim() ? 'Write a comment before posting.' : fieldError(error, 'comment');
  const post = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setSubmitted(true);
    if (!comment.trim()) {
      input.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await api<TicketDetail>(`/tickets/${id}/comments/`, user.id, {
        method: 'POST',
        body: JSON.stringify({ comment: comment.trim() }),
      });
      resource.replace(updated);
      setComment('');
      setSubmitted(false);
      notify('Comment posted.');
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Link to={`/tickets${location.search}`} className="back-link">
        <ArrowBack fontSize="small" />
        Back to tickets
      </Link>
      {resource.loading ? (
        <Loading label="Loading ticket…" />
      ) : resource.error ? (
        <ErrorState message={resource.error} retry={resource.retry} />
      ) : (
        ticket && (
          <div className="detail-layout">
            <div className="detail-main">
              <div className="detail-sticky-header">
                <header className="detail-heading">
                  <div className="ticket-reference">
                    #{ticket.reference}
                    <span className="department-label">{ticket.department.name}</span>
                  </div>
                  <div className="detail-title-row">
                    <Typography variant="h1">{ticket.issue}</Typography>
                    <StatusChip status={ticket.status} />
                  </div>
                  <Typography color="text.secondary">
                    {ticket.client.name} · {ticket.client.location}
                  </Typography>
                  <div className="ownership-summary">
                    <Avatar className="small-avatar">
                      {initials(ticket.technician?.name ?? ticket.manager.name)}
                    </Avatar>
                    <div>
                      <span className="owner-label">
                        {ticket.status === 'resolved'
                          ? 'Handled by'
                          : ticket.technician
                            ? 'Assigned technician'
                            : 'Department manager'}
                      </span>
                      <strong>{ticket.technician?.name ?? ticket.manager.name}</strong>
                    </div>
                    <span className="next-step">
                      {ticket.status === 'resolved'
                        ? 'Resolved · comments remain open'
                        : ticket.technician
                          ? 'Awaiting resolution'
                          : 'Awaiting technician assignment'}
                    </span>
                  </div>
                </header>
                <TicketActions
                  key={ticket.status}
                  ticket={ticket}
                  user={user}
                  users={users}
                  onUpdated={(updated, message) => {
                    resource.replace(updated);
                    notify(message);
                  }}
                />
              </div>
              <section className="description-section">
                <Typography variant="h2">Issue description</Typography>
                <p>{ticket.description || 'No description provided.'}</p>
              </section>
              <ActivityFeed activities={ticket.activities} />
              <form noValidate className="comment-composer" onSubmit={post}>
                <div className="composer-row">
                  <Avatar className="small-avatar">{initials(user.name)}</Avatar>
                  <TextField
                    inputRef={input}
                    label="Write a comment"
                    fullWidth
                    multiline
                    maxRows={4}
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    error={Boolean(commentError)}
                    helperText={commentError}
                    slotProps={{ htmlInput: { maxLength: 2000 } }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    loading={busy}
                    endIcon={<SendOutlined />}
                  >
                    Post
                  </Button>
                </div>
                {comment && (
                  <p className="composer-draft-hint">
                    Unsent draft kept in this tab until you reload.
                  </p>
                )}
                {Boolean(error) && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {errorMessage(error)}
                  </Alert>
                )}
              </form>
            </div>
            <aside className="ticket-details-sidebar">
              <Typography variant="h2">Ticket details</Typography>
              <dl>
                <dt>Created by</dt>
                <dd>
                  <Avatar className="small-avatar">{initials(ticket.created_by.name)}</Avatar>
                  <div>
                    {ticket.created_by.name}
                    <span className="secondary-line">Client POC</span>
                  </div>
                </dd>
                <dt>Created on</dt>
                <dd>{formatDate(ticket.created_at)} IST</dd>
                <dt>Workspace</dt>
                <dd>
                  {ticket.client.name}
                  <span className="secondary-line">{ticket.client.location}</span>
                </dd>
                <dt>Current assignees</dt>
                <dd className="assignee-detail">
                  <div>
                    {ticket.manager.name}
                    <span className="secondary-line">Department manager</span>
                  </div>
                  {ticket.technician && (
                    <div>
                      {ticket.technician.name}
                      <span className="secondary-line">Technician</span>
                    </div>
                  )}
                </dd>
                {ticket.resolved_at && (
                  <>
                    <dt>Resolved on</dt>
                    <dd>{formatDate(ticket.resolved_at)} IST</dd>
                  </>
                )}
              </dl>
              <div className="ticket-process">
                <span className="process-dot complete" />
                <span>Reported</span>
                <span className={`process-dot ${ticket.technician ? 'complete' : ''}`} />
                <span>Assigned</span>
                <span className={`process-dot ${ticket.status === 'resolved' ? 'complete' : ''}`} />
                <span>Resolved</span>
              </div>
            </aside>
          </div>
        )
      )}
    </>
  );
}
