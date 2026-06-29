import { useState, useEffect, useRef, useCallback } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionTemplate,
} from 'framer-motion';
import { Navbar } from './components/Navbar';
import { ScrambleIn } from './components/ScrambleText';
import { ConnectAILabLogo } from './components/ConnectAILabLogo';
import PayPalCheckoutButton from './components/payment/PayPalCheckoutButton';
import { useAuth } from './contexts/AuthContext';
import { createOrder } from './lib/firestore';
import { PRODUCTS } from './lib/paypal';
import { VIDEO_URLS } from './config/videos';
import { SITE_CONFIG } from './config/content';
import { AiToolCard, AiTool } from './components/AiToolCard';
import { SubmitToolModal } from './components/SubmitToolModal';
import { db } from './lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

// ── 테스트용 초기 AI 도구 데이터 (Firestore가 비어있을 때 사용) ──
const INITIAL_TOOLS: AiTool[] = [
  {
    id: 't1',
    name: 'CopyFlow AI',
    description: 'Create high-converting copy for landing pages, ads, and product descriptions in seconds.',
    category: 'chatbot',
    url: 'https://copyflow.ai',
    isFeatured: true,
  },
  {
    id: 't2',
    name: 'PixiGen',
    description: 'Transform sketch designs into production-ready 3D renders with real-time editing.',
    category: 'image',
    url: 'https://pixigen.art',
    isFeatured: true,
  },
  {
    id: 't3',
    name: 'CodeRefactor',
    description: 'AI-powered clean code assistant. Paste your legacy code and get refactored clean scripts.',
    category: 'developer',
    url: 'https://coderefactor.io',
    isFeatured: false,
  },
  {
    id: 't4',
    name: 'RankBoost',
    description: 'Identify SEO content gaps, extract keywords, and generate semantic briefs to boost Google ranking.',
    category: 'marketing',
    url: 'https://rankboost.io',
    isFeatured: false,
  },
  {
    id: 't5',
    name: 'FlowTime Timer',
    description: 'Smart Pomodoro timer that adapts rest durations based on your typing dynamics and keyboard speed.',
    category: 'productivity',
    url: 'https://flowtime.co',
    isFeatured: false,
  },
];

export default function App() {
  const [entranceComplete, setEntranceComplete] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [initialPlan, setInitialPlan] = useState<'standard' | 'express' | 'featured'>('standard');
  const [tools, setTools] = useState<AiTool[]>(INITIAL_TOOLS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { user } = useAuth();

  // ── Firestore에서 등록된 AI 도구 불러오기 ──
  const fetchTools = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'ai_tools'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const fetchedTools = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as AiTool[];
        // Featured 도구를 상단에 배치
        const sorted = [...fetchedTools].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        setTools(sorted);
      }
    } catch (err) {
      console.warn('Firestore load failed, using local fallback:', err);
    }
  }, []);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  /* ── PayPal 결제 완료 → Firestore 저장 ── */
  const handlePayPalSuccess = useCallback(
    async (details: any, productId: string, productName: string, amount: string) => {
      const orderId = details.id || `pp_${Date.now()}`;
      try {
        await createOrder({
          id: orderId,
          userId: user?.uid || 'anonymous',
          productId,
          productName,
          amount: parseFloat(amount),
          currency: 'USD',
          status: 'completed',
          paypalOrderId: orderId,
          paypalPayerId: details.payer?.payer_id || '',
        });
        console.log('[Firestore] Order saved:', orderId);
        alert(`✅ Payment Completed! Order: ${orderId}. Please submit your tool now.`);
        setInitialPlan(productId === PRODUCTS[0].id ? 'express' : 'featured');
        setIsSubmitModalOpen(true);
      } catch (err) {
        console.error('[Firestore] Failed to save order:', err);
        alert(`결제 완료되었으나 기록 실패: ${orderId}`);
      }
    },
    [user]
  );

  /* ── Hero video mouse-scrub ── */
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const targetTimeRef = useRef(0);
  const isSeekingRef = useRef(false);

  const handleSeeked = useCallback(() => {
    const video = heroVideoRef.current;
    if (!video) return;
    isSeekingRef.current = false;
    if (Math.abs(video.currentTime - targetTimeRef.current) > 0.01) {
      isSeekingRef.current = true;
      video.currentTime = targetTimeRef.current;
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const video = heroVideoRef.current;
      if (!video || !video.duration) return;
      const deltaX = e.movementX;
      const sensitivity = 0.8;
      const change = (deltaX / window.innerWidth) * video.duration * sensitivity;
      targetTimeRef.current = Math.max(
        0,
        Math.min(video.duration, targetTimeRef.current + change)
      );
      if (!isSeekingRef.current) {
        isSeekingRef.current = true;
        video.currentTime = targetTimeRef.current;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  /* ── Entrance delay ── */
  useEffect(() => {
    const timer = setTimeout(() => setEntranceComplete(true), 800);
    return () => clearTimeout(timer);
  }, []);

  /* ── Section 2 scroll-driven 3D text ── */
  const section2Ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: section2Ref,
    offset: ['start end', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 15,
    damping: 32,
    mass: 1.8,
  });
  const yScaleValue = useTransform(smoothProgress, [0, 1], [60, -120]);
  const textOpacity = useTransform(smoothProgress, [0.3, 0.5], [0, 1]);
  const transform3D = useMotionTemplate`rotateX(24deg) translateY(${yScaleValue}px) translateZ(15px)`;

  const { hero, cinematic, metrics, technology, architecture, footer } = SITE_CONFIG;

  // ── 필터링된 도구 목록 ──
  const filteredTools = selectedCategory === 'all' 
    ? tools 
    : tools.filter(t => t.category === selectedCategory);

  return (
    <div style={{ fontFamily: '"Space Mono", monospace' }}>
      <Navbar entranceComplete={entranceComplete} onSubmitClick={() => { setInitialPlan('standard'); setIsSubmitModalOpen(true); }} />

      {/* ════════════════ SECTION 1: HERO ════════════════ */}
      <section className="relative h-screen h-[100dvh] flex flex-col overflow-hidden">
        {VIDEO_URLS.hero && (
          <video
            ref={heroVideoRef}
            src={VIDEO_URLS.hero}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            preload="auto"
            onSeeked={handleSeeked}
          />
        )}

        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            opacity: 0.05,
          }}
        />

        {/* Watermark text */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          style={{ paddingTop: 50 }}
        >
          <span
            className="uppercase select-none"
            style={{
              fontFamily: '"Anton SC", sans-serif',
              fontSize: 'clamp(120px, 30vw, 521px)',
              letterSpacing: '-4px',
              opacity: 0.1,
              background: 'radial-gradient(circle, rgba(142,127,148,0) 0%, #8E7F94 70%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              lineHeight: 1,
            }}
          >
            {hero.watermark}
          </span>
        </div>

        <motion.div
          className="relative z-20 flex flex-col flex-1 px-4 sm:px-6 md:px-8 pt-20 sm:pt-24 pb-8 sm:pb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: entranceComplete ? 1 : 0 }}
          transition={{ duration: 1 }}
        >
          <div className="flex-1" />

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-4 items-start">
              {/* AI Directory Pill Badge */}
              <motion.div
                className="px-4 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-md flex items-center gap-2 mb-2"
                initial={{ opacity: 0, y: -10 }}
                animate={entranceComplete ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
                whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#a3ff12] animate-pulse" />
                <span className="text-[11px] font-mono tracking-wider text-white/80 uppercase">
                  AIHunt Global — Discover the Future of AI, One Tool at a Time
                </span>
              </motion.div>

              <h1
                className="text-white font-light leading-[0.95] tracking-[-0.03em]"
                style={{ fontSize: 'clamp(40px, 10vw, 100px)' }}
              >
                <ScrambleIn text={hero.titleLeft[0]} delay={200} triggered={entranceComplete} />
                <br />
                <ScrambleIn text={hero.titleLeft[1]} delay={500} triggered={entranceComplete} />
              </h1>

              <motion.p
                className="max-w-sm text-[13px] sm:text-[15px] text-white/60 leading-relaxed"
                initial={{ opacity: 0, y: 25 }}
                animate={entranceComplete ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.9,
                  ease: [0.215, 0.61, 0.355, 1.0],
                  delay: 0.2,
                }}
              >
                {hero.description}
              </motion.p>
            </div>

            <h1
              className="text-white font-light leading-[0.95] tracking-[-0.03em] text-left md:text-right"
              style={{ fontSize: 'clamp(40px, 10vw, 100px)' }}
            >
              <ScrambleIn text={hero.titleRight[0]} delay={700} triggered={entranceComplete} />
              <br />
              <ScrambleIn text={hero.titleRight[1]} delay={1000} triggered={entranceComplete} />
            </h1>
          </div>
        </motion.div>
      </section>

      {/* ════════════════ SECTION 2: CINEMATIC TEXT ════════════════ */}
      <section
        ref={section2Ref}
        className="relative h-screen h-[100dvh] flex items-center justify-center overflow-hidden"
      >
        {VIDEO_URLS.section2 && (
          <video
            src={VIDEO_URLS.section2}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        )}

        <div
          className="absolute top-0 left-0 right-0 z-10"
          style={{
            height: 180,
            background: 'linear-gradient(to bottom, #010103, transparent)',
          }}
        />

        <div className="relative z-20 max-w-5xl mx-auto" style={{ perspective: 400 }}>
          <motion.p
            className="font-normal text-[28px] sm:text-[42px] md:text-[54px] lg:text-[64px] text-white leading-[1.35] tracking-[-0.02em] select-none px-6 sm:px-12 text-center"
            style={{
              fontFamily: '"Space Mono", monospace',
              transform: transform3D,
              opacity: textOpacity,
            }}
          >
            {cinematic.text}
          </motion.p>
        </div>
      </section>

      {/* ════════════════ SECTION 3: AI TOOL LIST (디렉토리 메인) ════════════════ */}
      <section className="min-h-screen bg-black py-32 px-6" id="browse">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <p className="text-white/40 text-[12px] tracking-[0.15em] uppercase mb-3">Directory</p>
              <h2 className="text-white text-[32px] sm:text-[48px] font-light tracking-tight">
                Discover Next-Gen AI
              </h2>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-2">
              {['all', 'productivity', 'image', 'chatbot', 'developer', 'marketing'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-[12px] uppercase font-mono tracking-wider transition-all border cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-transparent text-[#00ffcc] border-[#00ffcc] shadow-[0_0_12px_rgba(0,255,200,0.4)] animate-pulse'
                      : 'bg-transparent text-white/50 border-white/10 hover:border-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((t, idx) => (
              <AiToolCard key={t.id} tool={t} index={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ SECTION 4: PLATFORM STATS ════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {VIDEO_URLS.metrics && (
          <video
            src={VIDEO_URLS.metrics}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        )}

        <div className="relative z-20 pt-32 pb-32 px-6 max-w-6xl mx-auto w-full">
          <motion.p
            className="text-white/40 text-[13px] sm:text-[14px] tracking-[0.2em] uppercase mb-20 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            {metrics.subtitle}
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 text-center">
            {metrics.items.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: i * 0.15 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <div
                  className="text-white font-light tracking-[-0.04em] leading-none"
                  style={{ fontSize: 'clamp(48px, 10vw, 96px)' }}
                >
                  {m.value}
                </div>
                <div className="text-white/40 text-[13px] sm:text-[15px] mt-4 tracking-wide">
                  {m.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ SECTION 5: ADVANTAGES ════════════════ */}
      <section className="relative h-screen h-[100dvh] flex flex-col overflow-hidden">
        {VIDEO_URLS.technology && (
          <video
            src={VIDEO_URLS.technology}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        )}

        <div className="relative z-20 flex flex-col flex-1 px-8 sm:px-12 md:px-16 py-12 sm:py-16">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
            <motion.h2
              className="text-white font-light leading-[0.95] tracking-[-0.03em]"
              style={{ fontSize: 'clamp(36px, 8vw, 72px)' }}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              {technology.title[0]}
              <br />
              {technology.title[1]}
            </motion.h2>

            <motion.p
              className="text-white/50 text-[13px] sm:text-[15px] leading-relaxed max-w-xs md:text-right md:pt-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 0.2 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              {technology.description}
            </motion.p>
          </div>

          <div className="flex-1" />

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.0, delay: 0.3 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            {technology.features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <h3 className="text-white text-[14px] sm:text-[16px] font-normal mb-2">
                  {f.title}
                </h3>
                <p className="text-white/40 text-[12px] sm:text-[14px] leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════ SECTION 6: ARCHITECTURE ════════════════ */}
      <section className="min-h-screen flex items-center justify-center bg-black">
        <div className="max-w-3xl mx-auto px-6 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0 }}
            viewport={{ once: true, amount: 0.4 }}
          >
            <p className="text-white/40 text-[13px] sm:text-[14px] tracking-[0.2em] uppercase mb-8">
              {architecture.subtitle}
            </p>
            <h2
              className="text-white font-light leading-[1.15] tracking-[-0.02em] mb-10"
              style={{ fontSize: 'clamp(28px, 6vw, 56px)' }}
            >
              {architecture.heading}
            </h2>
            <p className="text-white/45 text-[15px] sm:text-[17px] leading-relaxed max-w-xl mx-auto">
              {architecture.description}
            </p>
          </motion.div>

          <motion.div
            className="mt-20 flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            viewport={{ once: true, amount: 0.4 }}
          >
            {architecture.layers.map((l) => (
              <div
                key={l.num}
                className="w-full max-w-md h-[72px] border-2 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.15)] rounded-xl flex items-center justify-between px-6 bg-red-950/5"
              >
                <span className="text-red-400/60 text-[12px] tracking-[0.15em] uppercase font-mono">
                  Step {l.num}
                </span>
                <span className="text-white text-[16px] sm:text-[18px] font-light">
                  {l.name}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════ SECTION 7: PRICING ════════════════ */}
      <section className="min-h-screen bg-black py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <p className="text-white/40 text-[13px] sm:text-[14px] tracking-[0.2em] uppercase mb-8">
              Pricing
            </p>
            <h2
              className="text-white font-light leading-[1.15] tracking-[-0.02em] mb-6"
              style={{ fontSize: 'clamp(28px, 6vw, 56px)' }}
            >
              Choose Your Package
            </h2>
            <p className="text-white/45 text-[15px] sm:text-[17px] leading-relaxed max-w-xl mx-auto">
              Select the directory indexing speed and visibility package.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 justify-center">
            {/* ── Standard (Free) ── */}
            <motion.div
              className="border border-white/20 bg-white/[0.01] rounded-2xl p-8 flex flex-col hover:border-white/40 transition-colors"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <p className="text-white/40 text-[12px] tracking-[0.15em] uppercase mb-3">Standard</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-white text-[42px] font-light tracking-tight">Free</span>
              </div>
              <p className="text-white/40 text-[13px] leading-relaxed mb-8">
                Basic directory listing with a queue waiting time.
              </p>
              <ul className="flex flex-col gap-3 mb-10 flex-1">
                <li className="flex items-center gap-3 text-white/60 text-[13px]">
                  <span className="text-white/30">✓</span> Standard listing
                </li>
                <li className="flex items-center gap-3 text-white/60 text-[13px]">
                  <span className="text-white/30">✓</span> 3-4 Weeks queue wait time
                </li>
                <li className="flex items-center gap-3 text-white/60 text-[13px]">
                  <span className="text-white/30">✓</span> Do-follow Backlink
                </li>
              </ul>
              <button
                onClick={() => { setInitialPlan('standard'); setIsSubmitModalOpen(true); }}
                className="w-full h-[50px] bg-transparent border border-white/20 text-white rounded-lg font-medium text-[15px] hover:bg-white/5 transition-colors cursor-pointer"
              >
                Submit Free
              </button>
            </motion.div>

            {/* ── Express (Priority) ── */}
            <motion.div
              className="border-2 border-red-500/40 bg-black/60 shadow-[0_0_15px_rgba(239,68,68,0.05)] rounded-2xl p-8 flex flex-col relative hover:border-red-500/70 transition-colors"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="bg-red-600 text-white text-[11px] font-bold tracking-[0.1em] uppercase px-4 py-1.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                  Most Popular
                </span>
              </div>
              <p className="text-red-400 text-[12px] tracking-[0.15em] uppercase mb-3 font-semibold">Express</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-white text-[42px] font-light tracking-tight">$29.00</span>
                <span className="text-white/30 text-[14px]">/one-time</span>
              </div>
              <p className="text-white/40 text-[13px] leading-relaxed mb-8">
                Fast-track listing to launch your AI startup within 24 hours.
              </p>
              <ul className="flex flex-col gap-3 mb-10 flex-1">
                <li className="flex items-center gap-3 text-white/60 text-[13px]">
                  <span className="text-white/30">✓</span> Everything in Standard
                </li>
                <li className="flex items-center gap-3 text-white/60 text-[13px]">
                  <span className="text-red-400">✓</span> Guarenteed 24h Indexing
                </li>
                <li className="flex items-center gap-3 text-white/60 text-[13px]">
                  <span className="text-red-400">✓</span> Priority support
                </li>
              </ul>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setInitialPlan('express'); setIsSubmitModalOpen(true); }}
                  className="w-full h-[50px] bg-red-600 text-white rounded-lg font-semibold text-[15px] hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Submit Express
                </button>
              </div>
            </motion.div>

            {/* ── Featured (Featured) ── */}
            <motion.div
              className="border-2 border-[#00ffcc]/30 bg-black/60 shadow-[0_0_15px_rgba(0,255,200,0.05)] rounded-2xl p-8 flex flex-col hover:border-[#00ffcc]/60 transition-colors"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <p className="text-[#00ffcc] text-[12px] tracking-[0.15em] uppercase mb-3 font-semibold">Featured</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-white text-[42px] font-light tracking-tight">$79.00</span>
                <span className="text-white/30 text-[14px]">/7 days</span>
              </div>
              <p className="text-white/40 text-[13px] leading-relaxed mb-8">
                Express indexing plus premium top page exposure.
              </p>
              <ul className="flex flex-col gap-3 mb-10 flex-1">
                <li className="flex items-center gap-3 text-white/60 text-[13px]">
                  <span className="text-white/30">✓</span> Everything in Express
                </li>
                <li className="flex items-center gap-3 text-white/60 text-[13px]">
                  <span className="text-[#00ffcc]">✓</span> Top Page Featured placement
                </li>
                <li className="flex items-center gap-3 text-white/60 text-[13px]">
                  <span className="text-[#00ffcc]">✓</span> Newsletter promotion
                </li>
              </ul>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setInitialPlan('featured'); setIsSubmitModalOpen(true); }}
                  className="w-full h-[50px] bg-[#00ffcc] text-black rounded-lg font-semibold text-[15px] hover:bg-[#00d1a7] transition-colors cursor-pointer"
                >
                  Submit Featured
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="bg-black overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[400px]">
          {/* Left: Video */}
          <div className="md:w-1/2 h-[300px] md:h-auto relative">
            {VIDEO_URLS.footer ? (
              <video
                src={VIDEO_URLS.footer}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <div className="absolute inset-0 bg-white/5" />
            )}
          </div>

          {/* Right: Content */}
          <div className="md:w-1/2 flex flex-col justify-between p-10 sm:p-16">
            <div>
              <p className="text-[15px] font-medium text-white/70 tracking-tight mb-8">
                {SITE_CONFIG.brandName}
              </p>
              <p className="text-white/40 text-[14px] sm:text-[15px] leading-relaxed max-w-sm">
                {footer.tagline}
              </p>
            </div>

            <p className="text-white/25 text-[12px] mt-12">
              {SITE_CONFIG.copyright}
            </p>
          </div>
        </div>
      </footer>

      {/* Submit Tool Modal */}
      <SubmitToolModal
        isOpen={isSubmitModalOpen}
        onClose={() => { setIsSubmitModalOpen(false); setInitialPlan('standard'); fetchTools(); }}
        userId={user?.uid}
        initialPlan={initialPlan}
      />
    </div>
  );
}
