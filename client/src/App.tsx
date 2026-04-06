import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import IncidentsPage from "@/pages/incidents";
import ComplaintsPage from "@/pages/complaints";
import OfficersPage from "@/pages/officers";
import DepartmentsPage from "@/pages/departments";
import BodyCameraPage from "@/pages/body-camera";
import AnalyticsPage from "@/pages/analytics";
import ForumsPage from "@/pages/forums";
import PetitionsPage from "@/pages/petitions";
import WhistleblowerPage from "@/pages/whistleblower";
import RightsPage from "@/pages/rights";
import AlertsPage from "@/pages/alerts";
import AdminPage from "@/pages/admin";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#0EA5E9] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Redirect to="/login" />;
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">{() => <ProtectedRoute component={DashboardPage} />}</Route>
      <Route path="/incidents">{() => <ProtectedRoute component={IncidentsPage} />}</Route>
      <Route path="/complaints">{() => <ProtectedRoute component={ComplaintsPage} />}</Route>
      <Route path="/officers">{() => <ProtectedRoute component={OfficersPage} />}</Route>
      <Route path="/departments">{() => <ProtectedRoute component={DepartmentsPage} />}</Route>
      <Route path="/body-camera">{() => <ProtectedRoute component={BodyCameraPage} />}</Route>
      <Route path="/analytics">{() => <ProtectedRoute component={AnalyticsPage} />}</Route>
      <Route path="/forums">{() => <ProtectedRoute component={ForumsPage} />}</Route>
      <Route path="/petitions">{() => <ProtectedRoute component={PetitionsPage} />}</Route>
      <Route path="/whistleblower">{() => <ProtectedRoute component={WhistleblowerPage} />}</Route>
      <Route path="/rights">{() => <ProtectedRoute component={RightsPage} />}</Route>
      <Route path="/alerts">{() => <ProtectedRoute component={AlertsPage} />}</Route>
      <Route path="/admin">{() => <ProtectedRoute component={AdminPage} />}</Route>
      <Route>{() => <Redirect to="/" />}</Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
