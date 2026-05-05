// ============================================================
//  expertAudit.js  —  Logic-Based Scoring Engine
//  Version 2.0: Real rule-based scoring, no hardcoded values
// ============================================================

// ── Helpers ──────────────────────────────────────────────────

/** Clamp a number between min and max */
const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));

/**
 * Derive signals from the URL string alone (no network call).
 * Returns an object of boolean/string flags that scoring rules use.
 */
const deriveUrlSignals = (url = '') => {
  const raw = url.toLowerCase();

  // Domain / path clues
  const hasBlog       = /blog|article|post|news/.test(raw);
  const hasShop       = /shop|store|product|buy|cart|checkout|ecommerce/.test(raw);
  const hasSaas       = /app\.|dashboard|software|platform|saas|tool/.test(raw);
  const hasAgency     = /agency|studio|creative|design|marketing/.test(raw);
  const hasConsult    = /consult|coach|mentor|expert|advisor|book|call/.test(raw);
  const hasLead       = /lead|free|download|guide|checklist|ebook|webinar/.test(raw);
  const isLocalBiz    = /restaurant|salon|clinic|dentist|gym|spa|local/.test(raw);

  // Tech signals (cheap proxies for page quality)
  const hasHttps      = raw.startsWith('https');
  const hasWww        = raw.includes('www.');
  const hasSubdomain  = (raw.replace('https://', '').replace('http://', '').match(/\./g) || []).length >= 2;
  const hasDashInDomain = /\.[a-z]+-[a-z]+\.(com|io|co)/.test(raw);
  const isLongUrl     = url.length > 60;
  const hasQuery      = raw.includes('?') || raw.includes('&');

  // TLD trust signals
  const isComTld      = /\.(com|io|co|net)$/.test(raw.split('/')[0].split('?')[0]);
  const isCountryTld  = /\.(my|sg|uk|au|ca|de|fr)$/.test(raw.split('/')[0]);

  return {
    hasBlog, hasShop, hasSaas, hasAgency, hasConsult, hasLead, isLocalBiz,
    hasHttps, hasWww, hasSubdomain, hasDashInDomain, isLongUrl, hasQuery,
    isComTld, isCountryTld
  };
};

/**
 * Derive signals from goal string.
 */
const deriveGoalSignals = (goal = '') => {
  const g = goal.toLowerCase();
  return {
    isLeadGen:    /lead|download|free|webinar|checklist|ebook/.test(g),
    isSales:      /sell|product|buy|purchase|sale|ecommerce/.test(g),
    isBooking:    /book|call|appointment|consult|schedule/.test(g),
    isRegistration: /register|sign.?up|webinar|event/.test(g),
    isGeneric:    g.length < 6 || /general|other|misc/.test(g)
  };
};

/**
 * Derive signals from audience string.
 */
const deriveAudienceSignals = (audience = '') => {
  const a = audience.toLowerCase();
  const defined    = a.length > 3;
  const isBizOwner = /owner|founder|ceo|entrepreneur|startup|business/.test(a);
  const isConsumer = /parent|mom|dad|person|people|adult|senior|teen/.test(a);
  const isProf     = /manager|marketer|designer|developer|engineer|doctor|lawyer/.test(a);
  const isBroad    = /everyone|anybody|all|general/.test(a) || !defined;
  return { defined, isBizOwner, isConsumer, isProf, isBroad };
};

// ── Individual Module Scorers ────────────────────────────────

const scoreAboveTheFold = (urlSig, goalSig, audSig) => {
  let score = 50; // neutral start

  // Positive signals
  if (urlSig.hasHttps)     score += 5;  // HTTPS → basic credibility
  if (audSig.defined)      score += 8;  // Defined audience → likely more targeted
  if (!goalSig.isGeneric)  score += 7;  // Clear goal → likely clearer page
  if (urlSig.hasSaas)      score += 5;  // SaaS landing pages typically invest in copy
  if (urlSig.isComTld)     score += 3;

  // Negative signals
  if (audSig.isBroad)      score -= 10; // Vague audience → vague headline
  if (goalSig.isGeneric)   score -= 8;  // Unclear goal
  if (urlSig.hasBlog)      score -= 12; // Blog pages, not landing pages
  if (urlSig.hasQuery)     score -= 5;  // Dynamic URL → often not optimized
  if (urlSig.hasDashInDomain) score -= 5;
  if (urlSig.isLongUrl)    score -= 3;

  return clamp(score);
};

const scoreCta = (urlSig, goalSig, audSig) => {
  let score = 50;

  if (goalSig.isSales)      score += 10; // Sales pages usually have stronger CTAs
  if (goalSig.isBooking)    score += 8;
  if (goalSig.isLeadGen)    score += 6;
  if (urlSig.hasSaas)       score += 8;
  if (urlSig.hasShop)       score += 5;
  if (audSig.defined)       score += 5;

  if (audSig.isBroad)       score -= 10;
  if (goalSig.isGeneric)    score -= 12;
  if (urlSig.hasBlog)       score -= 15; // Blogs rarely have strong conversion CTAs
  if (urlSig.isLocalBiz)    score -= 8;
  if (urlSig.hasQuery)      score -= 5;

  return clamp(score);
};

const scoreOfferClarity = (urlSig, goalSig, audSig) => {
  let score = 45;

  if (goalSig.isSales)       score += 12;
  if (goalSig.isLeadGen)     score += 10;
  if (goalSig.isBooking)     score += 8;
  if (audSig.defined)        score += 10;
  if (audSig.isBizOwner)     score += 5;
  if (urlSig.hasSaas)        score += 8;
  if (urlSig.hasShop)        score += 8;

  if (audSig.isBroad)        score -= 15;
  if (goalSig.isGeneric)     score -= 15;
  if (urlSig.hasBlog)        score -= 10;
  if (urlSig.isLocalBiz)     score -= 5;

  return clamp(score);
};

const scoreCopywriting = (urlSig, goalSig, audSig) => {
  let score = 48;

  if (audSig.defined)        score += 10; // Knowing your audience → better copy
  if (audSig.isBizOwner)     score += 5;
  if (audSig.isProf)         score += 5;
  if (goalSig.isSales)       score += 8;
  if (urlSig.hasSaas)        score += 6;
  if (urlSig.hasConsult)     score += 5;

  if (audSig.isBroad)        score -= 12;
  if (goalSig.isGeneric)     score -= 10;
  if (urlSig.hasBlog)        score -= 8;
  if (urlSig.isLocalBiz)     score -= 8;
  if (urlSig.hasDashInDomain) score -= 4;

  return clamp(score);
};

const scorePageStructure = (urlSig, goalSig, audSig) => {
  let score = 42;

  if (goalSig.isSales)       score += 12;
  if (goalSig.isLeadGen)     score += 10;
  if (goalSig.isBooking)     score += 8;
  if (goalSig.isRegistration) score += 6;
  if (urlSig.hasSaas)        score += 10;
  if (audSig.defined)        score += 6;

  if (urlSig.hasBlog)        score -= 18; // Blogs have article structure, not LP
  if (goalSig.isGeneric)     score -= 12;
  if (audSig.isBroad)        score -= 8;
  if (urlSig.isLocalBiz)     score -= 10;
  if (urlSig.hasQuery)       score -= 5;

  return clamp(score);
};

const scoreTrustProof = (urlSig, goalSig, audSig) => {
  let score = 35;

  if (urlSig.hasSaas)        score += 12; // SaaS sites typically invest in trust
  if (urlSig.hasShop)        score += 8;
  if (urlSig.hasConsult)     score += 8;
  if (urlSig.hasAgency)      score += 10;
  if (audSig.isBizOwner)     score += 8;
  if (urlSig.isComTld)       score += 4;
  if (urlSig.isCountryTld)   score += 3;

  if (audSig.isBroad)        score -= 8;
  if (goalSig.isGeneric)     score -= 8;
  if (urlSig.hasBlog)        score -= 10;
  if (!urlSig.hasHttps)      score -= 15; // No HTTPS = serious trust issue
  if (urlSig.hasDashInDomain) score -= 5;

  return clamp(score);
};

const scoreFaqObjections = (urlSig, goalSig, audSig) => {
  let score = 30;

  if (goalSig.isSales)       score += 15;
  if (goalSig.isBooking)     score += 12;
  if (goalSig.isLeadGen)     score += 8;
  if (audSig.isBizOwner)     score += 10;
  if (audSig.isProf)         score += 8;
  if (urlSig.hasSaas)        score += 8;

  if (audSig.isBroad)        score -= 10;
  if (goalSig.isGeneric)     score -= 12;
  if (urlSig.hasBlog)        score -= 10;
  if (urlSig.isLocalBiz)     score -= 8;

  return clamp(score);
};

const scoreVisualHierarchy = (urlSig, goalSig, audSig) => {
  let score = 55; // visual quality harder to infer, start higher

  if (urlSig.hasSaas)        score += 10;
  if (urlSig.hasAgency)      score += 8;
  if (urlSig.hasShop)        score += 5;
  if (urlSig.hasConsult)     score += 5;
  if (audSig.isBizOwner)     score += 5;
  if (urlSig.isComTld)       score += 3;

  if (urlSig.isLocalBiz)     score -= 10;
  if (urlSig.hasDashInDomain) score -= 8;
  if (!urlSig.hasHttps)      score -= 5;
  if (urlSig.hasQuery)       score -= 5;
  if (audSig.isBroad)        score -= 5;

  return clamp(score);
};

const scoreMobileExperience = (urlSig, goalSig, audSig) => {
  let score = 60;

  if (urlSig.hasHttps)       score += 5;
  if (urlSig.hasSaas)        score += 8;
  if (urlSig.hasShop)        score += 5;
  if (urlSig.isComTld)       score += 3;

  if (urlSig.isLocalBiz)     score -= 10;
  if (urlSig.hasDashInDomain) score -= 8;
  if (!urlSig.hasHttps)      score -= 10;
  if (urlSig.hasQuery)       score -= 5;

  return clamp(score);
};

// ── Content Generators (goal + audience aware) ───────────────

const getOverallDiagnosis = (finalScore, urlSig, goalSig, audSig, isEn, aud) => {
  if (finalScore >= 72) {
    return {
      category: isEn ? "Solid Foundation, Optimization Needed" : "基础扎实，需要精细打磨",
      diagnosis: isEn
        ? `The page has a decent structure and clear intent for ${aud}. The priority is refining CTA copy, strengthening social proof, and improving above-the-fold specificity.`
        : `页面整体框架尚可，针对【${aud}】的意图比较清晰。优先任务是打磨 CTA 文案、强化社会证明，以及让首屏内容更加具体精准。`
    };
  }
  if (finalScore >= 55) {
    return {
      category: isEn ? "Clarity & Trust Problem" : "清晰度与信任度问题",
      diagnosis: isEn
        ? `The page has potential but suffers from vague messaging and insufficient trust signals for ${aud}. Visitors can't quickly understand the value or feel safe enough to act.`
        : `页面有潜力，但针对【${aud}】的信息传递模糊，信任信号不足。访客无法快速理解价值，也缺乏足够的安全感来采取行动。`
    };
  }
  return {
    category: isEn ? "Fundamental Conversion Architecture Issue" : "转化架构根本性问题",
    diagnosis: isEn
      ? `The page is missing core conversion elements for ${aud}. It reads like a generic brochure rather than a targeted landing page. A structural overhaul is needed before any design tweaks.`
      : `页面对【${aud}】缺少核心转化要素，更像一份通用宣传册而非针对性落地页。在做任何设计调整之前，需要先进行结构性改造。`
  };
};

const getExecutiveSummary = (scores, urlSig, goalSig, audSig, isEn, aud, domain) => {
  const weakest = Object.entries(scores).sort((a, b) => a[1] - b[1]).slice(0, 2).map(e => e[0]);

  const problemMap = {
    atf:       isEn ? `Visitors cannot understand what ${domain} does for ${aud} within the first 5 seconds.` : `访客在 5 秒内无法理解 ${domain} 能为【${aud}】解决什么问题。`,
    cta:       isEn ? `The call-to-action is weak or buried, leaving ${aud} without a clear next step.` : `行动号召按钮（CTA）力度弱或位置隐蔽，让【${aud}】不知道该怎么做。`,
    offer:     isEn ? `The offer is unclear — ${aud} can't tell what exactly they'll get.` : `Offer 不清晰，【${aud}】搞不清楚自己究竟能得到什么。`,
    copy:      isEn ? `The copywriting is too feature-focused and doesn't speak to ${aud}'s pain points.` : `文案过于以产品为中心，没有戳中【${aud}】的真实痛点。`,
    structure: isEn ? `The page structure is disorganized, making it hard for ${aud} to follow the conversion journey.` : `页面结构混乱，让【${aud}】难以跟上从认知到决策的完整旅程。`,
    trust:     isEn ? `There is insufficient social proof and trust signals to convince ${aud} to act.` : `缺乏足够的社会证明和信任信号来说服【${aud}】采取行动。`,
    faq:       isEn ? `Key objections from ${aud} are unaddressed, causing hesitation at the conversion point.` : `【${aud}】的核心疑虑没有被解答，导致在决策临门一脚时放弃。`,
  };

  const problem = problemMap[weakest[0]] || problemMap.copy;

  const priorities = isEn ? [
    "Rewrite the hero headline to be outcome-specific for your audience.",
    "Add clear risk-reversal (guarantee) directly next to the CTA button.",
    "Restructure the page: problem first, then solution, then proof, then CTA."
  ] : [
    "重写首屏大标题，直接点明你的受众能获得的核心结果。",
    "在所有 CTA 按钮旁加上清晰的风险逆转承诺（如退款保证）。",
    "重构页面顺序：先讲痛点 → 再介绍方案 → 展示证明 → 最后 CTA。"
  ];

  const impactMap = {
    isLeadGen:    isEn ? `Lead form submissions are likely low because ${aud} sees no clear reason to trust or submit.` : `表单提交率很低，因为【${aud}】看不到足够的理由去信任并填写。`,
    isSales:      isEn ? `Purchase conversion is suffering because ${aud} is not convinced of the value or security.` : `购买转化率受损，因为【${aud}】对价值和安全感都没有信心。`,
    isBooking:    isEn ? `Booking rates are low because ${aud} can't visualize the outcome of the call/appointment.` : `预约率很低，因为【${aud}】无法清晰想象通话/预约的结果。`,
    isGeneric:    isEn ? `Without a clear goal, the page is pulling visitors in multiple directions, reducing all conversions.` : `目标不明确导致页面拉扯访客向多个方向，所有转化率都在受损。`,
  };

  const goalKey = goalSig.isLeadGen ? 'isLeadGen' : goalSig.isSales ? 'isSales' : goalSig.isBooking ? 'isBooking' : 'isGeneric';
  const impact = impactMap[goalKey];

  return { problem, impact, priorities };
};

const getAboveTheFoldContent = (score, urlSig, goalSig, audSig, isEn, aud, domain) => {
  const highScore = score >= 70;
  const midScore  = score >= 50 && score < 70;

  return {
    headlineProblem: highScore
      ? (isEn ? "Headline is relatively clear but could be more outcome-specific." : "标题尚可，但可以更直接地指向具体成果。")
      : midScore
        ? (isEn ? "Headline is too vague — doesn't tell visitors what they'll achieve." : "标题太模糊，访客不知道他们能得到什么。")
        : (isEn ? "Headline is confusing or generic — fails the 5-second clarity test." : "标题令人困惑或过于通用，未能通过黄金 5 秒清晰度测试。"),

    subheadlineProblem: highScore
      ? (isEn ? "Subheadline supports the headline but lacks a measurable result or timeframe." : "副标题支撑了主标题，但缺少可衡量的结果或时间节点。")
      : (isEn ? "Subheadline either repeats the headline or adds no extra value or specificity." : "副标题要么在重复主标题，要么没有增加任何具体的价值信息。"),

    fiveSecondDiagnosis: highScore
      ? (isEn ? `Visitors likely understand the core offer, but may still need to scroll to find social proof.` : `访客大概能理解核心 Offer，但可能仍需滚动才能找到社会证明。`)
      : (isEn ? `Visitors cannot figure out what ${domain} does for ${aud} within the first 5 seconds. High bounce risk.` : `访客无法在 5 秒内搞懂 ${domain} 能为【${aud}】做什么。跳出风险极高。`),

    missingTrust: isEn
      ? "No immediate trust signals (logos, ratings, number of customers) are visible above the fold."
      : "首屏区域没有任何即时信任信号（客户 Logo、评分、用户数量）。",

    whyHurts: isEn
      ? "The hero section determines 80% of your bounce rate. Ambiguity here means visitors leave before seeing your offer."
      : "首屏区决定了 80% 的跳出率。这里的模糊意味着访客在看到你的 Offer 之前就离开了。",

    fix: isEn
      ? `Use this formula: "We help [${aud}] achieve [specific result] without [main pain point] — in [timeframe]."`
      : `使用这个公式重写："我们帮助【${aud}】在 [X 天] 内实现 [具体成果]，彻底告别 [最大痛点]。"`,

    headlineExample: isEn
      ? `Help ${aud} Get [Specific Outcome] Without [The Pain] — Guaranteed`
      : `帮助【${aud}】在 30 天内实现 [核心成果]，彻底告别 [最大痛点]`,

    subheadlineExample: isEn
      ? `Join 1,200+ ${aud} who've already achieved [Result]. Start free — no credit card required.`
      : `已有超过 1,200 名【${aud}】通过我们的方法成功实现了 [结果]。免费开始，无需信用卡。`,

    heroStructure: isEn
      ? "Label → H1 (Outcome) → H2 (How/For Whom) → Primary CTA + Microcopy → Trust Badges"
      : "标签徽章 → 主标题 H1 (结果) → 副标题 H2 (如何/为谁) → 主 CTA + 微文案 → 信任徽章",

    quickFixes: isEn ? [
      `Mention "${aud}" or their key pain point directly in the headline.`,
      "Add 3 recognizable customer logos directly below the hero.",
      "Ensure the CTA button color contrasts sharply against the background.",
      "Add 'No credit card required' directly under the main button.",
      "Remove all top navigation links that lead users away from the page."
    ] : [
      `在大标题里直接提及"${aud}"或他们的核心痛点。`,
      "在首屏下方立刻放上 3 个知名客户 Logo 增强信任。",
      "把 CTA 按钮改成与背景形成极强对比的高亮颜色。",
      "在主按钮正下方加上小字：'完全免费，无需绑定信用卡'。",
      "移除顶部导航的外链，防止用户分心跳出。"
    ]
  };
};

const getCtaContent = (score, urlSig, goalSig, audSig, isEn, aud) => {
  const weak = score < 55;
  return {
    visibility: weak
      ? (isEn ? "CTA button likely blends with the background or is hidden below the fold." : "CTA 按钮可能与背景色混在一起，或者被藏在首屏以下。")
      : (isEn ? "CTA is visible but could be made more prominent with stronger color contrast." : "CTA 可见，但可以通过更强的颜色对比来提升突出度。"),
    copyProblem: weak
      ? (isEn ? "Button copy is likely generic ('Submit', 'Learn More') with no value promise." : "按钮文案很可能是平庸的'提交'或'了解更多'，没有任何价值承诺。")
      : (isEn ? "Button copy is functional but could be more value-driven and action-specific." : "按钮文案功能性尚可，但可以更有价值感，更具体地指向行动结果。"),
    colorContrast: isEn
      ? "Ensure the button color is not used anywhere else on the page — it should be unique."
      : "确保按钮颜色在页面上独一无二，没有被其他元素使用。",
    placement: isEn
      ? "Place a CTA both in the hero section AND repeated after each major proof section."
      : "在首屏放一个 CTA，并在每个主要证明区块之后重复放置 CTA。",
    betterCopy: goalSig.isLeadGen
      ? (isEn ? ["Get My Free Guide", "Download Now — It's Free", "Send Me the Checklist"] : ["立即获取免费指南", "免费下载 — 马上领取", "发给我这份清单"])
      : goalSig.isSales
        ? (isEn ? ["Get Instant Access", "Start My Free Trial", "Claim My Spot Now"] : ["立即解锁", "开始免费试用", "马上抢占名额"])
        : goalSig.isBooking
          ? (isEn ? ["Book My Free Call", "Schedule a Strategy Session", "Reserve My Slot"] : ["预约免费咨询", "预约策略通话", "占位 — 我要预约"])
          : (isEn ? ["Get Started Free", "See How It Works", "Start Today"] : ["免费开始", "了解运作方式", "今天就开始"]),
    microcopy: isEn
      ? "No credit card required. Cancel anytime. 100% secure."
      : "无需信用卡 · 随时可取消 · 100% 安全保障"
  };
};

const getTopLeaks = (scores, isEn, aud) => {
  const all = [
    {
      key: 'atf', title: isEn ? "Vague Hero Headline" : "首屏标题模糊不清",
      wrong: isEn ? "Doesn't state a clear, audience-specific outcome." : "没有点明针对受众的清晰具体成果。",
      hurts: isEn ? "80% of your bounce rate happens in the first 5 seconds." : "80% 的跳出率发生在首屏的黄金 5 秒内。",
      fix: isEn ? `Use the formula: "Help ${aud} get [X] without [pain]."` : `使用公式重写："帮【${aud}】在 X 内实现 [成果]，告别 [痛点]"。`
    },
    {
      key: 'trust', title: isEn ? "Missing Social Proof" : "缺乏社会证明",
      wrong: isEn ? "No quantified testimonials, logos, or case studies near the decision point." : "决策点附近没有量化的客户评价、Logo 或案例研究。",
      hurts: isEn ? "92% of buyers check reviews before converting." : "92% 的买家在转化前会查看真实评价。",
      fix: isEn ? "Add a 'Wall of Love' with specific numbers (e.g. '300% ROI in 30 days')." : "加一面'客户赞誉墙'，包含具体数字（如'30 天内 ROI 提升 300%'）。"
    },
    {
      key: 'cta', title: isEn ? "Weak Call-to-Action" : "无力的行动号召",
      wrong: isEn ? "Generic CTA copy with no sense of value or urgency." : "通用的 CTA 文案，没有价值感或紧迫感。",
      hurts: isEn ? "Visitors feel no compelling reason to click right now." : "访客感受不到立刻点击的理由。",
      fix: isEn ? "Switch to value-based copy: 'Get My Free [Result]' beats 'Submit' every time." : "改成以价值为核心的文案：'立刻获取我的免费 [成果]' 永远胜过 '提交'。"
    },
    {
      key: 'faq', title: isEn ? "Unaddressed Objections" : "未解答的核心疑虑",
      wrong: isEn ? "Common buyer objections are not answered before the CTA." : "常见的购买疑虑没有在 CTA 之前得到回答。",
      hurts: isEn ? "Last-minute anxiety kills conversions at the final step." : "最后一步的焦虑感是最大的转化杀手。",
      fix: isEn ? "Add an FAQ section addressing price, timeline, and 'will it work for me'." : "增加一个 FAQ 区块，解答价格、效果周期和'这适合我吗'三大疑虑。"
    },
    {
      key: 'offer', title: isEn ? "Unclear Offer" : "Offer 不清晰",
      wrong: isEn ? "Visitors can't tell exactly what they'll get, when, and at what cost." : "访客搞不清楚自己将得到什么、什么时候得到、需要付多少代价。",
      hurts: isEn ? "Ambiguity = anxiety = no action." : "模糊 = 焦虑 = 不行动。",
      fix: isEn ? "Write an 'Offer Box': list exactly what's included, the timeline, and the guarantee." : "写一个'Offer 盒子'：精确列出包含内容、效果时间线和保障承诺。"
    }
  ];

  // Sort by score (lowest = biggest leak) and pick top 3-5
  return all
    .sort((a, b) => (scores[a.key] || 50) - (scores[b.key] || 50))
    .slice(0, 5);
};

// ── Main Export ───────────────────────────────────────────────

const getExpertAudit = (goal = '', audience = '', isEn = true, capName = 'Your Website', url = '', pageData = null) => {
  const aud    = audience || (isEn ? 'your target audience' : '目标受众');
  const domain = capName || 'Your Website';

  // 1. Derive signals
  const urlSig  = deriveUrlSignals(url);
  const goalSig = deriveGoalSignals(goal);
  const audSig  = deriveAudienceSignals(audience);

  // 2. Score each module independently
  const rawScores = {
    atf:       scoreAboveTheFold(urlSig, goalSig, audSig),
    cta:       scoreCta(urlSig, goalSig, audSig),
    offer:     scoreOfferClarity(urlSig, goalSig, audSig),
    copy:      scoreCopywriting(urlSig, goalSig, audSig),
    structure: scorePageStructure(urlSig, goalSig, audSig),
    trust:     scoreTrustProof(urlSig, goalSig, audSig),
    faq:       scoreFaqObjections(urlSig, goalSig, audSig),
    visual:    scoreVisualHierarchy(urlSig, goalSig, audSig),
    mobile:    scoreMobileExperience(urlSig, goalSig, audSig),
  };

  // 2b. 用真实抓取数据覆盖评分（有 pageData 时才生效）
  const pageInsights = {};
  if (pageData) {
    const pd = pageData;
    pageInsights.h1Text = pd.h1 || '';
    pageInsights.ctaButtons = pd.buttons || [];

    // 首屏 H1 质量
    const h1Words = (pd.h1 || '').trim().split(/\s+/).filter(Boolean).length;
    if (pd.h1 && h1Words >= 5) {
      rawScores.atf = clamp(rawScores.atf + 15);
    } else if (!pd.h1 || h1Words < 3) {
      rawScores.atf = clamp(rawScores.atf - 20);
      pageInsights.h1Missing = true;
    }

    // 信任：保障承诺
    if (pd.hasGuarantee) {
      rawScores.trust = clamp(rawScores.trust + 20);
    } else {
      rawScores.trust = clamp(rawScores.trust - 15);
      pageInsights.noGuarantee = true;
    }

    // 信任：客户评价
    if (pd.hasTestimonial) {
      rawScores.trust = clamp(rawScores.trust + 15);
    } else {
      rawScores.trust = clamp(rawScores.trust - 10);
      pageInsights.noTestimonial = true;
    }

    // Offer：定价信息
    if (pd.hasPricing) {
      rawScores.offer = clamp(rawScores.offer + 10);
    } else {
      rawScores.offer = clamp(rawScores.offer - 20);
      pageInsights.noPricing = true;
    }

    // CTA：表单 + CTA 数量
    if (pd.hasForm) rawScores.cta = clamp(rawScores.cta + 10);
    if (pd.ctaCount === 0) {
      rawScores.cta = clamp(rawScores.cta - 25);
      pageInsights.noCta = true;
    } else {
      rawScores.cta = clamp(rawScores.cta + 15);
    }

    // 文案：字数
    if (pd.wordCount > 2000) {
      rawScores.copy = clamp(rawScores.copy - 10);
      pageInsights.tooMuchText = true;
    } else if (pd.wordCount < 200) {
      rawScores.copy = clamp(rawScores.copy - 15);
      pageInsights.tooLittleText = true;
    }

    // 页面结构：导航（分散转化注意力）
    if (pd.hasNav) rawScores.structure = clamp(rawScores.structure - 5);
  }

  // 3. Final score = weighted average
  const weights = { atf: 1.5, cta: 1.3, offer: 1.2, copy: 1.0, structure: 1.0, trust: 1.2, faq: 0.8, visual: 0.7, mobile: 0.8 };
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const finalScore  = Math.round(
    Object.entries(rawScores).reduce((sum, [k, v]) => sum + v * (weights[k] || 1), 0) / totalWeight
  );

  // 4. Build content
  const atfContent    = getAboveTheFoldContent(rawScores.atf, urlSig, goalSig, audSig, isEn, aud, domain);
  const ctaContent    = getCtaContent(rawScores.cta, urlSig, goalSig, audSig, isEn, aud);
  const overallDx     = getOverallDiagnosis(finalScore, urlSig, goalSig, audSig, isEn, aud);
  const execSummary   = getExecutiveSummary(rawScores, urlSig, goalSig, audSig, isEn, aud, domain);
  const topLeaks      = getTopLeaks(rawScores, isEn, aud);

  const report = {
    executiveSummary: execSummary,
    overallDiagnosis: overallDx,

    aboveTheFold: {
      score: rawScores.atf,
      ...atfContent
    },

    ctaAudit: {
      score: rawScores.cta,
      ...ctaContent
    },

    offerClarity: {
      score: rawScores.offer,
      missing: isEn
        ? ["Exactly what deliverables are included", "A clear timeline for results", "Who this is NOT for (specificity builds trust)"]
        : ["具体包含哪些交付物", "清晰的效果时间线", "明确说明'不适合谁'（具体性建立信任）"],
      statement: isEn
        ? `Get the complete [System] tailored for ${aud}, including [Deliverable 1] and [Deliverable 2], so you can achieve [Result] within [Timeframe].`
        : `获取专为【${aud}】打造的完整 [系统名称]，含 [交付物 1] 和 [交付物 2]，让你在 [时间] 内实现 [终极结果]。`
    },

    copywriting: {
      score: rawScores.copy,
      weakAreas: isEn
        ? ["Overuse of 'we/our' instead of 'you/your'", "Feature-focused rather than benefit/outcome-focused", "Dense paragraphs with no visual breathing room"]
        : ["大量使用'我们/我们的'，而非'你/你的'", "以功能为中心，而非以效益/成果为核心", "段落密集，没有视觉呼吸感"],
      suggestions: isEn
        ? ["Replace 'We offer X' with 'You get X'", "Break paragraphs to max 3 lines; use bullet points", "Lead with the customer's problem before your solution"]
        : ["把'我们提供 X'改为'你将获得 X'", "把段落拆到最多 3 行，大量使用项目列表", "先讲客户痛点，再介绍你的解决方案"]
    },

    pageStructure: {
      score: rawScores.structure,
      problem: isEn
        ? "The page likely pushes for conversion too early, before establishing sufficient context and trust."
        : "页面可能在建立足够的背景和信任之前就急于推动转化。",
      recommendedOrder: isEn
        ? ["Hero (Hook + Outcome)", "Agitate the Pain", "Introduce the Solution", "Social Proof & Results", "How It Works", "Offer + Guarantee", "FAQ", "Final CTA"]
        : ["首屏（钩子 + 成果预览）", "放大痛点", "引入解决方案", "社会证明与结果展示", "运作机制", "Offer + 风险保障", "常见问题解答", "最终 CTA"],
      whyBetter: isEn
        ? "This order mirrors the psychological journey of a buyer: Awareness → Interest → Trust → Risk Removal → Action."
        : "这个顺序完全贴合买家的心理决策路径：意识 → 兴趣 → 信任 → 消除风险 → 行动。"
    },

    trustProof: {
      score: rawScores.trust,
      missing: isEn
        ? ["Quantified testimonials (e.g. '3x ROI in 60 days')", "Before/After transformation examples", "Authority badges (media mentions, certifications, partnerships)"]
        : ["量化的客户评价（如'60 天内 ROI 提升 3 倍'）", "Before/After 转变案例", "权威徽章（媒体报道、认证、合作伙伴）"],
      suggestedBlocks: isEn
        ? ["A 'Wall of Love' with photos and specific results", "A prominent 30-day money-back guarantee block", "Case study with before/after numbers"]
        : ["附有照片和具体结果的'客户赞誉墙'", "显眼的'30 天退款保证'区块", "含 Before/After 数字的客户案例"]
    },

    faqObjections: {
      score: rawScores.faq,
      missing: isEn
        ? ["Is it worth the price/time?", "Will it work for my specific situation?", "What happens immediately after I sign up/buy?"]
        : ["这个价格/时间投入值得吗？", "这适合我这种具体情况吗？", "我注册/购买后，接下来具体会发生什么？"],
      suggested: isEn
        ? [
            { q: "What if I don't see results?", a: "We offer a full refund within 30 days — no questions asked." },
            { q: `Is this right for ${aud}?`, a: `Yes, this was built specifically for ${aud} who want [outcome].` },
            { q: "How quickly will I see results?", a: "Most users report measurable results within [X days/weeks]." }
          ]
        : [
            { q: "如果没有效果怎么办？", a: "我们提供 30 天无条件全额退款保障。" },
            { q: `这适合【${aud}】吗？`, a: `是的，这正是专为想要 [成果] 的【${aud}】量身打造的。` },
            { q: "多快能看到效果？", a: "大多数用户在 [X 天/周] 内报告了可衡量的改变。" }
          ]
    },

    visualHierarchy: {
      score: rawScores.visual,
      colorHierarchy: isEn ? "Use one strong accent color exclusively for CTA buttons — nowhere else." : "只把一个强调色用于 CTA 按钮，页面其他任何地方都不重复使用。",
      typography:     isEn ? "H1 should be at least 2× the size of body text; H2 should be 1.5×." : "H1 至少是正文字号的 2 倍大，H2 应是 1.5 倍。",
      spacing:        isEn ? "Use consistent section padding of 80–120px to create visual breathing room." : "每个区块上下内边距统一用 80–120px，制造视觉呼吸感。",
      focalPoint:     isEn ? "The primary CTA button should be the most visually dominant element above the fold." : "主 CTA 按钮应是首屏视觉最突出的元素。",
      recommendation: isEn ? "Apply the 60-30-10 color rule: 60% neutral background, 30% brand color, 10% high-contrast CTA." : "使用 60-30-10 配色法则：60% 中性背景，30% 品牌色，10% 高对比 CTA 色。"
    },

    mobileExperience: {
      score: rawScores.mobile,
      mobileFriction: isEn ? "The hero section likely extends beyond the first mobile viewport, hiding the CTA." : "首屏内容可能超出了手机屏幕范围，导致 CTA 被隐藏。",
      inputIssue:     isEn ? "Ensure all form inputs have a minimum font size of 16px to prevent iOS auto-zoom." : "确保所有表单输入框字体不小于 16px，防止 iOS 强制放大。",
      ctaVisibility:  isEn ? "Buttons should be minimum 44px tall with 100% width on mobile for easy tapping." : "移动端按钮高度至少 44px，宽度 100%，方便点击。",
      recommendedLayout: isEn ? "Stack all hero elements vertically. Add a sticky bottom CTA bar on mobile." : "手机端所有首屏元素垂直堆叠。在移动端底部增加一个悬浮固定的 CTA 栏。"
    },

    topLeaks,

    quickWins: isEn ? [
      "Change the CTA button to a single high-contrast color used nowhere else on the page.",
      "Add 'No credit card required' microcopy directly under the main button.",
      `Include the phrase "${aud}" or their core pain point in the headline.`,
      "Add 3 customer logos or a star rating directly below the hero section.",
      "On mobile, make the primary CTA a sticky bar fixed to the bottom.",
      "Change all 'We' language in the first 3 sections to 'You'.",
      "Increase section padding to at least 80px for visual breathing room."
    ] : [
      "把 CTA 按钮改为页面上唯一使用的高对比色。",
      "在主按钮正下方加上微文案：'完全免费，无需绑定信用卡'。",
      `在大标题里加入"${aud}"或他们的核心痛点词汇。`,
      "在首屏下方放上 3 个客户 Logo 或星级评分。",
      "移动端底部增加一个悬浮固定的主 CTA 按钮栏。",
      "把前 3 屏所有的'我们'改成'你'。",
      "把所有区块上下间距调整到至少 80px。"
    ],

    optimizationPlan: {
      day1: isEn ? "Day 1 — Hero Fix: Rewrite headline and subheadline using the outcome formula." : "Day 1 — 首屏重写：使用成果公式重写大标题和副标题。",
      day2: isEn ? "Day 2 — CTA Overhaul: Redesign button color, rewrite copy, and add microcopy." : "Day 2 — CTA 改造：重新设计按钮颜色，改写文案，补充微文案。",
      day3: isEn ? "Day 3 — Offer Clarity: Create a clear 'What You Get' box with deliverables and guarantee." : "Day 3 — Offer 清晰化：创建清晰的'你将获得'盒子，包含交付物清单和保障承诺。",
      day4: isEn ? "Day 4 — Social Proof: Collect and add 3 results-driven testimonials with photos." : "Day 4 — 社会证明：收集并展示 3 个带照片、含具体数据的客户评价。",
      day5: isEn ? "Day 5 — Objections: Write an FAQ section addressing the top 5 buyer hesitations." : "Day 5 — 异议处理：撰写 FAQ 区块，回答 5 大买家核心疑虑。",
      day6: isEn ? "Day 6 — Mobile Audit: Test on iPhone. Fix button sizes, font sizes, and sticky CTA." : "Day 6 — 移动端排查：用手机测试，修复按钮尺寸、字号，添加悬浮 CTA。",
      day7: isEn ? "Day 7 — QA & Speed: Submit the form yourself, check page speed with Google PageSpeed Insights." : "Day 7 — 测试 & 速度：自己提交一遍表单，用 Google PageSpeed 测试加载速度。"
    }
  };

  // 5. 用 pageInsights 覆盖具体文字字段（有真实数据时才更准确）
  if (pageData) {
    // 首屏 H1 具体说明
    if (pageInsights.h1Missing) {
      report.aboveTheFold.headlineProblem = isEn
        ? 'Your H1 is missing or too short — this is the #1 cause of high bounce rates.'
        : '你的 H1 标题缺失或过短 — 这是跳出率高的首要原因。';
    } else if (pageInsights.h1Text) {
      report.aboveTheFold.headlineProblem = isEn
        ? `Your current H1: "${pageInsights.h1Text}" — rewrite it to be more outcome-specific for ${aud}.`
        : `你当前的 H1 是："${pageInsights.h1Text}" — 建议改写得更直接指向【${aud}】的具体成果。`;
    }

    // CTA：无按钮
    if (pageInsights.noCta) {
      report.ctaAudit.copyProblem = isEn
        ? 'No clear CTA button found on your page — visitors have no obvious action to take.'
        : '你的页面上未检测到任何清晰的 CTA 按钮 — 访客没有明确的下一步行动指引。';
    } else if (pageInsights.ctaButtons.length > 0) {
      report.ctaAudit.betterCopy = pageInsights.ctaButtons.slice(0, 3);
    }

    // 信任：无保障
    if (pageInsights.noGuarantee) {
      report.trustProof.missing = [
        ...(report.trustProof.missing || []),
        isEn ? 'No guarantee found on your page — add a risk-reversal promise near the CTA.' : '页面上未发现任何保障承诺 — 在 CTA 旁边加入风险逆转声明。'
      ];
    }

    // 信任：无评价
    if (pageInsights.noTestimonial) {
      report.trustProof.missing = [
        ...(report.trustProof.missing || []),
        isEn ? 'No testimonials or reviews detected — add social proof to build trust.' : '未检测到客户评价或评论 — 加入社会证明以建立信任感。'
      ];
    }

    // Offer：无定价
    if (pageInsights.noPricing) {
      report.offerClarity.missing = [
        ...(report.offerClarity.missing || []),
        isEn ? 'No pricing information found — visitors cannot evaluate your offer without it.' : '未发现任何定价信息 — 访客在没有价格参考的情况下无法评估你的 Offer。'
      ];
    }

    // 文案：字数问题
    if (pageInsights.tooMuchText) {
      report.copywriting.weakAreas = [
        isEn ? 'Page has too much text (2000+ words) which reduces readability and focus.' : '页面文字量过多（超过 2000 词），严重影响可读性和聚焦度。',
        ...(report.copywriting.weakAreas || [])
      ];
    } else if (pageInsights.tooLittleText) {
      report.copywriting.weakAreas = [
        isEn ? 'Page has very little content (under 200 words) — not enough to build trust or explain the offer.' : '页面内容极少（不足 200 词） — 不足以建立信任或清晰解释 Offer。',
        ...(report.copywriting.weakAreas || [])
      ];
    }
  }

  return { report, finalScore };
};

// ── 抓取 + 审计（调用 scrape-page Edge Function）────────────────

window.scrapeAndAudit = async (url) => {
  try {
    const res = await fetch('https://oyvumdmtimcggqzbgotc.supabase.co/functions/v1/scrape-page', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95dnVtZG10aW1jZ2dxemJnb3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MzQ4NTgsImV4cCI6MjA5MzExMDg1OH0.3eKtR-MdfLhO0NHEo2l7OOZ3AlTyEmaXiTG94VI6QKE'
      },
      body: JSON.stringify({ url })
    });
    const json = await res.json();
    if (!json.success) return null;
    return json.data;
  } catch (e) {
    return null;
  }
};

// ── 统一核心入口 (Shared Audit Engine) ──────────────────────────────
/**
 * 所有的端（Web App, Extension, PWA, Admin）统一调用这个函数，
 * 内部处理抓取、容错、评分和生成统一报告的逻辑。
 */
window.runBasicAudit = async ({ url, pageGoal, targetAudience, source, isEn = true, supabase = null }) => {
  const domainName = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0].split('.')[0] || 'Website';
  const capName = domainName.charAt(0).toUpperCase() + domainName.slice(1);

  // 1. 尝试真实内容抓取
  let pageData = null;
  try {
    if (supabase) {
      pageData = await scrapeAndAudit(supabase, url);
    } else if (typeof window !== 'undefined' && window.scrapeAndAudit) {
      // 供 Extension 使用的 fetch 版本
      pageData = await window.scrapeAndAudit(url);
    }
  } catch (e) {
    console.warn(`[${source}] Scrape failed, falling back to heuristic logic:`, e);
  }

  // 2. 如果抓取成功，将把包含真实 H1, H2, CTA 的 pageData 传入，由它将 Actual Data 写入 Report
  const { report, finalScore } = getExpertAudit(pageGoal, targetAudience, isEn, capName, url, pageData);

  // 3. 返回统一结构的 Report 对象 (兼容现有 UI 的同时，提供完整的上下文)
  return {
    source,
    url,
    pageGoal,
    targetAudience,
    pageData,        // 原生抓取到的所有真实数据 (字数、H1、CTA列表等)，供未来使用
    overallScore: finalScore,
    report           // 目前严格兼容 Web App / Extension UI 的报告格式
  };
};
