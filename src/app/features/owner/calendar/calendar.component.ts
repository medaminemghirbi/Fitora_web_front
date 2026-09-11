import { AfterViewInit, Component, OnInit, Signal, ViewChild, computed, effect, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DatePipe } from "@angular/common";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { FullCalendarComponent, FullCalendarModule } from "@fullcalendar/angular";
import { CalendarOptions, EventClickArg, EventDropArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import arLocale from "@fullcalendar/core/locales/ar";
import { Activity, CAPACITY_BOUNDS, SessionFormat } from "../../../core/models/activity.model";
import { AttendanceBooking, AttendanceStatus } from "../../../core/models/attendance.model";
import { Client } from "../../../core/models/client.model";
import { Coach } from "../../../core/models/coach.model";
import { Session } from "../../../core/models/session.model";
import { ActivitiesService } from "../../../core/services/activities.service";
import { AttendanceService } from "../../../core/services/attendance.service";
import { BookingsService } from "../../../core/services/bookings.service";
import { CalendarEvent, CalendarService } from "../../../core/services/calendar.service";
import { ClientsService } from "../../../core/services/clients.service";
import { CoachesService } from "../../../core/services/coaches.service";
import { LocaleService } from "../../../core/services/locale.service";
import { LocationsService } from "../../../core/services/locations.service";
import { SessionsService } from "../../../core/services/sessions.service";
import { ThemeService } from "../../../core/services/theme.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { AuthService } from "../../../core/auth/auth.service";
import { ModalComponent } from "../../../shared/components/modal.component";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";
import { SearchableSelectComponent } from "../../../shared/ui/searchable-select.component";

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

@Component({
  selector: "app-calendar",
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, DatePipe, TranslateModule, FullCalendarModule, ModalComponent, SpinnerComponent, StatusBadgeComponent, SearchableSelectComponent],
  templateUrl: "./calendar.component.html",
  styleUrl: "./calendar.component.scss",
})
export class CalendarComponent implements OnInit, AfterViewInit {
  @ViewChild(FullCalendarComponent) private readonly calendarComponent?: FullCalendarComponent;

  readonly coaches = signal<Coach[]>([]);
  readonly activities = signal<Activity[]>([]);
  readonly clients = signal<Client[]>([]);
  readonly clientOptions = computed(() =>
    this.clients().map((c) => ({ value: c.id, label: c.full_name }))
  );

  readonly coachFilter = signal<string | null>(null);
  readonly activityFilter = signal<string | null>(null);

  readonly canManageSessions: Signal<boolean>;

  // === session detail ===
  readonly detailOpen = signal(false);
  readonly detailLoading = signal(false);
  readonly selectedSession = signal<Session | null>(null);
  readonly detailBookings = signal<AttendanceBooking[]>([]);
  readonly attendanceStatuses: AttendanceStatus[] = ["present", "absent", "late", "no_show"];
  readonly markingBookingId = signal<string | null>(null);

  readonly addClientSearch = signal("");
  readonly addClientResults = signal<Client[]>([]);
  readonly addingClient = signal(false);

  // === create session ===
  readonly createModalOpen = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  // The FullCalendar cell the user actually clicked — kept highlighted while
  // the create-session modal is open so it's obvious which slot the date/
  // time fields were bound from, and cleared once the modal closes.
  private selectedCellEl: HTMLElement | null = null;
  readonly createForm = this.fb.nonNullable.group({
    activity_id: [null as string | null, Validators.required],
    client_id: [null as string | null],
    coach_id: [null as string | null],
    date: [toDateInputValue(new Date()), Validators.required],
    start_time: ["09:00", Validators.required],
    capacity: [null as number | null],
    price: [null as number | null],
  });

  /** Session format of the activity picked in the create form (drives capacity + the member field). */
  readonly createFormat = signal<SessionFormat | null>(null);
  readonly createCapacityBounds = signal(CAPACITY_BOUNDS.collective);

  private get calendarApi() {
    return this.calendarComponent?.getApi();
  }

  readonly calendarOptions = signal<CalendarOptions>({
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    locales: [frLocale, arLocale],
    initialView: "timeGridWeek",
    headerToolbar: false,
    height: "auto",
    slotMinTime: "06:00:00",
    slotMaxTime: "22:00:00",
    nowIndicator: true,
    selectable: false,
    editable: false,
    eventClick: (arg: EventClickArg) => this.onEventClick(arg),
    eventDrop: (arg: EventDropArg) => this.onEventDrop(arg),
    dateClick: (arg) => this.onDateClick(arg.date, arg.dayEl),
    datesSet: (arg) => this.onDatesSet(arg.start, arg.end),
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly calendarService: CalendarService,
    private readonly sessionsService: SessionsService,
    private readonly coachesService: CoachesService,
    private readonly activitiesService: ActivitiesService,
    private readonly attendanceService: AttendanceService,
    private readonly bookingsService: BookingsService,
    private readonly clientsService: ClientsService,
    private readonly locationsService: LocationsService,
    readonly locale: LocaleService,
    readonly theme: ThemeService,
    readonly auth: AuthService,
    private readonly confirm: ConfirmService,
    private readonly toast: ToastService,
    private readonly translate: TranslateService
  ) {
    this.canManageSessions = computed(() => this.auth.hasPermission("sessions"));

    // Permissions may land after the calendar renders (cold reload); keep the
    // editable/selectable options in sync when they do. allowSignalWrites
    // because this deliberately mirrors one signal into another.
    effect(
      () => {
        const canManage = this.canManageSessions();
        this.calendarOptions.update((opts) => ({ ...opts, editable: canManage, selectable: canManage }));
      },
      { allowSignalWrites: true }
    );

    // Picking an activity in the "new session" form drives its capacity range
    // and — for individual activities — reveals the required member field.
    this.createForm.controls.activity_id.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((id) => this.applyCreateActivity(id));
  }

  private applyCreateActivity(activityId: string | null): void {
    const activity = this.activities().find((a) => a.id === activityId) ?? null;
    const capacity = this.createForm.controls.capacity;
    const clientId = this.createForm.controls.client_id;

    this.createFormat.set(activity?.session_format ?? null);

    if (!activity) {
      capacity.enable({ emitEvent: false });
      capacity.clearValidators();
      clientId.setValue(null, { emitEvent: false });
      clientId.clearValidators();
    } else {
      const bounds = CAPACITY_BOUNDS[activity.session_format];
      this.createCapacityBounds.set(bounds);
      const validators = [Validators.min(bounds.min)];
      if (bounds.max !== null) validators.push(Validators.max(bounds.max));
      capacity.setValidators(validators);
      capacity.setValue(activity.session_format === "individual" ? 1 : activity.capacity, { emitEvent: false });

      if (activity.session_format === "individual") {
        capacity.disable({ emitEvent: false });
        clientId.setValidators(Validators.required);
      } else {
        capacity.enable({ emitEvent: false });
        clientId.setValue(null, { emitEvent: false });
        clientId.clearValidators();
      }
    }

    capacity.updateValueAndValidity({ emitEvent: false });
    clientId.updateValueAndValidity({ emitEvent: false });
  }

  ngOnInit(): void {
    // Anyone who can edit the schedule (owner, receptionist) can list
    // coaches + activities to fill the "new session" form; a coach gets
    // 403 and keeps empty filters, so these stay best-effort.
    this.coachesService.list().subscribe({ next: (res) => this.coaches.set(res.coaches), error: () => {} });
    this.activitiesService.list().subscribe({ next: (res) => this.activities.set(res.activities), error: () => {} });
    // Members, for the "individual session" picker. Best-effort like the rest.
    if (this.canManageSessions()) {
      this.clientsService.list({ per_page: 100 }).subscribe({ next: (res) => this.clients.set(res.clients), error: () => {} });
    }

    const canManage = this.canManageSessions();
    this.calendarOptions.update((opts) => ({
      ...opts,
      editable: canManage,
      selectable: canManage,
      direction: this.locale.isRtl() ? "rtl" : "ltr",
      locale: this.locale.locale(),
    }));

    // Opening hours are edited in Settings (owner) but readable by anyone
    // who can edit the schedule; a coach gets 403 here, so this is
    // best-effort: any error keeps the hardcoded 06:00-22:00 fallback above.
    this.locationsService.get().subscribe({
      next: (res) => {
        this.calendarOptions.update((opts) => ({
          ...opts,
          slotMinTime: `${res.location.business_hours_start}:00`,
          slotMaxTime: `${res.location.business_hours_end}:00`,
        }));
      },
      error: () => {},
    });
  }

  setView(view: "dayGridMonth" | "timeGridWeek" | "timeGridDay"): void {
    this.calendarApi?.changeView(view);
  }

  today(): void {
    this.calendarApi?.today();
  }

  prev(): void {
    this.calendarApi?.prev();
  }

  next(): void {
    this.calendarApi?.next();
  }

  ngAfterViewInit(): void {
    // FullCalendar's own datesSet fires once the view is ready, which is
    // when the events fetcher actually gets attached — nothing to do here,
    // this just documents that calendarApi is only safe to use from here on.
  }

  applyFilters(): void {
    this.calendarApi?.refetchEvents();
  }

  private onDatesSet(start: Date, end: Date): void {
    this.calendarOptions.update((opts) => ({
      ...opts,
      events: (_info, successCallback, failureCallback) => {
        this.calendarService
          .range({
            from: toDateInputValue(start),
            to: toDateInputValue(end),
            coach_id: this.coachFilter() ?? undefined,
            activity_id: this.activityFilter() ?? undefined,
          })
          .subscribe({
            next: (events) => successCallback(events.map((e) => this.toFullCalendarEvent(e)) as never[]),
            error: (err) => {
              this.toast.error(this.translate.instant("common.error_generic"));
              failureCallback(err);
            },
          });
      },
    }));
  }

  private toFullCalendarEvent(event: CalendarEvent) {
    return {
      id: event.id,
      title: `${event.session.activity_emoji ? event.session.activity_emoji + " " : ""}${event.session.activity_name}\n${event.session.coach_name ?? ""}`,
      start: event.start,
      end: event.end,
      extendedProps: { session: event.session },
      classNames: [`fc-status-${event.session.status}`, ...(this.isSessionEnded(event.session) ? ["fc-session-ended"] : [])],
    };
  }

  // A session nobody explicitly cancelled or marked completed, whose time
  // has simply passed (e.g. yesterday's booking) — shown greyed out, not
  // struck through like an actually-cancelled session.
  isSessionEnded(session: Session): boolean {
    return session.status === "scheduled" && new Date(session.ends_at).getTime() < Date.now();
  }

  private onEventClick(arg: EventClickArg): void {
    const session = arg.event.extendedProps["session"] as Session;
    this.openDetail(session);
  }

  private onDateClick(date: Date, dayEl: HTMLElement): void {
    if (!this.canManageSessions()) return;
    this.selectCell(dayEl);
    this.openCreate(date);
  }

  private selectCell(el: HTMLElement): void {
    this.clearSelectedCell();
    el.classList.add("fc-cell-selected");
    this.selectedCellEl = el;
  }

  private clearSelectedCell(): void {
    this.selectedCellEl?.classList.remove("fc-cell-selected");
    this.selectedCellEl = null;
  }

  private async onEventDrop(arg: EventDropArg): Promise<void> {
    const session = arg.event.extendedProps["session"] as Session;
    const newStart = arg.event.start!;

    const confirmed = await this.confirm.ask({
      title: this.translate.instant("calendar.move_confirm_title"),
      body: this.translate.instant("calendar.move_confirm_body"),
    });

    if (!confirmed) {
      arg.revert();
      return;
    }

    const duration = new Date(session.ends_at).getTime() - new Date(session.starts_at).getTime();
    const newEnd = new Date(newStart.getTime() + duration);

    this.sessionsService.update(session.id, { starts_at: newStart.toISOString(), ends_at: newEnd.toISOString() }).subscribe({
      next: () => {
        this.toast.success(this.translate.instant("common.save"));
        this.calendarApi?.refetchEvents();
      },
      error: (err) => {
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
        arg.revert();
      },
    });
  }

  // === Session detail ===
  openDetail(session: Session): void {
    this.selectedSession.set(session);
    this.detailOpen.set(true);
    this.detailLoading.set(true);
    this.addClientSearch.set("");
    this.addClientResults.set([]);

    this.attendanceService.forSession(session.id).subscribe({
      next: (res) => {
        this.detailBookings.set(res.bookings);
        this.detailLoading.set(false);
      },
      error: () => this.detailLoading.set(false),
    });
  }

  closeDetail(): void {
    this.detailOpen.set(false);
  }

  markAttendance(booking: AttendanceBooking, status: AttendanceStatus): void {
    this.markingBookingId.set(booking.booking_id);
    this.attendanceService.mark(booking.booking_id, status).subscribe({
      next: (res) => {
        this.markingBookingId.set(null);
        this.detailBookings.update((list) => list.map((b) => (b.booking_id === res.attendance.booking_id ? res.attendance : b)));
      },
      error: (err) => {
        this.markingBookingId.set(null);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  searchClientsToAdd(term: string): void {
    this.addClientSearch.set(term);
    if (term.trim().length < 2) {
      this.addClientResults.set([]);
      return;
    }
    this.clientsService.list({ search: term }).subscribe((res) => this.addClientResults.set(res.clients));
  }

  addClientToSession(client: Client): void {
    const session = this.selectedSession();
    if (!session) return;

    this.addingClient.set(true);
    this.bookingsService.create(client.id, session.id).subscribe({
      next: () => {
        this.addingClient.set(false);
        this.addClientSearch.set("");
        this.addClientResults.set([]);
        this.toast.success(this.translate.instant("common.save"));
        this.openDetail(session);
        this.calendarApi?.refetchEvents();
      },
      error: (err) => {
        this.addingClient.set(false);
        this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  async cancelSession(): Promise<void> {
    const session = this.selectedSession();
    if (!session) return;

    const confirmed = await this.confirm.ask({
      title: this.translate.instant("bookings.cancel_confirm_title"),
      body: this.translate.instant("calendar.cancel_session_body"),
      danger: true,
    });
    if (!confirmed) return;

    this.sessionsService.cancel(session.id).subscribe({
      next: () => {
        this.toast.success(this.translate.instant("common.confirm"));
        this.detailOpen.set(false);
        this.calendarApi?.refetchEvents();
      },
      error: (err) => this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic"))),
    });
  }

  // === Create session ===
  openCreate(date?: Date): void {
    this.createForm.reset({
      date: toDateInputValue(date ?? new Date()),
      // Keep the exact minute FullCalendar reports for the clicked slot
      // (already snapped to its own grid, e.g. :00/:30) instead of always
      // flattening to the top of the hour.
      start_time: date ? `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}` : "09:00",
    });
    this.applyCreateActivity(null);
    this.formError.set(null);
    this.createModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.createModalOpen.set(false);
    this.clearSelectedCell();
  }

  submitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const { activity_id, client_id, coach_id, date, start_time, capacity, price } = this.createForm.getRawValue();
    const activity = this.activities().find((a) => a.id === activity_id);
    if (!activity) return;

    const startsAt = new Date(`${date}T${start_time}:00`);
    const endsAt = new Date(startsAt.getTime() + activity.duration * 60000);

    this.saving.set(true);
    this.formError.set(null);

    this.sessionsService
      .create({
        activity_id: activity_id!,
        client_id: client_id || undefined,
        coach_id: coach_id || null,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        capacity: capacity || undefined,
        price: price || undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.createModalOpen.set(false);
          this.clearSelectedCell();
          this.toast.success(this.translate.instant("common.save"));
          this.calendarApi?.refetchEvents();
        },
        error: (err) => {
          this.saving.set(false);
          this.formError.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
        },
      });
  }
}
