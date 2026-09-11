import { Injectable, signal } from "@angular/core";

export interface ConfirmRequest {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmRequest {
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: "root" })
export class ConfirmService {
  readonly request = signal<ConfirmState | null>(null);

  ask(request: ConfirmRequest): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.request.set({ ...request, resolve });
    });
  }

  resolve(value: boolean): void {
    this.request()?.resolve(value);
    this.request.set(null);
  }
}
