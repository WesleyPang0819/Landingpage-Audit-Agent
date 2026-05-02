export const getExpertAudit = (goal, audience, isEn, capName) => {
    const aud = audience || (isEn ? 'your target audience' : '目标受众');
    const domain = capName || 'Your Website';

    // Generates a comprehensive 15-module audit report
    const report = {
        executiveSummary: {
            problem: isEn 
                ? `The primary issue with ${domain} is a severe lack of clarity and immediate value proposition. Visitors cannot figure out what you do for ${aud} within the first 5 seconds.` 
                : `${domain} 最大的问题是极度缺乏清晰度和即时价值主张。访客无法在黄金 5 秒内搞懂你能为【${aud}】解决什么具体问题。`,
            impact: isEn 
                ? `Because users don't understand the exact outcome, cognitive load is high, causing them to bounce before scrolling to your offer.` 
                : `因为用户看不懂你能带来的具体结果，导致认知负荷过高，绝大多数人在看到你的核心 Offer 之前就直接跳出了页面。`,
            priorities: isEn 
                ? ["Rewrite the Above-the-Fold headline to be outcome-driven.", "Add a clear risk-reversal guarantee near the CTA.", "Restructure the page to introduce the problem before the product."]
                : ["重写首屏大标题，直接点明能带来的核心结果。", "在所有行动号召按钮旁增加显眼的风险逆转（如退款保证）。", "重构页面逻辑，先抛出痛点，再介绍产品。"]
        },
        overallDiagnosis: {
            category: isEn ? "Clarity & Trust Problem" : "清晰度与信任度问题",
            diagnosis: isEn 
                ? `The page reads like an internal company brochure rather than a targeted landing page for ${aud}. It suffers from "Feature-itis" (focusing on what the product does) instead of emphasizing the transformation (how the user's life improves).` 
                : `这个页面读起来像是一本公司内部宣传册，而不是专门针对【${aud}】的高转化落地页。它患上了严重的“功能自嗨症”，一直在讲产品有多好，却没讲用户的切身痛点和改变。`
        },
        aboveTheFold: {
            score: 55,
            headlineProblem: isEn ? "Headline is too clever and vague." : "大标题过于文艺、抽象，不知所云。",
            subheadlineProblem: isEn ? "Lacks measurable results or timeframe." : "副标题缺乏可衡量的数据或结果。",
            fiveSecondDiagnosis: isEn ? "Visitors cannot figure out what you do and who you serve within 5 seconds." : "访客无法在黄金 5 秒内搞懂你能为他们解决什么具体问题。",
            missingTrust: isEn ? "Missing initial trust signals (e.g., logos, stars) above the fold." : "完全没有初步的信任背书（如客户 Logo 或评分）。",
            whyHurts: isEn ? "The hero section is responsible for 80% of your bounce rate. If it's vague, nothing else matters." : "首屏决定了 80% 的跳出率。如果首屏含糊不清，下方再好的内容都没人看。",
            fix: isEn ? "Use the formula: 'How to get [Desired Result] without [Pain Point] in [Timeframe].'" : "使用经典公式重写：“如何帮助你在 [时间] 内，无需 [讨厌的事]，就能获得 [渴望的结果]”。",
            headlineExample: isEn ? `Help ${aud} Achieve [Result] Without [Pain]` : `帮助【${aud}】在 30 天内实现 [核心结果]，告别 [最大痛点]`,
            subheadlineExample: isEn ? `Join 1,000+ others who have already transformed their workflow.` : `已经有超过 1,000 名客户通过我们的方法，成功提升了 300% 的效率。`,
            heroStructure: isEn ? "Label -> H1 -> H2 -> CTA + Microcopy -> Trust Badges" : "标签 -> 大标题 (H1) -> 副标题 (H2) -> 行动按钮 + 微文案 -> 信任徽章",
            quickFixes: isEn ? [
                "Make the headline specific to your audience.",
                "Add 3 customer logos immediately below the hero.",
                "Ensure CTA button color pops out from the background.",
                "Add 'No credit card required' under the button.",
                "Remove top navigation links to reduce distraction."
            ] : [
                "大标题必须精准带上目标受众的名字或职业。",
                "在首屏立刻放上 3 个知名客户的 Logo 增强信任。",
                "把 CTA 按钮改成具有极强对比度的高亮色。",
                "在主按钮下方加上一行小字：'完全免费，无需绑定信用卡'。",
                "移除顶部导航栏的外链，防止用户跳出。"
            ]
        },
        ctaAudit: {
            score: 60,
            visibility: isEn ? "Low contrast, blends into background." : "低对比度，和背景色混为一体。",
            copyProblem: isEn ? "Generic 'Submit' or 'Learn More' copy." : "按钮文案是极其平庸的“提交”或“了解更多”。",
            colorContrast: isEn ? "Poor contrast ratio (e.g. blue on blue)." : "对比度极差（例如蓝底蓝字）。",
            placement: isEn ? "Hidden below the fold." : "隐藏在首屏下方，需要滑动才能看到。",
            betterCopy: isEn ? ["Get My Free Plan", "Start Growing Now", "Show Me How"] : ["立即获取专属方案", "开始提升转化率", "我想看看怎么运作"],
            microcopy: isEn ? "No credit card required. Cancel anytime." : "无需绑定信用卡 · 随时可以取消 · 100% 安全"
        },
        offerClarity: {
            score: 45,
            missing: isEn 
                ? ["Exactly what is included (deliverables)", "The timeline for results", "Who it is NOT for"] 
                : ["到底包含哪些具体交付物？", "需要多久才能看到效果？", "明确说明这“不适合”什么样的人？"],
            statement: isEn 
                ? `Get the complete [System Name] tailored for ${aud}, including [Deliverable 1] and [Deliverable 2], so you can finally achieve [Result].` 
                : `获取专为【${aud}】打造的 [系统名称]，包含 [交付物 1] 和 [交付物 2]，让你真正实现 [终极结果]。`
        },
        copywriting: {
            score: 50,
            weakAreas: isEn 
                ? ["Too many adverbs and jargon.", "Focusing on 'We' instead of 'You'.", "Text blocks are too dense."] 
                : ["使用了太多形容词和行业黑话。", "全篇都是“我们如何如何”，缺少“你将获得什么”。", "文字段落太长，完全没有排版呼吸感。"],
            suggestions: isEn 
                ? ["Change every 'We do X' to 'You get Y'.", "Break paragraphs into 2-3 lines max.", "Use bullet points for readability."] 
                : ["把所有的“我们提供 X”改为“你可以享受 Y”。", "把所有长段落拆解成最多 3 行的短句。", "大量使用符号列表（Bullet points）来替代段落排版。"]
        },
        pageStructure: {
            score: 40,
            problem: isEn 
                ? "Asking for the sale/lead way too early before establishing value or proving the problem is understood." 
                : "在建立价值和信任之前，过早地要求用户购买或留资。结构像是在“逼单”。",
            recommendedOrder: isEn 
                ? ["Hero (Hook)", "Agitate Pain", "Introduce Solution", "Social Proof", "How it Works", "Offer & Guarantee", "FAQ", "Final CTA"] 
                : ["首屏 (钩子)", "放大痛点", "引入解决方案", "社会化证明", "运作机制", "具体 Offer 与保障", "常见问题解答 (FAQ)", "最终号召 (CTA)"],
            whyBetter: isEn 
                ? "It matches the psychological journey of a buyer: Awareness -> Interest -> Proof -> Action." 
                : "这完全贴合了用户的心理决策路径：意识到问题 -> 产生兴趣 -> 获得信任 -> 消除风险 -> 决定行动。"
        },
        trustProof: {
            score: 35,
            missing: isEn 
                ? ["Quantifiable results in testimonials.", "Before/After comparisons.", "Recognizable authority badges."] 
                : ["客户评价里没有具体的量化数据。", "缺乏清晰的 Before/After 现状对比。", "没有任何权威媒体或平台的认证徽章。"],
            suggestedBlocks: isEn 
                ? ["A 'Wall of Love' section.", "Video testimonials.", "A robust 30-day money-back guarantee box."] 
                : ["一面“客户赞誉墙” (Wall of Love)。", "真实的视频评价。", "一个视觉显眼的“30天无理由退款保证”区块。"]
        },
        faqObjections: {
            score: 30,
            missing: isEn 
                ? ["Is it worth the money/time?", "Will it work for my specific situation?", "What happens immediately after I click?"] 
                : ["这东西真的值这个价钱/时间吗？", "它适合我这种极其特殊的情况吗？", "我点击付款/提交后，下一步具体会发生什么？"],
            suggested: isEn 
                ? [{ q: "What if I don't see results?", a: "We offer a 100% refund." }, { q: `Is this for ${aud}?`, a: "Yes, specifically designed for you." }] 
                : [{ q: "如果没效果怎么办？", a: "我们提供 100% 的退款保障，不问任何理由。" }, { q: `这真的适合【${aud}】吗？`, a: "是的，这正是为您量身定制的方案。" }]
        },
        visualHierarchy: {
            score: 70,
            colorHierarchy: isEn ? "Everything is the same brand color. No accent color for actions." : "全篇都是同样的品牌色。没有用于行动按钮的强调色。",
            typography: isEn ? "H1 and H2 look too similar in weight." : "主标题 (H1) 和副标题 (H2) 视觉差异太小，没有主次。",
            spacing: isEn ? "Whitespace is inconsistent, making sections feel cramped." : "区块之间的留白（Spacing）极度不均匀，显得拥挤廉价。",
            focalPoint: isEn ? "The user's eye is drawn to stock photos instead of the CTA." : "用户的视觉焦点被图库素材吸引了，而不是核心行动按钮。",
            recommendation: isEn ? "Make CTAs a highly contrasting 'pop' color and increase section paddings to 96px." : "把 CTA 按钮改成具有极强对比度的高亮色，各区块上下内边距增加到 96px。"
        },
        mobileExperience: {
            score: 65,
            mobileFriction: isEn ? "Hero section takes up 1.5 screens. Users have to scroll to see the CTA." : "首屏在手机上被拉长，需要划一屏半才能看到按钮。",
            inputIssue: isEn ? "Forms require zooming to type (font size < 16px)." : "表单输入框字体小于 16px，点击时 iOS 会强制放大屏幕。",
            ctaVisibility: isEn ? "Buttons are too small for fat fingers or hidden at the bottom." : "按钮触控面积太小容易误触，或者完全被挤到了屏幕最底下。",
            recommendedLayout: isEn ? "Stack hero elements tighter. Make buttons 100% width and sticky at bottom." : "把首屏元素高度压紧。手机端把所有按钮设为 100% 宽，并在底部做一个悬浮的 Sticky CTA。"
        },
        topLeaks: [
            {
                title: isEn ? "Vague Hero Headline" : "首屏标题模糊不清",
                severity: "High",
                wrong: isEn ? "Doesn't state the clear outcome." : "没有直接说出用户能获得什么。",
                hurts: isEn ? "High immediate bounce rate." : "导致极高的开局跳出率，用户懒得猜。",
                fix: isEn ? "Rewrite using the suggested formula." : "按照我们提供的公式重写首屏文案。"
            },
            {
                title: isEn ? "Friction-heavy Form/Checkout" : "表单或购买流程摩擦力极大",
                severity: "High",
                wrong: isEn ? "Asking for too much upfront." : "一次性让用户填太多信息。",
                hurts: isEn ? "Users abandon mid-process." : "用户在填到一半时失去耐心放弃。",
                fix: isEn ? "Split into multiple easy steps." : "改成多步表单，或者先要邮箱再要其他信息。"
            },
            {
                title: isEn ? "Hidden Guarantee" : "保障条款被隐藏",
                severity: "Medium",
                wrong: isEn ? "No risk reversal visible near CTA." : "在购买/提交按钮附近根本看不到退款或隐私承诺。",
                hurts: isEn ? "Purchase anxiety kills the conversion." : "用户在最后一刻的防备心理导致放弃。",
                fix: isEn ? "Add a padlock icon and clear policy right below the button." : "在按钮正下方加上一个“小锁”图标和无忧承诺。"
            },
            {
                title: isEn ? "Wall of Text" : "密集的文字墙",
                severity: "Medium",
                wrong: isEn ? "Paragraphs are 6+ lines long." : "段落超过 6 行，密密麻麻全是字。",
                hurts: isEn ? "People scan, they don't read. Text walls get skipped." : "现在的用户只扫读不精读，文字墙会直接被滑过。",
                fix: isEn ? "Use bullet points and bold key terms." : "全部拆成 3 行以内的短句，使用列表，加粗核心词汇。"
            },
            {
                title: isEn ? "Weak Call-to-Action" : "软弱无力的号召按钮",
                severity: "Medium",
                wrong: isEn ? "Using standard 'Submit' or 'Click Here'." : "使用了最平庸的“提交”或“点击这里”。",
                hurts: isEn ? "Does not build excitement to click." : "完全无法激发点击的冲动。",
                fix: isEn ? "Use value-based copy (e.g., 'Get My Free Audit')." : "改成基于价值的文案（比如“立刻获取我的免费报告”）。"
            }
        ],
        quickWins: isEn ? [
            "Change the CTA button color to a highly contrasting color.",
            "Add 'No credit card required' microcopy under the main button.",
            "Make your headline specific to your audience.",
            "Add 3 customer logos above the fold.",
            "Ensure the mobile button is sticky at the bottom.",
            "Increase line-height to 1.6 for better readability.",
            "Change 'We' to 'You' in the first 3 sections."
        ] : [
            "立刻把所有 CTA 按钮换成与背景产生极强对比的高亮色。",
            "在主按钮下方加上一行小字：'完全免费，无需绑定信用卡'。",
            "大标题必须精准带上目标受众的名字或职业。",
            "在首屏立刻放上 3 个知名客户的 Logo 增强信任。",
            "在手机端做一个悬浮在屏幕最底部的购买/提交按钮。",
            "把网站正文的行高统一调到 1.6 倍，增加呼吸感。",
            "把页面前三屏的所有“我们”改成“你”。"
        ],
        optimizationPlan: {
            day1: isEn ? "Hero Rewrite: Fix headline and subheadline clarity." : "Day 1: 重写首屏大标题和副标题，确保 5 秒秒懂。",
            day2: isEn ? "CTA Overhaul: Redesign buttons and add microcopy." : "Day 2: 重新设计按钮颜色，修改按钮文案，补充消除疑虑的微文案。",
            day3: isEn ? "Offer Clarity: Restructure the pricing/offer section." : "Day 3: 梳理 Offer，明确写出包含什么、适合谁、不适合谁。",
            day4: isEn ? "Social Proof: Inject specific, results-driven testimonials." : "Day 4: 收集并替换所有的客户评价，加入具体的数据和 Before/After。",
            day5: isEn ? "Friction Removal: Add an FAQ section for top objections." : "Day 5: 针对用户最关心的 5 个问题，专门做一个 FAQ 区块。",
            day6: isEn ? "Mobile Cleanup: Fix spacing, font sizes, and button targets." : "Day 6: 用手机打开检查一遍，放大按钮，调整字号防止缩放。",
            day7: isEn ? "Final Polish: QA test the form and check page speed." : "Day 7: 自己测试填一遍表单，并用 Google Pagespeed 测一下加载速度。"
        }
    };

    // calculate total score dynamically based on module scores
    const s = report;
    const finalScore = Math.round((s.aboveTheFold.score + s.ctaAudit.score + s.offerClarity.score + s.copywriting.score + s.pageStructure.score + s.trustProof.score + s.faqObjections.score + s.visualHierarchy.score + s.mobileExperience.score) / 9);

    return { report, finalScore };
};
