export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE'
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
  LATE = 'LATE',
  ON_LEAVE = 'ON_LEAVE',
  EARLY_LEAVING = 'EARLY_LEAVING'
}

export enum LeaveType {
  SICK = 'SICK',
  CASUAL = 'CASUAL',
  PAID = 'PAID',
  UNPAID = 'UNPAID'
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department: string;
  avatar?: string;
  isActive?: boolean;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName?: string;
  date: string; // ISO String
  checkIn: string; // ISO String
  checkOut?: string; // ISO String
  status: AttendanceStatus;
  workHours: number;
  location?: { lat: number; lng: number };
  checkOutLocation?: { lat: number; lng: number };
  deviceInfo?: string;
  isAutoCheckIn?: boolean;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
}

export interface LeavePolicy {
  id: string;
  leave_type: LeaveType;
  display_name: string;
  allowance: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  priority: 'high' | 'medium' | 'info';
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'national' | 'company';
}

export interface AppNotification {
  id: string;
  userId: string; // Recipient ID (or 'all' for broadcast)
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
}