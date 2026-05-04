import { SUPPORT_EMAIL } from '../constants/brand';

export type FaqItem = { question: string; answer: string };
export type FaqCategory = { category: string; faqs: FaqItem[] };

export const faqCategories: FaqCategory[] = [
  {
    category: 'Getting Started',
    faqs: [
      {
        question: 'What is Cosmic Heroes?',
        answer:
          'Cosmic Heroes (mythicalhero.me) is an AI-powered experience where you create a fantasy hero from your birth date and a name. You get AI-generated portraits and a personalized backstory inspired by Western and Chinese zodiac traits. You can save heroes to your account, upgrade with Stripe for premium features, and explore shared story adventures.',
      },
      {
        question: 'How do I create my own hero?',
        answer:
          'Create a free account, open Create Hero, enter your birth date and hero name, then generate. Your hero is saved to your account. Premium and optional chapter unlocks are available in-app when you want the full experience.',
      },
      {
        question: 'Do I need cryptocurrency to use Cosmic Heroes?',
        answer:
          'No. Core access uses email login and card checkout via Stripe. Crypto is not required to create heroes or unlock premium in the app today.',
      },
    ],
  },
  {
    category: 'Account & Billing',
    faqs: [
      {
        question: 'How do I create an account?',
        answer:
          'Use Register on the site, enter your name, email, and password, then confirm you can sign in. After that you can open the creator flow.',
      },
      {
        question: 'What does premium unlock?',
        answer:
          'Premium is a one-time upgrade per hero that unlocks full-quality images, the full backstory, downloads, shared story participation (where applicable), and chapter flows tied to that hero—subject to product limits shown in the app.',
      },
      {
        question: 'How does billing work?',
        answer:
          'Payments are processed securely with Stripe. You will see the amount before you pay (for example premium hero unlock or optional chapter bundles). Receipts go to the email you provide at checkout.',
      },
    ],
  },
  {
    category: 'NFTs & optional on-chain features',
    faqs: [
      {
        question: 'Are heroes NFTs today?',
        answer:
          'Today Cosmic Heroes is focused on AI-generated digital content tied to your account. Optional wallet fields may be used for future on-chain features if we launch them; we will communicate clearly before any minting flow goes live.',
      },
      {
        question: 'What rights do I have to my hero content?',
        answer:
          'When you purchase premium for a hero, you receive the licensed digital goods and features described at checkout and in our Terms. We retain rights to the platform, models, and branding; your use of generated output is governed by the Terms.',
      },
      {
        question: 'Where can I learn NFT basics?',
        answer:
          'See our NFT Basics guide for general education. It explains tokens at a high level and how they could relate to digital collectibles in the future.',
      },
    ],
  },
  {
    category: 'Features & Gameplay',
    faqs: [
      {
        question: 'What are Shared Stories?',
        answer:
          'Shared Stories let participants collaborate on a room-based narrative experience. Creating or joining certain rooms may require premium on a hero—see in-app prompts.',
      },
      {
        question: 'Can I have multiple heroes?',
        answer:
          'Yes, but the free tier may limit how many unpaid heroes you can have active at once. Upgrading a hero unlocks the ability to create additional heroes according to the rules shown in the app.',
      },
      {
        question: 'Will there be updates and new features?',
        answer:
          'Yes. We ship improvements to generation quality, story features, and collaboration over time. Follow announcements on the site and blog.',
      },
    ],
  },
  {
    category: 'Technical Support',
    faqs: [
      {
        question: 'What should I do if a payment fails?',
        answer:
          'Retry after a minute, confirm your card details, and check for bank declines. If it persists, contact support with the approximate time of the attempt.',
      },
      {
        question: 'My hero image is not displaying correctly. What should I do?',
        answer:
          'Try a hard refresh, a different browser, and confirm you are signed in. If it still fails, contact support with your hero ID and a screenshot.',
      },
      {
        question: 'How can I report a bug or suggest a feature?',
        answer: `Use the Support page or email ${SUPPORT_EMAIL}. Include steps to reproduce and your browser/OS when reporting bugs.`,
      },
    ],
  },
];
