export interface FeedbackStorageEntry {
  id?: string;
  timestamp: number;
  page: string;
  highlight?: string;
  notes?: string;
  category?: string;
  [key: string]: any;
}

export interface FeedbackStorageAdapter {
  save(entry: FeedbackStorageEntry): Promise<void>;
  loadAll(): Promise<FeedbackStorageEntry[]>;
  clear?(): Promise<void>;
}
