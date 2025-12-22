import { useState, useEffect } from "react";
import { ShoppingBag, Package, Box, Tag, Settings, ChevronDown, Users, PieChart } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getSettings } from "../lib/api";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "./ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

export function AppSidebar() {
  const { open } = useSidebar();
  const { isAdmin } = useAuth();
  const [openMenus, setOpenMenus] = useState<string[]>(["Sales"]);
  const [storeName, setStoreName] = useState("Store");

  useEffect(() => {
    getSettings()
      .then(data => {
        setStoreName(data.storeName || "Store");
      })
      .catch(() => {});
  }, []);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50";

  // Base menu items available to all users
  const baseMenuItems = [
    {
      title: "Sales",
      icon: ShoppingBag,
      url: "/sales",
      subItems: [
        { title: "Sales", url: "/sales" },
        { title: "View Orders", url: "/orders" },
        { title: "Returns", url: "/returns" },
      ],
    },
  ];

  // Admin-only menu items
  const adminAnalyticsSubItems = [
    { title: "Dashboard", url: "/" },
    { title: "Sales Analysis", url: "/sales-analysis" },
  ];

  const adminMenuItems = [
    {
      title: "Analytics",
      icon: PieChart,
      subItems: adminAnalyticsSubItems,
    },
    {
      title: "Products",
      icon: Box,
      subItems: [
        { title: "Product List", url: "/sales" },
        { title: "Add Product", url: "/add-product" },
      ],
    },
    {
      title: "Inventory",
      icon: Package,
      url: "/inventory",
      subItems: [
        { title: "Manage Products", url: "/manage-products" },
      ],
    },
    {
      title: "Promotions",
      icon: Tag,
      subItems: [
        { title: "Discounts", url: "/discounts" },
        { title: "Coupons", url: "/coupons" },
      ],
    },
    {
      title: "Settings",
      icon: Settings,
      subItems: [
        { title: "System Settings", url: "/settings" },
        { title: "User Management", url: "/users" },
      ],
    },
  ];

  // Profile item for all users
  const profileMenuItem = {
    title: "Profile",
    icon: Users,
    subItems: [
      { title: "My Profile", url: "/profile" },
    ],
  };

  // Combine menu items based on role
  const menuItems = isAdmin 
    ? [...baseMenuItems, ...adminMenuItems, profileMenuItem]
    : [...baseMenuItems, profileMenuItem];

  return (
    <Sidebar className={open ? "w-64" : "w-14"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold px-3 py-4" style={{ color: '#0883A4' }}>
            {open ? storeName : storeName.charAt(0)}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <Collapsible
                  key={item.title}
                  open={openMenus.includes(item.title)}
                  onOpenChange={() => toggleMenu(item.title)}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full">
                        <item.icon className="h-4 w-4" />
                        {open && (
                          <>
                            <span className="flex-1">{item.title}</span>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                openMenus.includes(item.title) ? "rotate-180" : ""
                              }`}
                            />
                          </>
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {open && (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <NavLink to={subItem.url} end className={getNavCls}>
                                  {subItem.title}
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
