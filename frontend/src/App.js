import "@/App.css";
import "@/index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, isAccountantAdmin, isCollector, useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import PeopleList from "@/pages/PeopleList";
import Payments from "@/pages/Payments";
import Kadan from "@/pages/Kadan";
import Sadakah from "@/pages/Sadakah";
import Expenses from "@/pages/Expenses";
import Accounts from "@/pages/Accounts";
import Reports from "@/pages/Reports";
import AdminUsers from "@/pages/AdminUsers";
import VattiyillaDashboard from "@/pages/VattiyillaDashboard";
import VattiyillaAccounts from "@/pages/VattiyillaAccounts";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-app text-[color:var(--text-muted)]">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  if (!isAccountantAdmin(user)) return <Navigate to="/" replace />;
  return children;
}

function StaffOnly({ children }) {
  const { user } = useAuth();
  if (isCollector(user)) return <Navigate to="/payments" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protected><Layout /></Protected>}>
            <Route path="/" element={<StaffOnly><Dashboard /></StaffOnly>} />
            <Route path="/donors" element={<StaffOnly><PeopleList kind="donors" title="Donors" subtitle="Those who give — the lifeblood of the community fund." /></StaffOnly>} />
            <Route path="/beneficiaries" element={<StaffOnly><PeopleList kind="beneficiaries" title="Beneficiaries" subtitle="Those we serve — recipients of Kadan, Sadakah and support." /></StaffOnly>} />
            <Route path="/workers" element={<StaffOnly><PeopleList kind="workers" title="Workers" subtitle="Team members who help operate the fund." /></StaffOnly>} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/kadan" element={<StaffOnly><Kadan variant="kadan" /></StaffOnly>} />
            <Route path="/vattiyilla" element={<StaffOnly><VattiyillaDashboard /></StaffOnly>} />
            <Route path="/vattiyilla-loans" element={<StaffOnly><Kadan variant="vattiyilla" /></StaffOnly>} />
            <Route path="/vattiyilla-accounts" element={<StaffOnly><VattiyillaAccounts /></StaffOnly>} />
            <Route path="/sadakah" element={<StaffOnly><Sadakah /></StaffOnly>} />
            <Route path="/expenses" element={<StaffOnly><Expenses /></StaffOnly>} />
            <Route path="/accounts" element={<StaffOnly><Accounts /></StaffOnly>} />
            <Route path="/reports" element={<StaffOnly><Reports /></StaffOnly>} />
            <Route path="/admin" element={<AdminOnly><AdminUsers /></AdminOnly>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
