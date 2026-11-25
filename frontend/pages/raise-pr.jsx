import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getRaisePurchaseRequestOptions,
  submitPurchaseRequest,
} from "../lib/api";
import Loader from "../components/Loader/Loader";
import moment from "moment";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import Head from "next/head";

const fieldClassName =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";
const labelClassName = "block text-sm font-medium text-slate-700";

const ITEM_TYPES = [
  "Stock(Inventory)",
  "Non-Stock(Consumables)",
  "Asset/CapitalGoods",
  "Promotional",
  "Services",
];

const MATERIAL_DETAILS = {
  "Stock(Inventory)": ["SAP Mat Code", "Prod Hierarchy"],
  "Non-Stock(Consumables)": ["Cost Center"],
  "Asset/CapitalGoods": ["Asset Code", "Cost Center"],
  Promotional: ["Cost Center"],
  Services: [
    "SAP Mat Code",
    "Service Order No.",
    "Prod Hierarchy",
    "Cost Center",
  ],
};
const MATERIAL_DETAIL_OPTIONS = [
  ...new Set(Object.values(MATERIAL_DETAILS).flat()),
];
const INITIAL_ROW_COUNT = 50;
const MAX_ROW_COUNT = 300;

const DELIVERY_ADDRESSES = [
  ["del", "Delhi Office"],
  ["pun", "Pune HITC"],
  ["chn", "Chennai"],
  ["bng", "Bangalore"],
  ["hdw", "Haridwar Factory"],
  ["ngp", "Nagpur Factory"],
  ["oth", "Others"],
];

function getApiErrorMessage(data, fallback) {
  if (Array.isArray(data?.detail)) {
    return (
      data.detail
        .map((issue) => issue.msg)
        .filter(Boolean)
        .join("; ") || fallback
    );
  }
  return data?.detail || data?.message || fallback;
}

const createSpreadsheetRow = (uomId = "") => [
  "",
  "",
  "",
  "",
  "",
  uomId,
  "",
  "",
  "0.00",
  "",
  "",
];

const rowHasData = (row) =>
  [0, 1, 2, 3, 4, 6, 7, 9, 10].some(
    (column) => String(row[column] ?? "").trim() !== "",
  );

function updateSpreadsheetTotals(worksheet, updatingTotalsRef) {
  const data = worksheet.getData(false, true);
  let total = 0;
  const rowTotals = data.map((row) => {
    const rowTotal = (Number(row[6]) || 0) * (Number(row[7]) || 0);
    total += rowTotal;
    return rowTotal.toFixed(2);
  });

  updatingTotalsRef.current = true;
  try {
    rowTotals.forEach((rowTotal, index) => {
      if (String(data[index][8] ?? "") !== rowTotal) {
        worksheet.setValueFromCoords(8, index, rowTotal, true);
      }
    });
  } finally {
    updatingTotalsRef.current = false;
  }

  return Number(total.toFixed(2));
}

function SelectField({
  label,
  value,
  onChange,
  children,
  required = false,
  ...props
}) {
  return (
    <label className={labelClassName}>
      {label}
      {required && <span className="ml-1 text-red-600">*</span>}
      <select
        className={fieldClassName}
        value={value}
        onChange={onChange}
        required={required}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  ...props
}) {
  return (
    <label className={labelClassName}>
      {label}
      {required && <span className="ml-1 text-red-600">*</span>}
      <input
        className={fieldClassName}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        {...props}
      />
    </label>
  );
}

export default function RaisePurchaseRequest() {
  const [options, setOptions] = useState(null);
  const [form, setForm] = useState({
    sub_group_field_id: "",
    function_id: "",
    company_type: "Inter-Company",
    buyer_id: "",
    priority: "1",
    resale: "Yes",
    customer_name: "",
    customer_po_number: "",
    hin_use: "No",
    hin_use_clarify: "",
    back_charge: "",
    delivery_address: "",
    other_delivery_address: "",
    subject: "",
    project_number: "",
    purpose: "",
    cc_user_id: "",
    remarks: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [total, setTotal] = useState(0);
  const [rowCount, setRowCount] = useState(INITIAL_ROW_COUNT);
  const [gridReady, setGridReady] = useState(false);
  const [gridError, setGridError] = useState("");
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvError, setCsvError] = useState("");
  const csvFileInputRef = useRef(null);
  const spreadsheetHostRef = useRef(null);
  const worksheetRef = useRef(null);
  const updatingTotalsRef = useRef(false);
  const router = useRouter();

  function parseExcelDate(value, rowIndex) {
    console.log("DATE VALUE:", value);
    if (value === null || value === undefined || value === "") return "";

    // 1) Date object (from cellDates: true)
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        console.warn(`Row ${rowIndex}: invalid Date object`);
        return "";
      }
      // Use UTC getters to avoid timezone shift
      const y = value.getFullYear();
      const m = String(value.getMonth() + 1).padStart(2, "0");
      const d = String(value.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    // 2) Excel serial number
    if (typeof value === "number" && Number.isFinite(value)) {
      const m = moment("1899-12-30", "YYYY-MM-DD").add(
        Math.round(value),
        "days",
      );
      return m.isValid() ? m.format("YYYY-MM-DD") : "";
    }

    // 3) String
    const str = String(value)
      .trim()
      .replace(/\u2013|\u2014|\u2212/g, "-"); // normalize en/em/minus dashes
    if (!str) return "";

    const strict = moment(
      str,
      ["DD-MM-YYYY", "DD/MM/YYYY", "D-M-YYYY", "D/M/YYYY"],
      true,
    );
    if (strict.isValid()) return strict.format("YYYY-MM-DD");

    const iso = moment(str, moment.ISO_8601, true);
    if (iso.isValid()) return iso.format("YYYY-MM-DD");

    console.warn(`Row ${rowIndex}: could not parse EDD "${str}"`);
    return "";
  }

  useEffect(() => {
    let active = true;

    getRaisePurchaseRequestOptions()
      .then(({ data, status }) => {
        if (status < 200 || status >= 300) {
          throw new Error(
            getApiErrorMessage(data, "Unable to load request options."),
          );
        }
        if (
          !data?.requester ||
          !Array.isArray(data.sub_groups) ||
          !Array.isArray(data.functions) ||
          !Array.isArray(data.buyers) ||
          !Array.isArray(data.cc_users) ||
          !Array.isArray(data.plants) ||
          !Array.isArray(data.uom_source)
        ) {
          throw new Error("The request options response is invalid.");
        }
        if (active) {
          setOptions(data);
          console.log("UOM data:", data.uom_source);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError?.message || "Unable to load request options.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const uomSource = useMemo(
    () => (options?.uom_source || []).map((uom) => String(uom.name).trim()),
    [options],
  );

  const plantSource = useMemo(
    () =>
      (options?.plants || []).map((plant) => `${plant.code} - ${plant.name}`),
    [options],
  );

  const uomIdByName = useMemo(() => {
    const map = new Map();
    (options?.uom_source || []).forEach((uom) =>
      map.set(String(uom.name).trim(), Number(uom.id)),
    );
    return map;
  }, [options]);

  const plantIdByName = useMemo(() => {
    const map = new Map();
    (options?.plants || []).forEach((plant) =>
      map.set(`${plant.code} - ${plant.name}`, Number(plant.id)),
    );
    return map;
  }, [options]);

  const defaultUomName = useMemo(
    () =>
      (options?.uom_source || []).find(
        (u) => String(u.name).trim().toUpperCase() === "EA-EACH",
      )?.name || "",
    [options],
  );

  const visibleFunctions = useMemo(
    () =>
      (options?.functions || []).filter(
        (func) =>
          String(func.sub_group_field_id) === String(form.sub_group_field_id),
      ),
    [options, form.sub_group_field_id],
  );

  const refreshGridTotals = useCallback((worksheet) => {
    if (!worksheet || updatingTotalsRef.current) return;
    setTotal(updateSpreadsheetTotals(worksheet, updatingTotalsRef));
    setRowCount(worksheet.getData(false, true).length);
    setError("");
  }, []);

  useEffect(() => {
    if (!options || !spreadsheetHostRef.current) return undefined;

    let active = true;
    let jspreadsheet;
    const host = spreadsheetHostRef.current;

    async function initializeSpreadsheet() {
      try {
        const spreadsheetModule = await import("jspreadsheet-ce");
        jspreadsheet = spreadsheetModule.default || spreadsheetModule;
        if (!active) return;

        const initialData = Array.from({ length: INITIAL_ROW_COUNT }, () =>
          createSpreadsheetRow(defaultUomName),
        );
        const worksheets = jspreadsheet(host, {
          worksheets: [
            {
              data: initialData,
              minDimensions: [11, 20],
              columns: [
                {
                  type: "dropdown",
                  title: "Item Type",
                  width: 170,
                  source: ITEM_TYPES,
                  autocomplete: true,
                },
                {
                  type: "dropdown",
                  title: "Plant",
                  width: 150,
                  source: plantSource,
                  autocomplete: true,
                },
                {
                  type: "dropdown",
                  title: "Material Detail",
                  width: 160,
                  source: MATERIAL_DETAIL_OPTIONS,
                  autocomplete: true,
                },
                {
                  type: "text",
                  title: "MC/PH/CC/SO/AC",
                  width: 140,
                },
                {
                  type: "text",
                  title: "Material Description",
                  width: 200,
                },
                {
                  type: "dropdown",
                  title: "UOM",
                  width: 130,
                  source: uomSource,
                  autocomplete: true,
                },
                {
                  type: "numeric",
                  title: "Quantity",
                  width: 100,
                  align: "right",
                  mask: "0",
                },
                {
                  type: "numeric",
                  title: "Unit Value",
                  width: 115,
                  align: "right",
                  mask: "0.00",
                },
                {
                  type: "numeric",
                  title: "Total Amount",
                  width: 125,
                  align: "right",
                  mask: "0.00",
                  readOnly: true,
                },
                {
                  type: "calendar",
                  title: "EDD",
                  width: 125,
                  options: { format: "YYYY-MM-DD" },
                },
                {
                  type: "text",
                  title: "Remarks",
                  width: 180,
                },
              ],
              allowInsertRow: true,
              allowInsertColumn: false,
              allowManualInsertRow: false,
              allowManualInsertColumn: false,
              allowDeleteRow: true,
              tableOverflow: true,
              tableWidth: "100%",
              tableHeight: "550px",
            },
          ],
          onchange: (worksheet) => refreshGridTotals(worksheet),
          oninsertrow: (worksheet) => refreshGridTotals(worksheet),
          ondeleterow: (worksheet) => refreshGridTotals(worksheet),
        });
        const worksheet = worksheets?.[0];
        if (!worksheet) {
          throw new Error("The item spreadsheet could not be initialized.");
        }

        worksheetRef.current = worksheet;
        setGridError("");
        setGridReady(true);
        refreshGridTotals(worksheet);
      } catch (initializationError) {
        if (active) {
          setGridError(
            initializationError?.message ||
              "The item spreadsheet could not be initialized.",
          );
          setGridReady(false);
        }
      }
    }

    initializeSpreadsheet();

    return () => {
      active = false;
      if (jspreadsheet && host) {
        jspreadsheet.destroy(host, true);
      }
      worksheetRef.current = null;
    };
  }, [options, plantSource, refreshGridTotals, uomSource]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  }

  function addMoreRows() {
    const worksheet = worksheetRef.current;
    if (!worksheet) {
      setError("The item spreadsheet is not ready.");
      return;
    }
    if (rowCount >= MAX_ROW_COUNT) {
      setError("A request can have no more than 300 line items.");
      return;
    }

    const rowsToAdd = Math.min(10, MAX_ROW_COUNT - rowCount);
    worksheet.insertRow(rowsToAdd);
    const firstNewRow = worksheet.getData(false, true).length - rowsToAdd;
    updatingTotalsRef.current = true;
    try {
      for (
        let rowIndex = firstNewRow;
        rowIndex < firstNewRow + rowsToAdd;
        rowIndex += 1
      ) {
        worksheet.setValueFromCoords(5, rowIndex, defaultUomName || "", true);
      }
    } finally {
      updatingTotalsRef.current = false;
    }
    setRowCount(worksheet.getData(false, true).length);
    refreshGridTotals(worksheet);
  }

  function handleAttachmentChange(event) {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setAttachment(null);
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "zip"].includes(extension)) {
      event.target.value = "";
      setAttachment(null);
      setError("Attachments must be a PDF or ZIP file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      event.target.value = "";
      setAttachment(null);
      setError("Attachments cannot exceed 8 MB.");
      return;
    }
    setAttachment(file);
    setError("");
  }

  function openCsvModal() {
    setCsvFile(null);
    setCsvError("");
    if (csvFileInputRef.current) csvFileInputRef.current.value = "";
    setCsvModalOpen(true);
  }

  function closeCsvModal() {
    if (csvUploading) return;
    setCsvModalOpen(false);
    setCsvFile(null);
    setCsvError("");
    if (csvFileInputRef.current) csvFileInputRef.current.value = "";
  }

  // name -> id (already have)
// id -> display string
const plantNameById = useMemo(() => {
  const map = new Map();
  (options?.plants || []).forEach((plant) =>
    map.set(String(plant.id), `${plant.code} - ${plant.name}`),
  );
  return map;
}, [options]);

const plantNameByCode = useMemo(() => {
  const map = new Map();
  (options?.plants || []).forEach((plant) =>
    map.set(String(plant.code).trim().toUpperCase(), `${plant.code} - ${plant.name}`),
  );
  return map;
}, [options]);

const uomNameById = useMemo(() => {
  const map = new Map();
  (options?.uom_source || []).forEach((uom) =>
    map.set(String(uom.id), String(uom.name).trim()),
  );
  return map;
}, [options]);

// The uom_source API returns `code` (e.g. "EA") and `name` ("EA-Each").
// Map the bare code -> display name so a file with "EA" resolves.
const uomNameByCode = useMemo(() => {
  const map = new Map();
  (options?.uom_source || []).forEach((uom) =>
    map.set(String(uom.code).trim().toUpperCase(), String(uom.name).trim()),
  );
  return map;
}, [options]);

function resolvePlantName(rawValue) {
  const raw = String(rawValue ?? "").trim();
  if (!raw) return "";
  // 1) exact display name already ("HDW - Haridwar Factory")
  if (plantIdByName.has(raw)) return raw;
  // 2) plant_id ("3")
  const byId = plantNameById.get(raw);
  if (byId) return byId;
  // 3) plant code ("HDW" / "hdw")
  const byCode = plantNameByCode.get(raw.toUpperCase());
  if (byCode) return byCode;
  return ""; // unknown → leave blank so user must pick
}

function resolveUomName(rawValue) {
  const raw = String(rawValue ?? "").trim();
  if (!raw) return "";
  // 1) exact display name already ("EA-Each")
  if (uomIdByName.has(raw)) return raw;
  // 2) uom_id ("212")
  const byId = uomNameById.get(raw);
  if (byId) return byId;
  // 3) bare code ("EA" / "ea")
  const byCode = uomNameByCode.get(raw.toUpperCase());
  if (byCode) return byCode;
  return "";
}

  function handleCsvFileChange(event) {
    const file = event.target.files?.[0] || null;
    setCsvError("");
    if (!file) {
      setCsvFile(null);
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx") {
      event.target.value = "";
      setCsvFile(null);
      setCsvError("Only .xlsx format is supported.");
      return;
    }
    setCsvFile(file);
  }

  async function handleCsvUpload() {
    if (!csvFile) {
      setCsvError("Please select an .xlsx file.");
      return;
    }
    if (!worksheetRef.current) {
      setCsvError("The spreadsheet is not ready.");
      return;
    }

    setCsvUploading(true);
    setCsvError("");
    try {
      // Dynamically import xlsx (SheetJS) — client-side only, no API call
      const XLSXModule = await import("xlsx");
      const XLSX = XLSXModule.default || XLSXModule;

      const arrayBuffer = await csvFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, {
        type: "array",
        cellDates: true,
      });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert to array of arrays, skip the header row (row 0)
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      if (!raw || raw.length <= 1) {
        throw new Error("The file appears to be empty or has no data rows.");
      }

      // Map each data row (skip header) to the 11-column spreadsheet format:
      // [item_type, plant_id, material_detail, part_no, material_description,
      //  uom_id, quantity, unit_value, total_amount(auto), edd, remarks]
      const rows = raw.slice(1).map((row) => {
        const qty = Number(row[6]) || 0;
        const price = Number(row[7]) || 0;
        const plantName = resolvePlantName(row[1]);
        const uomName = resolveUomName(row[5]) || defaultUomName;
        return [
          String(row[0] ?? ""), // Item Type
          plantName, // Plant ID
          String(row[2] ?? ""), // Material Detail
          String(row[3] ?? ""), // MC/PH/CC/SO/AC
          String(row[4] ?? ""), // Material Description
          uomName, // UOM
          String(qty || ""), // Quantity
          String(price || ""), // Unit Value
          (qty * price).toFixed(2), // Total Amount (calculated)
          parseExcelDate(row[8]), // EDD
          row[9] ? String(row[9]) : "", // Remarks
        ];
      });

      if (rows.length === 0) {
        throw new Error("No data rows found in the file.");
      }
      console.log("EDD being set:", rows[0]?.[8], "raw was:", raw[1]?.[8]);

      // Load rows into the spreadsheet
      worksheetRef.current.setData(rows);
      worksheetRef.current.setData(rows);
console.log("EDD in grid:", worksheetRef.current.getData(false, true)[0]?.[8]);
      refreshGridTotals(worksheetRef.current);
      closeCsvModal();
    } catch (uploadError) {
      setCsvError(
        uploadError?.message ||
          "Failed to read the file. Make sure it is a valid .xlsx file.",
      );
    } finally {
      setCsvUploading(false);
    }
  }

  // Returns { row, field } for the first missing/invalid field, or null if all good.
  function findFirstIncompleteField(rows) {
    const isBlank = (v) => !String(v ?? "").trim();

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const rowNo = i + 1; // 1-based line number for the user

      if (isBlank(row[0])) return { row: rowNo, field: "Item Type" };
      if (isBlank(row[1])) return { row: rowNo, field: "Plant" };
      if (isBlank(row[2])) return { row: rowNo, field: "Material Detail" };

      // MC/PH/CC/SO/AC is required only for Stock(Inventory)
      if (row[0] === "Stock(Inventory)" && isBlank(row[3])) {
        return { row: rowNo, field: "MC/PH/CC/SO/AC" };
      }

      if (isBlank(row[4])) return { row: rowNo, field: "Material Description" };
      if (isBlank(row[5])) return { row: rowNo, field: "UOM" };

      if (
        isBlank(row[6]) ||
        !Number.isInteger(Number(row[6])) ||
        Number(row[6]) <= 0
      ) {
        return { row: rowNo, field: "Quantity (must be a greater than 0)" };
      }

      if (
        isBlank(row[7]) ||
        !Number.isFinite(Number(row[7])) ||
        Number(row[7]) < 0
      ) {
        return { row: rowNo, field: "Unit Value (must be a number ≥ 0)" };
      }

      if (isBlank(row[9])) return { row: rowNo, field: "EDD" };
    }
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!gridReady || !worksheetRef.current) {
      setError("The item spreadsheet is not ready.");
      return;
    }

    const populatedRows = worksheetRef.current
      .getData(false, true)
      .filter(rowHasData);

    if (populatedRows.length === 0) {
      toast.error("Add at least one line item before submitting.");
      return;
    }

    const missing = findFirstIncompleteField(populatedRows);
    if (missing) {
      const message = `Line item ${missing.row}: "${missing.field}" is required.`;
      setError(message);
      toast.error(message);
      return;
    }

    const requestLines = populatedRows.map((row) => {
      const plantName = String(row[1] ?? "").trim();
      const uomName = String(row[5] ?? "").trim();
      const plant_id = plantIdByName.get(plantName);
      const uom_id = uomIdByName.get(uomName);

      if (!plant_id || !uom_id) {
        throw new Error(
          `Unknown plant "${plantName}" or UOM "${uomName}" in a line item.`,
        );
      }

      return {
        item_type: String(row[0]).trim(),
        plant_id,
        material_detail: String(row[2]).trim(),
        part_no: String(row[3] ?? "").trim() || null,
        material_description: String(row[4]).trim(),
        uom_id,
        quantity: Number(row[6]),
        unit_value: Number(row[7]),
        expected_delivery: String(row[9]).trim(),
        remarks: String(row[10] ?? "").trim() || null,
      };
    });

    if (Number(options.requester.group_field_id) !== 4 && !form.function_id) {
      setError("Select a function.");
      return;
    }
    if (!form.sub_group_field_id || !form.buyer_id || !form.delivery_address) {
      setError(
        "Complete the required subgroup, buyer, and delivery address fields.",
      );
      return;
    }
    if (
      form.resale === "Yes" &&
      (!form.customer_name.trim() || !form.customer_po_number.trim())
    ) {
      setError(
        "Customer name and customer PO number are required for resale requests.",
      );
      return;
    }
    if (form.hin_use === "Yes" && !form.hin_use_clarify.trim()) {
      setError("Please clarify the HIN own-use requirement.");
      return;
    }
    if (
      form.delivery_address === "oth" &&
      !form.other_delivery_address.trim()
    ) {
      setError("Provide the other delivery address.");
      return;
    }

    const payload = {
      ...form,
      function_id: form.function_id ? Number(form.function_id) : null,
      sub_group_field_id: Number(form.sub_group_field_id),
      buyer_id: Number(form.buyer_id),
      priority: Number(form.priority),
      cc_user_id: form.cc_user_id ? Number(form.cc_user_id) : null,
      lines: requestLines,
    };

    setIsSubmitting(true);
    try {
      const { data, status } = await submitPurchaseRequest(payload, attachment);
      if (status < 200 || status >= 300) {
        throw new Error(
          getApiErrorMessage(data, "Unable to submit the purchase request."),
        );
      }
      setSuccess(
        data?.message ||
          `Purchase request ${data?.pur_req_hdr_id || ""} submitted for approval.`,
      );
      if (data.response == "success") {
        toast.success("PR Raised Successfully");
        router.push("/all-pr");
      }
    } catch (requestError) {
      setError(
        requestError?.message || "Unable to submit the purchase request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const PAGE_TITLE = "Raise Purchase Request | HORIBA Care";

  if (isLoading) {
    return (
        <>
         <Head><title>{PAGE_TITLE}</title></Head>
      <main className="mx-auto max-w-[1500px] p-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Raise Purchase Request
        </h1>
        <Loader />
      </main>
      </>
    );
  }

  if (!options) {
    return (
        <>
         <Head><title>{PAGE_TITLE}</title></Head>
      <main className="mx-auto max-w-[1500px] p-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Raise Purchase Request
        </h1>
        <p
          className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      </main>
      </>
    );
  }

  return (
    <>
       <Head><title>{PAGE_TITLE}</title></Head>
    <main className="mx-auto w-full min-w-0 max-w-[1500px] space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Raise Purchase Request
        </h1>
      </header>

      {error && (
        <div
          className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          role="status"
        >
          {success}
        </div>
      )}

      <form className="min-w-0 space-y-6" onSubmit={handleSubmit}>
        <fieldset className="min-w-0" disabled={isSubmitting}>
          <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Request details
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <TextField
                label="Requester"
                value={`${options.requester.name} - ${options.requester.email || ""}`}
                readOnly
                disabled
              />
              <TextField
                label="PR raised date"
                value={new Date().toLocaleDateString()}
                readOnly
                disabled
              />
              <TextField
                label="Group field"
                value={options.requester.group_field}
                readOnly
                disabled
              />
              <SelectField
                label="Subgroup field"
                value={form.sub_group_field_id}
                onChange={(event) => {
                  updateForm("sub_group_field_id", event.target.value);
                  updateForm("function_id", "");
                }}
                required
              >
                <option value="">Select subgroup</option>
                {options.sub_groups.map((subGroup) => (
                  <option key={subGroup.id} value={subGroup.id}>
                    {subGroup.name}
                  </option>
                ))}
              </SelectField>
              {Number(options.requester.group_field_id) !== 4 && (
                <SelectField
                  label="Function"
                  value={form.function_id}
                  onChange={(event) =>
                    updateForm("function_id", event.target.value)
                  }
                  required
                >
                  <option value="">Select function</option>
                  {visibleFunctions.map((func) => (
                    <option key={func.id} value={func.id}>
                      {func.name}
                    </option>
                  ))}
                </SelectField>
              )}
              <SelectField
                label="Affiliate for back charge"
                value={form.back_charge}
                onChange={(event) =>
                  updateForm("back_charge", event.target.value)
                }
              >
                <option value="">Select</option>
                {["HOR", "HE", "HTS", "HAT", "HMFR"].map((affiliate) => (
                  <option key={affiliate} value={affiliate}>
                    {affiliate}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Company type"
                value={form.company_type}
                onChange={(event) =>
                  updateForm("company_type", event.target.value)
                }
                required
              >
                <option>Inter-Company</option>
                <option>Other-Company</option>
              </SelectField>
              <SelectField
                label="Priority"
                value={form.priority}
                onChange={(event) => updateForm("priority", event.target.value)}
              >
                <option value="1">Low</option>
                <option value="2">Medium</option>
                <option value="3">High</option>
              </SelectField>
              <SelectField
                label="Buyer"
                value={form.buyer_id}
                onChange={(event) => updateForm("buyer_id", event.target.value)}
                required
              >
                <option value="">Select buyer</option>
                {options.buyers.map((buyer) => (
                  <option key={buyer.id} value={buyer.id}>
                    {buyer.name}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Is it for resale?"
                value={form.resale}
                onChange={(event) => updateForm("resale", event.target.value)}
                required
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </SelectField>
              {form.resale === "Yes" && (
                <>
                  <TextField
                    label="Customer PO number"
                    value={form.customer_po_number}
                    onChange={(event) =>
                      updateForm("customer_po_number", event.target.value)
                    }
                    maxLength={100}
                    required
                  />
                  <TextField
                    label="Customer name"
                    value={form.customer_name}
                    onChange={(event) =>
                      updateForm("customer_name", event.target.value)
                    }
                    maxLength={50}
                    required
                  />
                </>
              )}
              <SelectField
                label="For HIN own use?"
                value={form.hin_use}
                onChange={(event) => updateForm("hin_use", event.target.value)}
                required
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </SelectField>
              {form.hin_use === "Yes" && (
                <TextField
                  label="HIN own-use clarification"
                  value={form.hin_use_clarify}
                  onChange={(event) =>
                    updateForm("hin_use_clarify", event.target.value)
                  }
                  required
                />
              )}
              <SelectField
                label="Delivery address"
                value={form.delivery_address}
                onChange={(event) =>
                  updateForm("delivery_address", event.target.value)
                }
                required
              >
                <option value="">Select delivery address</option>
                {DELIVERY_ADDRESSES.map(([value, name]) => (
                  <option key={value} value={value}>
                    {name}
                  </option>
                ))}
              </SelectField>
              {form.delivery_address === "oth" && (
                <TextField
                  label="Other delivery address"
                  value={form.other_delivery_address}
                  onChange={(event) =>
                    updateForm("other_delivery_address", event.target.value)
                  }
                  required
                />
              )}
              <TextField
                label="PR subject"
                value={form.subject}
                onChange={(event) => updateForm("subject", event.target.value)}
                required
              />
              <TextField
                label="Project name/number"
                value={form.project_number}
                onChange={(event) =>
                  updateForm("project_number", event.target.value)
                }
                maxLength={200}
              />
              <TextField
                label="Purpose of purchase"
                value={form.purpose}
                onChange={(event) => updateForm("purpose", event.target.value)}
                maxLength={255}
                required
              />
            </div>
          </section>

          <section className="mt-6 min-w-0 max-w-full space-y-4 overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Item Details
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
                  onClick={addMoreRows}
                  disabled={!gridReady || rowCount >= MAX_ROW_COUNT}
                >
                  Add 10 More Rows
                </button>
                <button
                  type="button"
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  onClick={openCsvModal}
                  disabled={!gridReady}
                >
                 Upload file
                </button>
              </div>
            </div>

            <div className="w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
              <div className="w-full min-w-0" ref={spreadsheetHostRef} />
            </div>
            {!gridReady && !gridError && (
              <p className="text-sm text-slate-600">
                Loading item spreadsheet…
              </p>
            )}
            {gridError && (
              <p className="text-sm text-red-700" role="alert">
                {gridError}
              </p>
            )}

            <div className="grid gap-4 border-t border-slate-200 pt-4 md:grid-cols-3">
              <TextField
                label="PR total amount"
                value={total.toFixed(2)}
                readOnly
              />
              <SelectField
                label="Select user to CC"
                value={form.cc_user_id}
                onChange={(event) =>
                  updateForm("cc_user_id", event.target.value)
                }
              >
                <option value="">No CC user</option>
                {options.cc_users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </SelectField>
              <label className={labelClassName}>
                Attachment (PDF or ZIP, max 8 MB)
                <input
                  className={fieldClassName}
                  type="file"
                  accept=".pdf,.zip"
                  onChange={handleAttachmentChange}
                />
              </label>
              <label className={labelClassName}>
                Remarks / special instructions
                <textarea
                  className={fieldClassName}
                  rows={3}
                  value={form.remarks}
                  onChange={(event) =>
                    updateForm("remarks", event.target.value)
                  }
                />
              </label>
            </div>
          </section>
        </fieldset>

        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-md bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting…" : "Submit for approval"}
          </button>
          <button
            className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            type="button"
            onClick={() => {
              window.location.href = "/all-pr";
            }}
          >
            Cancel
          </button>
        </div>
      </form>

      {/* ===== Upload CSV Modal ===== */}
      {csvModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={closeCsvModal}
          />
          {/* Modal */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="csv-modal-title"
          >
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2
                  id="csv-modal-title"
                  className="text-base font-semibold text-slate-900"
                >
                  Upload Excel File
                </h2>
                <button
                  type="button"
                  onClick={closeCsvModal}
                  disabled={csvUploading}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="space-y-4 px-6 py-5">
                <p className="text-sm text-slate-600">
                  <a
                    href="/sample-pr-import.xlsx"
                    download
                    className="font-medium text-blue-600 underline hover:text-blue-800"
                  >
                    Click here
                  </a>{" "}
                  to download the sample file.
                </p>

                <label className={labelClassName}>
                  Select file (.xlsx only)
                  <input
                    ref={csvFileInputRef}
                    type="file"
                    accept=".xlsx"
                    onChange={handleCsvFileChange}
                    disabled={csvUploading}
                    className={`${fieldClassName} mt-1`}
                  />
                </label>

                <p className="text-xs text-red-500">
                  * Only .xlsx format is supported.
                </p>

                {csvError && (
                  <p
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                    role="alert"
                  >
                    {csvError}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={closeCsvModal}
                  disabled={csvUploading}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCsvUpload}
                  disabled={csvUploading || !csvFile}
                  className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {csvUploading ? "Uploading…" : "Upload"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
    </>
  );
}
