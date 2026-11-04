import { SelectField } from './components/SelectField';
import { useState } from 'react';
import { Alert, Avatar, Chip, MenuItem, Snackbar, Typography } from '@mui/material';
import ConfirmationNumberOutlined from '@mui/icons-material/ConfirmationNumberOutlined';
import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { CreateTicketDialog } from './components/CreateTicketDialog';
import { EmptyState, ErrorState, Loading } from './components/Feedback';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { TicketList } from './pages/TicketList';
import { initials } from './format';
import { useResource } from './useResource';
import type { User } from './types';

export default function App() {
  const users = useResource<User[]>('/users/');
  const [userId, setUserId] = useState(() => {
    try {
      return Number(localStorage.getItem('desk-demo-user')) || 1;
    } catch {
      return 1;
    }
  });
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState('');
  const [ticketDrafts, setTicketDrafts] = useState<
    Record<number, { issue: string; description: string }>
  >({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const user = users.data?.find((item) => item.id === userId) ?? users.data?.[0];
  const navigate = useNavigate();
  const location = useLocation();
  const switchUser = (id: number) => {
    setUserId(id);
    setCreating(false);
    try {
      localStorage.setItem('desk-demo-user', String(id));
    } catch {
      /* The demo also works when browser storage is unavailable. */
    }
    navigate('/tickets');
  };
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="app-sidebar">
        <Link to="/tickets" className="brand">
          <img src="/favicon.svg" width="36" height="36" alt="" />
          <span>
            workplace<span className="brand-subtitle">SERVICE DESK</span>
          </span>
        </Link>
        <div className="workspace-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          <Link className="nav-item active" to="/tickets" aria-current="page">
            <ConfirmationNumberOutlined fontSize="small" />
            Tickets
            <span className="nav-indicator" />
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="building-icon">
            <ApartmentOutlined />
          </div>
          <Typography variant="body2" fontWeight={700}>
            One ticket. Every update.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Report, assign, and resolve workplace issues in one place.
          </Typography>
          <div className="demo-label">
            <span className="status-dot" />
            Assignment demo
          </div>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <div className="breadcrumb">
            <ApartmentOutlined fontSize="small" />
            <span>{user?.client?.name ?? user?.department?.name ?? 'Workplace'}</span>
            <span className="breadcrumb-slash">/</span>
            <strong>Service desk</strong>
          </div>
          <div className="user-switch">
            <SwapHoriz className="switch-icon" />
            <SelectField
              label="Demo user"
              size="small"
              value={user?.id ?? ''}
              onChange={(event) => switchUser(Number(event.target.value))}
              className="user-selector"
              disabled={!user}
            >
              {(users.data ?? []).map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  <div className="user-option">
                    <span>{member.name}</span>
                    <span>
                      {member.role_label} · {member.client?.name ?? member.department?.name}
                    </span>
                  </div>
                </MenuItem>
              ))}
            </SelectField>
            {user && <Avatar className="user-avatar">{initials(user.name)}</Avatar>}
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          {users.loading ? (
            <Loading label="Loading workspace…" />
          ) : users.error ? (
            <ErrorState message={users.error} retry={users.retry} />
          ) : user ? (
            <>
              <div className="role-context">
                <Chip size="small" variant="outlined" label={user.role_label} />
                <span>Viewing as {user.name}</span>
              </div>
              <Routes>
                <Route path="/" element={<Navigate to="/tickets" replace />} />
                <Route
                  path="/tickets"
                  element={
                    <TicketList key={user.id} user={user} onCreate={() => setCreating(true)} />
                  }
                />
                <Route
                  path="/tickets/:id"
                  element={
                    <TicketDetailPage
                      key={`${user.id}:${location.pathname}`}
                      user={user}
                      users={users.data ?? []}
                      notify={setNotice}
                      comment={commentDrafts[`${user.id}:${location.pathname}`] ?? ''}
                      onCommentChange={(value) =>
                        setCommentDrafts((current) => ({
                          ...current,
                          [`${user.id}:${location.pathname}`]: value,
                        }))
                      }
                    />
                  }
                />
                <Route
                  path="*"
                  element={
                    <EmptyState
                      title="Page not found"
                      description="Return to your tickets to keep working."
                      action={<Link to="/tickets">Back to tickets</Link>}
                    />
                  }
                />
              </Routes>
              {creating && (
                <CreateTicketDialog
                  user={user}
                  draft={ticketDrafts[user.id] ?? { issue: '', description: '' }}
                  onDraftChange={(draft) =>
                    setTicketDrafts((current) => ({ ...current, [user.id]: draft }))
                  }
                  onClose={() => setCreating(false)}
                  onCreated={(ticket) => {
                    setCreating(false);
                    setTicketDrafts((current) => ({
                      ...current,
                      [user.id]: { issue: '', description: '' },
                    }));
                    setNotice('Ticket created and routed to your workspace team.');
                    navigate(`/tickets/${ticket.id}`);
                  }}
                />
              )}
            </>
          ) : (
            <EmptyState
              title="No demo users found"
              description="Run the seed_demo command in the README, then reload."
            />
          )}
        </main>
      </div>
      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={5000}
        onClose={() => setNotice('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        className="success-notice"
      >
        <Alert severity="success" onClose={() => setNotice('')} variant="filled" role="status">
          {notice}
        </Alert>
      </Snackbar>
    </div>
  );
}
