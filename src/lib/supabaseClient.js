import { createClient } from '@supabase/supabase-js';

// Si no están configuradas en Vercel dashboard, usar las credenciales públicas por defecto
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rlwugrqpavdxwrubvqym.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsd3VncnFwYXZkeHdydWJ2cXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4OTI1NDIsImV4cCI6MjEwOTQ2ODU0Mn0.88PwIDvhQn7KeHUlNBjZNxkfzBRXvUvXBCKbKfTUQsc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
