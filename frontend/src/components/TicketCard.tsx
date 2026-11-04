import { Avatar, Typography } from '@mui/material';
import ArrowForward from '@mui/icons-material/ArrowForward';
import AccessTime from '@mui/icons-material/AccessTime';
import { Link } from 'react-router-dom';
import type { Ticket, User } from '../types';
import { formatDate, initials } from '../format';
import { StatusChip } from './StatusChip';

export function TicketCard({
  ticket,
  user,
  search,
}: {
  ticket: Ticket;
  user: User;
  search: string;
}) {
  const actionable =
    ticket.allowed_actions.assign || (ticket.allowed_actions.resolve && user.role === 'technician');
  return (
    <article className="ticket-card">
      <div className="ticket-card-top">
        <div className="ticket-card-heading">
          <div className="ticket-reference">
            #{ticket.reference}
            <span className="department-label">{ticket.department.name}</span>
          </div>
          <Typography variant="h3" component="h2">
            <Link className="ticket-title-link" to={`/tickets/${ticket.id}${search}`}>
              {ticket.issue}
            </Link>
          </Typography>
          <Typography variant="body2" color="text.secondary" className="ticket-location">
            {ticket.client.name} <span aria-hidden="true">·</span> {ticket.client.location}
          </Typography>
        </div>
        <div className="ticket-card-status">
          <StatusChip status={ticket.status} />
          {actionable && <span className="action-required">Action required</span>}
        </div>
      </div>
      <div className="ticket-card-bottom">
        <div className="ticket-created">
          <AccessTime fontSize="small" />
          <div>
            <span>{formatDate(ticket.created_at)}</span>
            <span className="secondary-line">by {ticket.created_by.name}</span>
          </div>
        </div>
        <div className="ticket-assignees">
          <Avatar className="small-avatar">
            {initials(ticket.technician?.name ?? ticket.manager.name)}
          </Avatar>
          <div>
            <span>{ticket.technician?.name ?? ticket.manager.name}</span>
            <span className="secondary-line">
              {ticket.technician ? `With ${ticket.manager.name}` : 'Department manager'}
            </span>
          </div>
        </div>
        <Link
          className="ticket-view-link"
          to={`/tickets/${ticket.id}${search}`}
          aria-label={`View ${ticket.reference}`}
        >
          View ticket <ArrowForward fontSize="small" />
        </Link>
      </div>
    </article>
  );
}
