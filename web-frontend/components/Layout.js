import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { toggleSidebar, setMobileMenuOpen } from "@/store/uiSlice";
import Sidebar from "./Sidebar";
import Header from "./Header";
const Layout = ({ isMobile }) => {
  const dispatch = useAppDispatch();
  const { sidebarOpen, mobileMenuOpen } = useAppSelector((state) => state.ui);
  const handleSidebarToggle = () => {
    if (isMobile) {
      dispatch(setMobileMenuOpen(!mobileMenuOpen));
    } else {
      dispatch(toggleSidebar());
    }
  };
  return _jsxs("div", {
    className: "min-h-screen bg-background",
    children: [
      _jsx(Header, { onMenuClick: handleSidebarToggle, isMobile: isMobile }),
      _jsxs("div", {
        className: "flex",
        children: [
          _jsx(Sidebar, {
            isOpen: isMobile ? mobileMenuOpen : sidebarOpen,
            isMobile: isMobile,
            onClose: () => dispatch(setMobileMenuOpen(false)),
          }),
          _jsx("main", {
            className: `flex-1 transition-all duration-300 ${!isMobile && sidebarOpen ? "ml-64" : "ml-0"}`,
            children: _jsx("div", {
              className: "p-6 pt-20",
              children: _jsx(Outlet, {}),
            }),
          }),
        ],
      }),
    ],
  });
};
export default Layout;
