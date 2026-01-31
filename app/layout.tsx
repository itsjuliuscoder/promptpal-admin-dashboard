"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FaBars } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

import "@/lib/config/axios-config";
import "@/app/globals.css";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { AdminAuthProvider } from "@/lib/auth/AdminAuthProvider";
import ProtectedAdminRoute from "@/components/admin/ProtectedAdminRoute";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();
  const isLoginRoute = pathname === "/login";

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <html lang="en">
      <body>
        <AdminAuthProvider>
          <ProtectedAdminRoute>
            <div className="bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300">
              <a
                href="#admin-main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#A84C34] focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#A84C34] focus:ring-offset-2"
              >
                Skip to main content
              </a>

              {!isLoginRoute && (
                <motion.button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden fixed top-4 left-4 z-50 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 p-3 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#A84C34] focus:ring-offset-2"
                  aria-label="Toggle admin navigation menu"
                  aria-expanded={isMobileMenuOpen}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FaBars size={20} aria-hidden="true" />
                </motion.button>
              )}

              <div className="flex">
                {!isLoginRoute && (
                  <>
                    <AnimatePresence>
                      {isMobileMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                          onClick={() => setIsMobileMenuOpen(false)}
                          aria-hidden="true"
                        />
                      )}
                    </AnimatePresence>

                    <nav
                      className="fixed left-0 top-0 h-screen z-40 lg:z-30"
                      aria-label="Admin navigation"
                    >
                      <AdminSidebar
                        isMobileMenuOpen={isMobileMenuOpen}
                        setIsMobileMenuOpen={setIsMobileMenuOpen}
                        isExpanded={isExpanded}
                        setIsExpanded={setIsExpanded}
                      />
                    </nav>
                  </>
                )}

                <main
                  id="admin-main-content"
                  className={`flex-1 w-full min-h-screen transition-all duration-300 ease-in-out ${
                    isLoginRoute ? "ml-0" : isExpanded ? "lg:ml-64" : "lg:ml-20"
                  }`}
                  tabIndex={-1}
                >
                  {!isLoginRoute && <AdminHeader />}
                  <motion.div
                    className="min-h-[calc(100vh-80px)]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    {children}
                  </motion.div>
                </main>
              </div>
            </div>
          </ProtectedAdminRoute>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
