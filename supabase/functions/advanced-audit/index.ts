import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

// Set OPENAI_API_KEY in Supabase Dashboard > Edge Functions > Secrets
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? "";
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? "";

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured.');
    }

    // 1. Authenticate User
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Authentication required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid session' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    // 2. Check Member Profile (VIP Gate)
    const { data: member, error: memberError } = await supabaseClient
      .from('members')
      .select('plan, status')
      .eq('id', user.id)
      .single();

    if (memberError || !member) {
      return new Response(JSON.stringify({ success: false, error: 'Member profile not found. Please log in again.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      });
    }

    if (member.status === 'blocked') {
      return new Response(JSON.stringify({ success: false, error: 'ACCOUNT_BLOCKED' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      });
    }

    if (member.plan !== 'vip') {
      return new Response(JSON.stringify({ success: false, error: 'VIP_REQUIRED' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      });
    }

    // 3. Process Request
    const { url, goal, audience, lang } = await req.json();
    const isEn = lang === 'en';

    const systemPrompt = `You are a world-class CRO (Conversion Rate Optimization) consultant with 15 years of experience auditing high-converting landing pages. You provide specific, actionable, and commercially-focused recommendations. Always return valid JSON only — no markdown, no code blocks, no extra text.`;

    const userPrompt = `Perform a deep advanced CRO audit for this landing page.

URL: ${url}
Goal: ${goal}
Target Audience: ${audience}
Response Language: ${isEn ? 'English' : 'Chinese (Simplified)'}

Return ONLY a raw JSON object with this exact structure (no markdown, no backticks):

{
  "copyRewrites": {
    "headline": "A compelling rewritten H1 headline (max 12 words)",
    "subheadline": "A rewritten subheadline that supports the headline (1-2 sentences)",
    "cta": "High-converting CTA button text (3-6 words)",
    "bodyHook": "A rewritten opening paragraph that immediately hooks the target audience"
  },
  "ctaImprovements": [
    "Specific CTA improvement 1",
    "Specific CTA improvement 2",
    "Specific CTA improvement 3",
    "Specific CTA improvement 4"
  ],
  "offerClarity": {
    "currentProblem": "What is wrong with the current offer presentation (1-2 sentences)",
    "diagnosis": "Deep root cause diagnosis of the offer clarity issue",
    "recommendation": "Specific actionable recommendation to improve offer clarity and perceived value"
  },
  "trustObjectionMap": [
    { "objection": "Top objection 1 the visitor has", "response": "How to address this objection on the page with specific copy or element" },
    { "objection": "Top objection 2", "response": "Specific response strategy" },
    { "objection": "Top objection 3", "response": "Specific response strategy" },
    { "objection": "Top objection 4", "response": "Specific response strategy" }
  ],
  "visualHierarchyFeedback": {
    "score": 65,
    "mainIssue": "The single biggest visual hierarchy problem on this page",
    "recommendations": [
      "Visual recommendation 1",
      "Visual recommendation 2",
      "Visual recommendation 3"
    ]
  },
  "sevenDayPlan": [
    { "day": 1, "focus": "Quick Wins", "action": "Specific action to take on day 1" },
    { "day": 2, "focus": "Headline & Hero", "action": "Specific action" },
    { "day": 3, "focus": "CTA & Offer", "action": "Specific action" },
    { "day": 4, "focus": "Trust & Proof", "action": "Specific action" },
    { "day": 5, "focus": "Objection Handling", "action": "Specific action" },
    { "day": 6, "focus": "Mobile UX", "action": "Specific action" },
    { "day": 7, "focus": "A/B Test Setup", "action": "Specific action" }
  ]
}

Be specific, commercially-focused, and tailored to the goal "${goal}" targeting "${audience}".`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_completion_tokens: 2500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openaiRes.ok) {
      const errData = await openaiRes.text();
      console.error(`OpenAI API error (${openaiRes.status}):`, errData);
      throw new Error(`OpenAI error: ${errData}`);
    }

    const openaiData = await openaiRes.json();
    const content = openaiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    let advancedReport;
    try {
      advancedReport = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        advancedReport = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse OpenAI response as JSON');
      }
    }

    console.log('Advanced audit completed successfully for:', url);

    return new Response(JSON.stringify({ success: true, report: advancedReport }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Advanced audit error:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
})
