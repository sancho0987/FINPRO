'use strict';
const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

function createSupabase(accessToken) {
  if (!config.supabaseUrl || !config.supabaseAnonKey) throw new Error('Supabase no está configurado.');
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers },
  });
}

const publicClient = () => createSupabase();
module.exports = { createSupabase, publicClient };
