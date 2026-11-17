import { useState } from "react";
import { DateRange } from "react-date-range";
import { format } from "date-fns";

export default function DashboardHeader({ dateRange, setDateRange }) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <header className="">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Title and Breadcrumbs */}
        <div>
          <h1 className="text-xl font-bold tracking-wide">Dashboard</h1>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 text-white">
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 bg-[#1e4c8c] hover:bg-[#2a5da3] border border-[#1e4c8c] px-3 py-1.5 text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              {format(dateRange[0].startDate, "MMM d")} - {format(dateRange[0].endDate, "MMM d, yyyy")}
            </button>

            {showDatePicker && (
              <div className="absolute right-0 top-12 z-50 shadow-2xl border border-gray-200 bg-white text-black">
                <DateRange
                  editableDateInputs={true}
                  onChange={(item) => setDateRange([item.selection])}
                  moveRangeOnFirstSelection={false}
                  ranges={dateRange}
                  maxDate={new Date()}
                />
                <div className="p-2 bg-gray-50 text-right border-t">
                  <button onClick={() => setShowDatePicker(false)} className="text-xs font-semibold text-blue-600 hover:underline px-2">Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}