export interface Department {
  id: number;
  name: string;
}
export interface Client {
  id: number;
  name: string;
  location: string;
}
export interface User {
  id: number;
  name: string;
  role: 'client' | 'manager' | 'technician';
  role_label: string;
  client: Client | null;
  department: Department | null;
}
export interface IssueType {
  id: number;
  title: string;
  department: Department;
}
export type TicketStatus = 'pending_assignment' | 'pending_resolution' | 'resolved';
export interface Activity {
  id: number;
  actor: User | null;
  kind: 'created' | 'routed' | 'assigned' | 'resolved' | 'comment';
  body: string;
  from_value: string;
  to_value: string;
  created_at: string;
}
export interface Ticket {
  id: number;
  reference: string;
  issue: string;
  description: string;
  client: Client;
  department: Department;
  created_by: User;
  manager: User;
  technician: User | null;
  status: TicketStatus;
  status_label: string;
  created_at: string;
  resolved_at: string | null;
  allowed_actions: { assign: boolean; resolve: boolean };
}
export interface TicketDetail extends Ticket {
  activities: Activity[];
}
export interface TicketPage {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  counts: { open: number; resolved: number };
  results: Ticket[];
}
