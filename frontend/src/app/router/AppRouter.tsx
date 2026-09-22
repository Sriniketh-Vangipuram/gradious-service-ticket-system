import { Route, Routes } from "react-router-dom";

import { ROUTES } from "../../constants/routes";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicLayout } from "../layouts/PublicLayout";
import { AuthenticatedLayout } from "../layouts/AuthenticatedLayout";
import { LoginPage } from "../../features/auth/pages/LoginPage";
import { RegisterPage } from "../../features/auth/pages/RegisterPage";


function DashboardPlaceholder() {
  return <div className="p-8">Dashboard</div>;
}

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
          element={<DashboardPlaceholder />}
        />
      </Route>

      <Route
        path="*"
        element={<NotFoundPlaceholder />}
      />
    </Routes>
  );
}