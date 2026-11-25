import { useEffect, useState } from "react";
import CommonTable from "../components/Table/CommonTable";
import { getDeletedPurchaseRequests } from "../lib/api";

const INITIAL_PAGE_SIZE = 10;

const tableHeaderData = [
  { key: "group_field", label: "Group Field" },
  { key: "sub_group_field", label: "Sub Group" },
  { key: "pr_no", label: "PR No." },
  { key: "req_name", label: "Requestor" },
  { key: "date", label: "Date" },
  { key: "pr_subject", label: "Subject" },
  { key: "pr_status", label: "PR Status" },
  { key: "pr_approve_date", label: "PR Approved Date" },
  { key: "resale_cus_name", label: "Customer Name" },
  { key: "po_num", label: "Customer PO No." },
  { key: "Approver", label: "Approver" },
  { key: "pr_priority", label: "Priority" },
  { key: "pr_buyer", label: "Buyer" },
  { key: "cc_user", label: "CC User" },
];

export default function AllPRs() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(INITIAL_PAGE_SIZE);
  const [totalRows, setTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const Priority = {
    1: "Low",
    2: "Medium",
    3: "High",
  };

  const capitalizeName = (value) =>
    typeof value === "string" && value.trim()
      ? value
          .trim()
          .toLowerCase()
          .replace(/\b\w/g, (char) => char.toUpperCase())
      : value;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await getDeletedPurchaseRequests({
          start: (currentPage - 1) * pageSize,
          length: pageSize,
          draw: currentPage,
          search: debouncedSearch,
        });
        if (response.status < 200 || response.status >= 300) {
          throw new Error(
            response.data?.detail ||
              response.data?.message ||
              "Unable to load purchase requests.",
          );
        }
        if (
          !Array.isArray(response.data?.data) ||
          !Number.isInteger(response.data?.recordsFiltered)
        ) {
          throw new Error("The purchase requests response is invalid.");
        }
        const mapped = response.data.data.map((row) => ({
          ...row,
          pr_priority: Priority[row.pr_priority] ?? row.pr_priority,
          req_name: capitalizeName(row.req_name),
          Approver: capitalizeName(row.Approver),
          pr_buyer: capitalizeName(row.pr_buyer),
          cc_user: capitalizeName(row.cc_user),
        }));

        if (active) {
          setRows(mapped);
          setTotalRows(response.data.recordsFiltered);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError?.message || "Unable to load purchase requests.",
          );
          setRows([]);
          setTotalRows(0);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [currentPage, pageSize, debouncedSearch]);

  return (
    <div className="mx-auto max-w-[1600px] p-6">
      <h1 className="text-2xl font-bold text-[#212e44]">
        Deleted Purchase Requests
      </h1>
      <CommonTable
        tableHeaderData={tableHeaderData}
        userData={rows}
        isLoading={isLoading}
        error={error ? { message: error } : null}
        itemsPerPage={pageSize}
        serverSidePagination
        serverPage={currentPage}
        serverPageSize={pageSize}
        serverTotalItems={totalRows}
        serverSearchValue={search}
        onServerPageChange={setCurrentPage}
        onServerPageSizeChange={setPageSize}
        onServerSearchChange={setSearch}
        searchableFields={tableHeaderData.map(({ key }) => key)}
        showActions={false}
      />
    </div>
  );
}
