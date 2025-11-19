import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const commands = {
  async list() {
    console.log('\n📊 Nikufra Platform Database Summary\n');

    const tables = [
      'profiles',
      'companies',
      'contacts',
      'leads',
      'deals',
      'projects',
      'tasks',
      'documents',
      'calendar_events',
      'activities'
    ];

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`❌ ${table}: Error - ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${count || 0} records`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    console.log('\n');
  },

  async help() {
    console.log(`
Nikufra CLI Tool

Usage: node ./scripts/nikufra.mjs <command>

Commands:
  list        List all tables and record counts
  help        Show this help message

Examples:
  node ./scripts/nikufra.mjs list
  node ./scripts/nikufra.mjs help
    `);
  }
};

const command = process.argv[2] || 'help';

if (commands[command]) {
  commands[command]();
} else {
  console.error(`Unknown command: ${command}`);
  commands.help();
  process.exit(1);
}
