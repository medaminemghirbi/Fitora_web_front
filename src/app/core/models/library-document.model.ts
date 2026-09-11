export interface LibraryDocumentFile {
  filename: string;
  content_type: string;
  byte_size: number;
  url: string;
}

export interface LibraryDocument {
  id: string;
  folder_id: string;
  title: string;
  reference_number: string | null;
  issued_on: string | null;
  expires_on: string | null;
  expired: boolean;
  notes: string | null;
  active: boolean;
  file: LibraryDocumentFile | null;
  created_by: { id: string; full_name: string } | null;
  created_at: string;
  updated_at: string;
}
