export type ItemType = 'attraction' | 'restaurant' | 'transport' | 'flight' | 'checkin' | 'other';

export interface ItineraryItem {
  id: string;
  dayIndex: number;
  startTime: string;
  endTime?: string;
  title: string;
  location?: string;
  type: ItemType;
  notes?: string;
  participants: string[];
  isSplit: boolean;
  column: number; // 0: full, 1: left, 2: right
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  payer: string;
}

export interface QuickInfo {
  id: string;
  category: 'flight' | 'accommodation' | 'emergency' | 'other';
  title: string;
  content: string;
}

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  participants: string[];
  ownerId: string;
}

export type TabType = 'timeline' | 'budget' | 'info' | 'settings';
