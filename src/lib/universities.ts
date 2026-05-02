// A pragmatic list of well-known Pakistani universities students will recognise.
// Used in the student profile dropdown. "Other" is a free-text fallback.
export const PAKISTAN_UNIVERSITIES = [
  "IBA Karachi",
  "LUMS",
  "NUST Islamabad",
  "FAST NUCES Karachi",
  "FAST NUCES Lahore",
  "FAST NUCES Islamabad",
  "Habib University",
  "GIKI",
  "NED University",
  "University of Karachi",
  "Punjab University",
  "Quaid-i-Azam University",
  "University of Engineering & Technology Lahore",
  "University of Engineering & Technology Peshawar",
  "Bahria University",
  "COMSATS University Islamabad",
  "Air University",
  "International Islamic University Islamabad",
  "Aga Khan University",
  "Iqra University",
  "SZABIST",
  "Hamdard University",
  "Karachi University Business School",
  "Other",
] as const;

export type PakistanUniversity = (typeof PAKISTAN_UNIVERSITIES)[number];
