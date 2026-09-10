import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";

// Public Pages
import HomePage from "../pages/public/HomePage";
import DormListPage from "../pages/public/DormListPage";
import DormDetailPage from "../pages/public/DormDetailPage";
import LoginPage from "../pages/public/LoginPage";
import RegisterPage from "../pages/public/RegisterPage";
import AboutPage from "../pages/public/AboutPage";
import ContactPage from "../pages/public/ContactPage";

// User Pages
import UserDashboard from "../pages/user/UserDashboard";
import UserProfile from "../pages/user/UserProfile";
import UserFavorites from "../pages/user/UserFavorites";
import UserBookings from "../pages/user/UserBookings";
import UserReviews from "../pages/user/UserReviews";
import UserMessages from "../pages/user/UserMessages";
import UserNotifications from "../pages/user/UserNotifications";

// Owner Pages
import OwnerDashboard from "../pages/owner/OwnerDashboard";
import OwnerProfile from "../pages/owner/OwnerProfile";
import OwnerDormitories from "../pages/owner/OwnerDormitories";
import CreateDormitory from "../pages/owner/CreateDormitory";
import EditDormitory from "../pages/owner/EditDormitory";
import OwnerRooms from "../pages/owner/OwnerRooms";
import OwnerBookings from "../pages/owner/OwnerBookings";
import OwnerReviews from "../pages/owner/OwnerReviews";
import OwnerMessages from "../pages/owner/OwnerMessages";
import OwnerNotifications from "../pages/owner/OwnerNotifications";

// Common Pages
import ViewHistoryPage from "../pages/common/ViewHistoryPage";

// Admin Pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminProfile from "../pages/admin/AdminProfile";
import AdminMessages from "../pages/admin/AdminMessages";
import AdminNotifications from "../pages/admin/AdminNotifications";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminOwners from "../pages/admin/AdminOwners";
import AdminDormitories from "../pages/admin/AdminDormitories";
import AdminBookings from "../pages/admin/AdminBookings";
import AdminReviews from "../pages/admin/AdminReviews";
import AdminReports from "../pages/admin/AdminReports";
import AdminLogs from "../pages/admin/AdminLogs";
import AdminLocations from "../pages/admin/AdminLocations";
import AdminSettings from "../pages/admin/AdminSettings";

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/dorms" element={<DormListPage />} />
        <Route path="/dorms/:id" element={<DormDetailPage />} />
        <Route path="/dormitories/:id" element={<DormDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* 2. User Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/profile" element={<UserProfile />} />
          <Route path="/user/favorites" element={<UserFavorites />} />
          <Route path="/user/history" element={<ViewHistoryPage />} />
          <Route path="/user/bookings" element={<UserBookings />} />
          <Route path="/user/reviews" element={<UserReviews />} />
          <Route path="/user/messages" element={<UserMessages />} />
          <Route path="/user/notifications" element={<UserNotifications />} />
        </Route>
      </Route>

      {/* 3. Owner Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={["owner"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/profile" element={<OwnerProfile />} />
          <Route path="/owner/dormitories" element={<OwnerDormitories />} />
          <Route path="/owner/dormitories/create" element={<CreateDormitory />} />
          <Route path="/owner/dormitories/:id/edit" element={<EditDormitory />} />
          <Route path="/owner/history" element={<ViewHistoryPage />} />
          <Route path="/owner/rooms" element={<OwnerRooms />} />
          <Route path="/owner/bookings" element={<OwnerBookings />} />
          <Route path="/owner/reviews" element={<OwnerReviews />} />
          <Route path="/owner/messages" element={<OwnerMessages />} />
          <Route path="/owner/notifications" element={<OwnerNotifications />} />
        </Route>
      </Route>

      {/* 4. Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/profile" element={<AdminProfile />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/history" element={<ViewHistoryPage />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/owners" element={<AdminOwners />} />
          <Route path="/admin/dormitories" element={<AdminDormitories />} />
          <Route path="/admin/locations" element={<AdminLocations />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>

      {/* Catch-all redirect to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
