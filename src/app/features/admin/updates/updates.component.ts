import { Component, OnInit, inject, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AppUpdate } from "../../../core/models/app-update.model";
import { AppUpdatesService } from "../../../core/services/app-updates.service";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { PageHeaderComponent } from "../../../shared/ui/page-header.component";
import { SpinnerComponent } from "../../../shared/components/spinner.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { DrawerComponent } from "../../../shared/ui/drawer.component";
import { MediaUrlPipe } from "../../../shared/pipes/media-url.pipe";

const MAX_FILES = 8;
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_TYPES = [ "image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/quicktime", "video/webm" ];

@Component({
  selector: "app-admin-updates",
  standalone: true,
  imports: [
    FormsModule, DatePipe, TranslateModule, PageHeaderComponent, SpinnerComponent, ErrorStateComponent,
    EmptyStateComponent, DrawerComponent, MediaUrlPipe,
  ],
  templateUrl: "./updates.component.html",
  styleUrl: "./updates.component.scss",
})
export class AdminUpdatesComponent implements OnInit {
  private readonly service = inject(AppUpdatesService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly updates = signal<AppUpdate[]>([]);

  readonly drawerOpen = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly version = signal("");
  readonly title = signal("");
  readonly description = signal("");
  readonly files = signal<File[]>([]);
  readonly fileError = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.service.listAdmin().subscribe({
      next: (res) => {
        this.updates.set(res.app_updates);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.version.set("");
    this.title.set("");
    this.description.set("");
    this.files.set([]);
    this.fileError.set(null);
    this.formError.set(null);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const picked = Array.from(input.files ?? []);
    input.value = "";

    const combined = [ ...this.files(), ...picked ];
    if (combined.length > MAX_FILES) {
      this.fileError.set(this.translate.instant("admin.updates.too_many_files", { max: MAX_FILES }));
      return;
    }
    const invalid = picked.find((f) => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_FILE_SIZE);
    if (invalid) {
      this.fileError.set(this.translate.instant("admin.updates.invalid_file", { name: invalid.name }));
      return;
    }

    this.fileError.set(null);
    this.files.set(combined);
  }

  removeFile(index: number): void {
    this.files.update((list) => list.filter((_, i) => i !== index));
    this.fileError.set(null);
  }

  submit(): void {
    if (!this.version().trim() || !this.title().trim()) return;

    this.saving.set(true);
    this.formError.set(null);
    this.service.create(this.version().trim(), this.title().trim(), this.description().trim(), this.files()).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.drawerOpen.set(false);
        this.updates.update((list) => [ res.app_update, ...list ]);
        this.toast.success(this.translate.instant("admin.updates.published"));
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }
}
