import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of, switchMap, throwError, timer } from "rxjs";
import { API_BASE_URL } from "../models/api-config";

export type DataExchangeEntity = "clients" | "activities" | "contracts" | "payments";

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportResult {
  created: number;
  errors: ImportRowError[];
}

/** An import in progress or done — what the backend answers while it runs. */
export interface ImportStatus extends ImportResult {
  id: string;
  status: "queued" | "running" | "done" | "failed";
  finished: boolean;
  /** Why a failed import failed (a malformed file, too many rows). */
  message: string | null;
}

/** How often to ask whether a running import is done. */
export const IMPORT_POLL_MS = 1000;

@Injectable({ providedIn: "root" })
export class DataExchangeService {
  constructor(private readonly http: HttpClient) {}

  template(entity: DataExchangeEntity): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/data_exchange/${entity}/template`, { responseType: "blob" });
  }

  export(entity: DataExchangeEntity): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/data_exchange/${entity}/export`, { responseType: "blob" });
  }

  /**
   * Uploads the file and follows the import to its end. The backend works
   * through it in the background (a big member list no longer holds a
   * request open), so this polls until it is finished and then answers with
   * the result, as a single request used to. A failed import errors with
   * the backend's reason.
   */
  import(entity: DataExchangeEntity, file: File): Observable<ImportResult> {
    const form = new FormData();
    form.append("file", file);
    return this.http
      .post<ImportStatus>(`${API_BASE_URL}/data_exchange/${entity}/import`, form)
      .pipe(switchMap((status) => this.untilFinished(status)));
  }

  private untilFinished(status: ImportStatus): Observable<ImportResult> {
    if (status.finished) {
      return status.status === "failed"
        ? throwError(() => new HttpErrorResponse({ status: 422, error: { error: status.message } }))
        : of({ created: status.created, errors: status.errors });
    }

    return timer(IMPORT_POLL_MS).pipe(
      switchMap(() => this.http.get<ImportStatus>(`${API_BASE_URL}/data_exchange/imports/${status.id}`)),
      switchMap((next) => this.untilFinished(next))
    );
  }
}
