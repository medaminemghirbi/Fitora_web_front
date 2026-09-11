import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL, API_ORIGIN } from "../models/api-config";
import { LibraryDocument } from "../models/library-document.model";
import { PageMeta } from "./sessions.service";

export type LibraryDocumentStatusFilter = "active" | "inactive" | "expiring_soon";

export interface LibraryDocumentFilters {
  folder_id?: string;
  status?: LibraryDocumentStatusFilter;
  q?: string;
  page?: number;
}

// file is required on create; omit it on update to keep the existing
// attachment, or pass a new File to replace it.
export interface LibraryDocumentFormValue {
  title: string;
  folder_id?: string;
  reference_number?: string | null;
  issued_on?: string | null;
  expires_on?: string | null;
  notes?: string | null;
  active?: boolean;
  file?: File | null;
}

@Injectable({ providedIn: "root" })
export class LibraryDocumentsService {
  constructor(private readonly http: HttpClient) {}

  list(filters: LibraryDocumentFilters = {}): Observable<{ documents: LibraryDocument[]; meta: PageMeta }> {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params[key] = String(value);
    });
    return this.http.get<{ documents: LibraryDocument[]; meta: PageMeta }>(`${API_BASE_URL}/library_documents`, { params });
  }

  create(payload: LibraryDocumentFormValue): Observable<{ document: LibraryDocument }> {
    return this.http.post<{ document: LibraryDocument }>(`${API_BASE_URL}/library_documents`, this.toFormData(payload));
  }

  update(id: string, payload: LibraryDocumentFormValue): Observable<{ document: LibraryDocument }> {
    return this.http.patch<{ document: LibraryDocument }>(`${API_BASE_URL}/library_documents/${id}`, this.toFormData(payload));
  }

  destroy(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/library_documents/${id}`);
  }

  // The file endpoint needs the same Authorization header every other call
  // gets from the JWT interceptor — a plain <a href>/<img src> can't attach
  // that, so the caller fetches the bytes here and opens/renders them itself.
  downloadFile(doc: LibraryDocument): Observable<Blob> {
    return this.http.get(`${API_ORIGIN}${doc.file!.url}`, { responseType: "blob" });
  }

  private toFormData(payload: LibraryDocumentFormValue): FormData {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      formData.append(`library_document[${key}]`, value as string | File);
    });
    return formData;
  }
}
