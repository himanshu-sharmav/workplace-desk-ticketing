import { useState } from 'react';
import { Avatar, Tab, Tabs, Typography } from '@mui/material';
import ArrowForward from '@mui/icons-material/ArrowForward';
import type { Activity } from '../types';
import { formatDate, initials } from '../format';

const verbs = {
  created: 'created the ticket',
  routed: 'auto-assigned the ticket',
  assigned: 'assigned a technician',
  resolved: 'resolved the ticket',
  comment: 'added a comment',
};

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  const [filter, setFilter] = useState('all');
  const filtered = activities.filter(
    (activity) =>
      filter === 'all' ||
      (filter === 'comments' ? Boolean(activity.body) : activity.kind !== 'comment'),
  );
  return (
    <section className="activity-section" aria-labelledby="activity-title">
      <div className="section-heading">
        <Typography variant="h2" id="activity-title">
          Activity
        </Typography>
        <span className="count-label">{activities.length} events</span>
      </div>
      <Tabs
        value={filter}
        onChange={(_, value: string) => setFilter(value)}
        aria-label="Activity type"
        className="activity-tabs"
      >
        <Tab label="All" value="all" />
        <Tab label="Actions" value="actions" />
        <Tab label="Comments" value="comments" />
      </Tabs>
      {filtered.length ? (
        <ol className="activity-feed">
          {filtered.map((activity) => (
            <li key={activity.id} className="activity-event">
              <Avatar className={`activity-avatar ${activity.actor ? '' : 'system-avatar'}`}>
                {activity.actor ? initials(activity.actor.name) : 'S'}
              </Avatar>
              <div className="event-content">
                <div className="event-heading">
                  <Typography variant="body2">
                    <strong>{activity.actor?.name ?? 'System'}</strong> {verbs[activity.kind]}.
                  </Typography>
                  <time dateTime={activity.created_at}>{formatDate(activity.created_at)}</time>
                </div>
                {activity.from_value && (
                  <div className="history-change">
                    <span>{activity.from_value}</span>
                    <ArrowForward sx={{ fontSize: 14 }} />
                    <span>{activity.to_value}</span>
                  </div>
                )}
                {activity.body && <p className="comment-body">{activity.body}</p>}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <Typography className="no-activity" color="text.secondary">
          No comments yet. Start the conversation below.
        </Typography>
      )}
    </section>
  );
}
