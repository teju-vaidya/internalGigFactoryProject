import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { User, Lock, Bell, Save, Eye, EyeOff, Loader } from "lucide-react";
import { api, resolveAttachmentUrl } from "../../utils/api";
import { useAuthStore } from "../../store/useAuthStore";
import "./UserSettings.css";

const TABS = [
  { id: "account", label: "My Account", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
];

function Toggle({ checked, onChange, id }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      className={`settings-toggle ${checked ? "on" : "off"}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-thumb" />
    </button>
  );
}

function Section({ title, description, children }) {
  return (
    <div className="settings-section">
      {(title || description) && (
        <div className="settings-section-header">
          {title && <h3 className="settings-section-title">{title}</h3>}
          {description && (
            <p className="settings-section-desc">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

function FormRow({ label, hint, children, id }) {
  return (
    <div className="settings-form-row">
      <div className="settings-label-col">
        <label htmlFor={id} className="settings-label">
          {label}
        </label>
        {hint && <span className="settings-hint">{hint}</span>}
      </div>
      <div className="settings-input-col">{children}</div>
    </div>
  );
}

function NotifRow({ label, desc, inApp, email, onInApp, onEmail, id }) {
  return (
    <div className="notif-matrix-row">
      <div className="notif-matrix-info">
        <span className="notif-matrix-label">{label}</span>
        {desc && <span className="notif-matrix-desc">{desc}</span>}
      </div>
      <div className="notif-matrix-toggles">
        <div className="notif-matrix-toggle-cell">
          <Toggle id={`${id}-inapp`} checked={inApp} onChange={onInApp} />
        </div>
        <div className="notif-matrix-toggle-cell">
          <Toggle id={`${id}-email`} checked={email} onChange={onEmail} />
        </div>
      </div>
    </div>
  );
}

export default function UserSettings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("account");
  const updateStoreUser = useAuthStore((state) => state.updateUser);

  // Fetch settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["user-settings"],
    queryFn: () => api.get("/settings"),
  });

  const settings = settingsData?.settings || {};

  // Form states
  const [account, setAccount] = useState({
    full_name: "",
    email: "",
    mobile: "",
    saved_signature_url: "",
  });
  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPwd, setShowPwd] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [notif, setNotif] = useState({
    notif_payment_inapp: true,
    notif_payment_email: true,
    notif_project_inapp: true,
    notif_project_email: true,
  });

  // Sync data to local state
  useEffect(() => {
    if (settings.profile) {
      setAccount({
        full_name: settings.profile.full_name || "",
        email: settings.profile.email || "",
        mobile: settings.profile.mobile || "",
        saved_signature_url: settings.profile.saved_signature_url || "",
      });
    }
    if (settings.notifications) {
      setNotif(settings.notifications);
    }
  }, [settings]);

  // Mutation
  const saveMutation = useMutation({
    mutationFn: ({ section, data }) => api.put("/settings", { section, data }),
    onSuccess: (res, variables) => {
      toast.success("Settings saved successfully.");
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
      if (variables.section === "profile") {
        updateStoreUser({
          full_name: variables.data.full_name,
          fullName: variables.data.full_name,
          email: variables.data.email,
          mobile: variables.data.mobile,
        });
      }
    },
    onError: (err) => toast.error(err?.message || "Failed to save settings."),
  });

  const passwordMutation = useMutation({
    mutationFn: (data) => api.put("/settings/password", data),
    onSuccess: () => {
      toast.success("Password changed successfully.");
      setPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (err) => toast.error(err?.message || "Failed to change password."),
  });

  const handleSaveAccount = () =>
    saveMutation.mutate({ section: "profile", data: account });
  const handleSaveNotif = () =>
    saveMutation.mutate({ section: "notifications", data: notif });

  const handleChangePassword = () => {
    if (password.newPassword !== password.confirmPassword) {
      return toast.error("New passwords do not match.");
    }
    passwordMutation.mutate({
      currentPassword: password.currentPassword,
      newPassword: password.newPassword,
    });
  };

  const handleUploadSignature = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowed.includes(file.type)) {
      return toast.error("Only PNG, JPG, and JPEG files are allowed.");
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("File size must be less than 5MB.");
    }

    const formData = new FormData();
    formData.append("signature", file);

    try {
      const res = await api.putFile("/settings/signature", formData);
      if (res.success) {
        toast.success("Signature uploaded successfully.");
        queryClient.invalidateQueries({ queryKey: ["user-settings"] });
      } else {
        toast.error(res.message || "Failed to upload signature.");
      }
    } catch (err) {
      toast.error(err?.message || "Failed to upload signature.");
    }
  };

  const handleDeleteSignature = async () => {
    if (
      !window.confirm("Are you sure you want to remove your saved signature?")
    )
      return;
    try {
      const res = await api.delete("/settings/signature");
      if (res.success) {
        toast.success("Signature removed successfully.");
        queryClient.invalidateQueries({ queryKey: ["user-settings"] });
      } else {
        toast.error(res.message || "Failed to remove signature.");
      }
    } catch (err) {
      toast.error(err?.message || "Failed to remove signature.");
    }
  };

  const isSaving = saveMutation.isPending || passwordMutation.isPending;

  const SaveBtn = ({ onClick, label = "Save Changes", loading }) => (
    <button
      type="button"
      className="settings-save-btn"
      onClick={onClick}
      disabled={loading || isSaving}
    >
      {loading || isSaving ? (
        <Loader size={14} className="spin" />
      ) : (
        <Save size={14} />
      )}
      {label}
    </button>
  );

  if (settingsLoading) {
    return (
      <div className="settings-loading">
        <Loader size={28} className="spin" />
        <span>Loading settings…</span>
      </div>
    );
  }

  return (
    <div className="settings-shell">
      {/* Horizontal Navigation Tabs */}
      <nav className="settings-tab-nav-horizontal">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`settings-tab-btn-horizontal ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Content area */}
      <div className="settings-content">
        {/* MY ACCOUNT */}
        {activeTab === "account" && (
          <div className="settings-pane">
            <div className="settings-pane-header">
              <h2>My Account</h2>
              <p>Update your personal details and change your password.</p>
            </div>

            <Section
              title="Profile Details"
              description="This is how your name appears across the platform."
            >
              <FormRow label="Full Name" id="acc-name">
                <input
                  id="acc-name"
                  className="settings-input"
                  value={account.full_name}
                  onChange={(e) =>
                    setAccount((s) => ({ ...s, full_name: e.target.value }))
                  }
                />
              </FormRow>
              <FormRow
                label="Email Address"
                id="acc-email"
                hint="Used for login and communications"
              >
                <input
                  id="acc-email"
                  type="email"
                  className="settings-input"
                  value={account.email}
                  // onChange={(e) =>
                  //   setAccount((s) => ({ ...s, email: e.target.value }))
                  // }
                  disabled
                />
              </FormRow>
              <FormRow label="Mobile" id="acc-mobile">
                <input
                  id="acc-mobile"
                  className="settings-input"
                  type="tel"
                  inputMode="numeric"

                  value={account.mobile}
                  onKeyDown={(e) => {
                    const allowedKeys = [
                      "Backspace",
                      "Delete",
                      "Tab",
                      "ArrowLeft",
                      "ArrowRight",
                      "Home",
                      "End",
                    ];

                    if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setAccount((s) => ({ ...s, mobile: value }));
                  }}
                />

              </FormRow>
              <div className="settings-row-actions">
                <SaveBtn
                  onClick={handleSaveAccount}
                  loading={saveMutation.isPending}
                />
              </div>
            </Section>

            <Section
              title="Saved Signature"
              description="Securely store your signature for fast document signing. Only PNG, JPG, and JPEG files are allowed."
            >
              <div className="settings-form-row settings-signature-row">
                <div className="settings-label-col">
                  <span className="settings-label">Your Signature</span>
                  <span className="settings-hint">
                    Used for signing certificates and project approvals.
                  </span>
                </div>
                <div className="settings-input-col">
                  {account.saved_signature_url ? (
                    <div className="settings-signature-container">
                      <div className="settings-signature-preview-wrap">
                        <img
                          src={resolveAttachmentUrl(
                            account.saved_signature_url,
                          )}
                          alt="Saved Signature"
                          className="settings-signature-preview"
                        />
                      </div>
                      <button
                        type="button"
                        className="settings-signature-delete-btn"
                        onClick={handleDeleteSignature}
                        disabled={isSaving}
                      >
                        Remove Signature
                      </button>
                    </div>
                  ) : (
                    <div className="settings-signature-upload-wrap">
                      <input
                        type="file"
                        id="signature-file-upload"
                        accept=".png,.jpg,.jpeg"
                        style={{ display: "none" }}
                        onChange={handleUploadSignature}
                      />
                      <button
                        type="button"
                        className="settings-signature-upload-btn"
                        onClick={() =>
                          document
                            .getElementById("signature-file-upload")
                            .click()
                        }
                        disabled={isSaving}
                      >
                        Upload Signature Image
                      </button>
                      <span className="settings-hint mt-2">
                        Recommended: PNG transparent background, max 5MB.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Section>

            <Section
              title="Change Password"
              description="Use a strong password with at least 8 characters."
            >
              {[
                {
                  key: "currentPassword",
                  label: "Current Password",
                  id: "pwd-current",
                  show: "current",
                },
                {
                  key: "newPassword",
                  label: "New Password",
                  id: "pwd-new",
                  show: "new",
                },
                {
                  key: "confirmPassword",
                  label: "Confirm Password",
                  id: "pwd-confirm",
                  show: "confirm",
                },
              ].map(({ key, label, id, show }) => (
                <FormRow key={key} label={label} id={id}>
                  <div className="settings-input-icon-wrap">
                    <input
                      id={id}
                      type={showPwd[show] ? "text" : "password"}
                      className="settings-input"
                      value={password[key]}
                      onChange={(e) =>
                        setPassword((s) => ({ ...s, [key]: e.target.value }))
                      }
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="pwd-toggle"
                      onClick={() =>
                        setShowPwd((s) => ({ ...s, [show]: !s[show] }))
                      }
                    >
                      {showPwd[show] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </FormRow>
              ))}
              <div className="settings-row-actions">
                <SaveBtn
                  onClick={handleChangePassword}
                  label="Change Password"
                  loading={passwordMutation.isPending}
                />
              </div>
            </Section>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div className="settings-pane">
            <div className="settings-pane-header">
              <h2>Notification Preferences</h2>
              <p>Control which events trigger in-app and email alerts.</p>
            </div>
            <Section>
              {/* Matrix header */}
              <div className="notif-matrix-header">
                <span className="notif-matrix-event-col">Event</span>
                <div className="notif-matrix-toggles">
                  <span>In-App</span>
                  <span>Email</span>
                </div>
              </div>

              <NotifRow
                id="notif-pay"
                label="Payment / Transaction Events"
                desc="When a payment is processed or invoice is generated"
                inApp={notif.notif_payment_inapp}
                email={notif.notif_payment_email}
                onInApp={(v) =>
                  setNotif((s) => ({ ...s, notif_payment_inapp: v }))
                }
                onEmail={(v) =>
                  setNotif((s) => ({ ...s, notif_payment_email: v }))
                }
              />
              <NotifRow
                id="notif-proj"
                label="Project Assignments & Milestones"
                desc="When you are assigned to a new project or milestone status changes"
                inApp={notif.notif_project_inapp}
                email={notif.notif_project_email}
                onInApp={(v) =>
                  setNotif((s) => ({ ...s, notif_project_inapp: v }))
                }
                onEmail={(v) =>
                  setNotif((s) => ({ ...s, notif_project_email: v }))
                }
              />

              <div className="settings-row-actions">
                <SaveBtn onClick={handleSaveNotif} />
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
