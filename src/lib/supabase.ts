import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://optvzsdieukdqsrcxdzm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wdHZ6c2RpZXVrZHFzcmN4ZHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MDk0NjcsImV4cCI6MjEwMTA4NTQ2N30.5F68be2JoTm9BV51tjFJHEGH7BzhkECTkfVualXGkI0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
