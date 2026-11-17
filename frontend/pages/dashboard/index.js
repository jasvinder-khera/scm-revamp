import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { format, subDays } from "date-fns";
import { getCurrentUserApi, getDashboardData } from "../../lib/api";
import { isAuthenticated, logout } from "../../lib/auth";
import { requestHandler } from "../../lib/requestHandler";
import DashboardCharts from "../../components/dashboard/DashboardCharts";
import DashboardHeader from "../../components/dashboard/DashboardHeader";
import DashboardStats from "../../components/dashboard/DashboardStats";
import LatestPrTable from "../../components/dashboard/LatestPrTable";

const initialStats = {
  totalPr: 0, pendingPr: 0, openPr: 0, totalPoReleased: 0, rejected: 0, closedPr: 0,
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(initialStats);
  const [dashboardData, setDashboardData] = useState(null);
  const [latestPrs, setLatestPrs] = useState([]);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState([
    { startDate: subDays(new Date(), 29), endDate: new Date(), key: "selection" },
  ]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    requestHandler(getCurrentUserApi, null, setUser, logout, "Current user");
  }, [router]);

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    const startDate = format(dateRange[0].startDate, "yyyy-MM-dd");
    const endDate = format(dateRange[0].endDate, "yyyy-MM-dd");

    setError("");
    requestHandler(
      () => getDashboardData(startDate, endDate),
      null,
      (data) => {
        if (!active) return;
        setStats(data.stats);
        setDashboardData(data);
        setLatestPrs(data.latestPrs);
      },
      (message) => { if (active) setError(message); },
      "Dashboard data"
    );
    return () => { active = false; };
  }, [user, dateRange]);

  if (!user) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#f3f3f3] pb-20 font-sans text-[#181818]">
      <DashboardHeader dateRange={dateRange} setDateRange={setDateRange} />

      <main className="max-w-[1400px] mx-auto px-4 mt-6">
        {error && (
          <div role="alert" className="mb-4 border border-red-300 bg-red-50 p-4 text-red-700 text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Salesforce style grid: Stats on top, Charts side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-3">
             <DashboardStats stats={stats} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
             {/* Bar/Line charts take up 2/3 of width */}
             <DashboardCharts data={dashboardData} stats={stats} dateRange={dateRange} />
          </div>
          <div className="lg:col-span-1">
             {/* Pie charts stack in 1/3 column */}
             <LatestPrTable purchaseRequests={latestPrs} />
          </div>
        </div>
      </main>
    </div>
  );
}