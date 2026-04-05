import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout";
import DashboardPage from "./pages/dashboard";
import IncidentsPage from "./pages/incidents";
import ComplaintsPage from "./pages/complaints";
import OfficersPage from "./pages/officers";
import DepartmentsPage from "./pages/departments";
import BodyCameraPage from "./pages/body-camera";
import AnalyticsPage from "./pages/analytics";
import ForumsPage from "./pages/forums";
import PetitionsPage from "./pages/petitions";
import WhistleblowerPage from "./pages/whistleblower";
import RightsPage from "./pages/rights";
import AlertsPage from "./pages/alerts";
import AdminPage from "./pages/admin";
import LoginPage from "./pages/login";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/complaints" element={<ComplaintsPage />} />
        <Route path="/officers" element={<OfficersPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/body-camera" element={<BodyCameraPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/forums" element={<ForumsPage />} />
        <Route path="/petitions" element={<PetitionsPage />} />
        <Route path="/whistleblower" element={<WhistleblowerPage />} />
        <Route path="/rights" element={<RightsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}
