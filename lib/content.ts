// Generated from the website's index.html (arrays P, T, M, S, G, R, F, FAC). Public marketing content.
export const IMG: Record<string, number> = {
  'about': require('../assets/images/site/about.jpg'),
  'cta-tour': require('../assets/images/site/cta-tour.jpg'),
  'f-cardio-zone': require('../assets/images/site/f-cardio-zone.jpg'),
  'f-free-weights': require('../assets/images/site/f-free-weights.jpg'),
  'f-functional-zone': require('../assets/images/site/f-functional-zone.jpg'),
  'f-locker-rooms': require('../assets/images/site/f-locker-rooms.jpg'),
  'f-personal-training': require('../assets/images/site/f-personal-training.jpg'),
  'f-recovery-area': require('../assets/images/site/f-recovery-area.jpg'),
  'f-strength-area': require('../assets/images/site/f-strength-area.jpg'),
  'g-coach-team': require('../assets/images/site/g-coach-team.jpg'),
  'g-coaching-in-progress': require('../assets/images/site/g-coaching-in-progress.jpg'),
  'g-daily-grind': require('../assets/images/site/g-daily-grind.jpg'),
  'g-dumbbell-wall': require('../assets/images/site/g-dumbbell-wall.jpg'),
  'g-head-coach': require('../assets/images/site/g-head-coach.jpg'),
  'g-hiit-squad': require('../assets/images/site/g-hiit-squad.jpg'),
  'g-locker-room': require('../assets/images/site/g-locker-room.jpg'),
  'g-main-floor': require('../assets/images/site/g-main-floor.jpg'),
  'g-post-workout': require('../assets/images/site/g-post-workout.jpg'),
  'g-power-racks': require('../assets/images/site/g-power-racks.jpg'),
  'g-saturday-crew': require('../assets/images/site/g-saturday-crew.jpg'),
  'g-technique-clinic': require('../assets/images/site/g-technique-clinic.jpg'),
  'map': require('../assets/images/site/map.jpg'),
  'p-bodybuilding': require('../assets/images/site/p-bodybuilding.jpg'),
  'p-cardio-training': require('../assets/images/site/p-cardio-training.jpg'),
  'p-cross-training': require('../assets/images/site/p-cross-training.jpg'),
  'p-functional-training': require('../assets/images/site/p-functional-training.jpg'),
  'p-hiit': require('../assets/images/site/p-hiit.jpg'),
  'p-mobility-and-flexibility': require('../assets/images/site/p-mobility-and-flexibility.jpg'),
  'p-personal-training': require('../assets/images/site/p-personal-training.jpg'),
  'p-strength-training': require('../assets/images/site/p-strength-training.jpg'),
  'p-weight-loss': require('../assets/images/site/p-weight-loss.jpg'),
  'pl-basic': require('../assets/images/site/pl-basic.jpg'),
  'pl-elite': require('../assets/images/site/pl-elite.jpg'),
  'pl-personal-training': require('../assets/images/site/pl-personal-training.jpg'),
  'pl-premium': require('../assets/images/site/pl-premium.jpg'),
  'plbanner': require('../assets/images/site/plbanner.jpg'),
  'shop': require('../assets/images/site/shop.jpg'),
  't-arjun-rao': require('../assets/images/site/t-arjun-rao.jpg'),
  't-divya-menon': require('../assets/images/site/t-divya-menon.jpg'),
  't-karan-singh': require('../assets/images/site/t-karan-singh.jpg'),
  't-meera-nair': require('../assets/images/site/t-meera-nair.jpg'),
};
export const slug = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export type Program = { name: string; slug: string; category: string; level: string; duration: string; summary: string; benefits: string; image?: number };
export const PROGRAMS: Program[] = [
  {
    "name": "Strength Training",
    "slug": "strength-training",
    "category": "Strength",
    "level": "Intermediate",
    "duration": "60 min",
    "summary": "Barbell fundamentals and progressive overload.",
    "benefits": "Raw strength, bone density"
  },
  {
    "name": "Bodybuilding",
    "slug": "bodybuilding",
    "category": "Strength",
    "level": "Advanced",
    "duration": "75 min",
    "summary": "Hypertrophy splits with technique coaching.",
    "benefits": "Muscle size, symmetry"
  },
  {
    "name": "Weight Loss",
    "slug": "weight-loss",
    "category": "Fat Loss",
    "level": "Beginner",
    "duration": "45 min",
    "summary": "Structured conditioning and nutrition habits.",
    "benefits": "Fat loss, energy"
  },
  {
    "name": "Functional Training",
    "slug": "functional-training",
    "category": "Conditioning",
    "level": "Intermediate",
    "duration": "50 min",
    "summary": "Movement patterns for everyday strength.",
    "benefits": "Balance, core, mobility"
  },
  {
    "name": "Cross Training",
    "slug": "cross-training",
    "category": "Conditioning",
    "level": "Advanced",
    "duration": "60 min",
    "summary": "Mixed-modal workouts across disciplines.",
    "benefits": "Work capacity, grit"
  },
  {
    "name": "HIIT",
    "slug": "hiit",
    "category": "Fat Loss",
    "level": "Intermediate",
    "duration": "30 min",
    "summary": "Short, intense intervals with recovery.",
    "benefits": "Stamina, calorie burn"
  },
  {
    "name": "Personal Training",
    "slug": "personal-training",
    "category": "Strength",
    "level": "All levels",
    "duration": "60 min",
    "summary": "One-to-one programming built around you.",
    "benefits": "Custom results, accountability"
  },
  {
    "name": "Cardio Training",
    "slug": "cardio-training",
    "category": "Fat Loss",
    "level": "Beginner",
    "duration": "40 min",
    "summary": "Zone-based endurance on premium machines.",
    "benefits": "Heart health, endurance"
  },
  {
    "name": "Mobility & Flexibility",
    "slug": "mobility-and-flexibility",
    "category": "Recovery",
    "level": "Beginner",
    "duration": "40 min",
    "summary": "Guided stretching and joint care.",
    "benefits": "Range of motion, recovery"
  }
].map((p) => ({ ...p, image: IMG['p-' + p.slug] }));

export type TrainerInfo = { name: string; slug: string; specialty: string; experience: string; certs: string; bio: string; quote: string; image?: number };
export const TRAINERS: TrainerInfo[] = [
  {
    "name": "Arjun Rao",
    "slug": "arjun-rao",
    "specialty": "Strength & Powerlifting",
    "experience": "12 yrs",
    "certs": "NSCA-CSCS, IPF Coach L1",
    "bio": "Former state-level powerlifter who coaches technique first.",
    "quote": "Master the basics, then earn the heavy weights."
  },
  {
    "name": "Meera Nair",
    "slug": "meera-nair",
    "specialty": "Weight Loss & Nutrition",
    "experience": "9 yrs",
    "certs": "ACE-CPT, Precision Nutrition L1",
    "bio": "Helps members build sustainable habits.",
    "quote": "Consistency beats intensity."
  },
  {
    "name": "Karan Singh",
    "slug": "karan-singh",
    "specialty": "Bodybuilding",
    "experience": "10 yrs",
    "certs": "ISSA-CPT, IFBB Pro (demo)",
    "bio": "Physique coach focused on hypertrophy.",
    "quote": "Train hard, recover harder."
  },
  {
    "name": "Divya Menon",
    "slug": "divya-menon",
    "specialty": "Mobility & Functional",
    "experience": "7 yrs",
    "certs": "FMS Level 2, RYT-200",
    "bio": "Rehab-aware coach for pain-free movement.",
    "quote": "Move well before you load."
  }
].map((t) => ({ ...t, image: IMG['t-' + t.slug] }));

// Demo prices from the website; the gym administrator must confirm them. Real plans live in the membership_plans table.
export const PLANS = [
  {
    "name": "Basic",
    "slug": "basic",
    "monthly": 1499,
    "features": [
      "Gym floor access",
      "Cardio & free weights",
      "Locker room",
      "Open 6 am\u20134 pm"
    ]
  },
  {
    "name": "Premium",
    "slug": "premium",
    "monthly": 2499,
    "features": [
      "All Basic benefits",
      "All group classes",
      "Functional zone",
      "Open all hours"
    ]
  },
  {
    "name": "Elite",
    "slug": "elite",
    "monthly": 3999,
    "features": [
      "All Premium benefits",
      "Recovery area",
      "2 PT sessions / month",
      "Guest passes"
    ]
  },
  {
    "name": "Personal Training",
    "slug": "personal-training",
    "monthly": 7999,
    "features": [
      "Dedicated coach",
      "Custom program",
      "Weekly check-ins",
      "Priority booking"
    ]
  }
].map((p) => ({ ...p, image: IMG['pl-' + p.slug] }));
export const planPrice = (monthly: number, period: 'm' | 'q' | 'a') => period === 'm' ? { amount: monthly, unit: '/ month' } : period === 'q' ? { amount: Math.round(monthly * 3 * 0.92), unit: '/ quarter' } : { amount: Math.round(monthly * 12 * 0.8), unit: '/ year' };

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const SCHEDULE = [
  {
    "day": "Mon",
    "time": "6:30 am",
    "name": "Strength Basics",
    "trainer": "Arjun Rao",
    "level": "Beginner"
  },
  {
    "day": "Mon",
    "time": "6:00 pm",
    "name": "HIIT Burn",
    "trainer": "Meera Nair",
    "level": "Intermediate"
  },
  {
    "day": "Tue",
    "time": "7:00 am",
    "name": "Bodybuilding Push",
    "trainer": "Karan Singh",
    "level": "Advanced"
  },
  {
    "day": "Tue",
    "time": "7:00 pm",
    "name": "Mobility Flow",
    "trainer": "Divya Menon",
    "level": "Beginner"
  },
  {
    "day": "Wed",
    "time": "6:30 am",
    "name": "Cross Training",
    "trainer": "Arjun Rao",
    "level": "Advanced"
  },
  {
    "day": "Wed",
    "time": "6:00 pm",
    "name": "Functional Circuit",
    "trainer": "Divya Menon",
    "level": "Intermediate"
  },
  {
    "day": "Thu",
    "time": "7:00 am",
    "name": "Fat Loss Cardio",
    "trainer": "Meera Nair",
    "level": "Beginner"
  },
  {
    "day": "Thu",
    "time": "7:00 pm",
    "name": "Bodybuilding Pull",
    "trainer": "Karan Singh",
    "level": "Advanced"
  },
  {
    "day": "Fri",
    "time": "6:30 am",
    "name": "Strength Lower",
    "trainer": "Arjun Rao",
    "level": "Intermediate"
  },
  {
    "day": "Fri",
    "time": "6:00 pm",
    "name": "HIIT Finisher",
    "trainer": "Meera Nair",
    "level": "Intermediate"
  },
  {
    "day": "Sat",
    "time": "8:00 am",
    "name": "Group Cross Training",
    "trainer": "Arjun Rao",
    "level": "All levels"
  },
  {
    "day": "Sun",
    "time": "9:00 am",
    "name": "Recovery & Stretch",
    "trainer": "Divya Menon",
    "level": "Beginner"
  }
];

export const GALLERY = [
  {
    "category": "Gym Interiors",
    "label": "Main floor",
    "slug": "main-floor"
  },
  {
    "category": "Equipment",
    "label": "Power racks",
    "slug": "power-racks"
  },
  {
    "category": "Training Sessions",
    "label": "Coaching in progress",
    "slug": "coaching-in-progress"
  },
  {
    "category": "Trainers",
    "label": "Coach team",
    "slug": "coach-team"
  },
  {
    "category": "Group Workouts",
    "label": "Saturday crew",
    "slug": "saturday-crew"
  },
  {
    "category": "Fitness Lifestyle",
    "label": "Daily grind",
    "slug": "daily-grind"
  },
  {
    "category": "Gym Interiors",
    "label": "Locker room",
    "slug": "locker-room"
  },
  {
    "category": "Equipment",
    "label": "Dumbbell wall",
    "slug": "dumbbell-wall"
  },
  {
    "category": "Training Sessions",
    "label": "Technique clinic",
    "slug": "technique-clinic"
  },
  {
    "category": "Group Workouts",
    "label": "HIIT squad",
    "slug": "hiit-squad"
  },
  {
    "category": "Fitness Lifestyle",
    "label": "Post-workout",
    "slug": "post-workout"
  },
  {
    "category": "Trainers",
    "label": "Head coach",
    "slug": "head-coach"
  }
].map((g) => ({ ...g, image: IMG['g-' + g.slug] }));

export const FACILITIES = [
  {
    "name": "Strength area",
    "slug": "strength-area"
  },
  {
    "name": "Cardio zone",
    "slug": "cardio-zone"
  },
  {
    "name": "Free weights",
    "slug": "free-weights"
  },
  {
    "name": "Functional zone",
    "slug": "functional-zone"
  },
  {
    "name": "Personal training",
    "slug": "personal-training"
  },
  {
    "name": "Locker rooms",
    "slug": "locker-rooms"
  },
  {
    "name": "Recovery area",
    "slug": "recovery-area"
  }
].map((f) => ({ ...f, image: IMG['f-' + f.slug] }));

// The website labels these reviews as fictional demo content; the app keeps that label.
export const REVIEWS = [
  {
    "name": "Rohit S.",
    "goal": "Muscle gain",
    "stars": 5,
    "text": "The coaching on my squat form changed everything. Clean, serious gym."
  },
  {
    "name": "Anita K.",
    "goal": "Weight loss",
    "stars": 5,
    "text": "Lost steadily without crash diets. The trainers keep me accountable."
  },
  {
    "name": "Vikram P.",
    "goal": "Strength",
    "stars": 4,
    "text": "Great equipment and never overcrowded. I would love more evening classes."
  }
];

export const FAQS = [
  {
    "q": "How does membership work?",
    "a": "Choose a plan, pick monthly, quarterly or annual billing and submit an enquiry. Our team confirms details."
  },
  {
    "q": "What are the gym timings?",
    "a": "We are open daily from 6:00 am to 11:00 pm. Basic plan hours are 6 am to 4 pm."
  },
  {
    "q": "Do you offer personal training?",
    "a": "Yes. One-to-one coaching is available as a dedicated plan or as add-on sessions."
  },
  {
    "q": "I am a beginner. Where do I start?",
    "a": "Begin with Strength Basics or Weight Loss. A coach will walk you through an orientation."
  },
  {
    "q": "What equipment do you have?",
    "a": "Power racks, free weights, cardio machines, functional rigs and a recovery area."
  },
  {
    "q": "Is there a free trial?",
    "a": "Yes. Use the Free Trial button to submit a demo enquiry."
  },
  {
    "q": "How do I cancel my membership?",
    "a": "Cancellation terms depend on your plan. In a real deployment, this would be handled at the front desk."
  }
];

export const GYM = {
  address: '123 Fitness Avenue, Coimbatore, Tamil Nadu, India', // placeholder on the website
  phone: '+919876543210',
  phoneLabel: '+91 98765 43210',
  email: 'hello@forgefitness.com',
  hours: 'Open daily 6:00 am – 11:00 pm',
  stats: [['12,000', 'Sq ft training floor'], ['25+', 'Certified coaches'], ['40', 'Weekly classes'], ['6 am–11 pm', 'Open daily']] as [string, string][],
};
export const ABOUT = {
  mission: 'Our mission is to make strength accessible.',
  vision: 'A community where every member, from first-timer to competitor, trains with expert guidance.',
  philosophy: 'Progressive overload, sound technique, consistent recovery.',
  intro: 'FORGE began with one conviction: serious training deserves a serious environment.',
  benefits: ['Competition-grade racks, plates and platforms', 'Coaches certified in strength, nutrition and rehab', 'Programs for every goal and every level', 'Hygienic, spacious, never overcrowded'],
};
