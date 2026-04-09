/**
 * Disposable interface for resource cleanup.
 * Provides a standard way to release resources like timers, event listeners, etc.
 */

export interface Disposable {
  /**
   * Release any resources held by this instance.
   * Should be safe to call multiple times.
   */
  dispose(): void;
}

/**
 * Helper class to manage multiple disposable resources.
 */
export class CompositeDisposable implements Disposable {
  private disposables: Set<Disposable> = new Set();

  /**
   * Add a disposable to be managed.
   */
  add(disposable: Disposable): void {
    this.disposables.add(disposable);
  }

  /**
   * Remove a disposable from management.
   */
  remove(disposable: Disposable): void {
    this.disposables.delete(disposable);
  }

  /**
   * Dispose all managed resources.
   */
  dispose(): void {
    for (const disposable of this.disposables) {
      try {
        disposable.dispose();
      } catch (error) {
        console.error('Error disposing resource:', error);
      }
    }
    this.disposables.clear();
  }

  /**
   * Check if any resources are being managed.
   */
  isEmpty(): boolean {
    return this.disposables.size === 0;
  }
}
