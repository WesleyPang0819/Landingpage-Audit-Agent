import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// 从 Supabase Edge Function 环境变量读取 (在 Supabase Dashboard > Edge Functions > Secrets 配置)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
// 你的接收邮箱（从环境变量读取）
const MY_EMAIL = Deno.env.get('MY_EMAIL');
// 你的发送域名邮箱（必须在 Resend 验证过，或者使用默认的 onboarding@resend.dev）
const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'onboarding@resend.dev';

serve(async (req) => {
  // CORS 跨域头配置
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 检查必要的环境变量
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY 环境变量未配置，请在 Supabase Dashboard > Edge Functions > Secrets 中设置');
    }
    if (!MY_EMAIL) {
      throw new Error('MY_EMAIL 环境变量未配置，请在 Supabase Dashboard > Edge Functions > Secrets 中设置');
    }

    const { name, email, phone } = await req.json()
    console.log(`收到发送邮件请求，用户: ${name}, 邮箱: ${email}`);

    // 1. 发送邮件给「你」
    const adminRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Landingpage Audit Agent <${SENDER_EMAIL}>`,
        to: [MY_EMAIL],
        subject: '🎉 新的潜在客户 (New Lead)',
        html: `<h2>收到新线索</h2><p><strong>姓名:</strong> ${name}</p><p><strong>邮箱:</strong> ${email}</p><p><strong>电话:</strong> ${phone}</p>`,
      }),
    });
    
    const adminData = await adminRes.json();
    console.log('给管理员发送的结果:', adminData);

    // 2. 发送确认邮件给「用户」
    const userRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Landingpage Audit Agent <${SENDER_EMAIL}>`,
        to: [email],
        subject: 'We received your request!',
        html: `<p>Hi ${name},</p><p>Thank you for your request. We will get back to you shortly.</p>`,
      }),
    });
    
    const userData = await userRes.json();
    console.log('给用户发送的结果:', userData);

    // 如果任何一个发送失败，抛出明确的错误
    if (!adminRes.ok || !userRes.ok) {
      throw new Error(`Resend 报错: ${JSON.stringify(adminData || userData)}`);
    }

    return new Response(JSON.stringify({ success: true, adminData, userData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('云函数发生严重错误:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
