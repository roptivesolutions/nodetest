import React from 'react';
import { Announcement, Holiday } from './types';

export const APP_NAME = "AMS Pro";

// Institutional Shift Configuration
export const SHIFT_CONFIG = {
  START_TIME: "09:00", // 24h format
  GRACE_PERIOD_MINS: 5, // Optional grace period
  TOTAL_HOURS_REQUIRED: 8
};

export const MOCK_USERS = [
  { id: '1', name: 'John Admin', email: 'admin@attendify.com', role: 'ADMIN', department: 'Management', avatar: 'https://picsum.photos/seed/admin/200' },
  { id: '2', name: 'Sarah Manager', email: 'manager@attendify.com', role: 'MANAGER', department: 'Engineering', avatar: 'https://picsum.photos/seed/manager/200' },
  { id: '3', name: 'Alex Employee', email: 'employee@attendify.com', role: 'EMPLOYEE', department: 'Sales', avatar: 'https://picsum.photos/seed/emp/200' },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'Q3 Wellness Initiative',
    content: 'All employees are now eligible for a 50% gym membership reimbursement.',
    author: 'HR Dept',
    date: '2024-05-18T09:00:00Z',
    priority: 'medium'
  },
  {
    id: '2',
    title: 'System Maintenance Notice',
    content: 'AMS Pro will be offline this Sunday from 2 AM to 4 AM EST.',
    author: 'IT Security',
    date: '2024-05-20T14:30:00Z',
    priority: 'high'
  }
];

export const MOCK_HOLIDAYS: Holiday[] = [
  { id: '1', name: 'Memorial Day', date: '2024-05-27', type: 'national' },
  { id: '2', name: 'Founder\'s Day', date: '2024-06-12', type: 'company' },
  { id: '3', name: 'Independence Day', date: '2024-07-04', type: 'national' }
];