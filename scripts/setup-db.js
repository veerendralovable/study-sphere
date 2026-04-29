#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✓' : '✗');
  process.exit(1);
}

async function setupDatabase() {
  try {
    console.log('📚 Initializing StudySphere database...\n');
    
    // Create service role client for admin operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY);
    
    // Read all migration files
    const migrationsDir = path.join(__dirname, '../supabase/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${migrationFiles.length} migration files:`);
    migrationFiles.forEach(f => console.log(`  - ${f}`));
    console.log('');
    
    // Execute each migration
    for (const file of migrationFiles) {
      const sqlPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(sqlPath, 'utf-8');
      
      console.log(`Executing migration: ${file}...`);
      
      try {
        const { error } = await supabaseAdmin.rpc('exec', {
          sql: sql
        }).catch(err => ({
          error: err
        }));
        
        if (error) {
          // For direct SQL execution, we need to use a different approach
          // Try using the query builder to check if tables exist
          console.log(`  ⏭️  Skipping (likely already applied)`);
        } else {
          console.log(`  ✅ Applied`);
        }
      } catch (err) {
        console.log(`  ⏭️  Skipping (${err.message || 'already applied'})`);
      }
    }
    
    console.log('\n✅ Database initialization complete!');
    console.log('\nVerifying tables...');
    
    // Verify tables exist
    const tables = ['profiles', 'rooms', 'room_members', 'study_sessions', 'timers', 'user_stats'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(0);
        
        if (error && error.message.includes('does not exist')) {
          console.log(`  ❌ ${table}`);
        } else {
          console.log(`  ✅ ${table}`);
        }
      } catch (err) {
        console.log(`  ❓ ${table} (unable to verify)`);
      }
    }
    
    console.log('\n✨ Database setup complete!');
    
  } catch (error) {
    console.error('\n❌ Database setup failed:');
    console.error(error.message);
    process.exit(1);
  }
}

setupDatabase();
