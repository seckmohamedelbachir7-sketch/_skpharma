// config.js — Initialisation Supabase & variables globales

// ============================================================
// CONFIGURATION SUPABASE — Remplacez par vos identifiants
// ============================================================
const SUPABASE_URL = 'https://bupaadufyikswuaeeazd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1cGFhZHVmeWlrc3d1YWVlYXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzQyNjcsImV4cCI6MjA5MDYxMDI2N30.wG1uM0vTwCy-KqIhDkryH8AIIhJehNjsvi_VQHlKODw';
// ============================================================

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let currentPatient = null;
let allPatients = [];

// ---- AUTH ----
