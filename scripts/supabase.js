
// Initialize Supabase Client
const SUPABASE_URL = 'https://elnwlaqsxiphlqupyszv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vcnFzeWdlZnJwdnZoemR4ZmdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzczMzUsImV4cCI6MjA4MzgxMzMzNX0.1xwg3l9ett5opfZt_EV1wP4K57wUUWzaldezuku-Z1w';

// Check if the library is loaded
if (typeof supabase !== 'undefined') {
    // Detect if running locally via file://
    const isLocalFile = window.location.protocol === 'file:';

    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            persistSession: !isLocalFile // Disable persistence on file:// to avoid errors
        }
    });
    console.log("Supabase initialized");
} else {
    console.error("Supabase library not loaded.");
}