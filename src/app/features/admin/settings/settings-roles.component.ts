import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Role } from "../../../core/models/role.model";
import { RolesService } from "../../../core/services/roles.service";
import { ConfirmService } from "../../../core/services/confirm.service";
import { ToastService } from "../../../core/services/toast.service";
import { extractErrorMessage } from "../../../core/services/error.util";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { ModalComponent } from "../../../shared/components/modal.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ActionMenuComponent } from "../../../shared/ui/action-menu.component";

// Permission keys the roles editor groups the checkbox list by. Anything the
// backend catalogue adds that isn't listed here falls into "daily".
const CONFIG_PERMISSIONS = ["activities", "contract_types", "coaches"];

@Component({
  selector: "app-settings-roles",
  standalone: true,
  imports: [FormsModule, TranslateModule, EmptyStateComponent, ModalComponent, SkeletonComponent, ActionMenuComponent],
  templateUrl: "./settings-roles.component.html",
})
export class SettingsRolesComponent implements OnInit {
  private readonly rolesService = inject(RolesService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly roles = signal<Role[]>([]);
  readonly catalog = signal<Record<string, string>>({});

  readonly modalOpen = signal(false);
  readonly editing = signal<Role | null>(null);
  readonly draftName = signal("");
  readonly draftPerms = signal<Set<string>>(new Set());
  readonly formError = signal<string | null>(null);

  readonly isAdminRole = computed(() => this.editing()?.key === "admin");

  readonly configPermKeys = computed(() =>
    Object.keys(this.catalog()).filter((k) => CONFIG_PERMISSIONS.includes(k))
  );
  readonly dailyPermKeys = computed(() =>
    Object.keys(this.catalog()).filter((k) => !CONFIG_PERMISSIONS.includes(k))
  );

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.rolesService.list().subscribe({
      next: (res) => {
        this.roles.set(res.roles);
        this.catalog.set(res.permission_catalog);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  permLabel(key: string): string {
    const i18n = this.translate.instant(`settings.perm_${key}`);
    return i18n === `settings.perm_${key}` ? this.catalog()[key] ?? key : i18n;
  }

  openCreate(): void {
    this.editing.set(null);
    this.draftName.set("");
    this.draftPerms.set(new Set());
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  openEdit(role: Role): void {
    this.editing.set(role);
    this.draftName.set(role.name);
    this.draftPerms.set(new Set(role.permissions));
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  togglePerm(key: string): void {
    const next = new Set(this.draftPerms());
    next.has(key) ? next.delete(key) : next.add(key);
    this.draftPerms.set(next);
  }

  submit(): void {
    const name = this.draftName().trim();
    if (!name) {
      this.formError.set(this.translate.instant("settings.role_name_required"));
      return;
    }
    this.saving.set(true);
    this.formError.set(null);

    const payload = { name, permissions: [...this.draftPerms()] };
    const editing = this.editing();
    const req = editing
      ? this.rolesService.update(editing.id, editing.builtin ? { permissions: payload.permissions } : payload)
      : this.rolesService.create(payload);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.toast.success(this.translate.instant("common.save"));
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(extractErrorMessage(err, this.translate.instant("common.error_generic")));
      },
    });
  }

  async remove(role: Role): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.translate.instant("settings.role_delete_title", { name: role.name }),
      body: this.translate.instant("settings.role_delete_body"),
      danger: true,
    });
    if (!ok) return;
    this.rolesService.delete(role.id).subscribe({
      next: () => {
        this.toast.success(this.translate.instant("common.delete"));
        this.load();
      },
      error: (err) => this.toast.error(extractErrorMessage(err, this.translate.instant("common.error_generic"))),
    });
  }
}
