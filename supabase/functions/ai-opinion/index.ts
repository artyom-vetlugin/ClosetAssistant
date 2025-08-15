// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { encode as b64encode } from "https://deno.land/std@0.224.0/encoding/base64.ts"

const OPENAI_API_KEY = (globalThis as any).Deno?.env?.get("OPENAI_API_KEY")

function buildCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "*"
  const reqHeaders = req.headers.get("Access-Control-Request-Headers") ?? "authorization, x-client-info, apikey, content-type"
  return {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": reqHeaders,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true",
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: buildCorsHeaders(req) })
  }

  const authHeader = req.headers.get("Authorization") ?? ""
  try {
    const supabaseUrl = (globalThis as any).Deno?.env?.get("SUPABASE_URL")
    const supabaseAnonKey = (globalThis as any).Deno?.env?.get("SUPABASE_ANON_KEY")
    if (!supabaseUrl || !supabaseAnonKey) throw new Error("Missing Supabase env vars")
    const s = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await s.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...buildCorsHeaders(req) },
      })
    }
  } catch {
    // If project env vars are not present locally, we still allow for now
  }

  type ItemInput = { image_url: string; color?: string; type?: string }
  type BodyInput = { items?: { top?: ItemInput; bottom?: ItemInput; shoes?: ItemInput; accessory?: ItemInput | null } }
  let body: BodyInput
  try {
    body = await req.json() as BodyInput
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...buildCorsHeaders(req) },
    })
  }

  const items = body?.items
  if (!items?.top?.image_url || !items?.bottom?.image_url || !items?.shoes?.image_url) {
    return new Response(JSON.stringify({ error: "Missing required images" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...buildCorsHeaders(req) },
    })
  }

  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...buildCorsHeaders(req) },
    })
  }

  // Fetch images server-side and send to OpenAI as base64 data URLs to avoid external fetch timeouts
  async function toDataUrl(url: string): Promise<string> {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)
    const contentType = res.headers.get("content-type") || "image/jpeg"
    const bytes = new Uint8Array(await res.arrayBuffer())
    const b64 = b64encode(bytes)
    return `data:${contentType};base64,${b64}`
  }

  let topData: string
  let bottomData: string
  let shoesData: string
  let accData: string | null = null
  try {
    const results = await Promise.all([
      toDataUrl(items.top.image_url),
      toDataUrl(items.bottom.image_url),
      toDataUrl(items.shoes.image_url),
      items.accessory?.image_url ? toDataUrl(items.accessory.image_url) : Promise.resolve(null),
    ])
    topData = results[0] as string
    bottomData = results[1] as string
    shoesData = results[2] as string
    accData = results[3] as string | null
  } catch (e) {
    return new Response(JSON.stringify({ error: "Image fetch failed", details: String(e) }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...buildCorsHeaders(req) },
    })
  }

  const content: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
    { type: "text", text: "Act as a professional fashion stylist. Evaluate the outfit for cohesion, color harmony, season appropriateness, and style. Return strict JSON: { rating: 0-100, summary: <=60 words, pros: string[<=3], cons: string[<=3], suggestions: string[<=3] }. Be concise." },
    { type: "text", text: `Top: ${items.top.color || ""} ${items.top.type || "top"}` },
    { type: "image_url", image_url: { url: topData } },
    { type: "text", text: `Bottom: ${items.bottom.color || ""} ${items.bottom.type || "bottom"}` },
    { type: "image_url", image_url: { url: bottomData } },
    { type: "text", text: `Shoes: ${items.shoes.color || ""} ${items.shoes.type || "shoes"}` },
    { type: "image_url", image_url: { url: shoesData } },
  ]
  if (accData) {
    content.push(
      { type: "text", text: `Accessory: ${items.accessory?.color || ""} ${items.accessory?.type || "accessory"}` },
      { type: "image_url", image_url: { url: accData } },
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
        headers: { "Content-Type": "application/json", ...buildCorsHeaders(req) },
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
      headers: { "Content-Type": "application/json", ...buildCorsHeaders(req) },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unhandled error", details: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...buildCorsHeaders(req) },
    })
  }
})



