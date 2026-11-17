export async function requestHandler(
  api,
  setLoading,
  onSuccess,
  onError,
  apiName = api?.name || "API request"
) {
  try {
    if (typeof api !== "function") {
      throw new Error("API function is not defined");
    }

    const response = await api();
    const { data, status } = response || {};

    if (!Number.isInteger(status) || status < 200 || status >= 300) {
      onError?.(
        data?.detail || data?.message || `Error: ${status ?? "unknown status"}`
      );
    } else if (data?.success === false) {
      onError?.(data.message || "Request failed.");
    } else {
      onSuccess?.(data);
    }
  } catch (error) {
    onError?.(error?.message || `Request failed: ${apiName}`);
  } finally {
    setLoading?.(false);
  }
}
