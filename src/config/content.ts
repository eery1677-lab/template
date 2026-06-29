// ============================================================
// Site Content Configuration — 텍스트/데이터 관리
// ============================================================
// 사이트에 표시되는 모든 텍스트를 여기서 수정할 수 있습니다.
// ============================================================

export const SITE_CONFIG = {
  // 브랜드
  brandName: 'AIHunt Global',
  copyright: '© 2026 AIHUNT GLOBAL. All rights reserved.',

  // 히어로 섹션
  hero: {
    titleLeft: ['Discover', 'Submit AI'],
    titleRight: ['Growth', 'Instant'],
    watermark: 'AIHUNTER',
    description:
      'The premier global launchpad for next-generation AI tools. Submit your AI startup, get indexed in 24 hours, and reach thousands of active tech adopters.',
  },

  // 시네마틱 텍스트 섹션
  cinematic: {
    text: 'A curated directory connecting builders with users. Submit your tools, boost your SEO with high-authority backlinks, and get featured to drive instant traffic to your AI startup.',
  },

  // 성능 지표 섹션
  metrics: {
    subtitle: 'Platform Metrics',
    items: [
      { value: '12K+', label: 'Monthly Visitors' },
      { value: '450+', label: 'AI Tools Listed' },
      { value: '24h', label: 'Fastest Indexing' },
    ],
  },

  // 기술 섹션 (플랫폼 강점 소개)
  technology: {
    title: ['Maximize', 'Visibility'],
    description:
      'Why launch on AIHunt? We specialize in showcasing early-stage AI tools to an audience of active buyers, developers, and investors.',
    features: [
      {
        title: 'SEO Boosting Backlinks',
        desc: 'Gain valuable high-quality backlinks to increase your organic Google search ranking.',
      },
      {
        title: 'Targeted Tech Traffic',
        desc: 'Put your software directly in front of buyers looking for AI productivity solutions.',
      },
      {
        title: 'Instant 24h Indexing',
        desc: 'Skip the 4-week manual queue and go live instantly with Express Submission.',
      },
      {
        title: 'Weekly Newsletter Feature',
        desc: 'Premium slots get sent directly to our base of newsletter subscribers.',
      },
    ],
  },

  // 아키텍처 섹션
  architecture: {
    subtitle: 'Submission Process',
    heading: 'Three steps. Max traffic.',
    description:
      'Choose your package, fill in your product details, and watch your tool gain global traffic.',
    layers: [
      { num: 1, name: 'Select Plan' },
      { num: 2, name: 'Submit Details' },
      { num: 3, name: 'Get Traffic' },
    ],
  },

  // 푸터
  footer: {
    tagline:
      'The ultimate directory of artificial intelligence tools. Built for tech founders who refuse to build in silence.',
  },

  // 네비게이션
  nav: {
    links: [
      { label: 'Browse', scrollMultiplier: 1 },
      { label: 'Stats', scrollMultiplier: 2 },
    ],
    downloadLabel: 'Submit Tool',
  },
};
