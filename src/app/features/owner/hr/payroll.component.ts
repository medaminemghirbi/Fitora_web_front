import { Component, OnInit, computed, effect, inject, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { map } from "rxjs";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { HrService } from "../../../core/services/hr.service";
import { ToastService } from "../../../core/services/toast.service";
import { downloadBlob, readBlobErrorCode } from "../../../core/services/download.util";
import { PayrollEmployee, PayrollSheet } from "../../../core/models/work-contract.model";
import { AvatarComponent } from "../../../shared/components/avatar.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state.component";
import { MoneyPipe } from "../../../shared/pipes/money.pipe";
import { PageHeaderComponent } from "../../../shared/ui/page-header.component";
import { SkeletonComponent } from "../../../shared/ui/skeleton.component";
import { ErrorStateComponent } from "../../../shared/ui/error-state.component";

@Component({
  selector: "app-payroll",
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    RouterLink,
    TranslateModule,
    AvatarComponent,
    EmptyStateComponent,
    MoneyPipe,
    PageHeaderComponent,
    SkeletonComponent,
    ErrorStateComponent,
  ],
  templateUrl: "./payroll.component.html",
  styleUrl: "./payroll.component.scss",
})
export class PayrollComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly exporting = signal<string | null>(null); // "all" | staffMemberId
  readonly sheet = signal<PayrollSheet | null>(null);
  readonly month = signal(new Date().toISOString().slice(0, 7));
  readonly tab = signal<"resume" | "presences">("resume");

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Selected technician comes from the URL (/owner/hr/payroll/:staffMemberId).
  readonly routeId = toSignal(this.route.paramMap.pipe(map((p) => p.get("staffMemberId"))), {
    initialValue: this.route.snapshot.paramMap.get("staffMemberId"),
  });

  readonly employees = computed(() => this.sheet()?.employees ?? []);

  readonly selected = computed<PayrollEmployee | null>(() => {
    const list = this.employees();
    if (list.length === 0) return null;
    return list.find((e) => e.staff_member_id === this.routeId()) ?? list[0];
  });

  readonly selectedIndex = computed(() => {
    const cur = this.selected();
    return cur ? this.employees().findIndex((e) => e.staff_member_id === cur.staff_member_id) : -1;
  });

  constructor(
    private readonly hr: HrService,
    private readonly toast: ToastService,
    private readonly translate: TranslateService
  ) {
    // Keep the URL pointing at a real technician: land on the first one when
    // none / an unknown id is in the path.
    effect(() => {
      const list = this.employees();
      if (list.length === 0) return;
      const id = this.routeId();
      if (!id || !list.some((e) => e.staff_member_id === id)) {
        this.goTo(list[0].staff_member_id, true);
      }
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.hr.payroll(this.month()).subscribe({
      next: (res) => {
        this.sheet.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  onMonthChange(value: string): void {
    if (!value) return;
    this.month.set(value);
    this.load();
  }

  goTo(staffMemberId: string, replaceUrl = false): void {
    this.router.navigate(["/owner/hr/payroll", staffMemberId], { replaceUrl });
  }

  step(delta: number): void {
    const list = this.employees();
    const i = this.selectedIndex();
    if (i < 0 || list.length === 0) return;
    const next = (i + delta + list.length) % list.length;
    this.goTo(list[next].staff_member_id);
  }

  // Monday-first leading blanks so day 1 sits under its weekday column.
  pad(firstWeekday: number): number[] {
    return Array.from({ length: (firstWeekday + 6) % 7 });
  }

  dayClass(code: string): string {
    return "payroll-day payroll-day--" + code;
  }

  dayLabel(code: string, abbr: string | null): string {
    if (code === "worked") return "T";
    if (code === "off") return "·";
    if (code === "na") return "";
    return abbr ?? "";
  }

  async downloadPdf(employee?: PayrollEmployee): Promise<void> {
    const key = employee?.staff_member_id ?? "all";
    this.exporting.set(key);
    this.hr.payrollPdf(this.month(), employee?.staff_member_id).subscribe({
      next: (blob) => {
        this.exporting.set(null);
        const name = employee ? employee.name.toLowerCase().replace(/\s+/g, "-") : "equipe";
        downloadBlob(blob, `pre-fiche-paie-${this.month()}-${name}.pdf`);
      },
      error: async (err) => {
        this.exporting.set(null);
        const code = await readBlobErrorCode(err);
        this.toast.error(code ? code : this.translate.instant("common.error_generic"));
      },
    });
  }
}
