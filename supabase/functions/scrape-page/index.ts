import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── 辅助：清除 HTML 标签，提取纯文字 ──────────────────────────
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── 辅助：提取第一个标签内容 ──────────────────────────────────
function extractFirst(html: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = html.match(re)
  if (!match) return ''
  return stripHtml(match[1]).trim()
}

// ── 辅助：提取所有按钮文字 ─────────────────────────────────────
function extractButtons(html: string): string[] {
  const results: string[] = []
  
  // 1. <button>
  const btnRe = /<button[^>]*>([\s\S]*?)<\/button>/gi
  let m
  while ((m = btnRe.exec(html)) !== null) {
    const txt = stripHtml(m[1]).trim()
    if (txt.length > 0 && txt.length < 80) results.push(txt)
  }
  
  // 2. input[type=submit] or input[type=button]
  const inputRe = /<input[^>]*type=["'](submit|button)["'][^>]*value=["']([^"']+)["']/gi
  while ((m = inputRe.exec(html)) !== null) {
    results.push(m[2].trim())
  }
  
  // 3. <a> if it looks like a CTA/button
  // Using class names like 'btn', 'button', 'cta', or inline style
  // or text content that typically represents CTA
  const aRe = /<a[^>]*>([\s\S]*?)<\/a>/gi
  const ctaKeywords = /get|start|buy|download|free|join|book|dapatkan|mula|beli|daftar|register|sign up|subscribe|try|claim|grab/i
  while ((m = aRe.exec(html)) !== null) {
    const rawTag = m[0]
    const txt = stripHtml(m[1]).trim()
    if (txt.length > 0 && txt.length < 80) {
      if (/class=["'][^"']*(btn|button|cta)[^"']*["']/i.test(rawTag) || ctaKeywords.test(txt)) {
        results.push(txt)
      }
    }
  }
  
  return results
}

// ── 辅助：统计 CTA 按钮数量 ────────────────────────────────────
function countCTA(buttons: string[]): number {
  const ctaKeywords = /get|start|buy|download|free|join|book|dapatkan|mula|beli|daftar|register|sign up|subscribe|try|claim|grab/i
  return buttons.filter(b => ctaKeywords.test(b)).length
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: '缺少 url 参数' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // ── 抓取页面 ───────────────────────────────────────────────
    let html = ''
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuditBot/1.0)' },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      html = await res.text()
    } catch (e) {
      return new Response(
        JSON.stringify({ success: false, error: '无法抓取页面，请检查 URL 是否正确' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const lowerHtml = html.toLowerCase()
    const visibleText = stripHtml(html).toLowerCase()

    // ── 提取各字段 ────────────────────────────────────────────
    const h1 = extractFirst(html, 'h1')
    const h2 = extractFirst(html, 'h2')
    const buttons = extractButtons(html)
    const ctaCount = countCTA(buttons)

    // Meta description
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i)
    const metaDescription = metaMatch ? metaMatch[1].trim() : ''

    // Page title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const pageTitle = titleMatch ? stripHtml(titleMatch[1]).trim() : ''

    // 布尔检测
    const hasForm = /<form[\s>]/i.test(html)
    const hasNav = /<nav[\s>]/i.test(html)
    const hasImages = /<img[\s>]/i.test(html)

    const hasGuarantee = /guarantee|refund|money.?back|jamin|pulang wang|wang balik|no risk|risk.?free/i.test(visibleText)
    const hasTestimonial = /testimonial|review|customer|client|★|⭐|said|feedback|rating|bintang|pelanggan/i.test(visibleText)
    const hasPricing = /price|pricing|\brm\b|usd|\$|myr|harga|bayaran|payment|per month|per year|subscribe/i.test(visibleText)

    // 字数统计
    const wordCount = visibleText.split(/\s+/).filter(w => w.length > 1).length

    const data = {
      h1,
      h2,
      buttons: buttons.slice(0, 10),
      metaDescription,
      pageTitle,
      hasForm,
      hasGuarantee,
      hasTestimonial,
      hasPricing,
      wordCount,
      hasNav,
      hasImages,
      ctaCount,
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('scrape-page 错误:', error)
    return new Response(
      JSON.stringify({ success: false, error: '服务器内部错误' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
