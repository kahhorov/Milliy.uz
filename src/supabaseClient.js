// supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ylndtzbarfkwibfmgljs.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsbmR0emJhcmZrd2liZm1nbGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0OTY5NTEsImV4cCI6MjA3NzA3Mjk1MX0.Gtzp7NcG6MviLEI7jVPZYcWaIvYYSW2pLAhbKDM7WVM";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
