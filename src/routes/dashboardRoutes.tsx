import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, Search, FileText, Briefcase, Wallet, User, Send, Users, Building } from "lucide-react";
import StudentHome from "@/pages/student/StudentHome";
import BrowseGigs from "@/pages/student/BrowseGigs";
import GigDetail from "@/pages/student/GigDetail";
import StudentApplications from "@/pages/student/StudentApplications";
import ActiveWork from "@/pages/student/ActiveWork";
import StudentPayments from "@/pages/student/StudentPayments";
import StudentProfile from "@/pages/student/StudentProfile";
import BusinessHome from "@/pages/business/BusinessHome";
import PostGig from "@/pages/business/PostGig";
import Applicants from "@/pages/business/Applicants";
import ActiveGigs from "@/pages/business/ActiveGigs";
import BusinessPayments from "@/pages/business/BusinessPayments";
import CompanyProfile from "@/pages/business/CompanyProfile";

const studentNav = [
  { to: "/student", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/gigs", label: "Browse Gigs", icon: Search },
  { to: "/student/applications", label: "My Applications", icon: FileText },
  { to: "/student/active", label: "Active Work", icon: Briefcase },
  { to: "/student/payments", label: "Payments", icon: Wallet },
  { to: "/student/profile", label: "Profile", icon: User },
];

const businessNav = [
  { to: "/business", label: "Dashboard", icon: LayoutDashboard },
  { to: "/business/post", label: "Post a Gig", icon: Send },
  { to: "/business/applicants", label: "Applicants", icon: Users },
  { to: "/business/gigs", label: "Active Gigs", icon: Briefcase },
  { to: "/business/payments", label: "Payments", icon: Wallet },
  { to: "/business/company", label: "Company", icon: Building },
];

export const StudentRoutes = () => (
  <Routes>
    <Route element={<DashboardLayout items={studentNav} expectedRole="student" />}>
      <Route index element={<StudentHome />} />
      <Route path="gigs" element={<BrowseGigs />} />
      <Route path="gigs/:id" element={<GigDetail />} />
      <Route path="applications" element={<StudentApplications />} />
      <Route path="active" element={<ActiveWork />} />
      <Route path="payments" element={<StudentPayments />} />
      <Route path="profile" element={<StudentProfile />} />
      <Route path="*" element={<Navigate to="/student" replace />} />
    </Route>
  </Routes>
);

export const BusinessRoutes = () => (
  <Routes>
    <Route element={<DashboardLayout items={businessNav} expectedRole="business" />}>
      <Route index element={<BusinessHome />} />
      <Route path="post" element={<PostGig />} />
      <Route path="applicants" element={<Applicants />} />
      <Route path="gigs" element={<ActiveGigs />} />
      <Route path="payments" element={<BusinessPayments />} />
      <Route path="company" element={<CompanyProfile />} />
      <Route path="*" element={<Navigate to="/business" replace />} />
    </Route>
  </Routes>
);
