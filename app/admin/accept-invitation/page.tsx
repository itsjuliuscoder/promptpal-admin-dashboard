"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import SectionCard from "@/components/shared/SectionCard";
import ErrorState from "@/components/shared/ErrorState";
import { adminService } from "@/lib/services/adminService";
import { FiEye, FiEyeOff, FiCheckCircle, FiXCircle } from "react-icons/fi";

interface InvitationData {
  email: string;
  username: string;
  role: string;
  invitedBy: {
    username: string;
    email: string;
  } | null;
  invitedAt: string;
}

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      verifyInvitation();
    } else {
      setError("Invalid invitation link. No token provided.");
      setLoading(false);
    }
  }, [token]);

  const verifyInvitation = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await adminService.verifyInvitation(token);
      if (response.success && response.data) {
        setInvitationData(response.data);
      } else {
        setError(response.error || "Invalid or expired invitation token");
      }
    } catch (err: any) {
      console.error("Error verifying invitation:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Invalid or expired invitation token"
      );
    } finally {
      setLoading(false);
    }
  };

  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;
    return strength;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const validatePassword = (): boolean => {
    if (!password) {
      setError("Password is required");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validatePassword()) {
      return;
    }

    if (!token) {
      setError("Invalid invitation token");
      return;
    }

    setVerifying(true);

    try {
      const response = await adminService.acceptInvitation(token, password);
      if (response.success && response.data) {
        setSuccess(true);
        // Store token for auto-login
        if (response.data.token) {
          localStorage.setItem("adminToken", response.data.token);
        }
        // Redirect to admin dashboard after 2 seconds
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        setError(response.error || "Failed to accept invitation");
      }
    } catch (err: any) {
      console.error("Error accepting invitation:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to accept invitation. Please try again."
      );
    } finally {
      setVerifying(false);
    }
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return { text: "", color: "" };
    if (passwordStrength <= 2) return { text: "Weak", color: "text-red-600" };
    if (passwordStrength === 3) return { text: "Medium", color: "text-yellow-600" };
    return { text: "Strong", color: "text-green-600" };
  };

  const strengthLabel = getPasswordStrengthLabel();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Verifying Invitation" description="Please wait..." />
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#A84C34] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error && !invitationData) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Invalid Invitation" description="Unable to verify invitation" />
        <ErrorState title="Invitation Error" message={error} />
        <div className="text-center">
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-2 bg-[#A84C34] text-white rounded-lg hover:bg-[#92361a] transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Invitation Accepted" description="Your admin account has been activated" />
        <SectionCard title="">
          <div className="text-center py-8">
            <FiCheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Success!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your admin account has been successfully activated. Redirecting to dashboard...
            </p>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Accept Admin Invitation"
        description="Set your password to complete your admin account setup"
      />

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800 rounded-lg">
          {error}
        </div>
      )}

      {invitationData && (
        <SectionCard title="Invitation Details">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Email:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {invitationData.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Username:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {invitationData.username}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Role:</span>
              <span className="font-medium text-gray-900 dark:text-white capitalize">
                {invitationData.role.replace("_", " ")}
              </span>
            </div>
            {invitationData.invitedBy && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Invited by:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {invitationData.invitedBy.username}
                </span>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard title="Set Your Password">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A84C34] dark:bg-gray-800 dark:text-white pr-10"
                  placeholder="Enter password (min 6 characters)"
                  required
                  disabled={verifying}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  disabled={verifying}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          passwordStrength <= 2
                            ? "bg-red-500"
                            : passwordStrength === 3
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                    {strengthLabel.text && (
                      <span className={`text-xs font-medium ${strengthLabel.color}`}>
                        {strengthLabel.text}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Use at least 6 characters. Include uppercase, lowercase, numbers, and symbols for
                    stronger security.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A84C34] dark:bg-gray-800 dark:text-white pr-10"
                  placeholder="Confirm password"
                  required
                  disabled={verifying}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  disabled={verifying}
                >
                  {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Passwords do not match
                </p>
              )}
              {confirmPassword && password === confirmPassword && password.length >= 6 && (
                <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <FiCheckCircle size={12} />
                  Passwords match
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            disabled={verifying}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={verifying || !password || !confirmPassword || password !== confirmPassword}
            className="flex items-center gap-2 px-6 py-2 bg-[#A84C34] text-white rounded-lg hover:bg-[#92361a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifying ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Setting up account...
              </>
            ) : (
              <>
                <FiCheckCircle size={18} />
                Accept Invitation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
