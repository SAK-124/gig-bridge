// Admin-triggered demo data reset.
// Deletes prior demo records, creates 12 students + 6 businesses, profiles, 18 gigs,
// applications across stages, and 6 hires that exercise every workflow status.
// Idempotent: re-running wipes prior demo rows and re-creates them.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO_PASSWORD = "DemoPass123!";
const DEMO_EMAIL_DOMAIN = "gigbridge.test";

type SeedUser = {
  email: string;
  full_name: string;
  role: "student" | "business";
  university?: string;
  degree?: string;
  graduation_year?: number;
  skills?: string[];
  bio?: string;
  availability?: string;
  preferred_work_type?: "remote" | "onsite" | "either";
  portfolio_links?: string[];
  company_name?: string;
  company_website?: string;
  company_description?: string;
};

const STUDENTS: SeedUser[] = [
  { email: "ayesha.khan@gigbridge.test", full_name: "Ayesha Khan", role: "student", university: "IBA Karachi", degree: "BBA Marketing", graduation_year: 2026, skills: ["Social Media", "Copywriting", "Canva"], bio: "Marketing student who loves brand storytelling and Instagram content.", availability: "15 hrs/week", preferred_work_type: "remote", portfolio_links: ["https://behance.net/ayeshakhan"] },
  { email: "hassan.ahmed@gigbridge.test", full_name: "Hassan Ahmed", role: "student", university: "LUMS", degree: "BSc Computer Science", graduation_year: 2025, skills: ["React", "TypeScript", "Node.js", "Tailwind"], bio: "Final year CS student, freelance frontend dev with 12 client projects shipped.", availability: "20 hrs/week", preferred_work_type: "remote", portfolio_links: ["https://hassanahmed.dev", "https://github.com/hassanahmed"] },
  { email: "fatima.raza@gigbridge.test", full_name: "Fatima Raza", role: "student", university: "NUST Islamabad", degree: "BS Software Engineering", graduation_year: 2027, skills: ["Python", "Data Entry", "Excel", "Power BI"], bio: "Data nerd. Comfortable with messy spreadsheets and clean dashboards.", availability: "10 hrs/week", preferred_work_type: "remote" },
  { email: "ali.shah@gigbridge.test", full_name: "Ali Shah", role: "student", university: "FAST NUCES Karachi", degree: "BSc Computer Science", graduation_year: 2026, skills: ["Video Editing", "Premiere Pro", "After Effects", "Reels"], bio: "I cut reels for 8 Karachi-based brands. Quick turnarounds.", availability: "12 hrs/week", preferred_work_type: "either" },
  { email: "zara.malik@gigbridge.test", full_name: "Zara Malik", role: "student", university: "Habib University", degree: "BSc Communication & Design", graduation_year: 2025, skills: ["Graphic Design", "Illustrator", "Branding", "Logo Design"], bio: "Designer with a soft spot for South Asian colour palettes.", availability: "18 hrs/week", preferred_work_type: "remote", portfolio_links: ["https://dribbble.com/zaramalik"] },
  { email: "usman.tariq@gigbridge.test", full_name: "Usman Tariq", role: "student", university: "University of Karachi", degree: "BS Mathematics", graduation_year: 2026, skills: ["Tutoring", "Mathematics", "O-Level", "A-Level"], bio: "Mathematics tutor — A-Level and O-Level, both Cambridge & Edexcel.", availability: "8 hrs/week", preferred_work_type: "either" },
  { email: "mariam.iqbal@gigbridge.test", full_name: "Mariam Iqbal", role: "student", university: "IBA Karachi", degree: "BBA Finance", graduation_year: 2025, skills: ["Content Writing", "Finance", "Research", "Urdu Translation"], bio: "Long-form content writer for fintech and ed-tech blogs.", availability: "15 hrs/week", preferred_work_type: "remote" },
  { email: "bilal.qureshi@gigbridge.test", full_name: "Bilal Qureshi", role: "student", university: "GIKI", degree: "BSc Electrical Engineering", graduation_year: 2027, skills: ["Arduino", "PCB Design", "C++", "IoT"], bio: "Hardware tinkerer — builds for hackathons, ships for clients.", availability: "10 hrs/week", preferred_work_type: "onsite" },
  { email: "noor.fatima@gigbridge.test", full_name: "Noor Fatima", role: "student", university: "LUMS", degree: "BSc Anthropology", graduation_year: 2026, skills: ["Translation", "Urdu", "English", "Sindhi", "Transcription"], bio: "Trilingual writer & translator. Punctual.", availability: "12 hrs/week", preferred_work_type: "remote" },
  { email: "danish.malik@gigbridge.test", full_name: "Danish Malik", role: "student", university: "NED University", degree: "BSc Software Engineering", graduation_year: 2025, skills: ["Flutter", "Firebase", "iOS", "Android"], bio: "Cross-platform mobile dev. 6 apps on stores.", availability: "20 hrs/week", preferred_work_type: "remote", portfolio_links: ["https://github.com/danishmalik"] },
  { email: "iman.shaikh@gigbridge.test", full_name: "Iman Shaikh", role: "student", university: "Habib University", degree: "BSc Social Development", graduation_year: 2026, skills: ["Survey Design", "Research", "Notion", "Airtable"], bio: "Research assistant for 3 NGOs. Loves systems work.", availability: "8 hrs/week", preferred_work_type: "either" },
  { email: "rohail.akhtar@gigbridge.test", full_name: "Rohail Akhtar", role: "student", university: "FAST NUCES Lahore", degree: "BSc AI", graduation_year: 2027, skills: ["Python", "Machine Learning", "Data Analysis", "PyTorch"], bio: "Builds ML demos. Comfortable with Kaggle problems.", availability: "12 hrs/week", preferred_work_type: "remote" },
];

const BUSINESSES: SeedUser[] = [
  { email: "founder@kashmiriqahwa.gigbridge.test", full_name: "Hira Aslam", role: "business", company_name: "Kashmiri Qahwa Co.", company_website: "https://kashmiriqahwa.example", company_description: "DTC tea brand from Lahore, growing fast on Instagram." },
  { email: "ops@dehleez.gigbridge.test", full_name: "Adeel Faruqi", role: "business", company_name: "Dehleez Interiors", company_website: "https://dehleez.example", company_description: "Karachi-based interior design studio for residential clients." },
  { email: "hello@chaiwala.gigbridge.test", full_name: "Saad Hashmi", role: "business", company_name: "Chaiwala Café", company_website: "https://chaiwala.example", company_description: "Cafe chain across Lahore, Karachi & Islamabad." },
  { email: "team@bytebazaar.gigbridge.test", full_name: "Sundas Naveed", role: "business", company_name: "ByteBazaar", company_website: "https://bytebazaar.example", company_description: "E-commerce platform for Pakistani artisans." },
  { email: "founder@padosi.gigbridge.test", full_name: "Asad Khan", role: "business", company_name: "Padosi Tutoring", company_website: "https://padosi.example", company_description: "On-demand neighbourhood tutoring marketplace." },
  { email: "support@minarstack.gigbridge.test", full_name: "Maham Ali", role: "business", company_name: "MinarStack", company_website: "https://minarstack.example", company_description: "Pakistan-focused dev tools and training programs." },
];

type GigSeed = {
  key: string;
  business_email: string;
  title: string;
  category: string;
  description: string;
  required_skills: string[];
  budget: number;
  deadline_offset_days: number;
  location: "remote" | "onsite" | "hybrid";
  slots: number;
  status?: "open" | "in_progress" | "completed" | "closed";
};

const GIGS: GigSeed[] = [
  { key: "instagram-reels-1", business_email: "founder@kashmiriqahwa.gigbridge.test", title: "10 Instagram Reels for Ramadan campaign", category: "Social Media", description: "We need 10 vertical reels (15–30s) for our Ramadan launch. Cosy, candle-lit aesthetic — references will be shared. Footage shot in Lahore.", required_skills: ["Reels", "Premiere Pro", "Video Editing"], budget: 25000, deadline_offset_days: 14, location: "remote", slots: 1 },
  { key: "logo-redesign", business_email: "ops@dehleez.gigbridge.test", title: "Logo & wordmark refresh", category: "Graphic Design", description: "We've outgrown our 2019 logo. Looking for a refined wordmark and a small icon system. South-Asian motifs welcome.", required_skills: ["Logo Design", "Branding", "Illustrator"], budget: 18000, deadline_offset_days: 21, location: "remote", slots: 1 },
  { key: "menu-pdf", business_email: "hello@chaiwala.gigbridge.test", title: "Café menu redesign (PDF + Print)", category: "Graphic Design", description: "Two-page menu, both English and Urdu, print-ready. Brand fonts will be shared. Should print clean at A3.", required_skills: ["Graphic Design", "Illustrator"], budget: 12000, deadline_offset_days: 10, location: "remote", slots: 1 },
  { key: "shopify-theme", business_email: "team@bytebazaar.gigbridge.test", title: "Shopify theme tweaks (Liquid)", category: "Web Dev", description: "Customise an existing Shopify theme — change product card layout, add a category mega-menu, and a sticky filter bar.", required_skills: ["Shopify", "Liquid", "JavaScript", "CSS"], budget: 35000, deadline_offset_days: 18, location: "remote", slots: 1 },
  { key: "math-tutor", business_email: "founder@padosi.gigbridge.test", title: "A-Level Maths tutor (DHA Karachi)", category: "Tutoring", description: "Weekly 2-hour sessions, P1+P3, until A-Level exams. Student is currently a B grade, target is A*.", required_skills: ["Mathematics", "A-Level", "Tutoring"], budget: 6000, deadline_offset_days: 60, location: "onsite", slots: 1 },
  { key: "blog-content", business_email: "support@minarstack.gigbridge.test", title: "8 blog posts on dev tools (1500 words each)", category: "Content Writing", description: "We publish weekly. Need 8 posts on dev tools — VS Code, Postman, Docker, etc. SEO-friendly, with code snippets.", required_skills: ["Content Writing", "Technical Writing", "SEO"], budget: 28000, deadline_offset_days: 30, location: "remote", slots: 1 },
  { key: "data-cleanup", business_email: "team@bytebazaar.gigbridge.test", title: "Clean up 4,500 rows of vendor data (Excel)", category: "Data Entry", description: "De-dup, normalise phone numbers (+92 format), validate emails, fix CNIC casing. Pivot table at the end.", required_skills: ["Excel", "Data Entry"], budget: 8000, deadline_offset_days: 7, location: "remote", slots: 1 },
  { key: "translation-ur-en", business_email: "support@minarstack.gigbridge.test", title: "Urdu → English translation: 12,000 words", category: "Translation", description: "Translate 12k words of help-centre articles from Urdu to natural English. Tech-product context.", required_skills: ["Translation", "Urdu", "English"], budget: 18000, deadline_offset_days: 20, location: "remote", slots: 1 },
  { key: "react-landing", business_email: "team@bytebazaar.gigbridge.test", title: "React landing page for new vertical", category: "Web Dev", description: "Build a single-page marketing site in React + Tailwind. Designs in Figma. CMS-free, deploy to Vercel.", required_skills: ["React", "Tailwind", "TypeScript"], budget: 32000, deadline_offset_days: 14, location: "remote", slots: 1 },
  { key: "podcast-edit", business_email: "founder@kashmiriqahwa.gigbridge.test", title: "Podcast editing — 6 episodes", category: "Video Editing", description: "Editing for our founder podcast. Remove ums/uhs, add intro/outro music, normalise audio. ~45 min each.", required_skills: ["Audio Editing", "Audacity", "Podcast"], budget: 15000, deadline_offset_days: 21, location: "remote", slots: 1 },
  { key: "research-survey", business_email: "founder@padosi.gigbridge.test", title: "Parent survey of 100 households (Karachi)", category: "Research", description: "Field a 12-question survey to 100 parents across Karachi. We provide the questions; you handle outreach + data entry.", required_skills: ["Research", "Survey Design", "Urdu"], budget: 22000, deadline_offset_days: 25, location: "hybrid", slots: 2 },
  { key: "iconset", business_email: "ops@dehleez.gigbridge.test", title: "Custom icon set (24 icons)", category: "Graphic Design", description: "24 line icons for our website. Consistent stroke weight, subtle South-Asian flair. SVG handoff.", required_skills: ["Illustrator", "Icon Design"], budget: 14000, deadline_offset_days: 15, location: "remote", slots: 1 },
  { key: "flutter-app", business_email: "team@bytebazaar.gigbridge.test", title: "Flutter checkout flow rewrite", category: "Mobile Dev", description: "Rewrite our 4-screen checkout flow. State management with Riverpod. Backend stays the same.", required_skills: ["Flutter", "Dart", "Riverpod"], budget: 45000, deadline_offset_days: 28, location: "remote", slots: 1 },
  { key: "tiktok-creator", business_email: "founder@kashmiriqahwa.gigbridge.test", title: "TikTok creator — 4 videos / week", category: "Social Media", description: "On-camera creator to make 4 TikToks/week from our Karachi studio. Snacks provided.", required_skills: ["TikTok", "On-Camera"], budget: 30000, deadline_offset_days: 30, location: "onsite", slots: 1 },
  { key: "ml-prototype", business_email: "support@minarstack.gigbridge.test", title: "ML prototype: classify support tickets", category: "Data Science", description: "Build a small classifier for incoming support tickets (5 classes). Notebook + brief writeup.", required_skills: ["Python", "Machine Learning", "scikit-learn"], budget: 22000, deadline_offset_days: 21, location: "remote", slots: 1 },
  { key: "menu-photography", business_email: "hello@chaiwala.gigbridge.test", title: "Menu photography — 30 dishes (Lahore)", category: "Photography", description: "Studio shoot for 30 menu items. Half-day session. Edited JPGs delivered in 5 days.", required_skills: ["Photography", "Lightroom"], budget: 20000, deadline_offset_days: 12, location: "onsite", slots: 1 },
  { key: "tutor-physics", business_email: "founder@padosi.gigbridge.test", title: "O-Level Physics weekend tutor", category: "Tutoring", description: "Weekend tutoring for two siblings. 2 hours each Sat & Sun. Cambridge syllabus. Defence Phase 5.", required_skills: ["Physics", "O-Level", "Tutoring"], budget: 8000, deadline_offset_days: 90, location: "onsite", slots: 1 },
  { key: "automation-script", business_email: "support@minarstack.gigbridge.test", title: "Python script: scrape & schedule LinkedIn posts", category: "Web Dev", description: "Small automation: pull approved drafts from a Google Sheet, post to LinkedIn at scheduled times.", required_skills: ["Python", "Selenium", "Google Sheets API"], budget: 16000, deadline_offset_days: 18, location: "remote", slots: 1 },
];

// Hires we want to demo — covers every status badge.
type HireSeed = {
  gig_key: string;
  student_email: string;
  status: "awaiting_payment" | "payment_received" | "in_progress" | "submitted" | "revision_requested" | "approved" | "payout_pending" | "paid" | "disputed";
  payment_status?: "awaiting" | "received" | "payout_pending" | "paid" | "disputed";
  business_proof?: boolean;
  submission?: { message: string; link_url?: string; status: "submitted" | "revision_requested" | "approved" };
};

const HIRES: HireSeed[] = [
  { gig_key: "instagram-reels-1", student_email: "ayesha.khan@gigbridge.test", status: "awaiting_payment", payment_status: "awaiting" },
  { gig_key: "shopify-theme", student_email: "hassan.ahmed@gigbridge.test", status: "in_progress", payment_status: "received", business_proof: true },
  { gig_key: "blog-content", student_email: "mariam.iqbal@gigbridge.test", status: "submitted", payment_status: "received", business_proof: true, submission: { message: "First 4 posts attached. Drafts ready in Google Docs.", link_url: "https://docs.google.com/document/d/demo-mariam-blog", status: "submitted" } },
  { gig_key: "logo-redesign", student_email: "zara.malik@gigbridge.test", status: "revision_requested", payment_status: "received", business_proof: true, submission: { message: "Round 1 logo concepts. Three directions for review.", link_url: "https://dribbble.com/demo/zara-logo-r1", status: "revision_requested" } },
  { gig_key: "data-cleanup", student_email: "fatima.raza@gigbridge.test", status: "payout_pending", payment_status: "payout_pending", business_proof: true, submission: { message: "Cleaned file delivered with pivot. CNIC normalisation has 12 manual flags noted in tab 4.", link_url: "https://drive.google.com/file/d/demo-fatima-data", status: "approved" } },
  { gig_key: "podcast-edit", student_email: "ali.shah@gigbridge.test", status: "paid", payment_status: "paid", business_proof: true, submission: { message: "All 6 episodes mastered and uploaded to Drive.", link_url: "https://drive.google.com/drive/folders/demo-ali-podcast", status: "approved" } },
  { gig_key: "translation-ur-en", student_email: "noor.fatima@gigbridge.test", status: "disputed", payment_status: "disputed", business_proof: true, submission: { message: "Delivered the 12k words. Some glossary terms still under review.", link_url: "https://docs.google.com/document/d/demo-noor-translation", status: "submitted" } },
];

// Applications spread across multiple gigs (some hired, some pending, some shortlisted).
type AppSeed = { gig_key: string; student_email: string; status: "pending" | "shortlisted" | "rejected" | "hired"; cover_letter: string };

const APPLICATIONS: AppSeed[] = [
  // Applications matching hires — must exist with status=hired
  { gig_key: "instagram-reels-1", student_email: "ayesha.khan@gigbridge.test", status: "hired", cover_letter: "I've shipped reels for 3 Lahore F&B brands — examples in my Behance. Available immediately." },
  { gig_key: "shopify-theme", student_email: "hassan.ahmed@gigbridge.test", status: "hired", cover_letter: "I've done two Shopify theme overhauls. Comfortable with Liquid + Section JSON. Can start this week." },
  { gig_key: "blog-content", student_email: "mariam.iqbal@gigbridge.test", status: "hired", cover_letter: "Tech blog writer for two SaaS clients. Can deliver one post/week without losing voice." },
  { gig_key: "logo-redesign", student_email: "zara.malik@gigbridge.test", status: "hired", cover_letter: "I designed Habib University's student-org branding system. South-Asian motifs are my favourite playground." },
  { gig_key: "data-cleanup", student_email: "fatima.raza@gigbridge.test", status: "hired", cover_letter: "Excel-fluent. Done a similar 6k-row cleanup last month." },
  { gig_key: "podcast-edit", student_email: "ali.shah@gigbridge.test", status: "hired", cover_letter: "Audio editing is my main side hustle — 40 episodes shipped this year." },
  { gig_key: "translation-ur-en", student_email: "noor.fatima@gigbridge.test", status: "hired", cover_letter: "Trilingual. Tech context is fine — I've translated SaaS help docs before." },

  // Other pending/shortlisted/rejected applications across many gigs
  { gig_key: "instagram-reels-1", student_email: "ali.shah@gigbridge.test", status: "shortlisted", cover_letter: "I cut reels weekly for two restaurants. Fast turnaround." },
  { gig_key: "instagram-reels-1", student_email: "zara.malik@gigbridge.test", status: "pending", cover_letter: "Designer, comfortable with motion + colour grading." },
  { gig_key: "logo-redesign", student_email: "mariam.iqbal@gigbridge.test", status: "rejected", cover_letter: "Writer, but happy to art-direct from the brand side." },
  { gig_key: "menu-pdf", student_email: "zara.malik@gigbridge.test", status: "shortlisted", cover_letter: "Bilingual print design is my comfort zone. Sample available." },
  { gig_key: "menu-pdf", student_email: "ayesha.khan@gigbridge.test", status: "pending", cover_letter: "Marketing student who has worked with cafes on print." },
  { gig_key: "shopify-theme", student_email: "danish.malik@gigbridge.test", status: "shortlisted", cover_letter: "Mobile dev, but I've done 4 Shopify themes for friends." },
  { gig_key: "math-tutor", student_email: "usman.tariq@gigbridge.test", status: "shortlisted", cover_letter: "A* in A-Level Maths myself. 30+ tutoring hours." },
  { gig_key: "blog-content", student_email: "noor.fatima@gigbridge.test", status: "pending", cover_letter: "Writer with strong SEO chops. Samples on request." },
  { gig_key: "blog-content", student_email: "rohail.akhtar@gigbridge.test", status: "shortlisted", cover_letter: "I write Kaggle writeups — happy to apply that to dev tools." },
  { gig_key: "data-cleanup", student_email: "iman.shaikh@gigbridge.test", status: "pending", cover_letter: "Research assistant. Excel + Airtable daily." },
  { gig_key: "translation-ur-en", student_email: "mariam.iqbal@gigbridge.test", status: "shortlisted", cover_letter: "I've translated 4 fintech help-centres." },
  { gig_key: "react-landing", student_email: "hassan.ahmed@gigbridge.test", status: "shortlisted", cover_letter: "React + Tailwind is daily work for me." },
  { gig_key: "react-landing", student_email: "danish.malik@gigbridge.test", status: "pending", cover_letter: "Mobile primarily, but the React stack carries over." },
  { gig_key: "podcast-edit", student_email: "ayesha.khan@gigbridge.test", status: "pending", cover_letter: "Comfortable with Audacity. Have edited a college podcast." },
  { gig_key: "research-survey", student_email: "iman.shaikh@gigbridge.test", status: "shortlisted", cover_letter: "Field research is my main work — 3 NGO projects." },
  { gig_key: "research-survey", student_email: "noor.fatima@gigbridge.test", status: "pending", cover_letter: "Trilingual + comfortable interviewing parents." },
  { gig_key: "iconset", student_email: "zara.malik@gigbridge.test", status: "pending", cover_letter: "Icon design is something I love." },
  { gig_key: "flutter-app", student_email: "danish.malik@gigbridge.test", status: "shortlisted", cover_letter: "I've shipped two Flutter apps with Riverpod. Quick port-over." },
  { gig_key: "tiktok-creator", student_email: "ayesha.khan@gigbridge.test", status: "shortlisted", cover_letter: "On-camera doesn't scare me. Karachi-based." },
  { gig_key: "ml-prototype", student_email: "rohail.akhtar@gigbridge.test", status: "shortlisted", cover_letter: "Ticket classification is a textbook problem — happy to start tomorrow." },
  { gig_key: "ml-prototype", student_email: "fatima.raza@gigbridge.test", status: "pending", cover_letter: "Data analyst leaning into ML." },
  { gig_key: "menu-photography", student_email: "ali.shah@gigbridge.test", status: "pending", cover_letter: "Have worked with two restaurants on menu shoots." },
  { gig_key: "tutor-physics", student_email: "usman.tariq@gigbridge.test", status: "shortlisted", cover_letter: "Physics second favourite after maths. Defence-area tutoring is convenient." },
  { gig_key: "automation-script", student_email: "rohail.akhtar@gigbridge.test", status: "pending", cover_letter: "Python automation — done a similar script for Twitter." },
  { gig_key: "automation-script", student_email: "hassan.ahmed@gigbridge.test", status: "pending", cover_letter: "Comfortable with Selenium + APIs." },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { data: roleRow } = await userClient.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (roleRow?.role !== "admin") return json({ error: "Admin only" }, 403);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const allUsers = [...STUDENTS, ...BUSINESSES];
    const userIdByEmail: Record<string, string> = {};

    for (const u of allUsers) {
      const id = await ensureUser(admin, u);
      userIdByEmail[u.email] = id;
    }

    // Wipe prior demo records (cascades clean up apps/hires/payments/submissions).
    const demoUserIds = Object.values(userIdByEmail);
    await admin.from("hires").delete().in("business_id", demoUserIds);
    await admin.from("hires").delete().in("student_id", demoUserIds);
    await admin.from("applications").delete().in("student_id", demoUserIds);
    await admin.from("gigs").delete().in("business_id", demoUserIds);

    // Update profiles with rich demo data.
    for (const u of allUsers) {
      const userId = userIdByEmail[u.email];
      const profileUpdate: Record<string, unknown> = {
        full_name: u.full_name,
        bio: u.bio ?? null,
      };
      if (u.role === "student") {
        Object.assign(profileUpdate, {
          university: u.university ?? null,
          degree: u.degree ?? null,
          graduation_year: u.graduation_year ?? null,
          skills: u.skills ?? [],
          availability: u.availability ?? null,
          preferred_work_type: u.preferred_work_type ?? "either",
          portfolio_links: u.portfolio_links ?? [],
        });
      } else {
        Object.assign(profileUpdate, {
          company_name: u.company_name ?? null,
          company_website: u.company_website ?? null,
          company_description: u.company_description ?? null,
        });
      }
      await admin.from("profiles").update(profileUpdate).eq("user_id", userId);

      // Seed bank details for students so admin can show them in the payouts table.
      if (u.role === "student") {
        await admin.from("bank_details").upsert({
          user_id: userId,
          account_title: u.full_name,
          bank_name: "Meezan Bank",
          iban: `PK00MEZN${userId.replace(/-/g, "").slice(0, 16).toUpperCase()}`,
          easypaisa: "0300" + Math.floor(1000000 + Math.random() * 8999999).toString(),
        }, { onConflict: "user_id" });
      }
    }

    // Insert gigs
    const gigIdByKey: Record<string, string> = {};
    for (const g of GIGS) {
      const businessId = userIdByEmail[g.business_email];
      if (!businessId) continue;
      const deadline = new Date(Date.now() + g.deadline_offset_days * 86400000).toISOString().slice(0, 10);
      const { data, error } = await admin.from("gigs").insert({
        business_id: businessId,
        title: g.title,
        category: g.category,
        description: g.description,
        required_skills: g.required_skills,
        budget: g.budget,
        deadline,
        location: g.location,
        slots: g.slots,
        status: g.status ?? "open",
      }).select("id").single();
      if (error) { console.error("gig insert", g.key, error); continue; }
      gigIdByKey[g.key] = data.id;
    }

    // Insert applications
    const appIdByKey: Record<string, string> = {};
    for (const a of APPLICATIONS) {
      const gigId = gigIdByKey[a.gig_key];
      const studentId = userIdByEmail[a.student_email];
      if (!gigId || !studentId) continue;
      const { data, error } = await admin.from("applications").insert({
        gig_id: gigId,
        student_id: studentId,
        cover_letter: a.cover_letter,
        status: a.status,
      }).select("id").single();
      if (error) { console.error("app insert", a.gig_key, a.student_email, error); continue; }
      appIdByKey[`${a.gig_key}::${a.student_email}`] = data.id;
    }

    // Insert hires + payments + submissions
    for (const h of HIRES) {
      const gigId = gigIdByKey[h.gig_key];
      const studentId = userIdByEmail[h.student_email];
      const gigSeed = GIGS.find((g) => g.key === h.gig_key);
      if (!gigId || !studentId || !gigSeed) continue;

      const businessId = userIdByEmail[gigSeed.business_email];
      const applicationId = appIdByKey[`${h.gig_key}::${h.student_email}`];

      const { data: hireRow, error: hireErr } = await admin.from("hires").insert({
        gig_id: gigId,
        student_id: studentId,
        business_id: businessId,
        application_id: applicationId,
        status: h.status,
      }).select("id").single();
      if (hireErr) { console.error("hire insert", h.gig_key, hireErr); continue; }

      const platformFee = Math.round(gigSeed.budget * 0.1);
      const total = gigSeed.budget + platformFee;
      const paymentRow: Record<string, unknown> = {
        hire_id: hireRow.id,
        gig_amount: gigSeed.budget,
        platform_fee: platformFee,
        total_amount: total,
        currency: "PKR",
        status: h.payment_status ?? "awaiting",
      };
      if (h.business_proof) {
        paymentRow.business_proof_reference = `GB-${hireRow.id.slice(0, 8).toUpperCase()}`;
        paymentRow.business_proof_uploaded_at = new Date(Date.now() - 86400000).toISOString();
      }
      if (h.payment_status === "paid") {
        paymentRow.payout_method = "Bank transfer";
        paymentRow.payout_reference = `PAYOUT-${hireRow.id.slice(0, 6).toUpperCase()}`;
        paymentRow.paid_to_student_at = new Date().toISOString();
        paymentRow.admin_payout_proof_uploaded_at = new Date().toISOString();
      }
      if (h.payment_status === "received" || h.payment_status === "payout_pending" || h.payment_status === "paid") {
        paymentRow.admin_verified_at = new Date(Date.now() - 43200000).toISOString();
      }
      await admin.from("payments").insert(paymentRow);

      if (h.submission) {
        await admin.from("submissions").insert({
          hire_id: hireRow.id,
          message: h.submission.message,
          link_url: h.submission.link_url ?? null,
          status: h.submission.status,
        });
      }
    }

    return json({
      ok: true,
      created_users: allUsers.length,
      created_gigs: Object.keys(gigIdByKey).length,
      created_applications: Object.keys(appIdByKey).length,
      created_hires: HIRES.length,
      demo_password: DEMO_PASSWORD,
      demo_email_domain: DEMO_EMAIL_DOMAIN,
    });
  } catch (e) {
    console.error("reset-demo error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

async function ensureUser(admin: SupabaseClient, u: SeedUser): Promise<string> {
  // Try to find an existing user by email via the admin listUsers API (paginated).
  let existingId: string | undefined;
  let page = 1;
  // Stop after a few pages — demo set is tiny in absolute terms.
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data) break;
    const match = data.users.find((row) => row.email?.toLowerCase() === u.email.toLowerCase());
    if (match) { existingId = match.id; break; }
    if (data.users.length < 200) break;
    page += 1;
  }

  if (existingId) {
    await admin.auth.admin.updateUserById(existingId, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: u.full_name },
    });
    await admin.from("user_roles").upsert({ user_id: existingId, role: u.role }, { onConflict: "user_id,role" });
    return existingId;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: u.full_name },
  });
  if (error || !data.user) throw new Error(`Failed to create user ${u.email}: ${error?.message}`);

  await admin.from("user_roles").upsert({ user_id: data.user.id, role: u.role }, { onConflict: "user_id,role" });
  return data.user.id;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
