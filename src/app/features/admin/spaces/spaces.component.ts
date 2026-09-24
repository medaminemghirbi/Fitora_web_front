import { Component, Input, OnInit, computed, effect, inject, signal } from "@angular/core";
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Activity } from "../../../core/models/activity.model";
import { Space } from "../../../core/models/space.model";
import { ActivitiesService } from "../../../core/services/activities.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { SpacesService } from "../../../core/services/spaces.service";
import { ToastService } from "../../../core/services/toast.service";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { ModalComponent } from "../../../shared/components/modal.component";
import { PaginationComponent } from "../../../shared/components/pagination.component";
import { StatusBadgeComponent } from "../../../shared/components/status-badge.component";
import { HighlightPipe } from "../../../shared/pipes/highlight.pipe";
import { ActionMenuComponent } from "../../../shared/ui/action-menu.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { PageHeaderComponent } from "../../../shared/ui/page-header.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { clientPageMeta, filterBySearch, pageSlice } from "../../../shared/utils/client-list";

/**
 * The gym's rooms.
 *
 * Reachable only for a company that turned rooms on: the backend answers
 * 404 otherwise, and the nav hides the entry. A single-room gym never sees
 * this page, which is the whole point of the feature being optional.
 *
 * Restricting an activity to certain rooms is the exception, not the rule —
 * an empty list means "anything can run here", so the form asks for
 * restrictions rather than for permissions.
 */
@Component({
  selector: "app-spaces",
  standalone: true,
  imports: [
    PageHeaderComponent,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    EmptyStateComponent,
    ModalComponent,
    StatusBadgeComponent,
    HighlightPipe,
    PaginationComponent,
    SkeletonComponent,
    ErrorStateComponent,
    ActionMenuComponent,
  ],
  templateUrl: "./spaces.component.html",
  styleUrl: "./spaces.component.scss",
})
export class SpacesComponent implements OnInit {
  /** Rendered inside the onboarding flow rather than on a route of its own. */
  @Input() embedded = false;

  private readonly fb = inject(FormBuilder);
  private readonly spacesService = inject(SpacesService);
  private readonly activitiesService = inject(ActivitiesService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly saving = signal(false);
  readonly spaces = signal<Space[]>([]);
  readonly activities = signal<Activity[]>([]);
  readonly modalOpen = signal(false);
  readonly editing = signal<Space | null>(null);
  readonly formError = signal<string | null>(null);

  readonly search = signal("");
  readonly page = signal(1);
  readonly filtered = computed(() => filterBySearch(this.spaces(), this.search(), (s) => [s.name, s.kind ?? ""]));
  readonly pagedSpaces = computed(() => pageSlice(this.filtered(), this.page()));
  readonly meta = computed(() => clientPageMeta(this.filtered().length, this.page()));

  /** Which activities the room being edited is reserved for. */
  readonly restrictedTo = signal<string[]>([]);

  readonly form = this.fb.nonNullable.group({
    name: ["", Validators.required],
    kind: [""],
    capacity: [null as number | null, Validators.min(1)],
  });

  constructor() {
    effect(
      () => {
        this.search();
        this.page.set(1);
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

    this.spacesService.list().subscribe({
      next: (res) => {
        this.spaces.set(res.spaces);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });

    // Only needed by the form's restriction list; a failure there must not
    // stop the rooms themselves being listed.
    this.activitiesService.list().subscribe({
      next: (res) => this.activities.set(res.activities.filter((a) => a.active)),
      error: () => this.activities.set([]),
    });
  }

  openCreate(): void {
    this.editing.set(null);
    this.formError.set(null);
    this.form.reset({ name: "", kind: "", capacity: null });
    this.restrictedTo.set([]);
    this.modalOpen.set(true);
  }

  openEdit(space: Space): void {
    this.editing.set(space);
    this.formError.set(null);
    this.form.reset({ name: space.name, kind: space.kind ?? "", capacity: space.capacity });
    this.restrictedTo.set([...space.activity_ids]);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  toggleActivity(id: string): void {
    const current = this.restrictedTo();
    this.restrictedTo.set(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  }

  isRestrictedTo(id: string): boolean {
    return this.restrictedTo().includes(id);
  }

  /** Names the activities a room is reserved for, or says it takes anything. */
  restrictionLabel(space: Space): string {
    if (space.activity_ids.length === 0) return this.translate.instant("spaces.any_activity");

    const names = this.activities()
      .filter((a) => space.activity_ids.includes(a.id))
      .map((a) => a.name);
    return names.length > 0 ? names.join(", ") : this.translate.instant("spaces.any_activity");
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name,
      kind: raw.kind || null,
      capacity: raw.capacity,
      activity_ids: this.restrictedTo(),
    };

    this.saving.set(true);
    this.formError.set(null);

    const editing = this.editing();
    const request = editing ? this.spacesService.update(editing.id, payload) : this.spacesService.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.toast.success(this.translate.instant("common.saved"));
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  /**
   * A room still holding upcoming sessions is deactivated rather than
   * deleted — the backend decides which, and the wording says so up front
   * so the answer is not a surprise.
   */
  remove(space: Space): void {
    const deletable = space.deletable;

    void this.confirm
      .ask({
        title: this.translate.instant(deletable ? "spaces.delete_title" : "spaces.deactivate_title"),
        body: this.translate.instant(deletable ? "spaces.delete_message" : "spaces.deactivate_message", { name: space.name }),
        confirmLabel: this.translate.instant(deletable ? "common.delete" : "common.deactivate"),
        danger: true,
      })
      .then((ok) => {
        if (!ok) return;

        this.spacesService.remove(space.id).subscribe({
          next: () => {
            this.toast.success(this.translate.instant("common.saved"));
            this.load();
          },
          error: (err) => this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic"))),
        });
      });
  }
}
