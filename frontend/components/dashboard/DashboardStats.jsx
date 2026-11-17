export default function DashboardStats({ stats }) {
  const tiles = [
    { label: "Total PRs", val: stats.totalPr, border: "border-l-blue-600", bg: "bg-white" },
    { label: "Pending Approval", val: stats.pendingPr, border: "border-l-yellow-500", bg: "bg-white" },
    { label: "Open PR", val: stats.openPr, border: "border-l-indigo-500", bg: "bg-white" },
    { label: "PO Released", val: stats.totalPoReleased, border: "border-l-green-500", bg: "bg-white" },
    { label: "Rejected", val: stats.rejected, border: "border-l-red-500", bg: "bg-white" },
    { label: "Closed", val: stats.closedPr, border: "border-l-gray-500", bg: "bg-white" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
      {tiles.map((tile, idx) => (
        <div key={idx} className={`p-3 border border-gray-200 border-l-4 ${tile.border} ${tile.bg} hover:shadow-sm transition-shadow`}>
          <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">{tile.label}</div>
          <div className="text-2xl font-bold text-gray-900">{tile.val ?? 0}</div>
        </div>
      ))}
    </div>
  );
}