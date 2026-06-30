import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  User, Mail, Lock, Globe, Bell, ClipboardList,
  Shield, Wrench, Save, Send, Eye, EyeOff,
  CheckCircle, AlertTriangle, Loader, Upload,
  ToggleLeft, ToggleRight, RefreshCw,
} from 'lucide-react';
import { api } from '../../utils/api';
import './AdminSettings.css';

/* ── Tab definitions ──────────────────────────────────────────── */
const TABS = [
  { id: 'account',       label: 'My Account',         icon: User },
  { id: 'platform',      label: 'Platform',            icon: Globe },
  { id: 'smtp',          label: 'Email / SMTP',        icon: Mail },
  { id: 'notifications', label: 'Notifications',       icon: Bell },
  { id: 'registration',  label: 'Registration Rules',  icon: ClipboardList },
  { id: 'security',      label: 'Security',            icon: Shield },
  { id: 'system',        label: 'System',              icon: Wrench },
];

/* ── Small reusable toggle switch ─────────────────────────────── */
function Toggle({ checked, onChange, id }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      className={`settings-toggle ${checked ? 'on' : 'off'}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-thumb" />
    </button>
  );
}

/* ── Section wrapper ──────────────────────────────────────────── */
function Section({ title, description, children }) {
  return (
    <div className="settings-section">
      {(title || description) && (
        <div className="settings-section-header">
          {title && <h3 className="settings-section-title">{title}</h3>}
          {description && <p className="settings-section-desc">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

/* ── Form row ─────────────────────────────────────────────────── */
function FormRow({ label, hint, children, id }) {
  return (
    <div className="settings-form-row">
      <div className="settings-label-col">
        <label htmlFor={id} className="settings-label">{label}</label>
        {hint && <span className="settings-hint">{hint}</span>}
      </div>
      <div className="settings-input-col">{children}</div>
    </div>
  );
}

/* ── Notification row ─────────────────────────────────────────── */
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

/* ══════════════════════════════════════════════════════════════ */
export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('account');

  /* ── Fetch settings ── */
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn:  () => api.get('/admin/settings'),
  });

  /* ── Fetch admin profile ── */
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['admin-settings-me'],
    queryFn:  () => api.get('/admin/settings/me'),
  });

  const settings = settingsData?.settings || {};

  /* ── Local form states (per tab) ── */
  const [account, setAccount] = useState({ full_name: '', email: '', mobile: '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });

  const [platform, setPlatform] = useState({
    platform_name: '', support_email: '', company_address: '', terms_url: '', privacy_url: '',
  });

  const [smtp, setSmtp] = useState({
    smtp_host: '', smtp_port: '465', smtp_user: '', smtp_pass: '', smtp_from_name: '', smtp_from_email: '',
  });
  const [smtpTestStatus, setSmtpTestStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [smtpTestMsg, setSmtpTestMsg] = useState('');

  const [notif, setNotif] = useState({
    notif_new_registration_inapp: true,
    notif_new_registration_email: true,
    notif_user_suspended_inapp:   true,
    notif_user_suspended_email:   false,
    notif_failed_login_inapp:     true,
    notif_failed_login_email:     false,
    notif_payment_inapp:          true,
    notif_payment_email:          true,
  });

  const [registration, setRegistration] = useState({
    reg_default_cooldown_days: 30,
    reg_max_attempts:          5,
    reg_auto_approve:          false,
    reg_require_email_verify:  false,
  });

  const [security, setSecurity] = useState({
    sec_session_timeout_mins:  60,
    sec_max_failed_logins:     5,
    sec_lockout_duration_mins: 15,
    sec_inactivity_threshold_days: 30,
  });

  const [system, setSystem] = useState({
    sys_maintenance_mode:    false,
    sys_maintenance_message: '',
    sys_log_retention_days:  90,
  });

  /* ── Sync remote data → local state ── */
  useEffect(() => {
    if (profileData?.admin) {
      const a = profileData.admin;
      setAccount({ full_name: a.full_name || '', email: a.email || '', mobile: a.mobile || '' });
    }
  }, [profileData]);

  useEffect(() => {
    if (!settings) return;
    if (settings.platform)      setPlatform(settings.platform);
    if (settings.smtp)          setSmtp(settings.smtp);
    if (settings.notifications) setNotif(settings.notifications);
    if (settings.registration)  setRegistration(settings.registration);
    if (settings.security)      setSecurity(settings.security);
    if (settings.system)        setSystem(settings.system);
  }, [settings]);

  /* ── Save mutation (generic) ── */
  const saveMutation = useMutation({
    mutationFn: ({ section, data }) => api.put('/admin/settings', { section, data }),
    onSuccess: () => {
      toast.success('Settings saved successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (err) => toast.error(err?.message || 'Failed to save settings.'),
  });

  /* ── Update profile mutation ── */
  const profileMutation = useMutation({
    mutationFn: (data) => api.put('/admin/settings/me', data),
    onSuccess: () => {
      toast.success('Profile updated.');
      queryClient.invalidateQueries({ queryKey: ['admin-settings-me'] });
    },
    onError: (err) => toast.error(err?.message || 'Failed to update profile.'),
  });

  /* ── Change password mutation ── */
  const passwordMutation = useMutation({
    mutationFn: (data) => api.put('/admin/settings/password', data),
    onSuccess: () => {
      toast.success('Password changed successfully.');
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err) => toast.error(err?.message || 'Failed to change password.'),
  });

  /* ── Handlers ── */
  const handleSavePlatform    = () => saveMutation.mutate({ section: 'platform',      data: platform });
  const handleSaveSmtp        = () => saveMutation.mutate({ section: 'smtp',          data: smtp });
  const handleSaveNotif       = () => saveMutation.mutate({ section: 'notifications', data: notif });
  const handleSaveRegistration= () => saveMutation.mutate({ section: 'registration',  data: registration });
  const handleSaveSecurity    = () => saveMutation.mutate({ section: 'security',      data: security });
  const handleSaveSystem      = () => saveMutation.mutate({ section: 'system',        data: system });

  const handleSaveAccount = () => profileMutation.mutate(account);

  const handleChangePassword = () => {
    if (password.newPassword !== password.confirmPassword) {
      return toast.error('New passwords do not match.');
    }
    passwordMutation.mutate({ currentPassword: password.currentPassword, newPassword: password.newPassword });
  };

  const handleTestSmtp = async () => {
    setSmtpTestStatus('loading');
    setSmtpTestMsg('');
    try {
      const res = await api.post('/admin/settings/test-smtp', smtp);
      setSmtpTestStatus('ok');
      setSmtpTestMsg(res.message || 'Test email sent successfully.');
    } catch (err) {
      setSmtpTestStatus('error');
      setSmtpTestMsg(err?.message || 'SMTP test failed.');
    }
  };

  const isSaving = saveMutation.isPending || profileMutation.isPending || passwordMutation.isPending;

  /* ── Save button ── */
  const SaveBtn = ({ onClick, label = 'Save Changes', loading }) => (
    <button
      type="button"
      className="settings-save-btn"
      onClick={onClick}
      disabled={loading || isSaving}
    >
      {(loading || isSaving) ? <Loader size={14} className="spin" /> : <Save size={14} />}
      {label}
    </button>
  );

  if (settingsLoading || profileLoading) {
    return (
      <div className="settings-loading">
        <Loader size={28} className="spin" />
        <span>Loading settings…</span>
      </div>
    );
  }

  return (
    <div className="settings-shell">

      {/* ── Horizontal Navigation Tabs ── */}
      <nav className="settings-tab-nav-horizontal">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`settings-tab-btn-horizontal ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* ── Content area ── */}
      <div className="settings-content">

        {/* ══ MY ACCOUNT ══════════════════════════════════════════ */}
        {activeTab === 'account' && (
          <div className="settings-pane">
            <div className="settings-pane-header">
              <h2>My Account</h2>
              <p>Update your personal details and change your password.</p>
            </div>

            <Section title="Profile Details" description="This is how your name appears across the platform.">
              <FormRow label="Full Name" id="acc-name">
                <input id="acc-name" className="settings-input" value={account.full_name}
                  onChange={e => setAccount(s => ({ ...s, full_name: e.target.value }))} />
              </FormRow>
              <FormRow label="Email Address" id="acc-email" hint="Used for login and communications">
                <input id="acc-email" type="email" className="settings-input" value={account.email}
                  onChange={e => setAccount(s => ({ ...s, email: e.target.value }))} />
              </FormRow>
              <FormRow label="Mobile" id="acc-mobile">
                <input id="acc-mobile" className="settings-input" value={account.mobile}
                  onChange={e => setAccount(s => ({ ...s, mobile: e.target.value }))} />
              </FormRow>
              <div className="settings-row-actions">
                <SaveBtn onClick={handleSaveAccount} loading={profileMutation.isPending} />
              </div>
            </Section>

            <Section title="Change Password" description="Use a strong password with at least 8 characters.">
              {[
                { key: 'currentPassword', label: 'Current Password', id: 'pwd-current', show: 'current' },
                { key: 'newPassword',     label: 'New Password',     id: 'pwd-new',     show: 'new' },
                { key: 'confirmPassword', label: 'Confirm Password', id: 'pwd-confirm', show: 'confirm' },
              ].map(({ key, label, id, show }) => (
                <FormRow key={key} label={label} id={id}>
                  <div className="settings-input-icon-wrap">
                    <input
                      id={id}
                      type={showPwd[show] ? 'text' : 'password'}
                      className="settings-input"
                      value={password[key]}
                      onChange={e => setPassword(s => ({ ...s, [key]: e.target.value }))}
                      autoComplete="new-password"
                    />
                    <button type="button" className="pwd-toggle" onClick={() => setShowPwd(s => ({ ...s, [show]: !s[show] }))}>
                      {showPwd[show] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </FormRow>
              ))}
              <div className="settings-row-actions">
                <SaveBtn onClick={handleChangePassword} label="Change Password" loading={passwordMutation.isPending} />
              </div>
            </Section>
          </div>
        )}

        {/* ══ PLATFORM ════════════════════════════════════════════ */}
        {activeTab === 'platform' && (
          <div className="settings-pane">
            <div className="settings-pane-header">
              <h2>Platform Identity</h2>
              <p>Branding and contact info used in emails and user-facing communications.</p>
            </div>
            <Section>
              <FormRow label="Platform Name" id="plat-name">
                <input id="plat-name" className="settings-input" value={platform.platform_name}
                  onChange={e => setPlatform(s => ({ ...s, platform_name: e.target.value }))} />
              </FormRow>
              <FormRow label="Support Email" id="plat-email" hint="Shown to users for support queries">
                <input id="plat-email" type="email" className="settings-input" value={platform.support_email}
                  onChange={e => setPlatform(s => ({ ...s, support_email: e.target.value }))} />
              </FormRow>
              <FormRow label="Company Address" id="plat-address" hint="Used in email footers">
                <textarea id="plat-address" className="settings-textarea" rows={3} value={platform.company_address}
                  onChange={e => setPlatform(s => ({ ...s, company_address: e.target.value }))} />
              </FormRow>
              <FormRow label="Terms of Service URL" id="plat-terms">
                <input id="plat-terms" type="url" className="settings-input" value={platform.terms_url}
                  onChange={e => setPlatform(s => ({ ...s, terms_url: e.target.value }))} placeholder="https://" />
              </FormRow>
              <FormRow label="Privacy Policy URL" id="plat-privacy">
                <input id="plat-privacy" type="url" className="settings-input" value={platform.privacy_url}
                  onChange={e => setPlatform(s => ({ ...s, privacy_url: e.target.value }))} placeholder="https://" />
              </FormRow>
              <div className="settings-row-actions">
                <SaveBtn onClick={handleSavePlatform} />
              </div>
            </Section>
          </div>
        )}

        {/* ══ EMAIL / SMTP ════════════════════════════════════════ */}
        {activeTab === 'smtp' && (
          <div className="settings-pane">
            <div className="settings-pane-header">
              <h2>Email / SMTP</h2>
              <p>Configure the outgoing mail server used for all transactional emails.</p>
            </div>
            <Section title="Mail Server">
              <FormRow label="SMTP Host" id="smtp-host">
                <input id="smtp-host" className="settings-input" value={smtp.smtp_host}
                  onChange={e => setSmtp(s => ({ ...s, smtp_host: e.target.value }))} placeholder="smtp.gmail.com" />
              </FormRow>
              <FormRow label="SMTP Port" id="smtp-port" hint="465 for SSL, 587 for TLS">
                <input id="smtp-port" type="number" className="settings-input" value={smtp.smtp_port}
                  onChange={e => setSmtp(s => ({ ...s, smtp_port: e.target.value }))} />
              </FormRow>
              <FormRow label="Username" id="smtp-user">
                <input id="smtp-user" className="settings-input" value={smtp.smtp_user}
                  onChange={e => setSmtp(s => ({ ...s, smtp_user: e.target.value }))} />
              </FormRow>
              <FormRow label="Password" id="smtp-pass">
                <div className="settings-input-icon-wrap">
                  <input id="smtp-pass" type={showPwd.smtp ? 'text' : 'password'} className="settings-input"
                    value={smtp.smtp_pass}
                    onChange={e => setSmtp(s => ({ ...s, smtp_pass: e.target.value }))}
                    placeholder="Leave as ●●●●●●●● to keep existing" />
                  <button type="button" className="pwd-toggle" onClick={() => setShowPwd(s => ({ ...s, smtp: !s.smtp }))}>
                    {showPwd.smtp ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </FormRow>
            </Section>

            <Section title="Sender Details">
              <FormRow label="From Name" id="smtp-from-name" hint="Displayed as the email sender name">
                <input id="smtp-from-name" className="settings-input" value={smtp.smtp_from_name}
                  onChange={e => setSmtp(s => ({ ...s, smtp_from_name: e.target.value }))} />
              </FormRow>
              <FormRow label="From Email" id="smtp-from-email">
                <input id="smtp-from-email" type="email" className="settings-input" value={smtp.smtp_from_email}
                  onChange={e => setSmtp(s => ({ ...s, smtp_from_email: e.target.value }))} />
              </FormRow>
            </Section>

            <Section title="Test Connection">
              <div className="smtp-test-row">
                <button
                  type="button"
                  className="settings-secondary-btn"
                  onClick={handleTestSmtp}
                  disabled={smtpTestStatus === 'loading'}
                >
                  {smtpTestStatus === 'loading'
                    ? <><Loader size={14} className="spin" /> Sending…</>
                    : <><Send size={14} /> Send Test Email</>}
                </button>
                {smtpTestStatus === 'ok' && (
                  <div className="smtp-test-result ok">
                    <CheckCircle size={14} /> {smtpTestMsg}
                  </div>
                )}
                {smtpTestStatus === 'error' && (
                  <div className="smtp-test-result error">
                    <AlertTriangle size={14} /> {smtpTestMsg}
                  </div>
                )}
              </div>
              <p className="settings-hint mt-2">
                A test email will be sent to your admin email address using the configuration above.
              </p>
            </Section>

            <div className="settings-row-actions border-t border-[#1e1e26] pt-5 mt-2">
              <SaveBtn onClick={handleSaveSmtp} />
            </div>
          </div>
        )}

        {/* ══ NOTIFICATIONS ═══════════════════════════════════════ */}
        {activeTab === 'notifications' && (
          <div className="settings-pane">
            <div className="settings-pane-header">
              <h2>Notification Preferences</h2>
              <p>Control which events trigger in-app and email alerts for admins.</p>
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
                id="notif-reg"
                label="New Registration Request"
                desc="When a gig expert or agency submits a new registration"
                inApp={notif.notif_new_registration_inapp}
                email={notif.notif_new_registration_email}
                onInApp={v => setNotif(s => ({ ...s, notif_new_registration_inapp: v }))}
                onEmail={v => setNotif(s => ({ ...s, notif_new_registration_email: v }))}
              />
              <NotifRow
                id="notif-susp"
                label="User Suspended"
                desc="When an account is suspended or blocked"
                inApp={notif.notif_user_suspended_inapp}
                email={notif.notif_user_suspended_email}
                onInApp={v => setNotif(s => ({ ...s, notif_user_suspended_inapp: v }))}
                onEmail={v => setNotif(s => ({ ...s, notif_user_suspended_email: v }))}
              />
              <NotifRow
                id="notif-login"
                label="Failed Login Attempts"
                desc="When repeated failed logins are detected"
                inApp={notif.notif_failed_login_inapp}
                email={notif.notif_failed_login_email}
                onInApp={v => setNotif(s => ({ ...s, notif_failed_login_inapp: v }))}
                onEmail={v => setNotif(s => ({ ...s, notif_failed_login_email: v }))}
              />
              <NotifRow
                id="notif-pay"
                label="Payment / Transaction Events"
                desc="Upcoming — when payment flows are live"
                inApp={notif.notif_payment_inapp}
                email={notif.notif_payment_email}
                onInApp={v => setNotif(s => ({ ...s, notif_payment_inapp: v }))}
                onEmail={v => setNotif(s => ({ ...s, notif_payment_email: v }))}
              />

              <div className="settings-row-actions">
                <SaveBtn onClick={handleSaveNotif} />
              </div>
            </Section>
          </div>
        )}

        {/* ══ REGISTRATION RULES ══════════════════════════════════ */}
        {activeTab === 'registration' && (
          <div className="settings-pane">
            <div className="settings-pane-header">
              <h2>Registration & Onboarding Rules</h2>
              <p>Controls how new gig experts and agencies are admitted to the platform.</p>
            </div>
            <Section>
              <FormRow label="Default Cooldown Period" id="reg-cooldown"
                hint="Applied to applicants not selected before they can re-apply">
                <select id="reg-cooldown" className="settings-select"
                  value={registration.reg_default_cooldown_days}
                  onChange={e => setRegistration(s => ({ ...s, reg_default_cooldown_days: Number(e.target.value) }))}>
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days (Standard)</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days</option>
                </select>
              </FormRow>
              <FormRow label="Max Registration Attempts" id="reg-max"
                hint="After this many times of not being selected, the applicant is flagged">
                <input id="reg-max" type="number" min={1} max={20} className="settings-input"
                  value={registration.reg_max_attempts}
                  onChange={e => setRegistration(s => ({ ...s, reg_max_attempts: Number(e.target.value) }))} />
              </FormRow>
              <FormRow label="Auto-Approve New Registrations" id="reg-auto"
                hint="Bypass manual review (not recommended for production)">
                <Toggle id="reg-auto" checked={registration.reg_auto_approve}
                  onChange={v => setRegistration(s => ({ ...s, reg_auto_approve: v }))} />
              </FormRow>
              <FormRow label="Require Email Verification" id="reg-verify"
                hint="User must verify email before the review process begins">
                <Toggle id="reg-verify" checked={registration.reg_require_email_verify}
                  onChange={v => setRegistration(s => ({ ...s, reg_require_email_verify: v }))} />
              </FormRow>
              <div className="settings-row-actions">
                <SaveBtn onClick={handleSaveRegistration} />
              </div>
            </Section>
          </div>
        )}

        {/* ══ SECURITY ════════════════════════════════════════════ */}
        {activeTab === 'security' && (
          <div className="settings-pane">
            <div className="settings-pane-header">
              <h2>Security & Access</h2>
              <p>Configure session behavior and login lockout policies for the platform.</p>
            </div>
            <Section title="Session Policy">
              <FormRow label="Session Timeout" id="sec-timeout"
                hint="Minutes of inactivity before an admin is logged out automatically">
                <div className="settings-input-unit-wrap">
                  <input id="sec-timeout" type="number" min={5} max={480} className="settings-input"
                    value={security.sec_session_timeout_mins}
                    onChange={e => setSecurity(s => ({ ...s, sec_session_timeout_mins: Number(e.target.value) }))} />
                  <span className="settings-unit">minutes</span>
                </div>
              </FormRow>
            </Section>

            <Section title="User Activity Policy">
              <FormRow label="Inactivity Threshold" id="sec-inactivity-threshold"
                hint="Days of inactivity after which a user is considered inactive for filtering">
                <div className="settings-input-unit-wrap">
                  <input id="sec-inactivity-threshold" type="number" min={1} max={365} className="settings-input"
                    value={security.sec_inactivity_threshold_days || 30}
                    onChange={e => setSecurity(s => ({ ...s, sec_inactivity_threshold_days: Number(e.target.value) }))} />
                  <span className="settings-unit">days</span>
                </div>
              </FormRow>
            </Section>

            <Section title="Login Lockout Policy">
              <FormRow label="Max Failed Login Attempts" id="sec-max-logins"
                hint="Account is temporarily locked after this many consecutive failures">
                <input id="sec-max-logins" type="number" min={1} max={20} className="settings-input"
                  value={security.sec_max_failed_logins}
                  onChange={e => setSecurity(s => ({ ...s, sec_max_failed_logins: Number(e.target.value) }))} />
              </FormRow>
              <FormRow label="Lockout Duration" id="sec-lockout"
                hint="How long the account remains locked after threshold is hit">
                <div className="settings-input-unit-wrap">
                  <input id="sec-lockout" type="number" min={1} max={1440} className="settings-input"
                    value={security.sec_lockout_duration_mins}
                    onChange={e => setSecurity(s => ({ ...s, sec_lockout_duration_mins: Number(e.target.value) }))} />
                  <span className="settings-unit">minutes</span>
                </div>
              </FormRow>
              <div className="settings-row-actions">
                <SaveBtn onClick={handleSaveSecurity} />
              </div>
            </Section>
          </div>
        )}

        {/* ══ SYSTEM ══════════════════════════════════════════════ */}
        {activeTab === 'system' && (
          <div className="settings-pane">
            <div className="settings-pane-header">
              <h2>System</h2>
              <p>Operational controls for the platform — maintenance mode, logs, and data retention.</p>
            </div>

            <Section title="Maintenance Mode"
              description="When enabled, all non-admin users see a maintenance page instead of the platform.">
              <FormRow label="Maintenance Mode" id="sys-maint">
                <div className="flex items-center gap-3">
                  <Toggle id="sys-maint" checked={system.sys_maintenance_mode}
                    onChange={v => setSystem(s => ({ ...s, sys_maintenance_mode: v }))} />
                  {system.sys_maintenance_mode && (
                    <span className="text-[#f59e0b] text-[0.78rem] font-bold">
                      ⚠ Platform is in maintenance mode
                    </span>
                  )}
                </div>
              </FormRow>
              {system.sys_maintenance_mode && (
                <FormRow label="Maintenance Message" id="sys-maint-msg"
                  hint="Displayed to users during maintenance">
                  <textarea id="sys-maint-msg" className="settings-textarea" rows={3}
                    value={system.sys_maintenance_message}
                    onChange={e => setSystem(s => ({ ...s, sys_maintenance_message: e.target.value }))} />
                </FormRow>
              )}
            </Section>

            <Section title="Data Retention">
              <FormRow label="Audit Log Retention" id="sys-log-retention"
                hint="Logs older than this are automatically purged">
                <select id="sys-log-retention" className="settings-select"
                  value={system.sys_log_retention_days}
                  onChange={e => setSystem(s => ({ ...s, sys_log_retention_days: Number(e.target.value) }))}>
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days (Recommended)</option>
                  <option value={180}>180 Days</option>
                  <option value={365}>1 Year</option>
                </select>
              </FormRow>
            </Section>

            <div className="settings-row-actions">
              <SaveBtn onClick={handleSaveSystem} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
