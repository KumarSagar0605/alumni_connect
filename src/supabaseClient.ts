import { createClient } from '@supabase/supabase-js';

declare global {
	interface ImportMeta {
		readonly env: {
			readonly VITE_SUPABASE_URL: string;
			readonly VITE_SUPABASE_ANON_KEY: string;
			readonly VITE_GEMINI_API_KEY: string;
		};
	}
}

// These variables will be pulled from a .env file you create in your root folder
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);