import { Pipe, PipeTransform } from "@angular/core";
import { API_ORIGIN } from "../../core/models/api-config";

// The backend returns Active Storage paths as host-relative (e.g. Company's
// logo_url, and now Supplier's photo_url) — same
// reasoning as BrandingService.logoUrl(). The Angular dev server runs on a
// different origin, so every <img [src]> needs the API's origin prefixed.
@Pipe({ name: "mediaUrl", standalone: true })
export class MediaUrlPipe implements PipeTransform {
  transform(path: string | null | undefined): string | null {
    return path ? `${API_ORIGIN}${path}` : null;
  }
}
