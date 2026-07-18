import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );

    this.supabase.auth.onAuthStateChange((event, session) => {
      this.userSubject.next(session?.user ?? null);
    });
  }

  get client() {
    return this.supabase;
  }

  getSession() {
    return this.supabase.auth.getSession();
  }

  signUp(email: string, password: string, metadata: Record<string, any>) {
    return this.supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
  }

  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  signInWithGoogle() {
    return this.supabase.auth.signInWithOAuth({ provider: 'google' });
  }

  signOut() {
    return this.supabase.auth.signOut();
  }
}
