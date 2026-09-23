import { Outlet, Route, Routes } from "react-router-dom";

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


function NotFoundPlaceholder() {
  return <div className="p-8">Page not found</div>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route
          path={ROUTES.login}
          element={<LoginPage />}
        />
        <Route path={ROUTES.register} element={<RegisterPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <AuthenticatedLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path={ROUTES.app.dashboard}
          element={< DashboardPage/>}
        />

        <Route path={ROUTES.app.createTicket} element={<CreateTicketPage />} />
        
        <Route
        path={ROUTES.app.ticket(":ticketId")}
          element={<TicketDetailsPage />}
        />

        <Route
          path={ROUTES.app.tickets}
          element={<TicketsPage/>}
        />

        <Route
          path={ROUTES.app.notifications}
          element={<NotificationsPage />}
        />

        <Route
          path={ROUTES.technician.dashboard}
          element={<TechnicianDashboardPage />}
        />

        <Route
          path={ROUTES.technician.queue}
          element={<TechnicianQueuePage />}
        />

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
        
      </Route>
      </Route>

      <Route
        path="*"
        element={<NotFoundPlaceholder />}
      />
    </Routes>
  );
}