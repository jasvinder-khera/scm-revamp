import { useEffect, useRef } from "react";
import * as echarts from "echarts";

export default function DashboardCharts({ data }) {
  const barRef = useRef(null);
  const lineRef = useRef(null);
  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);

  useEffect(() => {
    if (!barRef.current || !lineRef.current) return undefined;

    const barChart = echarts.init(barRef.current);
    const lineChart = echarts.init(lineRef.current);
    barChartRef.current = barChart;
    lineChartRef.current = lineChart;

    const resizeObserver = new ResizeObserver(() => {
      barChart.resize();
      lineChart.resize();
    });
    resizeObserver.observe(barRef.current);
    resizeObserver.observe(lineRef.current);

    return () => {
      resizeObserver.disconnect();
      barChart.dispose();
      lineChart.dispose();
      barChartRef.current = null;
      lineChartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const barChart = barChartRef.current;
    const lineChart = lineChartRef.current;
    if (!barChart || !lineChart) return;

    const buyerLabels = Array.isArray(data?.bar?.months) ? data.bar.months : [];
    const buyerCounts = Array.isArray(data?.bar?.counts) ? data.bar.counts : [];
    const trendDates = Array.isArray(data?.line?.dates) ? data.line.dates : [];
    const trendCounts = Array.isArray(data?.line?.prRequests)
      ? data.line.prRequests
      : [];

    barChart.setOption({
      color: ["#1473e6"],
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { top: 24, right: 20, bottom: 60, left: 48, containLabel: true },
      xAxis: {
        type: "category",
        data: buyerLabels,
        axisLabel: { interval: 0, rotate: buyerLabels.length > 5 ? 30 : 0 },
      },
      yAxis: { type: "value", minInterval: 1 },
      series: [
        {
          name: "Purchase Requests",
          type: "bar",
          data: buyerCounts,
          barMaxWidth: 48,
          itemStyle: { borderRadius: [3, 3, 0, 0] },
        },
      ],
      graphic: buyerLabels.length
        ? []
        : [
            {
              type: "text",
              left: "center",
              top: "middle",
              style: { text: "No buyer data for this period", fill: "#6b7280" },
            },
          ],
    }, true);

    lineChart.setOption({
      color: ["#1473e6"],
      tooltip: { trigger: "axis" },
      grid: { top: 24, right: 20, bottom: 40, left: 48, containLabel: true },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: trendDates,
      },
      yAxis: { type: "value", minInterval: 1 },
      series: [
        {
          name: "Purchase Requests",
          type: "line",
          data: trendCounts,
          smooth: true,
          showSymbol: trendDates.length <= 31,
          lineStyle: { width: 3 },
          areaStyle: { opacity: 0.12 },
        },
      ],
      graphic: trendDates.length
        ? []
        : [
            {
              type: "text",
              left: "center",
              top: "middle",
              style: { text: "No daily trend data for this period", fill: "#6b7280" },
            },
          ],
    }, true);
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 bg-[#f8f8f8] px-4 py-2">
          <h3 className="text-sm font-bold text-gray-800">Buyerwise PR Analysis</h3>
          <span className="text-xs text-gray-500"></span>
        </div>
        <div className="p-4">
          <div ref={barRef} role="img" aria-label="Buyerwise purchase request analysis chart" style={{ width: "100%", height: 300 }} />
        </div>
      </div>

      <div className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-[#f8f8f8] px-4 py-2">
          <h3 className="text-sm font-bold text-gray-800">Daily PR Trend</h3>
        </div>
        <div className="p-4">
          <div ref={lineRef} role="img" aria-label="Daily purchase request trend chart" style={{ width: "100%", height: 300 }} />
        </div>
      </div>
    </div>
  );
}
