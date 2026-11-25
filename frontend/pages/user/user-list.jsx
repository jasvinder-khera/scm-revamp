import { useEffect, useState } from "react";
import { getAllUsersList, getCurrentUserApi } from "../../lib/api";
import CommonTable from "../../components/Table/CommonTable";

const INITIAL_PAGE_SIZE = 10;

const tableHeaderData = [
  { key: "id", label: "S No." },
  { key: "fname", label: "First Name" },
  { key: "lname", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "phone_no", label: "Phone Number" },
  { key: "role", label: "User Role" },
  { key: "group_field_id", label: "Group Field" },
  { key: "created_at", label: "Date" },
  { key: "status", label: "Status" },
];

const capitalizeName = (value) =>
  typeof value === "string" && value.trim()
    ? value.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : value;

export default function AllUsersList() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // 1) Confirm the user is an admin (UX gate; backend still enforces it)
  useEffect(() => {
    let active = true;
    getCurrentUserApi()
      .then(({ data, status }) => {
        if (status < 200 || status >= 300) {
          throw new Error("Unable to load current user.");
        }
        if (active) setIsAdmin(String(data?.user_role) === "3");
      })
      .catch((err) => {
        if (active) {
          setIsAdmin(false);
          setError(err?.message || "Unable to load current user.");
          setIsLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  // 2) Fetch the list once we know we're allowed
  useEffect(() => {
    if (isAdmin !== true) return undefined;
    let active = true;
    setIsLoading(true);
    setError("");

    (async () => {
      try {
        const response = await getAllUsersList();
        if (response.status < 200 || response.status >= 300) {
          throw new Error(
            response.data?.detail ||
            response.data?.message ||
            "Unable to load users.",
          );
        }
        const list = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
        const mapped = list.map((row) => ({
          ...row,
          fname: capitalizeName(row.fname),
          lname: capitalizeName(row.lname),
          status:
            row.status === 0 || row.status == null ? "Active" : "Inactive",
          created_at: row.created_at
            ? new Date(row.created_at).toLocaleDateString()
            : "",
        }));
        if (active) setRows(mapped);
      } catch (err) {
        if (active) {
          setError(err?.message || "Unable to load users.");
          setRows([]);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => { active = false; };
  }, [isAdmin]);

  // 3) Gate the render
  if (isAdmin === false) {
    return (
      <div className="mx-auto max-w-[1600px] p-6">
        <h1 className="text-2xl font-bold text-[#212e44]">All Users List</h1>
        <p className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert">
          Your role cannot view the Users List.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] p-6">
      <h1 className="text-2xl font-bold text-[#212e44]">All Users List</h1>
      <CommonTable
        tableHeaderData={tableHeaderData}
        userData={rows}
        isLoading={isLoading}
        error={error ? { message: error } : null}
        itemsPerPage={INITIAL_PAGE_SIZE}
        searchableFields={tableHeaderData.map(({ key }) => key)}
        showActions={false}
      />
    </div>
  );
}