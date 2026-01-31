"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import SectionCard from "@/components/shared/SectionCard";
import ErrorState from "@/components/shared/ErrorState";
import { adminService } from "@/lib/services/adminService";
import { useAdminAuth } from "@/lib/auth/AdminAuthProvider";
import { FiUserPlus, FiEye, FiEyeOff } from "react-icons/fi";

export default function CreateAdminPage() {
  const router = useRouter();
  const { admin } = useAdminAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "admin",
    permissions: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if current admin is super_admin
  const isSuperAdmin = admin?.role === "super_admin";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      setError("Username is required");
      return false;
    }
    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters long");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    if (!isSuperAdmin) {
      setError("Only super admins can create new admin accounts");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        permissions: formData.permissions.length > 0 ? formData.permissions : undefined,
      };

      await adminService.createAdmin(payload);

      setSuccess(true);
      setFormData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "admin",
        permissions: [],
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/system");
      }, 2000);
    } catch (err: any) {
      console.error("Error creating admin:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to create admin account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Create Admin"
          description="Create a new admin account"
        />
        <ErrorState
          title="Access Denied"
          message="Only super admins can create new admin accounts."
        />
      </div>
    );
  }

  const availableRoles = [
    { value: "admin", label: "Admin" },
    { value: "support", label: "Support" },
    { value: "analyst", label: "Analyst" },
  ];

  const availablePermissions = [
    "users:read",
    "users:write",
    "prompts:read",
    "prompts:write",
    "analytics:read",
    "billing:read",
    "billing:write",
    "settings:read",
    "settings:write",
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Create Admin"
        description="Create a new admin account with specified role and permissions"
      />

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800 rounded-lg">
          Admin account created successfully! Redirecting...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard title="Account Information">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A84C34] dark:bg-gray-800 dark:text-white"
                placeholder="Enter username"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A84C34] dark:bg-gray-800 dark:text-white"
                placeholder="Enter email address"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A84C34] dark:bg-gray-800 dark:text-white pr-10"
                  placeholder="Enter password (min 6 characters)"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  disabled={loading}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A84C34] dark:bg-gray-800 dark:text-white pr-10"
                  placeholder="Confirm password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  disabled={loading}
                >
                  {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Role & Permissions">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A84C34] dark:bg-gray-800 dark:text-white"
                disabled={loading}
              >
                {availableRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Note: Only super_admin role can create other admins
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Permissions (Optional)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availablePermissions.map((permission) => (
                  <label
                    key={permission}
                    className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission)}
                      onChange={() => handlePermissionToggle(permission)}
                      className="rounded border-gray-300 text-[#A84C34] focus:ring-[#A84C34]"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{permission}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-[#A84C34] text-white rounded-lg hover:bg-[#92361a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FiUserPlus size={18} />
                Create Admin
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
