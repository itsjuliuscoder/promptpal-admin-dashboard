"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/auth/AdminAuthProvider";

export default function ProtectedAdminRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { token } = useAdminAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !token && pathname !== "/login") {
      router.replace("/login");
    }
  }, [mounted, token, router, pathname]);

  // Show consistent loading state until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (!token && pathname !== "/login") {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Checking admin session...
      </div>
    );
  }

  return <>{children}</>;
}

