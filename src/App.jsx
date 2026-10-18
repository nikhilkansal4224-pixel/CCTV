import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import AppLayout from './components/layout/AppLayout';
import MinimalLayout from './components/layout/MinimalLayout';

// 1. Public & Marketing Pages (1-20)
import LandingPage from './pages/public/LandingPage';
import FeaturesPage from './pages/public/FeaturesPage';
import TechnologyPage from './pages/public/TechnologyPage';
import SolutionsDirectory from './pages/public/SolutionsDirectory';
import IndustryDetailPage from './pages/public/IndustryDetailPage';
import HardwareCompatibilityPage from './pages/public/HardwareCompatibilityPage';
import PricingPage from './pages/public/PricingPage';
import LiveDemoPage from './pages/public/LiveDemoPage';
import AboutPage from './pages/public/AboutPage';
import CareersPage from './pages/public/CareersPage';
import BlogDirectoryPage from './pages/public/BlogDirectoryPage';
import BlogArticlePage from './pages/public/BlogArticlePage';
import CaseStudiesPage from './pages/public/CaseStudiesPage';
import DocsHubPage from './pages/public/DocsHubPage';
import ApiReferencePage from './pages/public/ApiReferencePage';
import SystemStatusPage from './pages/public/SystemStatusPage';
import ContactPage from './pages/public/ContactPage';
import PrivacyPolicyPage from './pages/public/PrivacyPolicyPage';
import TermsPage from './pages/public/TermsPage';
import CompliancePage from './pages/public/CompliancePage';

// 2. Authentication & Onboarding (21-29)
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import TwoFactorVerifyPage from './pages/auth/TwoFactorVerifyPage';
import TwoFactorSetupPage from './pages/auth/TwoFactorSetupPage';
import OrgSetupWizard from './pages/auth/OrgSetupWizard';
import AddFirstCameraWizard from './pages/auth/AddFirstCameraWizard';

// 3. Live Monitoring & Video Feed (30-34)
import CommandDashboard from './pages/live/CommandDashboard';
import SingleStreamView from './pages/live/SingleStreamView';
import KioskMatrixView from './pages/live/KioskMatrixView';
import MapFloorplanView from './pages/live/MapFloorplanView';
import CustomLayoutManager from './pages/live/CustomLayoutManager';

// 4. Alert Management & Real-Time Incident Response (35-39)
import LiveAlertQueue from './pages/alerts/LiveAlertQueue';
import IncidentDetailsPage from './pages/alerts/IncidentDetailsPage';
import IncidentReviewQueue from './pages/alerts/IncidentReviewQueue';
import IncidentEscalationPage from './pages/alerts/IncidentEscalationPage';
import IncidentAuditLogPage from './pages/alerts/IncidentAuditLogPage';

// 5. Event History, Search & Playback (40-45)
import EventsArchivePage from './pages/events/EventsArchivePage';
import AdvancedVideoSearchPage from './pages/events/AdvancedVideoSearchPage';
import RecordedStreamPlayer from './pages/events/RecordedStreamPlayer';
import VideoClipEditorPage from './pages/events/VideoClipEditorPage';
import ExportManagerPage from './pages/events/ExportManagerPage';
import PublicEvidenceSharePage from './pages/events/PublicEvidenceSharePage';

// 6. AI Models, Detection Zones & Calibration (46-51)
import AiOverviewPage from './pages/ai/AiOverviewPage';
import DetectionZoneCanvasPage from './pages/ai/DetectionZoneCanvasPage';
import SensitivityThresholdPage from './pages/ai/SensitivityThresholdPage';
import PrivacyMaskingCanvasPage from './pages/ai/PrivacyMaskingCanvasPage';
import ThermalCalibrationPage from './pages/ai/ThermalCalibrationPage';
import AiModelSelectorPage from './pages/ai/AiModelSelectorPage';

// 7. Camera & Hardware Management (52-57)
import CameraInventoryPage from './pages/cameras/CameraInventoryPage';
import AddNewCameraPage from './pages/cameras/AddNewCameraPage';
import CameraDetailsPage from './pages/cameras/CameraDetailsPage';
import PtzControlsConfigPage from './pages/cameras/PtzControlsConfigPage';
import RetentionSchedulePage from './pages/cameras/RetentionSchedulePage';
import FirmwareUpdatesPage from './pages/cameras/FirmwareUpdatesPage';

// 8. Notification Rules & Integrations (58-64)
import AlertRulesDirectoryPage from './pages/notifications/AlertRulesDirectoryPage';
import AlertRuleBuilderPage from './pages/notifications/AlertRuleBuilderPage';
import ShiftSchedulePage from './pages/notifications/ShiftSchedulePage';
import IntegrationsHubPage from './pages/notifications/IntegrationsHubPage';
import WebhookSettingsPage from './pages/notifications/WebhookSettingsPage';
import ChatBotsSetupPage from './pages/notifications/ChatBotsSetupPage';
import PhysicalRelaysPage from './pages/notifications/PhysicalRelaysPage';

// 9. Analytics & Reporting (65-70)
import ExecutiveAnalyticsPage from './pages/analytics/ExecutiveAnalyticsPage';
import HeatmapsPage from './pages/analytics/HeatmapsPage';
import TrafficDwellPage from './pages/analytics/TrafficDwellPage';
import FalseAlarmAnalysisPage from './pages/analytics/FalseAlarmAnalysisPage';
import ScheduledReportsPage from './pages/analytics/ScheduledReportsPage';
import ReportsArchivePage from './pages/analytics/ReportsArchivePage';

// 10. User Administration & Workspace Settings (71-76)
import OrgProfilePage from './pages/settings/OrgProfilePage';
import UserDirectoryPage from './pages/settings/UserDirectoryPage';
import InviteUserPage from './pages/settings/InviteUserPage';
import RbacRolesPage from './pages/settings/RbacRolesPage';
import LocationsManagementPage from './pages/settings/LocationsManagementPage';
import AuditLogsPage from './pages/settings/AuditLogsPage';

// 11. System Health & Infrastructure (77-79)
import EdgeGatewayNodesPage from './pages/system/EdgeGatewayNodesPage';
import DiskAllocationPage from './pages/system/DiskAllocationPage';
import NetworkDiagnosticsPage from './pages/system/NetworkDiagnosticsPage';

// 12. Billing, Subscription & Account Management (80-84)
import BillingOverviewPage from './pages/billing/BillingOverviewPage';
import UpgradePlansPage from './pages/billing/UpgradePlansPage';
import PaymentMethodsPage from './pages/billing/PaymentMethodsPage';
import InvoicesArchivePage from './pages/billing/InvoicesArchivePage';
import UsageBreakdownPage from './pages/billing/UsageBreakdownPage';

// 13. Support & Self-Service Help (85-87)
import SupportTicketsCenterPage from './pages/support/SupportTicketsCenterPage';
import CreateTicketPage from './pages/support/CreateTicketPage';
import TroubleshootWizardPage from './pages/support/TroubleshootWizardPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Module 1: Public & Marketing Layout (Pages 1-20) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/technology" element={<TechnologyPage />} />
          <Route path="/solutions" element={<SolutionsDirectory />} />
          <Route path="/solutions/:industry" element={<IndustryDetailPage />} />
          <Route path="/hardware" element={<HardwareCompatibilityPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/demo" element={<LiveDemoPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/blog" element={<BlogDirectoryPage />} />
          <Route path="/blog/:slug" element={<BlogArticlePage />} />
          <Route path="/case-studies" element={<CaseStudiesPage />} />
          <Route path="/docs" element={<DocsHubPage />} />
          <Route path="/docs/api" element={<ApiReferencePage />} />
          <Route path="/status" element={<SystemStatusPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
        </Route>

        {/* Module 2: Authentication & Onboarding (Pages 21-29) in Minimal Layout */}
        <Route element={<MinimalLayout />}>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
          <Route path="/auth/2fa-verify" element={<TwoFactorVerifyPage />} />
          <Route path="/account/2fa-setup" element={<TwoFactorSetupPage />} />
          <Route path="/onboarding/org" element={<OrgSetupWizard />} />
          <Route path="/onboarding/add-first-camera" element={<AddFirstCameraWizard />} />
          <Route path="/share/:token" element={<PublicEvidenceSharePage />} />
        </Route>

        {/* Standalone Fullscreen Kiosk Matrix (Page 32) */}
        <Route path="/live/kiosk" element={<KioskMatrixView />} />

        {/* Operator Command & Management Layout (Pages 30-31, 33-87) */}
        <Route element={<AppLayout />}>
          {/* Module 3: Live Monitoring & Video Feed */}
          <Route path="/dashboard" element={<CommandDashboard />} />
          <Route path="/live/:camera_id" element={<SingleStreamView />} />
          <Route path="/live/map" element={<MapFloorplanView />} />
          <Route path="/dashboard/layouts" element={<CustomLayoutManager />} />

          {/* Module 4: Alert Management & Incident Response */}
          <Route path="/alerts/live" element={<LiveAlertQueue />} />
          <Route path="/alerts/:alert_id" element={<IncidentDetailsPage />} />
          <Route path="/alerts/review" element={<IncidentReviewQueue />} />
          <Route path="/alerts/:alert_id/escalate" element={<IncidentEscalationPage />} />
          <Route path="/alerts/:alert_id/history" element={<IncidentAuditLogPage />} />

          {/* Module 5: Event History, Search & Playback */}
          <Route path="/events" element={<EventsArchivePage />} />
          <Route path="/events/search" element={<AdvancedVideoSearchPage />} />
          <Route path="/playback/:camera_id" element={<RecordedStreamPlayer />} />
          <Route path="/playback/clip-editor" element={<VideoClipEditorPage />} />
          <Route path="/exports" element={<ExportManagerPage />} />

          {/* Module 6: AI Models, Detection Zones & Calibration */}
          <Route path="/ai/overview" element={<AiOverviewPage />} />
          <Route path="/cameras/:camera_id/zones" element={<DetectionZoneCanvasPage />} />
          <Route path="/cameras/:camera_id/sensitivity" element={<SensitivityThresholdPage />} />
          <Route path="/cameras/:camera_id/privacy-mask" element={<PrivacyMaskingCanvasPage />} />
          <Route path="/cameras/:camera_id/calibration" element={<ThermalCalibrationPage />} />
          <Route path="/ai/models" element={<AiModelSelectorPage />} />

          {/* Module 7: Camera & Hardware Management */}
          <Route path="/cameras" element={<CameraInventoryPage />} />
          <Route path="/cameras/new" element={<AddNewCameraPage />} />
          <Route path="/cameras/:camera_id" element={<CameraDetailsPage />} />
          <Route path="/cameras/:camera_id/ptz" element={<PtzControlsConfigPage />} />
          <Route path="/cameras/:camera_id/storage" element={<RetentionSchedulePage />} />
          <Route path="/hardware/updates" element={<FirmwareUpdatesPage />} />

          {/* Module 8: Notification Rules & Integrations */}
          <Route path="/notifications/rules" element={<AlertRulesDirectoryPage />} />
          <Route path="/notifications/rules/new" element={<AlertRuleBuilderPage />} />
          <Route path="/notifications/schedules" element={<ShiftSchedulePage />} />
          <Route path="/integrations" element={<IntegrationsHubPage />} />
          <Route path="/integrations/webhooks" element={<WebhookSettingsPage />} />
          <Route path="/integrations/chat" element={<ChatBotsSetupPage />} />
          <Route path="/integrations/relays" element={<PhysicalRelaysPage />} />

          {/* Module 9: Analytics & Reporting */}
          <Route path="/analytics/overview" element={<ExecutiveAnalyticsPage />} />
          <Route path="/analytics/heatmaps" element={<HeatmapsPage />} />
          <Route path="/analytics/traffic" element={<TrafficDwellPage />} />
          <Route path="/analytics/accuracy" element={<FalseAlarmAnalysisPage />} />
          <Route path="/analytics/reports" element={<ScheduledReportsPage />} />
          <Route path="/analytics/reports/archive" element={<ReportsArchivePage />} />

          {/* Module 10: User Administration & Settings */}
          <Route path="/settings/org" element={<OrgProfilePage />} />
          <Route path="/settings/users" element={<UserDirectoryPage />} />
          <Route path="/settings/users/invite" element={<InviteUserPage />} />
          <Route path="/settings/roles" element={<RbacRolesPage />} />
          <Route path="/settings/locations" element={<LocationsManagementPage />} />
          <Route path="/settings/audit-logs" element={<AuditLogsPage />} />

          {/* Module 11: System Health & Infrastructure */}
          <Route path="/system/nodes" element={<EdgeGatewayNodesPage />} />
          <Route path="/system/storage" element={<DiskAllocationPage />} />
          <Route path="/system/network" element={<NetworkDiagnosticsPage />} />

          {/* Module 12: Billing, Subscription & Account */}
          <Route path="/billing" element={<BillingOverviewPage />} />
          <Route path="/billing/plans" element={<UpgradePlansPage />} />
          <Route path="/billing/payment-methods" element={<PaymentMethodsPage />} />
          <Route path="/billing/invoices" element={<InvoicesArchivePage />} />
          <Route path="/billing/usage" element={<UsageBreakdownPage />} />

          {/* Module 13: Support & Help Desk */}
          <Route path="/support/tickets" element={<SupportTicketsCenterPage />} />
          <Route path="/support/tickets/new" element={<CreateTicketPage />} />
          <Route path="/support/troubleshoot" element={<TroubleshootWizardPage />} />
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
