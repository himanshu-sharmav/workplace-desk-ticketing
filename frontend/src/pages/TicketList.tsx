import { SelectField } from '../components/SelectField';
import { useEffect, useRef, useState } from 'react';
import {
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import Search from '@mui/icons-material/Search';
import Close from '@mui/icons-material/Close';
import { useLocation, useSearchParams } from 'react-router-dom';
import { TicketCard } from '../components/TicketCard';
import { EmptyState, ErrorState, Loading } from '../components/Feedback';
import { useResource } from '../useResource';
import type { TicketPage, User } from '../types';

export function TicketList({ user, onCreate }: { user: User; onCreate: () => void }) {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const tab = params.get('tab') === 'resolved' ? 'resolved' : 'open';
  const search = params.get('search') ?? '';
  const [draft, setDraft] = useState(search);
  const [composing, setComposing] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const restore = () => setDraft(new URLSearchParams(window.location.search).get('search') ?? '');
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);
  useEffect(() => {
    document.title = 'Tickets · Workplace Desk';
  }, []);
  const status = params.get('status') ?? '';
  const ordering = params.get('ordering') === 'created_at' ? 'created_at' : '-created_at';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const query = new URLSearchParams({ tab, search, status, ordering, page: String(page) });
  const resource = useResource<TicketPage>(`/tickets/?${query}`, user.id);
  const data = resource.data;
  const update = (changes: Record<string, string>) =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      for (const [key, value] of Object.entries({ page: '1', ...changes })) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      return next;
    });
  useEffect(() => {
    if (composing || draft === search) return;
    const timer = setTimeout(
      () =>
        setParams(
          (current) => {
            const next = new URLSearchParams(current);
            if (draft.trim()) next.set('search', draft.trim());
            else next.delete('search');
            next.set('page', '1');
            return next;
          },
          { replace: true },
        ),
      300,
    );
    return () => clearTimeout(timer);
  }, [draft, search, composing, setParams]);
  const clear = () => {
    setDraft('');
    update({ search: '', status: '' });
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">WORKPLACE SERVICE DESK</div>
          <Typography variant="h1">Tickets</Typography>
          <Typography color="text.secondary">
            {user.role === 'client'
              ? 'Report an issue and follow it through to resolution.'
              : user.role === 'manager'
                ? 'Review incoming issues and connect them with the right people.'
                : 'Your assigned work, with every update in one place.'}
          </Typography>
        </div>
        {user.role === 'client' && (
          <Button variant="contained" startIcon={<Add />} onClick={onCreate}>
            Create new ticket
          </Button>
        )}
      </div>
      <section className="ticket-workspace" aria-label="Ticket listing">
        <Tabs
          value={tab}
          onChange={(_, value: string) => update({ tab: value, status: '' })}
          aria-label="Ticket state"
        >
          <Tab
            value="open"
            label={
              <span className="tab-label">
                Open tickets{data && <span className="tab-count">{data.counts.open}</span>}
              </span>
            }
          />
          <Tab
            value="resolved"
            label={
              <span className="tab-label">
                Resolved tickets{data && <span className="tab-count">{data.counts.resolved}</span>}
              </span>
            }
          />
        </Tabs>
        <div className="list-toolbar">
          <TextField
            inputRef={searchInput}
            className="ticket-search"
            label="Search tickets"
            placeholder="Search by issue…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={() => setComposing(false)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: draft ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="Clear search"
                      onClick={() => {
                        setDraft('');
                        update({ search: '' });
                        searchInput.current?.focus();
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
              htmlInput: { maxLength: 160 },
            }}
          />
          <SelectField
            label="Status"
            value={status}
            onChange={(e) => update({ status: e.target.value })}
            className="status-filter"
          >
            <MenuItem value="">All statuses</MenuItem>
            {tab === 'open' ? (
              [
                <MenuItem key="assignment" value="pending_assignment">
                  Pending Technician Assignment
                </MenuItem>,
                <MenuItem key="resolution" value="pending_resolution">
                  Pending Resolution
                </MenuItem>,
              ]
            ) : (
              <MenuItem value="resolved">Resolved</MenuItem>
            )}
          </SelectField>
          <SelectField
            label="Sort by"
            value={ordering}
            onChange={(e) => update({ ordering: e.target.value })}
            className="sort-filter"
          >
            <MenuItem value="-created_at">Newest first</MenuItem>
            <MenuItem value="created_at">Older first</MenuItem>
          </SelectField>
        </div>
        <div className="list-summary">
          <Typography variant="body2" color="text.secondary">
            {data
              ? `${data.count} ${data.count === 1 ? 'ticket' : 'tickets'}${search ? ` matching “${search}”` : ''}`
              : 'Loading your tickets…'}
          </Typography>
          {(search || status) && (
            <Button size="small" onClick={clear}>
              Clear filters
            </Button>
          )}
          <span className="scope-caption">
            {user.client?.name ?? user.department?.name} workspace
          </span>
        </div>
        <div className="ticket-list" aria-busy={resource.loading}>
          {resource.loading ? (
            <Loading />
          ) : resource.error ? (
            <ErrorState message={resource.error} retry={resource.retry} />
          ) : data?.results.length ? (
            data.results.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} user={user} search={location.search} />
            ))
          ) : (
            <EmptyState
              title={
                search || status
                  ? 'No matching tickets'
                  : tab === 'resolved'
                    ? 'No resolved tickets yet'
                    : 'You’re all caught up'
              }
              description={
                search || status
                  ? 'Try another issue or clear your filters.'
                  : user.role === 'technician'
                    ? 'Tickets will appear here when a manager assigns them to you.'
                    : tab === 'resolved'
                      ? 'Completed tickets will appear here with their full history.'
                      : 'New workplace issues will appear here.'
              }
              action={
                search || status ? (
                  <Button variant="outlined" onClick={clear}>
                    Clear filters
                  </Button>
                ) : user.role === 'client' && tab === 'open' ? (
                  <Button variant="outlined" onClick={onCreate}>
                    Create new ticket
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>
        {data && data.count > 0 && (
          <div className="pagination">
            <Typography variant="body2" color="text.secondary">
              Showing {(data.page - 1) * data.page_size + 1}–
              {Math.min(data.page * data.page_size, data.count)} of {data.count}
            </Typography>
            <Pagination
              count={data.total_pages}
              page={data.page}
              onChange={(_, value) => update({ page: String(value) })}
              color="primary"
              shape="rounded"
              size="small"
            />
          </div>
        )}
      </section>
    </>
  );
}
