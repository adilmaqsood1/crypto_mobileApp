import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://klotmtjrwacqdzxjlvyo.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijk0ZTIxMGI2LTNhYzItNDA3OS05M2Q3LTM3ZTRkYjcwMDhiMiJ9.eyJwcm9qZWN0SWQiOiJrbG90bXRqcndhY3FkenhqbHZ5byIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY5MjU0NTkxLCJleHAiOjIwODQ2MTQ1OTEsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.jkd7pvYvDuZifs02cvhxSH6G18lhlqefJjQ-RAediHc';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };