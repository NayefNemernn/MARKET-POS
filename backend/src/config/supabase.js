import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is missing in .env");
}

if (!supabaseKey) {
  throw new Error("SUPABASE_SERVICE_KEY is missing in .env");
}

// Pass ws transport so supabase-js works on Node 18 (no native WebSocket)
const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: ws },
});

export default supabase;