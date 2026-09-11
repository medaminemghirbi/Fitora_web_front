import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { AuthService } from "../auth/auth.service";
import { NavigationService } from "./navigation.service";

describe("NavigationService", () => {
  let permissions: ReturnType<typeof signal<string[]>>;
  let user: ReturnType<typeof signal<{ role: string } | null>>;

  function build(): NavigationService {
    permissions = signal<string[]>([
      "clients", "contracts", "payments", "reports", "company_library", "coaches",
    ]);
    user = signal<{ role: string } | null>({ role: "owner" });

    const authStub: Partial<AuthService> = {
      currentUser: user as AuthService["currentUser"],
      hasPermission: (k: string) => permissions().includes(k),
    };

    TestBed.configureTestingModule({
      providers: [
        NavigationService,
        { provide: AuthService, useValue: authStub },
      ],
    });
    return TestBed.inject(NavigationService);
  }

  it("shows the planning + management groups for an owner", () => {
    const nav = build();
    const ids = nav.groups().map((g) => g.id);
    expect(ids).toContain("planning");
    expect(ids).toContain("management");
    expect(nav.groups().find((g) => g.id === "management")!.items.map((i) => i.path))
      .toEqual(["/owner/clients", "/owner/contracts"]);
  });

  it("shows the bookings item only once its permission is granted", () => {
    const nav = build();
    expect(nav.groups().flatMap((g) => g.items).map((i) => i.path)).not.toContain("/owner/bookings");

    permissions.set([...permissions(), "bookings"]);
    expect(nav.groups().flatMap((g) => g.items).map((i) => i.path)).toContain("/owner/bookings");
  });

  it("hides a permission-gated item the login lacks", () => {
    const nav = build();
    permissions.set(["clients"]);
    const paths = nav.groups().flatMap((g) => g.items).map((i) => i.path);
    expect(paths).toContain("/owner/clients");
    expect(paths).not.toContain("/owner/payments");
  });

  it("hides owner-only groups from staff", () => {
    const nav = build();
    user.set({ role: "staff" });
    expect(nav.groups().map((g) => g.id)).not.toContain("hr");
    expect(nav.secondaryItems().length).toBe(0);
  });
});
