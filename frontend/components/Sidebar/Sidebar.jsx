import Link from "next/link";
import { useRouter } from "next/router";
import {
  useState,
  useEffect,
  isValidElement,
  cloneElement,
  useRef,
} from "react";
import { GoLock } from "react-icons/go";
import { DEFAULT_MENU, useDynamicMenu } from "./SidebarData";
import { FaChevronRight } from "react-icons/fa";
import { getCurrentUserApi } from "../../lib/api";
import { isAuthenticated, logout } from "../../lib/auth";

const ICON_COMPONENTS = {
  GoLock,
};

const renderMenuIcon = (icon, className = "w-5 h-5 flex-shrink-0") => {
  if (isValidElement(icon)) {
    const combinedClassName = [icon.props?.className, className]
      .filter(Boolean)
      .join(" ");
    return cloneElement(icon, { className: combinedClassName });
  }

  if (typeof icon === "function") {
    const IconComponent = icon;
    return <IconComponent className={className} />;
  }

  if (typeof icon === "string") {
    const NamedIcon = ICON_COMPONENTS[icon];
    if (NamedIcon) {
      return <NamedIcon className={className} />;
    }

    return (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={icon}
        />
      </svg>
    );
  }

  return <GoLock className={className} />;
};

const Sidebar = ({ isOpen, onToggle }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [activeItem, setActiveItem] = useState("");
  const [expandedItems, setExpandedItems] = useState({});
  const [profileError, setProfileError] = useState("");
  const router = useRouter();
  const [user, setUser] = useState(null);
  const { dynamicMenuItems, isLoading } = useDynamicMenu();

  useEffect(() => {
    if (!isAuthenticated()) return undefined;

    let active = true;
    getCurrentUserApi()
      .then(({ data, status }) => {
        if (!active) return;
        if (status === 401) {
          logout();
          return;
        }
        if (status < 200 || status >= 300) {
          throw new Error(
            data?.detail || data?.message || "Unable to load account details.",
          );
        }
        setUser(data);
      })
      .catch((error) => {
        if (active) {
          setProfileError(error?.message || "Unable to load account details.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const getMenuItems = () => {
    if (!user) return dynamicMenuItems.requestor || DEFAULT_MENU;

    switch (String(user.user_role)) {
      case "3":
        return dynamicMenuItems.admin || DEFAULT_MENU;
      case "0":
        return dynamicMenuItems.requestor || DEFAULT_MENU;
      default:
        return dynamicMenuItems.requestor || DEFAULT_MENU;
    }
  };

  // const checkRouteAccess = (path) => {
  //   if (!user) return false;
  //   if (user.role === "1") return true;

  //   // Block specific routes
  //   if (path === "/work/work-list") {
  //     return false;
  //   }

  //   const menuItems = getMenuItems();
  //   const routes = [];

  //   const extractRoutes = (items) => {
  //     if (!items || !Array.isArray(items)) return;
  //     items.forEach((item) => {
  //       if (item.areaItems && Array.isArray(item.areaItems)) {
  //         item.areaItems.forEach((areaItem) => {
  //           if (areaItem.to && areaItem.to !== "#") {
  //             routes.push(areaItem.to);
  //           }
  //           if (areaItem.items && Array.isArray(areaItem.items)) {
  //             areaItem.items.forEach((subItem) => {
  //               if (subItem.to && subItem.to !== "#") {
  //                 routes.push(subItem.to);
  //               }
  //             });
  //           }
  //         });
  //       }
  //     });
  //   };

  //   extractRoutes(menuItems);

  //   // Check exact match
  //   if (routes.includes(path)) return true;

  //   // Check if the path starts with any route + '/'
  //   for (const route of routes) {
  //     if (path.startsWith(route + "/")) {
  //       return true;
  //     }
  //   }

  //   // NEW: Check for dynamic routes like /request/anything or /work/anything
  //   // This handles cases where the base route doesn't exist in menu
  //   const pathParts = path.split("/").filter(Boolean);

  //   // If path has 2 parts: /request/CDRP-0001, /work/123, etc.
  //   if (pathParts.length === 2) {
  //     const folderName = pathParts[0]; // 'request' or 'work'

  //     // Check if any route exists under this folder
  //     const hasRoutesInFolder = routes.some((route) => {
  //       const routeParts = route.split("/").filter(Boolean);
  //       return routeParts.length >= 2 && routeParts[0] === folderName;
  //     });

  //     if (hasRoutesInFolder) {
  //       return true; // Allow /request/anything or /work/anything
  //     }
  //   }

  //   return false;
  // };

  // Calculate menu items and access
  const menuItems = getMenuItems();
  // const hasAccess = checkRouteAccess(router.asPath);

  // Debug logging
  // console.log({
  //   pathname: router.pathname,
  //   asPath: router.asPath,
  //   routes: getMenuItems()?.flatMap(
  //     (item) => item.areaItems?.map((area) => area.to) || [],
  //   ),
  //   hasAccess,
  //   userRole: user?.role,
  // });

  // useEffect with proper handling
  // useEffect(() => {
  //   // Only redirect if not loading, no access, user exists, and not redirected yet
  //   if (!isLoading && !hasAccess && user && !hasRedirected.current) {
  //     hasRedirected.current = true;
  //     router.replace("/401");
  //   }

  //   // Reset redirect flag if access is granted
  //   if (hasAccess) {
  //     hasRedirected.current = false;
  //   }
  // }, [isLoading, hasAccess, user, router]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Set active item based on current route
  useEffect(() => {
    const findActiveItem = (items) => {
      for (const section of items) {
        if (section.areaItems) {
          for (const item of section.areaItems) {
            // Check if current route matches this item
            if (
              router.asPath === item.to ||
              (item.to !== "#" && router.asPath.startsWith(item.to))
            ) {
              return item.id;
            }

            // Check dropdown items
            if (item.items) {
              for (const subItem of item.items) {
                if (
                  router.asPath === subItem.to ||
                  (subItem.to !== "#" && router.asPath.startsWith(subItem.to))
                ) {
                  // Expand the parent dropdown
                  setExpandedItems((prev) => ({ ...prev, [item.id]: true }));
                  return subItem.id;
                }
              }
            }
          }
        }
      }
      return router.asPath;
    };

    const activeId = findActiveItem(menuItems);
    setActiveItem(activeId);
  }, [router.asPath, menuItems]);

  const handleMenuItemClick = (itemId, isDropdown = false) => {
    setActiveItem(itemId);

    if (isDropdown) {
      // Toggle dropdown expansion
      setExpandedItems((prev) => ({
        ...prev,
        [itemId]: !prev[itemId],
      }));
    }

    if (isMobile) {
      onToggle();
    }
  };

  const handleSubMenuItemClick = (itemId) => {
    setActiveItem(itemId);
    if (isMobile) {
      onToggle();
    }
  };

  // Check if a dropdown item should be expanded
  const isItemExpanded = (itemId) => {
    return expandedItems[itemId] || false;
  };

  const previousPathname = useRef(router.pathname);

  useEffect(() => {
    const routeChanged = previousPathname.current !== router.pathname;
    previousPathname.current = router.pathname;

    if (routeChanged && isMobile && isOpen) {
      onToggle();
    }
  }, [router.pathname, isMobile, isOpen, onToggle]);

  // Show loading state if needed
  if (isLoading) {
    return (
      <div
        id="main-sidebar"
        className={`fixed left-0 top-[4.5rem] z-40 flex h-[calc(100vh-4.5rem)] flex-col bg-[#212e44] shadow-xl transition-all duration-300 ease-in-out ${
          isOpen
            ? "w-64 translate-x-0"
            : "w-0 -translate-x-full lg:w-20 lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-white/70">Loading menu...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-x-0 top-[4.5rem] bottom-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        id="main-sidebar"
        className={`fixed left-0 top-[4.5rem] z-40 flex h-[calc(100vh-4.5rem)] flex-col border-r border-gray-700 bg-[#212e44] shadow-2xl transition-all duration-300 ease-in-out ${
          isOpen
            ? "w-64 translate-x-0"
            : "w-0 -translate-x-full lg:w-20 lg:translate-x-0"
        }`}
      >
        <nav className={`flex-1 overflow-y-auto py-4  scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent ${isOpen ? "px-3" : "px-0"}`}>
          {profileError && (
            <p role="alert" className="mb-4 px-3 text-xs text-red-300">
              Unable to load your menu: {profileError}
            </p>
          )}
          <ul className="space-y-6">
            {menuItems?.map((section) => (
              <li key={section.id} className="space-y-2">
                {/* Section Header */}
                {isOpen && (
                  <div className="px-3 py-1">
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                      {section.sectionLabel}
                    </p>
                  </div>
                )}

                {/* Section Items */}
                <ul className="space-y-1">
                  {section.areaItems?.map((item) => {
                    const isActive = activeItem === item.id;
                    const isExpanded = isItemExpanded(item.id);
                    const hasDropdown =
                      item.isDropdown && item.items?.length > 0;

                    return (
                      <li key={item.id}>
                        {hasDropdown ? (
                          // Dropdown Menu Item
                          <div>
                            <button
                              onClick={() => handleMenuItemClick(item.id, true)}
                              className={`
                                group relative flex items-center w-full px-3 py-2.5
                                text-sm font-medium rounded-xl transition-all duration-300
                                ${isMobile ? "text-base py-3" : "text-sm py-2.5"}
                                ${isOpen ? "justify-start" : "justify-center"}
                                ${
                                  isActive || isExpanded
                                    ? "text-white bg-white/10 backdrop-blur-xl shadow-lg shadow-white/5 ring-1 ring-white/20"
                                    : "text-white/60 hover:text-white hover:bg-white/5"
                                }
                              `}
                            >
                              {/* Glassmorphism glow effect */}
                              {(isActive || isExpanded) && (
                                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 opacity-50" />
                              )}

                              {/* Icon */}
                              <span className="relative z-10">
                                {renderMenuIcon(
                                  item.icon,
                                  `w-5 h-5 flex-shrink-0 transition-colors duration-300 ${
                                    isActive || isExpanded
                                      ? "text-white"
                                      : "text-white/50 group-hover:text-white/80"
                                  }`,
                                )}
                              </span>

                              {/* Label */}
                              {isOpen && (
                                <span className="relative z-10 ml-3 flex-1 text-left whitespace-nowrap capitalize">
                                  {item.label}
                                </span>
                              )}

                              {/* Dropdown Arrow */}
                              <span className="relative z-10 ml-auto">
                                <FaChevronRight
                                  className={`w-3 h-3 text-white/40 transition-all duration-300 ease-in-out ${
                                    isExpanded ? "rotate-90" : ""
                                  }`}
                                />
                              </span>

                              {/* Tooltip for collapsed state */}
                              {!isOpen && (
                                <span className="absolute left-full ml-2 px-2 py-1 text-xs font-medium text-white bg-[#0F1218] rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-white/10 pointer-events-none z-50">
                                  {item.label}
                                </span>
                              )}
                            </button>

                            {/* Dropdown Sub-items */}
                            {isOpen && isExpanded && (
                              <ul className="ml-8 mt-1 space-y-1 transition-all duration-300 ease-in-out">
                                {item.items.map((subItem) => {
                                  const isSubActive = activeItem === subItem.id;
                                  return (
                                    <li key={subItem.id}>
                                      <Link
                                        href={subItem.to}
                                        onClick={() =>
                                          handleSubMenuItemClick(subItem.id)
                                        }
                                        className={`
                                            group relative flex items-center w-full px-3 py-2
                                            text-sm font-medium rounded-lg transition-all duration-300
                                            ${isMobile ? "text-base py-2.5" : "text-sm py-2"}
                                            ${
                                              isSubActive
                                                ? "text-white bg-white/5"
                                                : "text-white/50 hover:text-white hover:bg-white/5"
                                            }
                                          `}
                                        >
                                          {/* Sub-item Icon */}
                                          <span className="mr-3">
                                            {renderMenuIcon(
                                              subItem.icon,
                                              `w-4 h-4 flex-shrink-0 transition-colors duration-300 ${
                                                isSubActive
                                                  ? "text-white"
                                                  : "text-white/30 group-hover:text-white/60"
                                              }`,
                                            )}
                                          </span>

                                          <span className="relative z-10 whitespace-nowrap capitalize text-sm">
                                            {subItem.label}
                                          </span>
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        ) : (
                          // Regular Menu Item
                          <Link
                            href={item.to}
                            onClick={() => handleMenuItemClick(item.id)}
                            className={`
                                group relative flex items-center w-full px-3 py-2.5
                                text-sm font-medium rounded-xl transition-all duration-300
                                ${isMobile ? "text-base py-3" : "text-sm py-2.5"}
                                ${isOpen ? "justify-start" : "justify-center"}
                                ${
                                  isActive
                                    ? "text-white bg-white/10 backdrop-blur-xl shadow-lg shadow-white/5 ring-1 ring-white/20"
                                    : "text-white/60 hover:text-white hover:bg-white/5"
                                }
                              `}
                            >
                              {/* Glassmorphism glow effect for active item */}
                              {isActive && (
                                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/5 via-white/10 to-white/5 opacity-50" />
                              )}

                              {/* Icon */}
                              <span className="relative z-10">
                                {renderMenuIcon(
                                  item.icon,
                                  `w-5 h-5 flex-shrink-0 transition-colors duration-300 ${
                                    isActive
                                      ? "text-white"
                                      : "text-white/50 group-hover:text-white/80"
                                  }`,
                                )}
                              </span>

                              {/* Label */}
                              {isOpen && (
                                <span className="relative z-10 ml-3 whitespace-nowrap capitalize">
                                  {item.label}
                                </span>
                              )}

                              {/* Tooltip for collapsed state */}
                              {!isOpen && (
                                <span className="absolute left-full ml-2 px-2 py-1 text-xs font-medium text-white bg-[#0F1218] rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-white/10 pointer-events-none z-50">
                                  {item.label}
                                </span>
                              )}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
