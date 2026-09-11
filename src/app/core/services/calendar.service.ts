import { Injectable } from "@angular/core";
import { Observable, map } from "rxjs";
import { Session } from "../models/session.model";
import { SessionRange, SessionsService } from "./sessions.service";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  session: Session;
}

@Injectable({ providedIn: "root" })
export class CalendarService {
  constructor(private readonly sessionsService: SessionsService) {}

  range(range: SessionRange): Observable<CalendarEvent[]> {
    return this.sessionsService.range(range).pipe(
      map((res) =>
        res.sessions.map((session) => ({
          id: String(session.id),
          title: session.activity_name,
          start: session.starts_at,
          end: session.ends_at,
          session,
        }))
      )
    );
  }
}
