import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
} from "@heroicons/react/24/solid";
import { FaGitPullRequest } from "react-icons/fa";

import Select from "react-select";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { RiFileExcel2Fill } from "react-icons/ri";
import Link from "next/link";
import Loader from "../Loader/Loader";

const CommonTable = ({
  tableHeaderData = [],
  userData,
  onEdit,
  onAccept,
  onDelete,
  onCreate,
  fileName,
  exportData,
  onImport,
  chunkSize = {},
  buttonConfig,
  isLoading = false,
  error = null,
  searchableFields = ["name", "email", "department"],
  excludeColumns = [
    "_id",
    "id",
    "guid",
    "sid",
    "phone",
    "employeeCode",
    "refreshToken",
    "applicationPermissionAccess",
  ],
  itemsPerPage: initialItemsPerPage = 10,
  serverSidePagination = false,
  serverPage = 1,
  serverPageSize,
  serverTotalItems = 0,
  serverSearchValue = "",
  onServerPageChange,
  onServerPageSizeChange,
  onServerSearchChange,
  showActions = true,
  onDataUpdate,
  onStatusUpdate,
}) => {
  const router = useRouter();
  const currentPath = router.pathname;
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [showUserTypeSelector, setShowUserTypeSelector] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [editForm, setEditForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(new Set());
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [localUserData, setLocalUserData] = useState(userData);
  const [selectedItems, setSelectedItems] = useState(new Set());
  // const [previewLimit] = useState(10);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [importProgress, setImportProgress] = useState({
    total: 0,
    processed: 0,
    currentChunk: 0,
    totalChunks: 0,
    isComplete: false,
  });
  const user = null;
  const userRole = user;
  const path = router?.pathname;
  const activePage = serverSidePagination ? serverPage : currentPage;
  const activeItemsPerPage =
    serverSidePagination && serverPageSize ? serverPageSize : itemsPerPage;
  const activeSearchQuery = serverSidePagination ? serverSearchValue : searchQuery;

  useEffect(() => {
    if (!serverSidePagination) setCurrentPage(1);
  }, [searchQuery, itemsPerPage, serverSidePagination]);

  const itemsPerPageOptions = [
    { value: 5, label: "5 per page" },
    { value: 10, label: "10 per page" },
    { value: 25, label: "25 per page" },
    { value: 50, label: "50 per page" },
  ];

  useEffect(() => {
    setLocalUserData(userData);
  }, [userData]);

  const filteredData = serverSidePagination
    ? userData || []
    : localUserData?.filter((item) => {
        if (userRole !== 2 && item.statusDesc?.toLowerCase() === "draft") {
          return false;
        }

        if (!searchQuery) return true;

        const searchLower = searchQuery.toLowerCase();
        return searchableFields.some((field) =>
          item[field]?.toString().toLowerCase().includes(searchLower),
        );
      });

  const getVisibleColumns = () => {
    if (tableHeaderData.length > 0) {
      return tableHeaderData.filter(
        (header) => !excludeColumns.includes(header.key),
      );
    }

    if (userData?.length === 0) return [];

    return Object.keys(userData?.[0] || {})
      .filter((key) => !excludeColumns.includes(key))
      .map((key) => ({
        key,
        label: formatColumnLabel(key),
        type: "text",
      }));
  };

  const formatColumnLabel = (key) => {
    return key
      .replace(/_/g, " ")
      .split(/(?=[A-Z])/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Pagination
  const totalItems = serverSidePagination
    ? serverTotalItems
    : filteredData?.length || 0;
  const totalPages = Math.ceil(totalItems / activeItemsPerPage);
  const paginatedData = serverSidePagination
    ? filteredData
    : filteredData?.slice(
        (activePage - 1) * activeItemsPerPage,
        activePage * activeItemsPerPage,
      );

  const changePage = (page) => {
    const nextPage = Math.max(1, Math.min(totalPages, page));
    if (serverSidePagination) {
      onServerPageChange?.(nextPage);
    } else {
      setCurrentPage(nextPage);
    }
  };

  const changePageSize = (pageSize) => {
    if (serverSidePagination) {
      onServerPageSizeChange?.(pageSize);
      onServerPageChange?.(1);
    } else {
      setItemsPerPage(pageSize);
      setCurrentPage(1);
    }
  };

  const hasDfKey = Boolean(
    userData?.length && Object.prototype.hasOwnProperty.call(userData[0], "df"),
  );
  const hasStatusColumn =
    hasDfKey && path === "/material-master/material-list";
  const hasActionsColumn =
    showActions &&
    path !== "/work/work-list" &&
    path !== "/request/request-list" &&
    path !== "/materials-specification/materials-type-list" &&
    user?.role !== "3";

  const visibleColumns = getVisibleColumns();

  // Export functions

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];

    if (
      !validTypes.includes(file.type) &&
      !file.name.match(/\.(xlsx|xls|csv)$/)
    ) {
      toast.error("Please select a valid Excel or CSV file");
      return;
    }

    // Check file size (limit to 100MB for large files)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast.error(
        "File size too large. Please select a filesetIsPreviewLoading(true); smaller than 100MB.",
      );
      return;
    }

    setImportFile(file);
    setPreviewError(null);
    setIsPreviewLoading(true);
    previewFile(file);
  };

  const previewFile = (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        setIsPreviewLoading(true);
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          setPreviewError("No data found in the file");
          toast.error("No data found in the file");
          setImportPreview([]);
        } else {
          const previewData = jsonData;
          setImportPreview(previewData);
          setPreviewError(null);
          toast.info(`Preview loaded. Total records: ${jsonData.length}`);
        }
      } catch (error) {
        console.error("Error previewing file:", error);
        setPreviewError("Error processing file data for preview");
        toast.error("Error processing file data");
        setImportPreview([]);
      } finally {
        setIsPreviewLoading(false);
      }
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      setPreviewError("Error reading file");
      toast.error("Error reading file");
      setIsPreviewLoading(false);
      setImportPreview([]);
    };

    reader.readAsArrayBuffer(file);
  };

  // Function to split array into chunks
  const chunkArray = (array, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const generateSampleFile = () => {
    if (!userData || userData.length === 0) {
      toast.error("No data available to generate sample file");
      return;
    }

    try {
      const visibleColumns = getVisibleColumns();

      // Create sample data based on actual table structure
      const sampleData = [];

      // Add 2-3 sample rows based on actual data structure
      const sampleRowCount = 3;

      for (let i = 0; i < sampleRowCount; i++) {
        const sampleRow = {};

        visibleColumns.forEach((column) => {
          const key = column.key;

          // Generate sample data based on column type/name
          if (key.toLowerCase().includes("status")) {
            sampleRow[key] = true;
          } else if (key.toLowerCase().includes("date")) {
            sampleRow[key] = new Date().toISOString().split("T")[0];
          } else if (typeof userData[0][key] === "number") {
            sampleRow[key] = i + 1;
          } else if (typeof userData[0][key] === "boolean") {
            sampleRow[key] = true;
          } else {
            // Use actual sample data from first row if available, otherwise generic
            sampleRow[key] = userData[0]?.[key] || `Sample ${column.label}`;
          }
        });

        sampleData.push(sampleRow);
      }

      return sampleData;
    } catch (error) {
      console.error("Error generating sample file:", error);
      toast.error("Error generating sample file");
      return null;
    }
  };

  const handleSampleFileDownload = (format = "csv", fileName) => {
    const sampleData = generateSampleFile();

    if (!sampleData) return;

    try {
      if (format === "excel") {
        // Create Excel file
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sample Data");

        const finalFileName = `${fileName}_template.xlsx`;
        XLSX.writeFile(workbook, finalFileName);

        toast.success("Sample Excel file downloaded successfully");
      } else {
        // Create CSV file
        const headers = Object.keys(sampleData[0]);
        const csvContent = [
          headers.join(","), // Header row
          ...sampleData.map((row) =>
            headers
              .map((header) => {
                const value = row[header];
                // Handle values that might contain commas or quotes
                if (
                  typeof value === "string" &&
                  (value.includes(",") || value.includes('"'))
                ) {
                  return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
              })
              .join(","),
          ),
        ].join("\n");

        // Create and download CSV file
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", `${fileName}_sample_template.csv`);
        link.style.visibility = "hidden";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Sample CSV file downloaded successfully");
      }
    } catch (error) {
      console.error("Error downloading sample file:", error);
      toast.error("Error downloading sample file");
    }
  };

  const handleImportClick = () => {
    setShowImportModal(true);
    // Reset progress when opening modal
    setImportProgress({
      total: 0,
      processed: 0,
      currentChunk: 0,
      totalChunks: 0,
      isComplete: false,
    });
  };

  const handleEdit = (id) => {
    if (onEdit) {
      onEdit(id);
    }
  };

  const handleAcceptRequest = (id) => {
    if (onAccept) {
      onAccept(id);
    }
  };

  const handleEditForm = (id) => {
    setEditingUserId(id);
    setEditForm(true);
    setShowForm(true);
  };

  const handleCloseEditForm = () => {
    setEditForm(false);
    setEditingUserId(null);
  };

  const handleDelete = (id) => {
    if (onDelete) {
      onDelete(id);
    } else {
      // if (window.confirm("Are you sure you want to delete this item?")) {
      // }
    }
  };

  const handleCreate = () => {
    if (onCreate) {
      onCreate();
    } else {
      router.push("/dashboard");
    }
  };

  const toggleStatus = async (id, statusValue) => {
    try {
      setUpdatingStatus((prev) => new Set(prev).add(id));

      // Calculate new status
      const newDfValue = statusValue === 0 ? 1 : 0;

      setLocalUserData((prevData) =>
        prevData.map((item) => {
          const itemId = item.customer_id || item._id || item.id || item.guid;
          if (itemId === id) {
            return { ...item, df: newDfValue };
          }
          return item;
        }),
      );

      await materialDataDelete(id, { df: newDfValue });

      toast.success(
        `Status ${newDfValue === 0 ? "activated" : "deactivated"} successfully!`,
      );

      // Refresh data from server
      setTimeout(() => {
        router.replace(router.asPath);
      }, 1000);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");

      // Revert optimistic update on error
      setLocalUserData(userData);
    } finally {
      // Remove from updating status set
      setUpdatingStatus((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const renderCellContent = (item, column) => {
    const value = item[column.key];

    if (value === null || value === undefined || value === "") {
      return "-";
    }
    if (column.key === "scheme_total_discount_amount") {
      const intValue = parseInt(value, 10);
      if (!isNaN(intValue)) {
        return intValue;
      }
      return value;
    }

    if (
      column.key === "scheme_start_date" ||
      column.key === "scheme_end_date" ||
      column.key.toLowerCase().includes("date") ||
      column.key.toLowerCase().includes("time")
    ) {
      return formatDateTime(value);
    }

    if (column.key.toLowerCase() === "status") {
      // If status is null, undefined, or empty, return "Open"
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        value === "null"
      ) {
        return "Open";
      }

      // Otherwise return the actual status value
      return value;
    }

    return value.toString();
  };

  const handleCreateButtonClick = () => {
    setShowUserTypeSelector(true);
  };

  const handleUserTypeSelect = (userType) => {
    setSelectedUserType(userType);
    setShowUserTypeSelector(false);
    setShowForm(true);
  };

  const handleCloseAllModals = () => {
    setShowForm(false);
    setShowUserTypeSelector(false);
    setSelectedUserType(null);
  };

  const handleCloseUserTypeSelector = () => {
    setShowUserTypeSelector(false);
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Add this helper function before the return statement
  const getStatusDisplay = (status) => {
    if (
      !status ||
      status === null ||
      status === undefined ||
      status === "" ||
      status === "null" ||
      status === "NULL"
    ) {
      return "Open";
    }
    return status;
  };

  const getStatusPillStyle = (status) => {
    if (
      !status ||
      status === null ||
      status === undefined ||
      status === "" ||
      status === "null" ||
      status === "NULL"
    ) {
      return "bg-green-100 text-green-800 border-green-300";
    }

    const styles = {
      Open: "bg-green-100 text-green-800 border-green-300",
      "In Progress": "bg-blue-100 text-blue-800 border-blue-300",
      Completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
      Closed: "bg-gray-100 text-gray-800 border-gray-300",
      "In Review": "bg-purple-100 text-purple-800 border-purple-300",
      Rework: "bg-red-100 text-red-800 border-red-300",
    };
    return styles[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  // Render the appropriate form based on user type
  const renderUserForm = () => {
    // switch (selectedUserType) {
    //   case "local":
    //     return (
    //       <AddSystemUser
    //         onClose={handleCloseAllModals}
    //         onSuccess={onDataUpdate}
    //       />
    //     );
    //   case "ldap":
    //     return (
    //       <AddUser onClose={handleCloseAllModals} onSuccess={onDataUpdate} />
    //     );
    //   default:
    //     return (
    //       <AddUser onClose={handleCloseAllModals} onSuccess={onDataUpdate} />
    //     );
    // }
  };

  if (isLoading) return <Loader />;
  const getLength = importFile?.length;

  if (error) {
    return (
      <div className="text-center py-4 text-red-500 bg-red-50 rounded-lg">
        {typeof error === "string"
          ? error
          : error.message || "An error occurred"}
      </div>
    );
  }

  return (
    <div className="px-2 py-2">
      {/* Header Section */}
      <div className="flex justify-end items-center mb-6">
        {/* <h2 className="text-xl font-semibold text-gray-800">
          Data Table ({totalItems} items)
        </h2> */}
      </div>

      {/* Search Section */}
      <div className="bg-linear-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-t-lg p-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="w-full md:w-2/5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={activeSearchQuery}
                onChange={(e) => {
                  if (serverSidePagination) {
                    onServerSearchChange?.(e.target.value);
                    onServerPageChange?.(1);
                  } else {
                    setSearchQuery(e.target.value);
                  }
                }}
                className="w-full border border-gray-300 text-black rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="text-sm flex justify-between items-center gap-3 text-gray-600">
            {selectedItems.size > 0 ? (
              <span className="font-semibold text-blue-600">
                {selectedItems.size} item(s) selected
              </span>
            ) : activeSearchQuery ? (
              `Found ${totalItems} results`
            ) : (
              `Total: ${totalItems} items`
            )}
            <Select
              value={itemsPerPageOptions.find(
                (option) => option.value === activeItemsPerPage,
              )}
              options={itemsPerPageOptions}
              onChange={(selectedOption) =>
                changePageSize(selectedOption.value)
              }
              className=""
            />
            <div className="">
              {fileName && (
                <>
                  <div
                    className="border px-3 py-2 bg-[#01787e] hover:bg-[#034b4f] hover:cursor-pointer flex justify-between gap-2 items-center rounded-md text-white font-medium text-center transition-colors duration-200"
                    onClick={handleImportClick}
                  >
                    <RiFileExcel2Fill className="" />
                    <button className="inline-flex">{`Import ${fileName}`}</button>{" "}
                  </div>
                </>
              )}
            </div>
            <div className="">
              {exportData && (
                <div
                  className="border px-3 py-2 bg-[#217346] hover:bg-[#175031] hover:cursor-pointer flex justify-between gap-2 items-center rounded-md text-white font-medium text-center transition-colors duration-200"
                  onClick={handleExportAll}
                >
                  <RiFileExcel2Fill className="" />
                  <button className="inline-flex">{`Export ${fileName}`}</button>
                </div>
              )}
            </div>

            {buttonConfig && (
              <button
                type="button"
                onClick={handleCreateButtonClick}
                className="bg-[#013f79] hover:bg-[#002b54] text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                <Link href={`${buttonConfig?.navigation}`}>
                  {buttonConfig.name}
                </Link>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="border border-gray-200 border-t-0 rounded-b-lg overflow-hidden ">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="sticky top-0 border border-gray-500 bg-[#212e44]">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider w-16">
                  S.no
                </th>
                {visibleColumns.map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-center text-xs font-medium text-white capitalize tracking-wider"
                    style={{ minWidth: "150px" }}
                  >
                    {column.label || formatColumnLabel(column.key)}
                  </th>
                ))}
                {/* Status Column Header */}
                {hasStatusColumn && (
                  <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider w-32">
                    Status
                  </th>
                )}
                {hasActionsColumn && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider w-24">
                      Actions
                    </th>
                  )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData?.length > 0 ? (
                paginatedData.map((item, index) => {
                  const itemId = item.id;
                  const typeofOrder = item.type;
                  const request = item.request_accept_by;
                  // console.log("request:", item);

                  const dItem = item.unique_id;
                  const currentDfValue = item.df !== undefined ? item.df : 0;
                  const isActive = currentDfValue === 0;
                  const isUpdating = updatingStatus.has(itemId);

                  const allowClick = currentPath === "/orders";

                  return (
                    <tr
                      key={index}
                      onClick={
                        allowClick ? () => handleEdit(itemId) : undefined
                      }
                      className={`transition-colors  hover:bg-blue-50 ${
                        index % 2 === 0 ? "bg-gray-200" : "bg-gray-10a0"
                      } ${allowClick ? "cursor-pointer" : ""}`}
                    >
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 font-semibold">
                        {(activePage - 1) * activeItemsPerPage + index + 1}
                      </td>
                      {visibleColumns.map((column) => (
                        <td
                          key={`${itemId}-${column.key}`}
                          className="px-6 py-2 whitespace-nowrap text-center text-sm text-gray-900 max-w-xs truncate"
                          title={item[column.key]?.toString()}
                          onClick={(e) => {
                            if (
                              column.key === "order_pdf" &&
                              item[column.key]
                            ) {
                              e.stopPropagation();
                            }
                            // Make unique_id clickable
                            if (column.key === "unique_id") {
                              e.stopPropagation();
                              handleEdit(item[column.key]);
                            }
                          }}
                        >
                          {column.key === "order_pdf" &&
                          item[column.key]?.trim() !== "" &&
                          item.statusId !== 7 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadPDF(itemId, dItem);
                              }}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors inline-flex items-center gap-1"
                              title="Download PDF"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              PDF
                            </button>
                          ) : column.key === "order_pdf" &&
                            item[column.key]?.trim() !== "" &&
                            item.statusId == 7 ? (
                            ""
                          ) : column.key === "statusDesc" ? (
                            item[column.key]?.trim() ? (
                              item[column.key]
                            ) : (
                              "Pending from Business Admin"
                            )
                          ) : column.key === "group_field" ? (
                            (() => {
                              const groupField = item[column.key]?.toString();
                              switch (groupField) {
                                case "1493":
                                  return "Bio & Healthcare";
                                case "1492":
                                  return "Energy & Environment";
                                case "1494":
                                  return "Material & Semiconductor";
                                default:
                                  return groupField || "";
                              }
                            })()
                          ) : column.key === "type" ? (
                            item[column.key]?.trim() ? (
                              item[column.key]
                            ) : (
                              "TRADE"
                            )
                          ) : column.key === "total_order_value" ? (
                            `₹ ${item[column.key] || 0}`
                          ) : column.key === "approved_at" ||
                            column.key === "created_at" ? (
                            formatDate(item[column.key])
                          ) : column.key === "unique_id" ? (
                            // Make unique_id clickable with blue link style
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(item[column.key]);
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer transition-colors"
                              title={`Click to view ${item[column.key]}`}
                            >
                              {item[column.key]}
                            </button>
                          ) : column.key.toLowerCase().includes("status") ||
                            column.key === "statusDesc" ? (
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusPillStyle(
                                path === "/group-field/group-field-list"
                                  ? item[column.key] === 1 ||
                                    item[column.key] === true
                                    ? "InActive"
                                    : "Active"
                                  : item[column.key],
                              )}`}
                            >
                              {path === "/group-field/group-field-list" ||
                              path === "/creative-type/creative-type-list" ||
                              path === "/dimension/dimension-list" ||
                              path === "/user/user-list" ||
                              path === "/category/category-list"
                                ? item[column.key] === 1 ||
                                  item[column.key] === true
                                  ? "Inactive" 
                                  : "Active"
                                : getStatusDisplay(item[column.key])}
                            </span>
                          ) : (
                            // For all other columns
                            renderCellContent(item, column)
                          )}
                        </td>
                      ))}
                      {/* Status Column */}
                      {hasStatusColumn && (
                        <td className="px-6 py-2 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex justify-center items-center flex-col">
                            <button
                              type="button"
                              onClick={() =>
                                toggleStatus(itemId, currentDfValue)
                              }
                              disabled={isUpdating}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                isActive ? "bg-green-600" : "bg-gray-300"
                              } ${
                                isUpdating
                                  ? "opacity-50 cursor-not-allowed"
                                  : "cursor-pointer"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  isActive ? "translate-x-6" : "translate-x-1"
                                } ${isUpdating ? "animate-pulse" : ""}`}
                              />
                            </button>
                            <div className="text-xs text-gray-500 mt-1">
                              {isActive ? "Active" : "Inactive"}
                            </div>
                          </div>
                          {isUpdating && (
                            <div className="text-xs text-gray-500 mt-1">
                              Updating...
                            </div>
                          )}
                        </td>
                      )}

                      {/* <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleEdit(itemId)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                        </div>
                      </td> */}

                      {(
                        currentPath === "/group-field/group-field-list" ||
                        currentPath === "/category/category-list" ||
                        currentPath === "/creative-type/creative-type-list" ||
                        currentPath === "/dimension/dimension-list") && (
                        <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleEdit(itemId)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                              title="View"
                            >
                              <EyeIcon className="h-4 w-4" />
                              <span className="hidden sm:inline">View</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={
                      visibleColumns.length +
                      1 +
                      Number(hasStatusColumn) +
                      Number(hasActionsColumn)
                    }
                    className="px-6 py-12 text-center"
                  >
                    <div className="text-gray-500">
                      {activeSearchQuery ? (
                        <>
                          <h5 className="font-semibold text-lg mb-2">
                            No matching results
                          </h5>
                          <p>Try adjusting your search terms</p>
                        </>
                      ) : (
                        <>
                          <h5 className="font-semibold text-lg mb-2">
                            No data available
                          </h5>
                          <p>Add your first item to get started</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="bg-white px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-700">
              Showing {(activePage - 1) * activeItemsPerPage + 1} to{" "}
              {Math.min(activePage * activeItemsPerPage, totalItems)} of {totalItems}{" "}
              entries
            </div>

            <div className="flex items-center gap-1 justify-center flex-wrap text-black">
              <button
                type="button"
                onClick={() => changePage(1)}
                disabled={activePage === 1}
                className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                aria-label="First page"
              >
                «
              </button>
              <button
                type="button"
                onClick={() => changePage(activePage - 1)}
                disabled={activePage === 1}
                className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (activePage <= 3) {
                  pageNum = i + 1;
                } else if (activePage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = activePage - 2 + i;
                }

                return (
                  <button
                    type="button"
                    key={pageNum}
                    onClick={() => changePage(pageNum)}
                    className={`px-3 py-1 rounded border ${
                      pageNum === activePage
                        ? "bg-blue-600 text-white border-blue-600"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => changePage(activePage + 1)}
                disabled={activePage === totalPages || totalPages === 0}
                className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => changePage(totalPages)}
                disabled={activePage === totalPages || totalPages === 0}
                className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                aria-label="Last page"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommonTable;
