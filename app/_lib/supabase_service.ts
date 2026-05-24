import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function broadcastPresent(sessionId: string, url: string): void {
  supabase
    .channel(`lyric_present_${sessionId}`)
    .send({ type: "broadcast", event: "present", payload: { url } });
}

export { supabase };
