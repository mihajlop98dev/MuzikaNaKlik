export const environment = {
  production: false,
  supabaseUrl: 'https://lsiicemxpvppgzpwiury.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzaWljZW14cHZwcGd6cHdpdXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MDA2ODAsImV4cCI6MjA5OTk3NjY4MH0.9PJMRFSfroijVRUJ1SjsHgNjVs0w3dMXUW_9-gLBAPg',
  apiUrl: '/api',

  /**
   * Master switch for charging money.
   *
   * Off until there is a registered business to invoice through: taking
   * recurring payment for a service is business activity, and doing it
   * unregistered is not an option. Card processing is a separate blocker —
   * Stripe does not accept Serbian merchants, and merchant-of-record services
   * (Polar, Paddle) prohibit booking directories outright.
   *
   * While off, every performer is visible and plans are hidden. Turning it on
   * restores the paid tiers as they were — no code was removed.
   */
  paidPlansEnabled: false,
};
