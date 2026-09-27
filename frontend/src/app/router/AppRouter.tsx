import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { ROUTES } from "../../constants/routes";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicLayout } from "../layouts/PublicLayout";
import { AuthenticatedLayout } from "../layouts/AuthenticatedLayout";

import { LoginPage } from "../../features/auth/pages/LoginPage";
import { RegisterPage } from "../../features/auth/pages/RegisterPage";

import { TicketsPage } from "../../features/tickets/pages/TicketsPage";
import { DashboardPage } from "../../features/dashboard/pages/DashboardPage";
import { CreateTicketPage } from "../../features/tickets/pages/CreateTicketPage";
import { TicketDetailsPage } from "../../features/tickets/pages/TicketDetailsPage";

import { NotificationsPage } from "../../features/notifications/pages/NotificationsPage";

import { TechnicianDashboardPage } from "../../features/technician/pages/TechnicianDashboardPage";
import { TechnicianQueuePage } from "../../features/technician/pages/TechnicianQueuePage";

import { AdministrationDashboardPage } from "../../features/administration/dashboard/pages/AdministrationDashboardPage";
import { AdministrationTicketsPage } from "../../features/administration/tickets/pages/AdministrationTicketsPage";
import AdministrationUsersPage from "../../features/administration/users/pages/AdministrationUsersPage";
import { AdministrationCentersPage } from "../../features/administration/centers/pages/AdministrationCentersPage";
import LabsPage from "../../features/administration/labs/pages/LabsPage";
import { CategoriesPage } from "../../features/administration/categories/pages/CategoriesPage";



import { useCurrentUser } from "../../features/auth/hooks/useCurrentUser";

function NotFoundPlaceholder() {
  return <div className="p-8">Page not found</div>;
}

/**
 * /dashboard is the application's role-aware landing route.
 *
 * It exists so login/session restoration can always navigate
 * to one stable entry point without knowing the user's role.
 */
function RoleLandingRedirect() {
  const { user } = useCurrentUser();

  if (!user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  switch (user.role) {
    case "ADMIN":
    case "CENTER_MANAGER":
      return (
        <Navigate
          to={ROUTES.administration.dashboard}
          replace
        />
      );

    case "TECHNICIAN":
      return (
        <Navigate
          to={ROUTES.technician.dashboard}
          replace
        />
      );

    case "EMPLOYEE":
    default:
      return <DashboardPage />;
  }
}

export function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route
          path={ROUTES.login}
          element={<LoginPage />}
        />

        <Route
          path={ROUTES.register}
          element={<RegisterPage />}
        />
      </Route>

      {/* Authenticated application */}
      <Route
        element={
          <ProtectedRoute>
            <AuthenticatedLayout />
          </ProtectedRoute>
        }
      >
        {/* Role-aware application landing page */}
        <Route
          path={ROUTES.app.dashboard}
          element={<RoleLandingRedirect />}
        />

        {/* Employee ticket workflow */}
        <Route
          path={ROUTES.app.createTicket}
          element={<CreateTicketPage />}
        />

        <Route
          path={ROUTES.app.ticket(":ticketId")}
          element={<TicketDetailsPage />}
        />

        <Route
          path={ROUTES.app.tickets}
          element={<TicketsPage />}
        />

        <Route
          path={ROUTES.app.notifications}
          element={<NotificationsPage />}
        />

        {/* Technician routes */}
        <Route
          path={ROUTES.technician.dashboard}
          element={<TechnicianDashboardPage />}
        />

        <Route
          path={ROUTES.technician.queue}
          element={<TechnicianQueuePage />}
        />

        {/* Administration / management routes */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={["CENTER_MANAGER", "ADMIN"]}
            >
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route
            path={ROUTES.administration.dashboard}
            element={<AdministrationDashboardPage />}
          />

          <Route
            path={ROUTES.administration.tickets}
            element={<AdministrationTicketsPage />}
          />

          <Route
            path={ROUTES.administration.users}
            element={<AdministrationUsersPage />}
          />

          <Route
            path={ROUTES.administration.centers}
            element={<AdministrationCentersPage />}
          />

          <Route 
            path={ROUTES.administration.labs}
            element={<LabsPage/>}
          />

          <Route
            path={ROUTES.administration.categories}
            element={<CategoriesPage/>}
          />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route
        path="*"
        element={<NotFoundPlaceholder />}
      />
    </Routes>
  );
}