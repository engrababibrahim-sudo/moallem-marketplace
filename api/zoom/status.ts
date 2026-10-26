
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

function getEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(`Missing environment variable: ${names[0]}`);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "يجب تسجيل الدخول أولًا",
      });
    }

    const supabase = createClient(
      getEnv("SUPABASE_URL", "VITE_SUPABASE_URL"),
      getEnv(
        "SUPABASE_PUBLISHABLE_KEY",
        "VITE_SUPABASE_PUBLISHABLE_KEY",
        "SUPABASE_ANON_KEY",
        "VITE_SUPABASE_ANON_KEY"
      ),
      {
        global: {
          headers: { Authorization: authorization },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({
        error: "انتهت جلسة الدخول. سجّلي الدخول مرة أخرى.",
      });
    }

    const { data, error } = await supabase
      .from("teacher_zoom_connections")
      .select(
        "zoom_email, token_expires_at, updated_at"
      )
      .eq("teacher_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Zoom status database error:", error);

      return res.status(500).json({
        error: "تعذر التحقق من حالة ربط Zoom",
      });
    }

    return res.status(200).json({
      connected: Boolean(data),
      zoomEmail: data?.zoom_email ?? null,
      tokenExpiresAt: data?.token_expires_at ?? null,
      updatedAt: data?.updated_at ?? null,
    });
  } catch (error) {
    console.error("Zoom status error:", error);

    return res.status(500).json({
      error: "حدث خطأ أثناء فحص ربط Zoom",
    });
  }
}
