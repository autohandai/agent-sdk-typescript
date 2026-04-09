/**
 * SessionManager for managing cleanup of resources during agent execution.
 * Handles AbortControllers, timers, and other disposable resources.
 */

import { Disposable, CompositeDisposable } from "./disposable";

/**
 * Manages resources for a single agent execution session.
 */
export class SessionManager implements Disposable {
  private disposables: CompositeDisposable;
  private abortController: AbortController | null = null;
  private timers: Set<NodeJS.Timeout> = new Set();

  constructor() {
    this.disposables = new CompositeDisposable();
  }

  /**
   * Create a new AbortSignal for this session.
   * Can be used to cancel in-flight requests.
   */
  getSignal(): AbortSignal {
    if (!this.abortController) {
      this.abortController = new AbortController();
    }
    return this.abortController.signal;
  }

  /**
   * Add a disposable resource to this session.
   */
  addDisposable(disposable: Disposable): void {
    this.disposables.add(disposable);
  }

  /**
   * Set a timeout that will be cleared when the session is disposed.
   */
  setTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timer = setTimeout(callback, delay);
    this.timers.add(timer);
    return timer;
  }

  /**
   * Clear a specific timer.
   */
  clearTimeout(timer: NodeJS.Timeout): void {
    clearTimeout(timer);
    this.timers.delete(timer);
  }

  /**
   * Abort the session, canceling all in-flight requests.
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Check if the session has been aborted.
   */
  isAborted(): boolean {
    return this.abortController?.signal.aborted ?? false;
  }

  /**
   * Dispose all resources in this session.
   */
  dispose(): void {
    // Clear all timers
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();

    // Abort any in-flight requests
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Dispose all managed disposables
    this.disposables.dispose();
  }
}
