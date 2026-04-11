"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiClock,
  FiLock,
  FiMail,
  FiRefreshCw,
  FiSave,
  FiSettings,
  FiSlash,
} from "react-icons/fi";
import PageHeader from "@/components/shared/PageHeader";
import SectionCard from "@/components/shared/SectionCard";
import ErrorState from "@/components/shared/ErrorState";
import { CardSkeleton } from "@/components/shared/LoadingSkeleton";
import SectionWorkspace, { WorkspaceSectionItem } from "@/components/shared/SectionWorkspace";
import { PreviewNotice, ToggleCard } from "@/components/shared/AdminWidgets";
import { useSectionQueryState } from "@/lib/hooks/useSectionQueryState";
import { adminService } from "@/lib/services/adminService";

type GeneralFormState = {
  platformName: string;
  supportEmail: string;
  senderName: string;
  footerText: string;
  logoUrl: string;
  primaryColor: string;
  platformUrl: string;
  adminUrl: string;
  timezone: string;
};

type FeatureFlagState = Record<string, boolean>;
type AuthPreviewState = {
  sessionTimeout: string;
  maxAttempts: string;
  requireEmailVerification: boolean;
  forceLogoutOnPasswordChange: boolean;
};

const DEFAULT_GENERAL_STATE: GeneralFormState = {
  platformName: "PromptPal",
  supportEmail: "support@promptpal.app",
  senderName: "PromptPal",
  footerText: "",
  logoUrl: "",
  primaryColor: "#c95b2b",
  platformUrl: "https://promptpal.app",
  adminUrl: "https://admin.promptpal.app",
  timezone: "UTC (Coordinated Universal Time)",
};

const DEFAULT_AUTH_PREVIEW: AuthPreviewState = {
  sessionTimeout: "1440",
  maxAttempts: "5",
  requireEmailVerification: true,
  forceLogoutOnPasswordChange: true,
};

const FEATURE_FLAGS = [
  {
    key: "registrations_open",
    title: "User registrations open",
    description: "Allow new users to sign up to PromptPal.",
  },
  {
    key: "google_oauth_login",
    title: "Google OAuth login",
    description: "Allow sign-in via Google accounts.",
  },
  {
    key: "email_password_login",
    title: "Email/password login",
    description: "Allow sign-in via local email and password.",
  },
  {
    key: "public_template_library",
    title: "Public template library",
    description: "Allow all users to browse public templates.",
  },
  {
    key: "chrome_extension_active",
    title: "Chrome Extension active",
    description: "Enable Chrome Extension visibility and reporting.",
  },
  {
    key: "maintenance_mode",
    title: "Maintenance mode",
    description: "Show a maintenance experience to non-admin users.",
  },
];

const SECTION_ITEMS: WorkspaceSectionItem[] = [
  { id: "general", label: "General", icon: <FiSettings size={18} /> },
  { id: "platform", label: "Platform", icon: <FiClock size={18} /> },
  { id: "auth", label: "Auth & login", icon: <FiLock size={18} /> },
  { id: "email", label: "Email / SMTP", icon: <FiMail size={18} /> },
  { id: "danger", label: "Danger zone", icon: <FiAlertTriangle size={18} /> },
];

function normalizeSettings(raw: any): GeneralFormState {
  return {
    platformName: raw?.branding?.name || DEFAULT_GENERAL_STATE.platformName,
    supportEmail: raw?.emailTemplates?.senderEmail || DEFAULT_GENERAL_STATE.supportEmail,
    senderName: raw?.emailTemplates?.senderName || DEFAULT_GENERAL_STATE.senderName,
    footerText: raw?.emailTemplates?.footerText || DEFAULT_GENERAL_STATE.footerText,
    logoUrl: raw?.branding?.logoUrl || DEFAULT_GENERAL_STATE.logoUrl,
    primaryColor: raw?.branding?.primaryColor || DEFAULT_GENERAL_STATE.primaryColor,
    platformUrl: DEFAULT_GENERAL_STATE.platformUrl,
    adminUrl: DEFAULT_GENERAL_STATE.adminUrl,
    timezone: DEFAULT_GENERAL_STATE.timezone,
  };
}

function normalizeFlags(rawFlags: any[]): FeatureFlagState {
  const map: FeatureFlagState = {};
  FEATURE_FLAGS.forEach((flag) => {
    map[flag.key] = false;
  });

  rawFlags.forEach((flag) => {
    const name = flag?.name || flag?.key;
    if (name && name in map) {
      map[name] = Boolean(flag.enabled);
    }
  });

  return map;
}

export default function AdminSettingsPage() {
  const sectionIds = useMemo(() => SECTION_ITEMS.map((item) => item.id), []);
  const { activeSection, setActiveSection } = useSectionQueryState(sectionIds, "general");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const [rawSettings, setRawSettings] = useState<any>(null);
  const [generalForm, setGeneralForm] = useState<GeneralFormState>(DEFAULT_GENERAL_STATE);
  const [generalInitial, setGeneralInitial] = useState<GeneralFormState>(DEFAULT_GENERAL_STATE);
  const [platformFlags, setPlatformFlags] = useState<FeatureFlagState>(() =>
    normalizeFlags([])
  );
  const [platformInitial, setPlatformInitial] = useState<FeatureFlagState>(() =>
    normalizeFlags([])
  );
  const [authPreview, setAuthPreview] = useState<AuthPreviewState>(DEFAULT_AUTH_PREVIEW);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const [settingsRes, flagsRes] = await Promise.all([
        adminService.getPlatformSettings(),
        adminService.getAllFeatureFlags(),
      ]);

      const settingsData = settingsRes?.data || settingsRes || {};
      const flagsData = Array.isArray(flagsRes?.data) ? flagsRes.data : Array.isArray(flagsRes) ? flagsRes : [];

      const normalizedSettings = normalizeSettings(settingsData);
      const normalizedFlags = normalizeFlags(flagsData);

      setRawSettings(settingsData);
      setGeneralForm(normalizedSettings);
      setGeneralInitial(normalizedSettings);
      setPlatformFlags(normalizedFlags);
      setPlatformInitial(normalizedFlags);
    } catch (loadError) {
      console.error("Failed to load settings", loadError);
      setError("Failed to load platform settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const generalChanged = JSON.stringify(generalForm) !== JSON.stringify(generalInitial);
  const platformChanged = JSON.stringify(platformFlags) !== JSON.stringify(platformInitial);
  const previewOnly = activeSection === "auth" || activeSection === "email" || activeSection === "danger";

  const canSave =
    !saving &&
    ((activeSection === "general" && generalChanged) ||
      (activeSection === "platform" && platformChanged));

  const saveLabel =
    activeSection === "platform" ? "Save changes" : activeSection === "general" ? "Save changes" : "Save unavailable";

  const handleCancel = () => {
    setBanner(null);

    if (activeSection === "general") {
      setGeneralForm(generalInitial);
      return;
    }

    if (activeSection === "platform") {
      setPlatformFlags(platformInitial);
      return;
    }

    if (activeSection === "auth") {
      setAuthPreview(DEFAULT_AUTH_PREVIEW);
    }
  };

  const handleSave = async () => {
    if (!canSave) return;

    setSaving(true);
    setBanner(null);

    try {
      if (activeSection === "general") {
        const payload = {
          branding: {
            ...(rawSettings?.branding || {}),
            name: generalForm.platformName,
            logoUrl: generalForm.logoUrl,
            primaryColor: generalForm.primaryColor,
          },
          emailTemplates: {
            ...(rawSettings?.emailTemplates || {}),
            senderName: generalForm.senderName,
            senderEmail: generalForm.supportEmail,
            footerText: generalForm.footerText,
          },
          notifications: rawSettings?.notifications || {},
        };

        const response = await adminService.updatePlatformSettings(payload);
        const updated = response?.data || payload;
        const normalized = normalizeSettings(updated);
        setRawSettings(updated);
        setGeneralForm(normalized);
        setGeneralInitial(normalized);
        setBanner({ type: "success", message: "General settings saved." });
      } else if (activeSection === "platform") {
        await Promise.all(
          FEATURE_FLAGS.map((flag) =>
            adminService.updateFeatureFlag(flag.key, {
              enabled: platformFlags[flag.key],
              description: flag.description,
            })
          )
        );
        setPlatformInitial(platformFlags);
        setBanner({ type: "success", message: "Platform feature flags updated." });
      }
    } catch (saveError: any) {
      console.error("Failed to save settings", saveError);
      setBanner({
        type: "error",
        message:
          saveError?.response?.data?.error ||
          saveError?.response?.data?.message ||
          "Failed to save the current section.",
      });
    } finally {
      setSaving(false);
    }
  };

  const actions = (
    <>
      <button
        type="button"
        className="admin-button admin-button-secondary"
        onClick={handleCancel}
      >
        <FiSlash size={16} />
        Cancel
      </button>
      <button
        type="button"
        className={`admin-button ${canSave ? "admin-button-primary" : "admin-button-secondary opacity-60"}`}
        onClick={handleSave}
        disabled={!canSave}
      >
        {saving ? <FiRefreshCw className="animate-spin" size={16} /> : <FiSave size={16} />}
        {saveLabel}
      </button>
    </>
  );

  if (loading) {
    return (
      <div className="admin-page space-y-6">
        <PageHeader
          eyebrow="Operations"
          title="Settings"
          description="Manage branding, platform flags, and operational defaults."
          actions={actions}
        />
        <div className="admin-workspace">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page space-y-6">
        <PageHeader
          eyebrow="Operations"
          title="Settings"
          description="Manage branding, platform flags, and operational defaults."
          actions={actions}
        />
        <ErrorState message={error} onRetry={loadSettings} />
      </div>
    );
  }

  return (
    <div className="admin-page space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Settings"
        description="Manage branding, platform flags, and operational defaults."
        metadata={<span className="admin-stat-pill">Section: {SECTION_ITEMS.find((item) => item.id === activeSection)?.label}</span>}
        actions={actions}
      />

      {banner ? (
        <div
          className={`rounded-[1rem] border px-4 py-3 text-sm ${
            banner.type === "success"
              ? "border-[color:var(--admin-success)]/30 bg-[color:var(--admin-success-soft)] text-[color:var(--admin-success)]"
              : "border-[color:var(--admin-danger)]/30 bg-[color:var(--admin-danger-soft)] text-[color:var(--admin-danger)]"
          }`}
        >
          {banner.message}
        </div>
      ) : null}

      <SectionWorkspace
        sections={SECTION_ITEMS}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        sectionLabel="Settings sections"
      >
        {activeSection === "general" ? (
          <SectionCard
            title="General settings"
            description="Platform identity, support metadata, and the visible defaults already supported by the backend."
          >
            <div className="space-y-6">
              <div className="admin-field-grid">
                <div className="admin-field-stack">
                  <label className="admin-field-label" htmlFor="platform-name">
                    Platform name
                  </label>
                  <input
                    id="platform-name"
                    className="admin-input"
                    value={generalForm.platformName}
                    onChange={(event) =>
                      setGeneralForm((current) => ({
                        ...current,
                        platformName: event.target.value,
                      }))
                    }
                  />
                  <p className="admin-field-hint">
                    Shown in the admin header and any backend-driven email sender references.
                  </p>
                </div>

                <div className="admin-field-stack">
                  <label className="admin-field-label" htmlFor="support-email">
                    Support email
                  </label>
                  <input
                    id="support-email"
                    type="email"
                    className="admin-input"
                    value={generalForm.supportEmail}
                    onChange={(event) =>
                      setGeneralForm((current) => ({
                        ...current,
                        supportEmail: event.target.value,
                      }))
                    }
                  />
                  <p className="admin-field-hint">
                    Persists to the current sender email field used by backend-managed email templates.
                  </p>
                </div>

                <div className="admin-field-stack">
                  <label className="admin-field-label" htmlFor="sender-name">
                    Sender name
                  </label>
                  <input
                    id="sender-name"
                    className="admin-input"
                    value={generalForm.senderName}
                    onChange={(event) =>
                      setGeneralForm((current) => ({
                        ...current,
                        senderName: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="admin-field-stack">
                  <label className="admin-field-label" htmlFor="primary-color">
                    Brand accent color
                  </label>
                  <input
                    id="primary-color"
                    className="admin-input"
                    value={generalForm.primaryColor}
                    onChange={(event) =>
                      setGeneralForm((current) => ({
                        ...current,
                        primaryColor: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="admin-field-stack">
                <label className="admin-field-label" htmlFor="footer-text">
                  Email footer text
                </label>
                <textarea
                  id="footer-text"
                  className="admin-textarea min-h-[120px]"
                  value={generalForm.footerText}
                  onChange={(event) =>
                    setGeneralForm((current) => ({
                      ...current,
                      footerText: event.target.value,
                    }))
                  }
                />
              </div>

              <PreviewNotice message="Platform URL, admin panel URL, and default user timezone are displayed from the design but are not backed by the current admin settings API. They remain visible as read-only placeholders in this pass." />

              <div className="admin-field-grid">
                <div className="admin-field-stack">
                  <label className="admin-field-label" htmlFor="platform-url">
                    Platform URL
                  </label>
                  <input id="platform-url" className="admin-input" value={generalForm.platformUrl} readOnly />
                </div>
                <div className="admin-field-stack">
                  <label className="admin-field-label" htmlFor="admin-url">
                    Admin panel URL
                  </label>
                  <input id="admin-url" className="admin-input" value={generalForm.adminUrl} readOnly />
                </div>
                <div className="admin-field-stack md:col-span-2">
                  <label className="admin-field-label" htmlFor="default-timezone">
                    Default user timezone
                  </label>
                  <input
                    id="default-timezone"
                    className="admin-input"
                    value={generalForm.timezone}
                    readOnly
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" className="admin-button admin-button-primary" onClick={handleSave} disabled={!canSave}>
                  <FiSave size={16} />
                  Save changes
                </button>
                <button type="button" className="admin-button admin-button-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {activeSection === "platform" ? (
          <SectionCard
            title="Platform settings"
            description="Feature flags and platform-wide behaviour controls."
          >
            <div className="space-y-4">
              {FEATURE_FLAGS.map((flag) => (
                <ToggleCard
                  key={flag.key}
                  title={flag.title}
                  description={flag.description}
                  checked={platformFlags[flag.key]}
                  onChange={(checked) =>
                    setPlatformFlags((current) => ({ ...current, [flag.key]: checked }))
                  }
                />
              ))}

              <div className="flex flex-wrap gap-3 pt-2">
                <button type="button" className="admin-button admin-button-primary" onClick={handleSave} disabled={!canSave}>
                  <FiSave size={16} />
                  Save changes
                </button>
                <button type="button" className="admin-button admin-button-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {activeSection === "auth" ? (
          <SectionCard
            title="Auth & login"
            description="Authentication providers, session settings, and account protection rules."
          >
            <div className="space-y-6">
              <PreviewNotice message="These controls match the new admin design, but the current backend does not expose persistence for auth/session configuration yet." />

              <div className="admin-field-grid">
                <div className="admin-field-stack">
                  <label className="admin-field-label" htmlFor="session-timeout">
                    Session timeout (minutes)
                  </label>
                  <input
                    id="session-timeout"
                    className="admin-input"
                    value={authPreview.sessionTimeout}
                    onChange={(event) =>
                      setAuthPreview((current) => ({
                        ...current,
                        sessionTimeout: event.target.value,
                      }))
                    }
                  />
                  <p className="admin-field-hint">0 = never expire. Default is 1440 (24 hours).</p>
                </div>
                <div className="admin-field-stack">
                  <label className="admin-field-label" htmlFor="max-attempts">
                    Max login attempts
                  </label>
                  <input
                    id="max-attempts"
                    className="admin-input"
                    value={authPreview.maxAttempts}
                    onChange={(event) =>
                      setAuthPreview((current) => ({
                        ...current,
                        maxAttempts: event.target.value,
                      }))
                    }
                  />
                  <p className="admin-field-hint">
                    Accounts are temporarily locked after this many failed attempts.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <ToggleCard
                  title="Require email verification"
                  description="New users must verify email before accessing the platform."
                  checked={authPreview.requireEmailVerification}
                  onChange={(checked) =>
                    setAuthPreview((current) => ({
                      ...current,
                      requireEmailVerification: checked,
                    }))
                  }
                />
                <ToggleCard
                  title="Force logout on password change"
                  description="Revoke all active sessions when a user changes their password."
                  checked={authPreview.forceLogoutOnPasswordChange}
                  onChange={(checked) =>
                    setAuthPreview((current) => ({
                      ...current,
                      forceLogoutOnPasswordChange: checked,
                    }))
                  }
                />
              </div>
            </div>
          </SectionCard>
        ) : null}

        {activeSection === "email" ? (
          <SectionCard
            title="Email / SMTP"
            description="Mail delivery, sender infrastructure, and operational email controls."
          >
            <PreviewNotice
              title="Backend hookup pending"
              message="The current admin API supports basic email sender metadata, but it does not expose SMTP host, credentials, or test-send configuration. This section is intentionally shipped as a placeholder."
            />
          </SectionCard>
        ) : null}

        {activeSection === "danger" ? (
          <SectionCard
            title="Danger zone"
            description="Destructive platform-wide actions and irreversible maintenance controls."
          >
            <PreviewNotice
              title="Protected from unsupported actions"
              message="No destructive settings or teardown flows are implemented in this pass. The backend does not expose safe admin APIs for these actions yet, so this section remains informational."
            />
          </SectionCard>
        ) : null}
      </SectionWorkspace>

      {previewOnly ? (
        <div className="admin-preview-notice">
          Save is intentionally disabled for this section because the backend does not expose persistence for it yet.
        </div>
      ) : null}
    </div>
  );
}
