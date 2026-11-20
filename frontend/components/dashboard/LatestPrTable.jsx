import { format } from "date-fns";
import Link from "next/link";

export default function LatestPrTable({ purchaseRequests }) {
  return (
    <div className="bg-white border border-gray-200 h-full flex flex-col">
      <div className="border-b border-gray-200 px-4 py-2 bg-[#f8f8f8] flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-800">Latest Purchase Requests</h3>
        <Link href="/all-pr" className="text-xs text-blue-600 font-semibold hover:underline">View All</Link>
      </div>
      
      <div className="overflow-auto flex-grow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase sticky top-0">
            <tr>
              <th className="px-3 py-2 font-semibold border-b">PR #</th>
              <th className="px-3 py-2 font-semibold border-b">Date</th>
              <th className="px-3 py-2 font-semibold border-b">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {purchaseRequests.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-3 py-8 text-center text-gray-500">No recent requests</td>
              </tr>
            ) : (
              purchaseRequests.map((item, idx) => (
                <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-3 py-2 text-blue-600 font-medium whitespace-nowrap">
                    {item.prno || '-'}
                  </td>
                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                    {item.pr_date ? format(new Date(item.pr_date), 'dd MMM') : '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-sm ${
                      item.approval_status_id == 2 ? "bg-yellow-100 text-yellow-800" :
                      item.approval_status_id == 3 ? "bg-green-100 text-green-800" :
                      item.approval_status_id == 4 ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {item.approval_status_id == 2 ? "Pending" :
                       item.approval_status_id == 3 ? "Approved" :
                       item.approval_status_id == 4 ? "Rejected" : "New"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}