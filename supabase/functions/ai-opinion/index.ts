// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const authHeader = req.headers.get("Authorization") ?? ""
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const s = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await s.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      })
    }
  } catch (_) {
    // If project env vars are not present locally, we still allow for now
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }

  const items = body?.items
  if (!items?.top?.image_url || !items?.bottom?.image_url || !items?.shoes?.image_url) {
    return new Response(JSON.stringify({ error: "Missing required images" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }

  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }

  const content: any[] = [
    { type: "text", text: "Act as a professional fashion stylist. Evaluate the outfit for cohesion, color harmony, season appropriateness, and style. Return strict JSON: { rating: 0-100, summary: <=60 words, pros: string[<=3], cons: string[<=3], suggestions: string[<=3] }. Be concise." },
    { type: "text", text: `Top: ${items.top.color || ""} ${items.top.type || "top"}` },
    { type: "image_url", image_url: { url: items.top.image_url } },
    { type: "text", text: `Bottom: ${items.bottom.color || ""} ${items.bottom.type || "bottom"}` },
    { type: "image_url", image_url: { url: items.bottom.image_url } },
    { type: "text", text: `Shoes: ${items.shoes.color || ""} ${items.shoes.type || "shoes"}` },
    { type: "image_url", image_url: { url: items.shoes.image_url } },
  ]
  if (items.accessory?.image_url) {
    content.push(
      { type: "text", text: `Accessory: ${items.accessory.color || ""} ${items.accessory.type || "accessory"}` },
      { type: "image_url", image_url: { url: items.accessory.image_url } },
    )
  }

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are a top-tier fashion stylist." },
          { role: "user", content },
        ],
      }),
    })
    if (!openaiRes.ok) {
      const text = await openaiRes.text()
      return new Response(JSON.stringify({ error: "OpenAI error", details: text }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      })
    }
    const data = await openaiRes.json()
    const contentStr: string = data?.choices?.[0]?.message?.content ?? "{}"
    let parsed: unknown
    try {
      parsed = JSON.parse(contentStr)
    } catch {
      parsed = { summary: contentStr }
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unhandled error", details: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }
})



