import { supabase } from './supabaseService';

// Timeouts in milliseconds per role (userTypeCode)
// userTypeCode: 1=Admin, 2=DTI, 3=Store, 4=Shopper (no timeout)
const IDLE_TIMEOUTS: Record<number, number> = {
  1: 4 * 60 * 60 * 1000,  // Admin  — 4 hours
  2: 4 * 60 * 60 * 1000,  // DTI    — 4 hours
  3: 8 * 60 * 60 * 1000,  // Store  — 8 hours
};

// How long before timeout to show the warning (2 minutes)
const WARNING_LEAD_TIME = 2 * 60 * 1000;

export interface IdleTimeoutCallbacks {
  onWarn: (secondsLeft: number) => void;   // called when warning fires
  onLogout: () => void;                     // called when session expires
}

export class IdleTimeoutService {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private warningId: ReturnType<typeof setTimeout> | null = null;
  private countdownId: ReturnType<typeof setInterval> | null = null;
  private userTypeCode: number | null = null;
  private callbacks: IdleTimeoutCallbacks | null = null;

  private readonly ACTIVITY_EVENTS = [
    'mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'
  ];

  private handleActivity = () => {
    if (this.userTypeCode && IDLE_TIMEOUTS[this.userTypeCode]) {
      this.resetTimer();
    }
  };

  async start(callbacks: IdleTimeoutCallbacks): Promise<void> {
    this.callbacks = callbacks;

    // Determine the current user's role
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) return;

    // Use .maybeSingle() instead of .single() to avoid 406 errors when no
    // USER row exists for this email (e.g. auth user created but profile
    // registration not yet completed).
    const { data: userData, error: userErr } = await supabase
      .from('USER')
      .select('userTypeCode')
      .eq('email', session.user.email)
      .maybeSingle();

    if (userErr) {
      console.warn('Could not fetch userTypeCode:', userErr.message);
      return;
    }

    const code = userData?.userTypeCode as number | undefined;

    // Shoppers (code 4) and unknown roles get no timeout
    if (!code || !IDLE_TIMEOUTS[code]) {
      return;
    }

    this.userTypeCode = code;

    // Attach activity listeners
    this.ACTIVITY_EVENTS.forEach(event =>
      window.addEventListener(event, this.handleActivity, { passive: true })
    );

    this.resetTimer();
  }

  stop(): void {
    this.ACTIVITY_EVENTS.forEach(event =>
      window.removeEventListener(event, this.handleActivity)
    );
    this.clearTimers();
    this.userTypeCode = null;
    this.callbacks = null;
  }

  private resetTimer(): void {
    this.clearTimers();

    if (!this.userTypeCode || !this.callbacks) return;
    const timeout = IDLE_TIMEOUTS[this.userTypeCode];

    // Schedule warning 2 minutes before logout
    this.warningId = setTimeout(() => {
      if (!this.callbacks) return;
      let secondsLeft = WARNING_LEAD_TIME / 1000;
      this.callbacks.onWarn(secondsLeft);

      this.countdownId = setInterval(() => {
        secondsLeft -= 1;
        if (secondsLeft > 0) {
          this.callbacks?.onWarn(secondsLeft);
        } else {
          this.clearTimers();
        }
      }, 1000);
    }, timeout - WARNING_LEAD_TIME);

    // Schedule actual logout
    this.timeoutId = setTimeout(async () => {
      this.clearTimers();
      await supabase.auth.signOut();
      localStorage.clear();
      this.callbacks?.onLogout();
    }, timeout);
  }

  private clearTimers(): void {
    if (this.timeoutId)   { clearTimeout(this.timeoutId);     this.timeoutId = null; }
    if (this.warningId)   { clearTimeout(this.warningId);     this.warningId = null; }
    if (this.countdownId) { clearInterval(this.countdownId);  this.countdownId = null; }
  }

  /** Call this from the warning dialog when the user clicks "Stay logged in" */
  extendSession(): void {
    this.resetTimer();
  }
}

export const idleTimeout = new IdleTimeoutService();
