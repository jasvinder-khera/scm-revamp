import { useState } from "react";
import { FaHome, FaChartBar } from "react-icons/fa";
import { FiFileText, FiPieChart } from "react-icons/fi";
import { GiRolledCloth } from "react-icons/gi";

export const useDynamicMenu = () => {
  const [dynamicMenuItems, setDynamicMenuItems] = useState(MENU_ITEMS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  return { dynamicMenuItems, isLoading, error };
};

// Static menu items with dropdown support
export const MENU_ITEMS = {
  admin: [
    {
      id: "overview",
      sectionLabel: "",
      areaItems: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: FaHome,
          to: "/dashboard",
        },
        {
          id: "requests",
          label: "View All PRs",
          icon: FiFileText,
          to: "/all-pr",
        },
        {
          id: "request-line-items",
          label: "View All PR Line Items",
          icon: FiFileText,
          to: "/all-pr-line-items",
        },
        {
          id: "deleted-pr",
          label: "View All Deleted PRs",
          icon: FiFileText,
          to: "/deleted-pr",
        },
        {
          id: "delivery-challan",
          label: "Delivery Challan",
          icon: FiFileText,
          to: "/all-pr",
        },
        {
          id: "delivery-challan-line-items",
          label: "View All DC Line Items",
          icon: FiFileText,
          to: "/all-pr",
        },
         {
          id: "user",
          label: "User Management",
          icon: FiFileText,
          to: "#",
          isDropdown: true,
          items: [
            {
              id: "user-list",
              label: "All User List",
              icon: FiFileText,
              to: "/user/user-list",
            },
            {
              id: "user-logs",
              label: "All User Logs",
              icon: FiFileText,
              to: "/user/user-logs",
            },
          ],
        },
       
      ],
    },
  ],
  requestor: [
    {
      id: "overview",
      sectionLabel: "Overview",
      areaItems: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: FaHome,
          to: "/dashboard",
        },
        {
          id: "raise-pr",
          label: "Raise New PR",
          icon: FiFileText,
          to: "/raise-pr",
        },
         {
          id: "all-requests",
          label: "View All PRs",
          icon: FiFileText,
          to: "/all-pr",
        },
        {
          id: "request-line-items",
          label: "View All PR Line Items",
          icon: FiFileText,
          to: "/all-pr-line-items",
        },
        {
          id: "deleted-pr",
          label: "View All Deleted PRs",
          icon: FiFileText,
          to: "/deleted-pr",
        },
        {
          id: "delivery-challan",
          label: "Delivery Challan",
          icon: FiFileText,
          to: "/delivery-challan",
        },
        {
          id: "delivery-challan-line-items",
          label: "View All DC Line Items",
          icon: FiFileText,
          to: "/delivery-challan-line-items",
        },
        {
          id: "gateway",
          label: "HIN Gateway",
          icon: FiFileText,
          to: "#",
          isDropdown: true,
          items: [
            {
              id: "returnable",
              label: "Outward Register (Non-Returnable)",
              icon: FiFileText,
              to: "/request/create-request",
            },
            {
              id: "non-returnable",
              label: "Outward Register (Returnable)",
              icon: FiFileText,
              to: "/request/request-list",
            },
          ],
        },
      ],
    },
  ],
  trainee: [
    {
      id: "overview",
      sectionLabel: "Overview",
      areaItems: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: FaHome,
          to: "/dashboard",
        },
        {
          id: "work",
          label: "Work",
          icon: FiFileText,
          to: "#",
          isDropdown: true,
          items: [
            {
              id: "to-do",
              label: "Open Work",
              icon: FiFileText,
              to: "/work/open-work",
            },
            {
              id: "my-work",
              label: "My Work",
              icon: FiFileText,
              to: "/work/work-list",
            },
          ],
        },
      ],
    },
  ],
  designer: [
    {
      id: "overview",
      sectionLabel: "Overview",
      areaItems: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: FaHome,
          to: "/dashboard",
        },

        {
          id: "work",
          label: "Work",
          icon: FiFileText,
          to: "#",
          isDropdown: true,
          items: [
            {
              id: "to-do",
              label: "Open Work",
              icon: FiFileText,
              to: "/work/open-work",
            },
            {
              id: "my-work",
              label: "My Work",
              icon: FiFileText,
              to: "/work/work-list",
            },
          ],
        },
      ],
    },
  ],
  pm: [
    {
      id: "overview",
      sectionLabel: "Overview",
      areaItems: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: FaHome,
          to: "/dashboard",
        },
        {
          id: "requests",
          label: "Requests",
          icon: FiFileText,
          to: "#",
          isDropdown: true,
          items: [
            {
              id: "create-request",
              label: "Raise Request",
              icon: FiFileText,
              to: "/request/create-request",
            },
            {
              id: "my-request",
              label: "My Request",
              icon: FiFileText,
              to: "/request/request-list",
            },
          ],
        },
      ],
    },
  ],
};

export const DEFAULT_MENU = MENU_ITEMS.admin;

export default useDynamicMenu;
