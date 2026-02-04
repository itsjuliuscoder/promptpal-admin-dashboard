"use client";

import React, { useState, useEffect } from "react";
import SectionCard from "@/components/shared/SectionCard";
import PageHeader from "@/components/shared/PageHeader";
import { adminService } from "@/lib/services/adminService";
import { FiMail, FiX, FiPlus, FiSend, FiFileText, FiEdit3 } from "react-icons/fi";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import ErrorState from "@/components/shared/ErrorState";

interface Recipient {
  id: string;
  email: string;
  name: string;
  company: string;
  error?: string;
}

interface EmailTemplate {
  _id: string;
  name: string;
  subject: string;
  description?: string;
  category: string;
  variables: string[];
}

export default function EmailPage() {
  const [useTemplate, setUseTemplate] = useState(true);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [templateDetails, setTemplateDetails] = useState<any>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: Date.now().toString(), email: "", name: "", company: "" },
  ]);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Load template details when template is selected
  useEffect(() => {
    if (selectedTemplateId && useTemplate) {
      loadTemplateDetails(selectedTemplateId);
    } else {
      setTemplateDetails(null);
    }
  }, [selectedTemplateId, useTemplate]);

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await adminService.getEmailTemplates();
      if (response.success && response.data) {
        setTemplates(response.data);
        if (response.data.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(response.data[0]._id);
          setSelectedTemplate(response.data[0]);
        }
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      setMessage({
        type: "error",
        text: "Failed to load email templates",
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadTemplateDetails = async (templateId: string) => {
    try {
      const response = await adminService.getEmailTemplate(templateId);
      if (response.success && response.data) {
        setTemplateDetails(response.data);
        const template = templates.find((t) => t._id === templateId);
        if (template) {
          setSelectedTemplate(template);
        }
      }
    } catch (error) {
      console.error("Error loading template details:", error);
    }
  };

  const validateEmail = (email: string): boolean => {
    return emailRegex.test(email.trim());
  };

  const updateRecipient = (id: string, field: "email" | "name" | "company", value: string) => {
    setRecipients((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, [field]: value };
          if (field === "email") {
            updated.error = value.trim() && !validateEmail(value) ? "Invalid email format" : undefined;
          }
          return updated;
        }
        return r;
      })
    );
  };

  const addRecipient = () => {
    setRecipients((prev) => [
      ...prev,
      { id: Date.now().toString(), email: "", name: "", company: "" },
    ]);
  };

  const removeRecipient = (id: string) => {
    if (recipients.length > 1) {
      setRecipients((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const validateForm = (): boolean => {
    const validRecipients = recipients.filter(
      (r) => r.email.trim().length > 0 && validateEmail(r.email)
    );

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

    if (useTemplate) {
      if (!selectedTemplateId) {
        setMessage({ type: "error", text: "Please select an email template" });
        return false;
      }
    } else {
      if (!subject.trim()) {
        setMessage({ type: "error", text: "Subject is required" });
        return false;
      }

      if (!content.trim()) {
        setMessage({ type: "error", text: "Content is required" });
        return false;
      }
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
        .filter((r) => r.email.trim().length > 0 && validateEmail(r.email))
        .map((r) => ({
          email: r.email.trim(),
          name: r.name.trim() || undefined,
          company: r.company.trim() || undefined,
        }));

      if (useTemplate && selectedTemplateId) {
        // Send with template
        await adminService.sendEmail({
          recipients: validRecipients,
          templateId: selectedTemplateId,
        });
      } else {
        // Send custom email
        await adminService.sendEmail({
          recipients: validRecipients.map((r) => r.email),
          subject: subject.trim(),
          content: content.trim(),
        });
      }

      setMessage({
        type: "success",
        text: `Email sent successfully to ${validRecipients.length} recipient(s)!`,
      });

      // Reset form
      setRecipients([{ id: Date.now().toString(), email: "", name: "", company: "" }]);
      if (!useTemplate) {
        setSubject("");
        setContent("");
      }
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

  const getTemplatePreview = (template: EmailTemplate | null) => {
    if (!template) return null;
    
    // Show example substitution
    const exampleSubject = template.subject
      .replace(/\{\{name\}\}/g, "John Doe")
      .replace(/\{\{email\}\}/g, "john@example.com")
      .replace(/\{\{company\}\}/g, "Acme Corp");
    
    return {
      subject: exampleSubject,
      variables: template.variables || [],
    };
  };

  const templatePreview = getTemplatePreview(selectedTemplate);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Email"
        description="Send emails to users using templates or custom content"
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
        {/* Template Selection Section */}
        <SectionCard title="Email Type">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="emailType"
                  checked={useTemplate}
                  onChange={() => setUseTemplate(true)}
                  className="w-4 h-4 text-[#A84C34] focus:ring-[#A84C34]"
                  disabled={isLoading}
                />
                <FiFileText className="w-5 h-5" />
                <span className="font-medium">Use Template</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="emailType"
                  checked={!useTemplate}
                  onChange={() => setUseTemplate(false)}
                  className="w-4 h-4 text-[#A84C34] focus:ring-[#A84C34]"
                  disabled={isLoading}
                />
                <FiEdit3 className="w-5 h-5" />
                <span className="font-medium">Custom Email</span>
              </label>
            </div>

            {useTemplate && (
              <div className="space-y-3">
                {loadingTemplates ? (
                  <LoadingSkeleton />
                ) : templates.length === 0 ? (
                  <ErrorState message="No email templates available" />
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Template
                      </label>
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => {
                          setSelectedTemplateId(e.target.value);
                          const template = templates.find((t) => t._id === e.target.value);
                          setSelectedTemplate(template || null);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A84C34] dark:bg-gray-800 dark:text-white"
                        disabled={isLoading}
                        required={useTemplate}
                      >
                        <option value="">-- Select a template --</option>
                        {templates.map((template) => (
                          <option key={template._id} value={template._id}>
                            {template.name} {template.description ? `- ${template.description}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedTemplate && templatePreview && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          Template Preview
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">Subject:</span>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                              {templatePreview.subject}
                            </p>
                          </div>
                          {templatePreview.variables.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                Variables used:
                              </span>
                              <div className="flex gap-2 mt-1">
                                {templatePreview.variables.map((variable) => (
                                  <span
                                    key={variable}
                                    className="px-2 py-1 bg-[#A84C34]/10 text-[#A84C34] dark:bg-[#A84C34]/20 dark:text-[#A84C34] rounded text-xs"
                                  >
                                    {`{{${variable}}}`}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </SectionCard>

        {/* Recipients Section */}
        <SectionCard title="Recipients">
          <div className="space-y-3">
            {recipients.map((recipient, index) => (
              <div key={recipient.id} className="space-y-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Recipient {index + 1}
                  </span>
                  {recipients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRecipient(recipient.id)}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                      disabled={isLoading}
                      aria-label="Remove recipient"
                    >
                      <FiX size={18} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={recipient.email}
                      onChange={(e) => updateRecipient(recipient.id, "email", e.target.value)}
                      placeholder="email@example.com"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A84C34] dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm ${
                        recipient.error
                          ? "border-red-500 dark:border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      disabled={isLoading}
                      required
                    />
                    {recipient.error && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {recipient.error}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={recipient.name}
                      onChange={(e) => updateRecipient(recipient.id, "name", e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A84C34] dark:bg-gray-800 dark:text-white text-sm"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Company
                    </label>
                    <input
                      type="text"
                      value={recipient.company}
                      onChange={(e) => updateRecipient(recipient.id, "company", e.target.value)}
                      placeholder="Acme Corp"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A84C34] dark:bg-gray-800 dark:text-white text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addRecipient}
              className="flex items-center gap-2 px-4 py-2 text-[#A84C34] hover:bg-[#F4E7E2] dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 text-sm"
              disabled={isLoading}
            >
              <FiPlus size={16} />
              Add Recipient
            </button>
          </div>
        </SectionCard>

        {/* Custom Email Fields (only show if not using template) */}
        {!useTemplate && (
          <>
            <SectionCard title="Email Subject">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                maxLength={200}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A84C34] dark:bg-gray-800 dark:text-white"
                disabled={isLoading}
                required={!useTemplate}
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
                required={!useTemplate}
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                HTML formatting is supported. You can use HTML tags like &lt;p&gt;, &lt;strong&gt;, &lt;a&gt;, etc.
              </p>
            </SectionCard>
          </>
        )}

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
