const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiClient {
  constructor(baseUrl = API_URL) {
    this.baseUrl = baseUrl;
  }

  request(endpoint, options = {}) {
    return fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }).then(async (response) => {
      const body = await response.text();
      let data = null;

      if (body) {
        try {
          data = JSON.parse(body);
        } catch {
          data = body;
        }
      }

      return { data, status: response.status };
    });
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, options);
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  }
}

export const apiClient = new ApiClient();

function getAuthorizationHeaders() {
  if (typeof window === "undefined") return {};

  const token = window.localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getDashboardEndpoint(path, startDate, endDate) {
  const params = new URLSearchParams({
    startdate: startDate,
    enddate: endDate,
  });
  return apiClient.get(`/api/dashboard/${path}?${params}`, {
    headers: getAuthorizationHeaders(),
  });
}

export function getCurrentUserApi() {
  return apiClient.get("/api/me", { headers: getAuthorizationHeaders() });
}

export function getDashboardStats(startDate, endDate) {
  return apiClient.get(
    `/api/dashboard?${new URLSearchParams({ startdate: startDate, enddate: endDate })}`,
    { headers: getAuthorizationHeaders() }
  );
}

export function getDashboardBarGraph(startDate, endDate) {
  return getDashboardEndpoint("bar-graph", startDate, endDate);
}

export function getDashboardLineGraph(startDate, endDate) {
  return getDashboardEndpoint("line-graph", startDate, endDate);
}

export function getDashboardSegmentGraph(startDate, endDate) {
  return getDashboardEndpoint("segment-graph", startDate, endDate);
}

export function getDashboardFunctionGraph(startDate, endDate) {
  return getDashboardEndpoint("function-graph", startDate, endDate);
}

export function getLatestPurchaseRequests() {
  return apiClient.get("/api/dashboard/latest-pr", {
    headers: getAuthorizationHeaders(),
  });
}

export async function getDashboardData(startDate, endDate) {
  const responses = await Promise.all([
    getDashboardStats(startDate, endDate),
    getDashboardBarGraph(startDate, endDate),
    getDashboardLineGraph(startDate, endDate),
    getDashboardSegmentGraph(startDate, endDate),
    getDashboardFunctionGraph(startDate, endDate),
    getLatestPurchaseRequests(),
  ]);
  const failedResponse = responses.find(
    ({ status }) => status < 200 || status >= 300
  );

  if (failedResponse) return failedResponse;

  const [stats, bar, line, segment, functionGraph, latestPrs] = responses;
  return {
    status: 200,
    data: {
      stats: stats.data.data,
      bar: bar.data.data,
      line: line.data.data,
      segment: segment.data.data,
      functionGraph: functionGraph.data.data,
      latestPrs: latestPrs.data.data,
    },
  };
}

export function fetchFromApi(endpoint, options = {}) {
  return apiClient.request(endpoint, options);
}