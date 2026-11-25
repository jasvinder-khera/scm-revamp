import { useEffect, useState } from "react";
import CommonTable from "../components/Table/CommonTable";
import { getAllPurchaseRequestLineItems, getCurrentUserApi } from "../lib/api";

const INITIAL_PAGE_SIZE = 10;

const tableHeaderData = [
  { key: "group_field", label: "Group Field" },
  { key: "sub_group_field", label: "Sub Group" },
  { key: "Pr_no", label: "PR No." },
  { key: "pr_date", label: "PR Date" },
  { key: "material_desc", label: "Material Description" },
  { key: "requestor", label: "Requestor" },
  { key: "buyer", label: "Buyer" },
  { key: "approval_status", label: "Approval Status" },
  { key: "pr_stat", label: "PR Status" },
  { key: "pr_Approved_date", label: "PR Approved Date" },
  { key: "customer_name", label: "Customer Name" },
  { key: "customer_po_no", label: "Customer PO No." },
  { key: "item_type", label: "Item Type" },
  { key: "plant_code", label: "Plant" },
  { key: "mat_detail", label: "Material Details" },
  { key: "mc_ph_cc", label: "MC/PH/CC/SO" },
  { key: "quantity", label: "Quantity" },
  { key: "received_qty", label: "Received Quantity" },
  { key: "po_no", label: "PO No." },
  { key: "po_creation_date", label: "PO Creation Date" },
  { key: "po_rls_date", label: "PO Release Date" },
  { key: "po_action", label: "PO Action" },
  { key: "status", label: "Status" },
  { key: "pr_ageing", label: "PR Ageing (Days)" },
  { key: "cc_user", label: "CC User" },
];

export default function AllPRs() {
  const [bid, setBid] = useState(null);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(INITIAL_PAGE_SIZE);
  const [totalRows, setTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const capitalizeName = (value) =>
    typeof value === "string" && value.trim()
      ? value
          .trim()
          .toLowerCase()
          .replace(/\b\w/g, (char) => char.toUpperCase())
      : value;

  useEffect(() => {
    let active = true;

    getCurrentUserApi()
      .then(({ data, status }) => {
        if (status < 200 || status >= 300) {
          throw new Error(
            data?.detail || data?.message || "Unable to load current user.",
          );
        }

        const roleBids = { 0: "req", 1: "apr", 2: "all", 3: "all" };
        const userBid = roleBids[String(data?.user_role)];
        if (!userBid) {
          throw new Error("Your role cannot view PR line items.");
        }
        if (active) setBid(userBid);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError?.message || "Unable to load current user.");
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(search), 400);
  return () => clearTimeout(timer);
}, [search]);

  useEffect(() => {
    if (!bid) return undefined;

    let active = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await getAllPurchaseRequestLineItems(bid, {
          start: (currentPage - 1) * pageSize,
          length: pageSize,
          draw: currentPage,
          search: debouncedSearch,
        });
        if (response.status < 200 || response.status >= 300) {
          throw new Error(
            response.data?.detail ||
              response.data?.message ||
            "Unable to load PR line items.",
          );
        }
        if (
          !Array.isArray(response.data?.data) ||
          !Number.isInteger(response.data?.recordsFiltered)
        ) {
          throw new Error("The PR line-items response is invalid.");
        }
        const mapped = response.data.data.map((row) => ({
          ...row,
          requestor: capitalizeName(row.requestor),
          buyer: capitalizeName(row.buyer),
          cc_user: capitalizeName(row.cc_user),
        }));

        if (active) {
          setRows(mapped);
          setTotalRows(response.data.recordsFiltered);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError?.message || "Unable to load PR line items.",
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
  }, [bid, currentPage, pageSize, debouncedSearch]);

  return (
    <div className="mx-auto max-w-[1600px] p-6">
      <h1 className="text-2xl font-bold text-[#212e44]">
        All PR Line Items
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
