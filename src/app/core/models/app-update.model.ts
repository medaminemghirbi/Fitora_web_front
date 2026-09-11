export interface AppUpdateMedia {
  id: string;
  filename: string;
  content_type: string;
  byte_size: number;
  url: string;
}

export interface AppUpdate {
  id: string;
  version: string;
  title: string;
  description: string | null;
  published_at: string;
  created_by: { id: string; full_name: string };
  media: AppUpdateMedia[];
}

export interface AppVersionInfo {
  version: string | null;
  title: string | null;
  published_at: string | null;
}
