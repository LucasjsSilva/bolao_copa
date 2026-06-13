import { Injectable, inject, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private resolveReady: (() => void) | null = null;
  private readonly readyPromise = new Promise<void>((resolve) => {
    this.resolveReady = resolve;
  });

  readonly currentUser = signal<User | null>(null);
  readonly loading = signal(true);

  constructor() {
    void this.initializeSession();

    this.supabase.client.auth.onAuthStateChange((_, session) => {
      this.currentUser.set(session?.user ?? null);
      this.loading.set(false);
      this.finishInitialization();
    });
  }

  async ensureSessionLoaded(): Promise<void> {
    await this.readyPromise;
  }

  async signInWithEmail(email: string, password: string) {
    const result = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (!result.error) {
      this.currentUser.set(result.data.session?.user ?? result.data.user ?? null);
    }
    return result;
  }

  async signUpWithEmail(email: string, password: string) {
    const result = await this.supabase.client.auth.signUp({ email, password });
    if (!result.error) {
      this.currentUser.set(result.data.session?.user ?? null);
    }
    return result;
  }

  async signOut() {
    const result = await this.supabase.client.auth.signOut();
    if (!result.error) {
      this.currentUser.set(null);
    }
    return result;
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  private async initializeSession(): Promise<void> {
    const { data } = await this.supabase.client.auth.getSession();
    this.currentUser.set(data.session?.user ?? null);
    this.loading.set(false);
    this.finishInitialization();
  }

  private finishInitialization(): void {
    if (this.resolveReady) {
      this.resolveReady();
      this.resolveReady = null;
    }
  }
}
