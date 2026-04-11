"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
            <div className="min-h-screen transition-colors duration-300">
              <a
                href="#admin-main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-[color:var(--admin-accent)] focus:px-4 focus:py-2 focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--admin-accent)] focus:ring-offset-2"
              >
                Skip to main content
              </a>

              <div className="flex min-h-screen">
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
                      className="fixed left-0 top-0 z-40 h-screen lg:z-30"
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
                  className={`w-full flex-1 transition-all duration-300 ease-in-out ${
                    isLoginRoute ? "ml-0" : isExpanded ? "lg:ml-[17.5rem]" : "lg:ml-24"
                  }`}
                  tabIndex={-1}
                >
                  {!isLoginRoute && (
                    <AdminHeader onMenuToggle={() => setIsMobileMenuOpen((prev) => !prev)} />
                  )}
                  <motion.div
                    className="min-h-[calc(100vh-76px)]"
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
