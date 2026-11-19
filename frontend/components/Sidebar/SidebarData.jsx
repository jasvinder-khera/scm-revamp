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
          id: "group-field",
          label: "Group Field",
          icon: FiFileText,
          to: "#",
          isDropdown: true,
          items: [
            {
              id: "group-field",
              label: "Group Field List",
              icon: FiPieChart,
              to: "/group-field/group-field-list",
            },
            {
              id: "group-field-list",
              label: "Create Group Field",
              icon: FaChartBar,
              to: "/group-field/create-group-field",
            },
          ],
        },
        {
          id: "creative-config",
          label: "Creative Config",
          icon: FiFileText,
          to: "#",
          isDropdown: true,
          items: [
            {
              id: "category-list",
              label: "Category List",
              icon: FiPieChart,
              to: "/category/category-list",
            },
            {
              id: "create-category",
              label: "Create Category",
              icon: FaChartBar,
              to: "/category/create-category",
            },
            {
              id: "creative-types",
              label: "Creative Type List",
              icon: FiPieChart,
              to: "/creative-type/creative-type-list",
            },
            {
              id: "create-creative-type",
              label: "Create Creative Type",
              icon: FaChartBar,
              to: "/creative-type/create-creative-type",
            },
            {
              id: "dimensions",
              label: "Dimension List",
              icon: FiPieChart,
              to: "/dimension/dimension-list",
            },
            {
              id: "create-dimension",
              label: "Create Dimension",
              icon: FaChartBar,
              to: "/dimension/create-dimension",
            },
            {
              id: "materials",
              label: "Material Type",
              icon: GiRolledCloth,
              to: "/materials-specification/materials-type",
            },
            {
              id: "list-materials",
              label: "Material Type List",
              icon: FaChartBar,
              to: "/materials-specification/materials-type-list",
            },
          ],
        },
        {
          id: "user-management",
          label: "User Management",
          icon: FiFileText,
          to: "#",
          isDropdown: true,
          items: [
            {
              id: "user-list",
              label: "Users List",
              icon: FaChartBar,
              to: "/user/user-list",
            },
            {
              id: "register",
              label: "Register",
              icon: FiPieChart,
              to: "/register",
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
