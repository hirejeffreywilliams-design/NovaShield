import { useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Users, AlertTriangle, Clock, Building2 } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";

const COLORS = ["#0EA5E9", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#6B7280"];

const monthlyTrends = [
  { month: "May '25", incidents: 89, complaints: 34 },
  { month: "Jun '25", incidents: 102, complaints: 41 },
  { month: "Jul '25", incidents: 97, complaints: 38 },
  { month: "Aug '25", incidents: 115, complaints: 52 },
  { month: "Sep '25", incidents: 108, complaints: 45 },
  { month: "Oct '25", incidents: 93, complaints: 39 },
  { month: "Nov '25", incidents: 86, complaints: 31 },
  { month: "Dec '25", incidents: 78, complaints: 28 },
  { month: "Jan '26", incidents: 91, complaints: 36 },
  { month: "Feb '26", incidents: 84, complaints: 33 },
  { month: "Mar '26", incidents: 79, complaints: 29 },
  { month: "Apr '26", incidents: 72, complaints: 25 },
];

const disparityData = [
  { demographic: "Black", stopRate: 34.2, populationPct: 13.4, disparityIndex: 2.55 },
  { demographic: "Hispanic", stopRate: 24.1, populationPct: 18.5, disparityIndex: 1.30 },
  { demographic: "White", stopRate: 31.5, populationPct: 58.9, disparityIndex: 0.53 },
  { demographic: "Asian", stopRate: 5.8, populationPct: 5.9, disparityIndex: 0.98 },
  { demographic: "Other", stopRate: 4.4, populationPct: 3.3, disparityIndex: 1.33 },
];

const forceTypes = [
  { type: "Physical Control", count: 45, pct: 38.1 },
  { type: "Taser", count: 22, pct: 18.6 },
  { type: "OC Spray", count: 15, pct: 12.7 },
  { type: "Vehicle Pursuit", count: 12, pct: 10.2 },
  { type: "Baton", count: 8, pct: 6.8 },
  { type: "Other", count: 7, pct: 5.9 },
  { type: "K9", count: 6, pct: 5.1 },
  { type: "Firearm", count: 3, pct: 2.5 },
];

const outcomes = [
  { name: "No Injury", value: 62 },
  { name: "Minor Injury", value: 34 },
  { name: "Serious Injury", value: 15 },
  { name: "Fatal", value: 2 },
];

const responseTimes = [
  { priority: "Critical", days: 1.1 },
  { priority: "High", days: 2.8 },
  { priority: "Medium", days: 4.5 },
  { priority: "Low", days: 8.3 },
];

const responseTimeTrend = [
  { month: "Nov '25", avgDays: 5.1 },
  { month: "Dec '25", avgDays: 4.8 },
  { month: "Jan '26", avgDays: 4.5 },
  { month: "Feb '26", avgDays: 4.2 },
  { month: "Mar '26", avgDays: 3.9 },
  { month: "Apr '26", avgDays: 4.0 },
];

const deptRankings = [
  { dept: "Community Relations", officers: 45, complaints: 12, resolved: 10, rate: 83, score: 92 },
  { dept: "Internal Affairs", officers: 38, complaints: 28, resolved: 22, rate: 79, score: 85 },
  { dept: "Patrol Division", officers: 312, complaints: 156, resolved: 98, rate: 63, score: 71 },
  { dept: "Investigations", officers: 87, complaints: 52, resolved: 31, rate: 60, score: 67 },
  { dept: "Traffic Enforcement", officers: 64, complaints: 41, resolved: 22, rate: 54, score: 58 },
  { dept: "Special Operations", officers: 29, complaints: 23, resolved: 11, rate: 48, score: 45 },
];

const tabs = ["Overview", "Racial Disparity", "Complaint Trends", "Use of Force", "Response Times", "Dept Rankings"] as const;
type Tab = (typeof tabs)[number];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg p-3 text-sm">
      <p className="text-[#e5e5e5] font-medium mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-7 w-7 text-[#0EA5E9]" />
        <div>
          <h1 className="text-2xl font-bold text-[#e5e5e5]">Data Analytics</h1>
          <p className="text-sm text-[#a3a3a3]">Comprehensive accountability metrics and trend analysis</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              tab === t
                ? "bg-[#0EA5E9] text-white"
                : "bg-[#111111] text-[#a3a3a3] hover:bg-[#1e1e1e] hover:text-[#e5e5e5]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Incidents", value: "1,247", icon: AlertTriangle, change: "-8.2%", down: true },
              { label: "Active Complaints", value: "342", icon: TrendingUp, change: "+12.5%", down: false },
              { label: "Officers Tracked", value: "3,891", icon: Users, change: "+3.1%", down: false },
              { label: "Departments", value: "156", icon: Building2, change: "+2", down: false },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <s.icon className="h-5 w-5 text-[#0EA5E9]" />
                  <span className={`text-xs font-medium ${s.down ? "text-[#10B981]" : "text-[#F59E0B]"}`}>
                    {s.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-[#e5e5e5]">{s.value}</p>
                <p className="text-xs text-[#a3a3a3] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#e5e5e5] mb-4">Monthly Trends</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis dataKey="month" stroke="#a3a3a3" fontSize={12} />
                <YAxis stroke="#a3a3a3" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="incidents" name="Incidents" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.15} />
                <Area type="monotone" dataKey="complaints" name="Complaints" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "Racial Disparity" && (
        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#e5e5e5] mb-4">Disparity Index by Demographic</h3>
            <p className="text-sm text-[#a3a3a3] mb-4">Values above 1.0 indicate disproportionate contact rates</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={disparityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis type="number" stroke="#a3a3a3" fontSize={12} />
                <YAxis dataKey="demographic" type="category" stroke="#a3a3a3" fontSize={12} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="disparityIndex" name="Disparity Index" radius={[0, 4, 4, 0]}>
                  {disparityData.map((_, i) => (
                    <Cell key={i} fill={disparityData[i].disparityIndex > 1.5 ? "#EF4444" : disparityData[i].disparityIndex > 1.0 ? "#F59E0B" : "#10B981"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#e5e5e5] mb-4">Detailed Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1e1e1e]">
                    <th className="text-left py-3 px-4 text-[#a3a3a3] font-medium">Demographic</th>
                    <th className="text-right py-3 px-4 text-[#a3a3a3] font-medium">Stop Rate %</th>
                    <th className="text-right py-3 px-4 text-[#a3a3a3] font-medium">Population %</th>
                    <th className="text-right py-3 px-4 text-[#a3a3a3] font-medium">Disparity Index</th>
                  </tr>
                </thead>
                <tbody>
                  {disparityData.map((d) => (
                    <tr key={d.demographic} className="border-b border-[#1e1e1e]/50">
                      <td className="py-3 px-4 text-[#e5e5e5]">{d.demographic}</td>
                      <td className="py-3 px-4 text-right text-[#e5e5e5]">{d.stopRate}%</td>
                      <td className="py-3 px-4 text-right text-[#e5e5e5]">{d.populationPct}%</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-semibold ${d.disparityIndex > 1.5 ? "text-[#EF4444]" : d.disparityIndex > 1.0 ? "text-[#F59E0B]" : "text-[#10B981]"}`}>
                          {d.disparityIndex}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#e5e5e5] mb-3">Recommendations</h3>
            <ul className="space-y-2">
              {["Implement bias training programs across all departments", "Increase oversight in high-disparity precincts", "Deploy early warning systems for pattern detection"].map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-[#a3a3a3]">
                  <TrendingUp className="h-4 w-4 text-[#0EA5E9] mt-0.5 shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "Complaint Trends" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card rounded-xl p-5">
              <p className="text-xs text-[#a3a3a3]">Total This Year</p>
              <p className="text-2xl font-bold text-[#e5e5e5] mt-1">431</p>
            </div>
            <div className="glass-card rounded-xl p-5">
              <p className="text-xs text-[#a3a3a3]">Avg Per Month</p>
              <p className="text-2xl font-bold text-[#e5e5e5] mt-1">36</p>
            </div>
            <div className="glass-card rounded-xl p-5">
              <p className="text-xs text-[#a3a3a3]">Trend</p>
              <div className="flex items-center gap-2 mt-1">
                <TrendingDown className="h-5 w-5 text-[#10B981]" />
                <p className="text-2xl font-bold text-[#10B981]">-26%</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#e5e5e5] mb-4">Monthly Complaint Volume</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis dataKey="month" stroke="#a3a3a3" fontSize={12} />
                <YAxis stroke="#a3a3a3" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="complaints" name="Complaints" stroke="#0EA5E9" strokeWidth={2} dot={{ fill: "#0EA5E9", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === "Use of Force" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#e5e5e5] mb-4">Force Type Distribution</h3>
              <div className="space-y-3">
                {forceTypes.map((f, i) => (
                  <div key={f.type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#a3a3a3]">{f.type}</span>
                      <span className="text-[#e5e5e5] font-medium">{f.pct}%</span>
                    </div>
                    <div className="h-2 bg-[#1e1e1e] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${f.pct}%`, backgroundColor: COLORS[i] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#e5e5e5] mb-4">Outcome Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={outcomes} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {outcomes.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[#a3a3a3]">Year-over-year change:</span>
              <span className="text-[#10B981] font-semibold flex items-center gap-1">
                <TrendingDown className="h-4 w-4" /> -3.2%
              </span>
            </div>
            <p className="text-sm text-[#a3a3a3]">Overall use of force incidents have decreased, with significant reductions in firearm discharges (-18%) and K9 deployments (-12%).</p>
          </div>
        </div>
      )}

      {tab === "Response Times" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#e5e5e5] mb-4">Avg Response by Priority</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={responseTimes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                  <XAxis dataKey="priority" stroke="#a3a3a3" fontSize={12} />
                  <YAxis stroke="#a3a3a3" fontSize={12} label={{ value: "Days", angle: -90, position: "insideLeft", fill: "#a3a3a3" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="days" name="Avg Days" radius={[4, 4, 0, 0]}>
                    {responseTimes.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#e5e5e5] mb-4">Response Time Trend</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={responseTimeTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                  <XAxis dataKey="month" stroke="#a3a3a3" fontSize={12} />
                  <YAxis stroke="#a3a3a3" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="avgDays" name="Avg Days" stroke="#10B981" strokeWidth={2} dot={{ fill: "#10B981", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#0EA5E9]" />
              <p className="text-[#e5e5e5] font-medium">Overall average response time: <span className="text-[#0EA5E9]">4.2 days</span></p>
            </div>
          </div>
        </div>
      )}

      {tab === "Dept Rankings" && (
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#e5e5e5] mb-4">Department Accountability Rankings</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1e1e1e]">
                  <th className="text-left py-3 px-4 text-[#a3a3a3] font-medium">#</th>
                  <th className="text-left py-3 px-4 text-[#a3a3a3] font-medium">Department</th>
                  <th className="text-right py-3 px-4 text-[#a3a3a3] font-medium">Officers</th>
                  <th className="text-right py-3 px-4 text-[#a3a3a3] font-medium">Complaints</th>
                  <th className="text-right py-3 px-4 text-[#a3a3a3] font-medium">Resolution %</th>
                  <th className="text-right py-3 px-4 text-[#a3a3a3] font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {deptRankings.map((d, i) => (
                  <tr key={d.dept} className="border-b border-[#1e1e1e]/50 hover:bg-[#1e1e1e]/30">
                    <td className="py-3 px-4 text-[#a3a3a3]">{i + 1}</td>
                    <td className="py-3 px-4 text-[#e5e5e5] font-medium">{d.dept}</td>
                    <td className="py-3 px-4 text-right text-[#a3a3a3]">{d.officers}</td>
                    <td className="py-3 px-4 text-right text-[#a3a3a3]">{d.complaints}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={d.rate >= 70 ? "text-[#10B981]" : d.rate >= 50 ? "text-[#F59E0B]" : "text-[#EF4444]"}>{d.rate}%</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        d.score >= 80 ? "bg-[#10B981]/20 text-[#10B981]" : d.score >= 60 ? "bg-[#F59E0B]/20 text-[#F59E0B]" : d.score >= 40 ? "bg-[#F97316]/20 text-[#F97316]" : "bg-[#EF4444]/20 text-[#EF4444]"
                      }`}>{d.score}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
