import { Component, HostListener, computed, effect, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { NavigationService } from "../../core/configuration/navigation.service";
import { CommandPaletteService } from "../../core/services/command-palette.service";
import { ClientsService } from "../../core/services/clients.service";
import { ContractsService } from "../../core/services/contracts.service";
import { PaymentsService } from "../../core/services/payments.service";
import { AuthService } from "../../core/auth/auth.service";

interface Cmd {
  id: string;
  label?: string;
  labelKey?: string;
  sub?: string;
  icon: string;
  run: () => void;
}
interface Section {
  key: string;
  labelKey: string;
  items: Cmd[];
}

@Component({
  selector: "app-command-palette",
  standalone: true,
  imports: [TranslateModule],
  templateUrl: "./command-palette.component.html",
  styleUrl: "./command-palette.component.scss",
})
export class CommandPaletteComponent {
  readonly palette = inject(CommandPaletteService);
  private readonly nav = inject(NavigationService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly clients = inject(ClientsService);
  private readonly contracts = inject(ContractsService);
  private readonly payments = inject(PaymentsService);
  private readonly translate = inject(TranslateService);

  readonly query = signal("");
  readonly active = signal(0);

  private readonly remote = signal<{ clients: Cmd[]; contracts: Cmd[]; payments: Cmd[] }>({
    clients: [],
    contracts: [],
    payments: [],
  });
  private searchDebounce?: ReturnType<typeof setTimeout>;
  private readonly isOwner = computed(() => this.auth.currentUser()?.role === "owner");

  private close(run: () => void): void {
    this.palette.close();
    run();
  }

  private readonly navCmds = computed<Cmd[]>(() =>
    [
      ...(this.nav.dashboardItem() ? [this.nav.dashboardItem()!] : []),
      ...this.nav.groups().flatMap((g) => g.items),
      ...this.nav.secondaryItems(),
    ]
      .map((l) => ({
        id: "nav:" + l.path,
        labelKey: l.labelKey,
        icon: l.icon,
        run: () => this.close(() => this.router.navigateByUrl(l.path)),
      }))
  );

  private readonly actionCmds = computed<Cmd[]>(() => {
    if (!this.isOwner()) return [];
    const nav = (path: string) => this.close(() => this.router.navigate([path], { queryParams: { action: "new" } }));
    return [
      { id: "act:client", labelKey: "palette.action_new_client", icon: "bi-person-plus", run: () => nav("/owner/clients") },
      { id: "act:payment", labelKey: "palette.action_new_payment", icon: "bi-cash-coin", run: () => nav("/owner/payments") },
      { id: "act:activity", labelKey: "palette.action_new_activity", icon: "bi-lightning-charge", run: () => nav("/owner/activities") },
      { id: "act:team", labelKey: "team.new", icon: "bi-person-vcard", run: () => nav("/owner/team") },
    ];
  });

  readonly sections = computed<Section[]>(() => {
    const q = this.query().trim().toLowerCase();
    const has = (c: Cmd) =>
      !q ||
      (c.label ?? "").toLowerCase().includes(q) ||
      (c.labelKey ? this.translate.instant(c.labelKey).toLowerCase().includes(q) : false);

    const navItems = this.navCmds().filter(has).slice(0, 8);
    const actionItems = q.length > 0 ? this.actionCmds().filter(has) : [];
    const r = this.remote();

    const out: Section[] = [];
    if (navItems.length) out.push({ key: "goto", labelKey: "palette.goto", items: navItems });
    if (actionItems.length) out.push({ key: "actions", labelKey: "palette.actions", items: actionItems });
    if (r.clients.length) out.push({ key: "clients", labelKey: "palette.clients", items: r.clients });
    if (r.contracts.length) out.push({ key: "contracts", labelKey: "palette.contracts", items: r.contracts });
    if (r.payments.length) out.push({ key: "payments", labelKey: "palette.payments", items: r.payments });
    return out;
  });

  readonly flat = computed<Cmd[]>(() => this.sections().flatMap((s) => s.items));

  /** Flattened rows for the template: section labels + items with a global index. */
  readonly rows = computed<({ label: string } | { cmd: Cmd; index: number })[]>(() => {
    const out: ({ label: string } | { cmd: Cmd; index: number })[] = [];
    let i = 0;
    for (const s of this.sections()) {
      out.push({ label: s.labelKey });
      for (const it of s.items) out.push({ cmd: it, index: i++ });
    }
    return out;
  });

  constructor() {
    effect(() => {
      if (this.palette.isOpen()) {
        this.query.set("");
        this.active.set(0);
        this.remote.set({ clients: [], contracts: [], payments: [] });
        queueMicrotask(() => document.getElementById("cmdk-input")?.focus());
      }
    });
  }

  onQuery(value: string): void {
    this.query.set(value);
    this.active.set(0);
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    const term = value.trim();
    if (term.length < 2) {
      this.remote.set({ clients: [], contracts: [], payments: [] });
      return;
    }
    this.searchDebounce = setTimeout(() => this.runRemote(term), 250);
  }

  private runRemote(term: string): void {
    if (!this.isOwner()) return;
    this.clients.list({ search: term }).subscribe((res) =>
      this.remote.update((r) => ({
        ...r,
        clients: res.clients.slice(0, 5).map((c) => ({
          id: "cli:" + c.id,
          label: c.full_name,
          sub: c.phone ?? c.email ?? undefined,
          icon: "bi-person",
          run: () => this.close(() => this.router.navigate(["/owner/clients", c.id])),
        })),
      }))
    );
    this.contracts.list({ q: term }).subscribe((res) =>
      this.remote.update((r) => ({
        ...r,
        contracts: res.contracts.slice(0, 5).map((m) => ({
          id: "ctr:" + m.id,
          label: m.client.full_name,
          sub: m.plan.name,
          icon: "bi-file-earmark-text",
          run: () => this.close(() => this.router.navigate(["/owner/clients", m.client.id])),
        })),
      }))
    );
    this.payments.list({ q: term }).subscribe((res) =>
      this.remote.update((r) => ({
        ...r,
        payments: res.payments.slice(0, 5).map((p) => ({
          id: "pay:" + p.id,
          label: p.client.full_name,
          sub: `${p.amount} ${p.currency}`,
          icon: "bi-credit-card",
          run: () => this.close(() => this.router.navigate(["/owner/payments"], { queryParams: { q: term } })),
        })),
      }))
    );
  }

  @HostListener("document:keydown", ["$event"])
  onKey(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      this.palette.toggle();
      return;
    }
    if (!this.palette.isOpen()) return;
    if (e.key === "Escape") {
      this.palette.close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      this.active.update((i) => Math.min(i + 1, this.flat().length - 1));
      this.scrollActive();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.active.update((i) => Math.max(i - 1, 0));
      this.scrollActive();
    } else if (e.key === "Enter") {
      e.preventDefault();
      this.flat()[this.active()]?.run();
    }
  }

  private scrollActive(): void {
    queueMicrotask(() => document.querySelector(".cmdk-item.is-active")?.scrollIntoView({ block: "nearest" }));
  }
}
