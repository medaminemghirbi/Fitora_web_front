import { Injectable, signal } from "@angular/core";

export type ToastKind = "success" | "error" | "info" | "warning";

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

let nextId = 1;

@Injectable({ providedIn: "root" })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  success(message: string): void {
    this.push("success", message);
  }

  error(message: string): void {
    this.push("error", message);
  }

  info(message: string): void {
    this.push("info", message);
  }

  warning(message: string): void {
    this.push("warning", message);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(kind: ToastKind, message: string): void {
    const toast: Toast = { id: nextId++, kind, message };
    this.toasts.update((list) => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), 4000);
  }
}
