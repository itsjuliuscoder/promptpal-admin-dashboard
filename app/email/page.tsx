"use client";

import React, { useState } from "react";
import SectionCard from "@/components/shared/SectionCard";
import PageHeader from "@/components/shared/PageHeader";
import { adminService } from "@/lib/services/adminService";
import { FiMail, FiX, FiPlus, FiSend } from "react-icons/fi";

interface Recipient {
  id: string;
  email: string;
  error?: string;
}

export default function EmailPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: Date.now().toString(), email: "" },
  ]);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (email: string): boolean => {
    return emailRegex.test(email.trim());
  };

  const updateRecipient = (id: string, email: string) => {
    setRecipients((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const error = email.trim() && !validateEmail(email) ? "Invalid email format" : undefined;
          return { ...r, email, error };
        }
        return r;
      })
    );
  };

  const addRecipient = () => {
    setRecipients((prev) => [
      ...prev,
      { id: Date.now().toString(), email: "" },
    ]);
  };

  const removeRecipient = (id: string) => {
    if (recipients.length > 1) {
      setRecipients((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const validateForm = (): boolean => {
    const validRecipients = recipients
      .map((r) => r.email.trim())
      .filter((email) => email.length > 0);

    if (validRecipients.length === 0) {
      setMessage({ type: "error", text: "At least one recipient email is required" });
      return false;
    }

    const invalidEmails = recipients.filter(
      (r) => r.email.trim() && !validateEmail(r.email)
    );
    if (invalidEmails.length > 0) {
      setMessage({ type: "error", text: "Please fix invalid email addresses" });
      return false;
    }

    if (!subject.trim()) {
      setMessage({ type: "error", text: "Subject is required" });
      return false;
    }

    if (!content.trim()) {
      setMessage({ type: "error", text: "Content is required" });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const validRecipients = recipients
        .map((r) => r.email.trim())
        .filter((email) => email.length > 0 && validateEmail(email));

      await adminService.sendEmail({
        recipients: validRecipients,
        subject: subject.trim(),
        content: content.trim(),
      });

      setMessage({
        type: "success",
        text: `Email sent successfully to ${validRecipients.length} recipient(s)!`,
      });

      // Reset form
      setRecipients([{ id: Date.now().toString(), email: "" }]);
      setSubject("");
      setContent("");
    } catch (error: any) {
      console.error("Error sending email:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.error || error.response?.data?.message || "Failed to send email. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Email"
        description="Send emails to users and manage email communications"
      />

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard title="Recipients">
          <div className="space-y-3">
            {recipients.map((recipient, index) => (
              <div key={recipient.id} className="flex gap-2 items-start">
                <div className="flex-1">
                  <input
                    type="email"
                    value={recipient.email}
                    onChange={(e) => updateRecipient(recipient.id, e.target.value)}
                    placeholder="Enter email address"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A84C34] dark:bg-gray-800 dark:border-gray-700 dark:text-white ${
                      recipient.error
                        ? "border-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    disabled={isLoading}
                  />
                  {recipient.error && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {recipient.error}
                    </p>
                  )}
                </div>
                {recipients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRecipient(recipient.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    disabled={isLoading}
                    aria-label="Remove recipient"
                  >
                    <FiX size={20} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addRecipient}
              className="flex items-center gap-2 px-4 py-2 text-[#A84C34] hover:bg-[#F4E7E2] dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              <FiPlus size={18} />
              Add Recipient
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Email Subject">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject"
            maxLength={200}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A84C34] dark:bg-gray-800 dark:text-white"
            disabled={isLoading}
            required
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {subject.length}/200 characters
          </p>
        </SectionCard>

        <SectionCard title="Email Content (HTML)">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter email content (HTML supported)"
            rows={12}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A84C34] dark:bg-gray-800 dark:text-white font-mono text-sm"
            disabled={isLoading}
            required
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            HTML formatting is supported. You can use HTML tags like &lt;p&gt;, &lt;strong&gt;, &lt;a&gt;, etc.
          </p>
        </SectionCard>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-[#A84C34] text-white rounded-lg hover:bg-[#92361a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <FiSend size={18} />
                Send Email
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
