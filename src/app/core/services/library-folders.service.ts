import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { API_BASE_URL } from "../models/api-config";
import { LibraryFolder } from "../models/library-folder.model";

export type LibraryFolderPayload = Pick<LibraryFolder, "name">;

@Injectable({ providedIn: "root" })
export class LibraryFoldersService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<{ folders: LibraryFolder[] }> {
    return this.http.get<{ folders: LibraryFolder[] }>(`${API_BASE_URL}/library_folders`);
  }

  get(id: string): Observable<{ folder: LibraryFolder }> {
    return this.http.get<{ folder: LibraryFolder }>(`${API_BASE_URL}/library_folders/${id}`);
  }

  create(payload: LibraryFolderPayload): Observable<{ folder: LibraryFolder }> {
    return this.http.post<{ folder: LibraryFolder }>(`${API_BASE_URL}/library_folders`, { library_folder: payload });
  }

  update(id: string, payload: LibraryFolderPayload): Observable<{ folder: LibraryFolder }> {
    return this.http.patch<{ folder: LibraryFolder }>(`${API_BASE_URL}/library_folders/${id}`, { library_folder: payload });
  }

  destroy(id: string): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/library_folders/${id}`);
  }
}
