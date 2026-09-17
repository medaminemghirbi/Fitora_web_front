import { Injectable, signal } from "@angular/core";

export interface Coords {
  lat: number;
  lng: number;
}

export type GeoState = "idle" | "asking" | "granted" | "denied" | "unavailable";

/**
 * The visitor's position, used only to put the nearest gym first.
 *
 * Deliberately never asked for on page load: an unprompted permission dialog
 * is hostile, and Chrome and Safari refuse or silently ignore it outside a
 * user gesture anyway. The exception is when permission was ALREADY granted
 * on a previous visit — the browser then answers without prompting, so the
 * list can sort itself the way the person asked for last time.
 */
@Injectable({ providedIn: "root" })
export class GeolocationService {
  readonly state = signal<GeoState>("idle");
  readonly coords = signal<Coords | null>(null);

  get supported(): boolean {
    return typeof navigator !== "undefined" && !!navigator.geolocation;
  }

  /** Resolves to null rather than rejecting: no position is not an error. */
  async locate(): Promise<Coords | null> {
    if (!this.supported) {
      this.state.set("unavailable");
      return null;
    }

    this.state.set("asking");
    return new Promise<Coords | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          this.coords.set(coords);
          this.state.set("granted");
          resolve(coords);
        },
        (error) => {
          this.state.set(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
      );
    });
  }

  /**
   * Only locates when the browser says permission is already granted, so a
   * returning visitor gets the nearest gyms with no dialog and everyone else
   * is left alone until they ask.
   */
  async locateIfAlreadyAllowed(): Promise<Coords | null> {
    if (!this.supported || !navigator.permissions?.query) return null;

    try {
      const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
      if (status.state !== "granted") return null;
    } catch {
      // Firefox has refused this query for geolocation in the past; staying
      // silent is the safe answer, the button still works.
      return null;
    }

    return this.locate();
  }
}
