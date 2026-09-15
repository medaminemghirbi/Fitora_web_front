import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
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

@Injectable({ providedIn: "root" })
export class DataExchangeService {
  constructor(private readonly http: HttpClient) {}

  template(entity: DataExchangeEntity): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/data_exchange/${entity}/template`, { responseType: "blob" });
  }

  export(entity: DataExchangeEntity): Observable<Blob> {
    return this.http.get(`${API_BASE_URL}/data_exchange/${entity}/export`, { responseType: "blob" });
  }

  import(entity: DataExchangeEntity, file: File): Observable<ImportResult> {
    const form = new FormData();
    form.append("file", file);
    return this.http.post<ImportResult>(`${API_BASE_URL}/data_exchange/${entity}/import`, form);
  }
}
