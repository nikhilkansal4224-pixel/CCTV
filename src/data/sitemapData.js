// Master Blueprint: 87 Single-Purpose Pages Across 13 Modules

export const SITEMAP_MODULES = [
  {
    id: 'public',
    name: '1. Public & Marketing Pages',
    count: 20,
    icon: 'Globe',
    description: 'Marketing, technology specs, solutions, documentation, and compliance'
  },
  {
    id: 'auth',
    name: '2. Authentication & Onboarding',
    count: 9,
    icon: 'ShieldCheck',
    description: 'Access control, 2FA security, workspace registration, and camera wizard'
  },
  {
    id: 'live',
    name: '3. Live Monitoring & Video Feed',
    count: 5,
    icon: 'Video',
    description: 'Real-time multi-grid, single stream PTZ, floorplan maps, and kiosk matrix'
  },
  {
    id: 'alerts',
    name: '4. Alert Management & Real-Time Incident Response',
    count: 5,
    icon: 'AlertTriangle',
    description: 'Live alert ticker, incident deep-dive, verification triage, and escalation'
  },
  {
    id: 'events',
    name: '5. Event History, Search & Playback',
    count: 6,
    icon: 'History',
    description: 'Detections archive, timeline player, clip editor, and public evidence share'
  },
  {
    id: 'ai',
    name: '6. AI Models, Detection Zones & Calibration',
    count: 6,
    icon: 'Cpu',
    description: 'Engine status, polygon zone drawing, sensitivity sliders, privacy masking, thermal'
  },
  {
    id: 'cameras',
    name: '7. Camera & Hardware Management',
    count: 6,
    icon: 'Camera',
    description: 'Camera inventory, ONVIF discovery wizard, PTZ presets, storage retention'
  },
  {
    id: 'notifications',
    name: '8. Notification Rules & Integrations',
    count: 7,
    icon: 'BellRing',
    description: 'IFTTT rule builder, shift schedules, webhooks, Slack/Telegram, IoT relay sirens'
  },
  {
    id: 'analytics',
    name: '9. Analytics & Reporting',
    count: 6,
    icon: 'BarChart3',
    description: 'Executive security stats, density heatmaps, traffic dwell times, automated PDFs'
  },
  {
    id: 'settings',
    name: '10. User Administration & Workspace Settings',
    count: 6,
    icon: 'Sliders',
    description: 'Workspace profile, RBAC permissions, member invites, multi-site locations, audit logs'
  },
  {
    id: 'system',
    name: '11. System Health & Infrastructure',
    count: 3,
    icon: 'Server',
    description: 'Edge gateway GPU/CPU metrics, NAS vs cloud disk allocation, bandwidth diagnostics'
  },
  {
    id: 'billing',
    name: '12. Billing, Subscription & Account Management',
    count: 5,
    icon: 'CreditCard',
    description: 'Plan tiers, stream count billing, payment cards, invoices, compute breakdown'
  },
  {
    id: 'support',
    name: '13. Support & Self-Service Help',
    count: 3,
    icon: 'HelpCircle',
    description: 'Ticket desk, issue submission with diagnostic logs, guided camera troubleshooter'
  }
];

export const SITEMAP_PAGES = [
  // 1. Public & Marketing Pages (1-20)
  {
    id: 1,
    moduleId: 'public',
    title: 'Landing Page',
    path: '/',
    navPath: '/',
    badge: 'Marketing',
    description: 'Hero section, autonomous perimeter defense pitch, key metrics, and call-to-actions.'
  },
  {
    id: 2,
    moduleId: 'public',
    title: 'Features Overview Page',
    path: '/features',
    navPath: '/features',
    badge: 'Product',
    description: 'Deep-dive into 0.08s latency, 99.4% precision, smart loitering, and multi-stream sync.'
  },
  {
    id: 3,
    moduleId: 'public',
    title: 'AI Technology Page',
    path: '/technology',
    navPath: '/technology',
    badge: 'Tech Spec',
    description: 'Technical breakdown of YOLOv9 edge models, tensor RT acceleration, and low-light enhancement.'
  },
  {
    id: 4,
    moduleId: 'public',
    title: 'Use Cases / Solutions Directory',
    path: '/solutions',
    navPath: '/solutions',
    badge: 'Solutions',
    description: 'Vertical breakdown across Retail, Construction, Residential, Logistics, and High-Sec.'
  },
  {
    id: 5,
    moduleId: 'public',
    title: 'Industry Solution Detail Page',
    path: '/solutions/:industry',
    navPath: '/solutions/construction',
    badge: 'Vertical',
    description: 'Tailored landing page specifically engineered for Construction Site Monitoring & PPE compliance.'
  },
  {
    id: 6,
    moduleId: 'public',
    title: 'Hardware Compatibility List',
    path: '/hardware',
    navPath: '/hardware',
    badge: 'Specs',
    description: 'Database of supported ONVIF Profile S/G/T IP cameras, Hikvision, Dahua, Axis, and NVRs.'
  },
  {
    id: 7,
    moduleId: 'public',
    title: 'Pricing Page',
    path: '/pricing',
    navPath: '/pricing',
    badge: 'Commercial',
    description: 'Interactive tier selector, dynamic stream-count calculator, and enterprise comparison matrix.'
  },
  {
    id: 8,
    moduleId: 'public',
    title: 'Live Demo / Interactive Sandbox',
    path: '/demo',
    navPath: '/demo',
    badge: 'Interactive',
    description: 'Public self-guided sandbox with interactive simulated feeds and real-time bounding box detection.'
  },
  {
    id: 9,
    moduleId: 'public',
    title: 'About Us Page',
    path: '/about',
    navPath: '/about',
    badge: 'Company',
    description: 'Founding mission, computer vision engineering leadership, and global perimeter intelligence vision.'
  },
  {
    id: 10,
    moduleId: 'public',
    title: 'Careers Page',
    path: '/careers',
    navPath: '/careers',
    badge: 'Hiring',
    description: 'Open engineering positions in edge ML, WebRTC streaming, and cyber-physical security systems.'
  },
  {
    id: 11,
    moduleId: 'public',
    title: 'Blog Directory',
    path: '/blog',
    navPath: '/blog',
    badge: 'Content',
    description: 'Articles on synthetic surveillance datasets, edge inference benchmarks, and zero false-alarm protocols.'
  },
  {
    id: 12,
    moduleId: 'public',
    title: 'Blog Article Page',
    path: '/blog/:slug',
    navPath: '/blog/edge-ai-vs-cloud-video-latency',
    badge: 'Article',
    description: 'Full reading experience with code snippets, latency benchmarks, and architectural blueprints.'
  },
  {
    id: 13,
    moduleId: 'public',
    title: 'Customer Case Studies',
    path: '/case-studies',
    navPath: '/case-studies',
    badge: 'Social Proof',
    description: 'Port of Antwerp and Metro Logistics cut false alarms by 97.8% and response time from 15m to 4s.'
  },
  {
    id: 14,
    moduleId: 'public',
    title: 'Documentation Hub',
    path: '/docs',
    navPath: '/docs',
    badge: 'Knowledge',
    description: 'Getting started with RTSP stream ingestion, port forwarding, edge node setup, and network configs.'
  },
  {
    id: 15,
    moduleId: 'public',
    title: 'API Reference',
    path: '/docs/api',
    navPath: '/docs/api',
    badge: 'Developers',
    description: 'REST API, Webhook signing, WebSocket telemetry feeds, and Python/Node.js SDK documentation.'
  },
  {
    id: 16,
    moduleId: 'public',
    title: 'System Status Page',
    path: '/status',
    navPath: '/status',
    badge: '99.99%',
    description: 'Live uptime status of US-East, EU-Central edge clusters, AI inference nodes, and WebSockets.'
  },
  {
    id: 17,
    moduleId: 'public',
    title: 'Contact Us Page',
    path: '/contact',
    navPath: '/contact',
    badge: 'Inquiry',
    description: 'Direct sales engineer inquiry, custom edge deployment consultation, and 24/7 hotline.'
  },
  {
    id: 18,
    moduleId: 'public',
    title: 'Privacy Policy Page',
    path: '/privacy',
    navPath: '/privacy',
    badge: 'Legal',
    description: 'Zero biometric storage guarantee, video stream encryption at rest, and data processing terms.'
  },
  {
    id: 19,
    moduleId: 'public',
    title: 'Terms of Service Page',
    path: '/terms',
    navPath: '/terms',
    badge: 'Legal',
    description: 'Service level agreements, uptime guarantees, acceptable use policies, and emergency liability.'
  },
  {
    id: 20,
    moduleId: 'public',
    title: 'GDPR / Compliance Page',
    path: '/compliance',
    navPath: '/compliance',
    badge: 'SOC2 / GDPR',
    description: 'Video retention compliance, facial privacy masking defaults, and immutable cryptographic audit trails.'
  },

  // 2. Authentication & Onboarding (21-29)
  {
    id: 21,
    moduleId: 'auth',
    title: 'Sign In Page',
    path: '/auth/login',
    navPath: '/auth/login',
    badge: 'Auth',
    description: 'Email/password and Single Sign-On (SAML Okta / Azure AD / Google Workspace) credentials.'
  },
  {
    id: 22,
    moduleId: 'auth',
    title: 'Sign Up Page',
    path: '/auth/register',
    navPath: '/auth/register',
    badge: 'Auth',
    description: 'Create security operator account with plan selection and organization domain verification.'
  },
  {
    id: 23,
    moduleId: 'auth',
    title: 'Password Reset Request',
    path: '/auth/forgot-password',
    navPath: '/auth/forgot-password',
    badge: 'Recovery',
    description: 'Initiate secure one-time password recovery link dispatched to authorized corporate email.'
  },
  {
    id: 24,
    moduleId: 'auth',
    title: 'Password Reset Confirmation',
    path: '/auth/reset-password',
    navPath: '/auth/reset-password',
    badge: 'Recovery',
    description: 'Set new high-entropy master password meeting SOC2 compliance complexity criteria.'
  },
  {
    id: 25,
    moduleId: 'auth',
    title: 'Email Verification Page',
    path: '/auth/verify-email',
    navPath: '/auth/verify-email',
    badge: 'Verify',
    description: 'Pending email token validation state with live countdown and resend confirmation dispatch.'
  },
  {
    id: 26,
    moduleId: 'auth',
    title: 'Two-Factor Auth (2FA) Verification',
    path: '/auth/2fa-verify',
    navPath: '/auth/2fa-verify',
    badge: 'MFA',
    description: 'Hardware key or Time-based One Time Password (TOTP) 6-digit challenge prompt.'
  },
  {
    id: 27,
    moduleId: 'auth',
    title: '2FA Setup Wizard',
    path: '/account/2fa-setup',
    navPath: '/account/2fa-setup',
    badge: 'Security',
    description: 'Authenticator QR code provisioner, recovery seed generation, and emergency printout.'
  },
  {
    id: 28,
    moduleId: 'auth',
    title: 'Organization Setup Wizard',
    path: '/onboarding/org',
    navPath: '/onboarding/org',
    badge: 'Setup',
    description: 'Name security operations center (SOC), define timezone, and select edge vs cloud topology.'
  },
  {
    id: 29,
    moduleId: 'auth',
    title: 'Initial Camera Setup Wizard',
    path: '/onboarding/add-first-camera',
    navPath: '/onboarding/add-first-camera',
    badge: 'Setup',
    description: 'Step-by-step auto-discovery of local IP streams, ONVIF probe, and test bounding-box verification.'
  },

  // 3. Live Monitoring & Video Feed (30-34)
  {
    id: 30,
    moduleId: 'live',
    title: 'Main Command Center / Multi-Grid Dashboard',
    path: '/dashboard',
    navPath: '/dashboard',
    badge: 'Core Hub',
    description: 'Real-time multi-grid (1x1, 2x2, 3x3, 4x4) with bounding-box streaming overlays and telemetry.'
  },
  {
    id: 31,
    moduleId: 'live',
    title: 'Single Stream View',
    path: '/live/:camera_id',
    navPath: '/live/cam-01',
    badge: 'Live',
    description: 'Expanded ultra-HD stream with 2-way audio, PTZ joystick controls, and target tracking.'
  },
  {
    id: 32,
    moduleId: 'live',
    title: 'Fullscreen Matrix View',
    path: '/live/kiosk',
    navPath: '/live/kiosk',
    badge: 'Kiosk',
    description: 'Distraction-free high-density kiosk layout engineered for 24/7 security wall displays.'
  },
  {
    id: 33,
    moduleId: 'live',
    title: 'Map / Floorplan Dashboard',
    path: '/live/map',
    navPath: '/live/map',
    badge: 'Geo/Floor',
    description: 'Interactive architectural blueprint & satellite map showing camera field-of-views and active breaches.'
  },
  {
    id: 34,
    moduleId: 'live',
    title: 'Custom Layout Manager',
    path: '/dashboard/layouts',
    navPath: '/dashboard/layouts',
    badge: 'Layouts',
    description: 'Save and cycle custom camera grid presets (e.g. "Gate Entrances", "Perimeter Fence", "Loading Docks").'
  },

  // 4. Alert Management & Real-Time Incident Response (35-39)
  {
    id: 35,
    moduleId: 'alerts',
    title: 'Live Alert Queue',
    path: '/alerts/live',
    navPath: '/alerts/live',
    badge: 'Ticker',
    description: 'Sub-second incoming real-time human detection events with audio sirens and priority sorting.'
  },
  {
    id: 36,
    moduleId: 'alerts',
    title: 'Incident Details Page',
    path: '/alerts/:alert_id',
    navPath: '/alerts/alt-101',
    badge: 'Deep Dive',
    description: 'High-res snapshot, 10s pre/post event video buffer, metadata, and YOLO confidence breakdown.'
  },
  {
    id: 37,
    moduleId: 'alerts',
    title: 'Incident Verification / Review Queue',
    path: '/alerts/review',
    navPath: '/alerts/review',
    badge: 'Triage',
    description: 'Human-in-the-loop rapid-fire verification queue to classify alerts as "True Positive" or "False Alarm".'
  },
  {
    id: 38,
    moduleId: 'alerts',
    title: 'Incident Escalation Page',
    path: '/alerts/:alert_id/escalate',
    navPath: '/alerts/alt-101/escalate',
    badge: 'Dispatch',
    description: 'Direct response console: trigger strobe sirens, dispatch local security guards, or alert emergency 911.'
  },
  {
    id: 39,
    moduleId: 'alerts',
    title: 'Incident Commenting & Audit Log',
    path: '/alerts/:alert_id/history',
    navPath: '/alerts/alt-101/history',
    badge: 'Audit',
    description: 'Tamper-proof operator activity timeline, investigation notes, and timestamps for legal chain-of-custody.'
  },

  // 5. Event History, Search & Playback (40-45)
  {
    id: 40,
    moduleId: 'events',
    title: 'Detection Events Archive',
    path: '/events',
    navPath: '/events',
    badge: 'Archive',
    description: 'Filterable archive of all historical human detections with thumbnails and risk scores.'
  },
  {
    id: 41,
    moduleId: 'events',
    title: 'Advanced Video Search',
    path: '/events/search',
    navPath: '/events/search',
    badge: 'AI Search',
    description: 'Query detections by clothing color (red hoodie), vector direction, dwell time, and camera zones.'
  },
  {
    id: 42,
    moduleId: 'events',
    title: 'Recorded Stream Player',
    path: '/playback/:camera_id',
    navPath: '/playback/cam-01',
    badge: '24/7 NVR',
    description: 'Continuous 24/7 scrubbable timeline with color-coded incident markers, speed controls, and frame stepping.'
  },
  {
    id: 43,
    moduleId: 'events',
    title: 'Video Clipping Tool',
    path: '/playback/clip-editor',
    navPath: '/playback/clip-editor',
    badge: 'Editor',
    description: 'Interactive video timeline cutter to crop, trim, stitch multi-angle feeds, and prepare evidence packs.'
  },
  {
    id: 44,
    moduleId: 'events',
    title: 'Export Manager',
    path: '/exports',
    navPath: '/exports',
    badge: 'Exports',
    description: 'Cryptographically watermarked MP4 exports, SHA256 integrity checksums, and cloud expiring links.'
  },
  {
    id: 45,
    moduleId: 'events',
    title: 'Public Evidence Share Page',
    path: '/share/:token',
    navPath: '/share/ev-99824',
    badge: 'Share',
    description: 'Password-authenticated, time-restricted public portal to share verified incident evidence with police.'
  },

  // 6. AI Models, Detection Zones & Calibration (46-51)
  {
    id: 46,
    moduleId: 'ai',
    title: 'AI Detection Engine Overview',
    path: '/ai/overview',
    navPath: '/ai/overview',
    badge: 'Engines',
    description: 'Real-time telemetry on inference engines: FPS, latency (42ms), GPU utilization, and throughput.'
  },
  {
    id: 47,
    moduleId: 'ai',
    title: 'Detection Zone Drawing Canvas',
    path: '/cameras/:camera_id/zones',
    navPath: '/cameras/cam-01/zones',
    badge: 'Zones',
    description: 'Interactive polygon canvas to define inclusion zones, tripwires, and restricted perimeter boundaries.'
  },
  {
    id: 48,
    moduleId: 'ai',
    title: 'Object Filtering & Threshold Settings',
    path: '/cameras/:camera_id/sensitivity',
    navPath: '/cameras/cam-01/sensitivity',
    badge: 'Tuning',
    description: 'Fine-tune minimum human bounding-box size, confidence cutoffs (85%), and loitering dwell thresholds.'
  },
  {
    id: 49,
    moduleId: 'ai',
    title: 'Privacy Masking Canvas',
    path: '/cameras/:camera_id/privacy-mask',
    navPath: '/cameras/cam-01/privacy-mask',
    badge: 'Privacy',
    description: 'Brush and block out sensitive regions (e.g. neighboring residences, locker rooms) at source encoder.'
  },
  {
    id: 50,
    moduleId: 'ai',
    title: 'Night Vision / Thermal Calibration',
    path: '/cameras/:camera_id/calibration',
    navPath: '/cameras/cam-01/calibration',
    badge: 'Infrared',
    description: 'Contrast enhancement, infrared noise filtering, and thermal heat map calibration for zero-light sites.'
  },
  {
    id: 51,
    moduleId: 'ai',
    title: 'AI Model Selector',
    path: '/ai/models',
    navPath: '/ai/models',
    badge: 'Models',
    description: 'Toggle specialized neural nets: Human Detection, Vehicle Classifier, Loitering, Weapon, PPE Hardhats.'
  },

  // 7. Camera & Hardware Management (52-57)
  {
    id: 52,
    moduleId: 'cameras',
    title: 'Camera Inventory List',
    path: '/cameras',
    navPath: '/cameras',
    badge: 'Devices',
    description: 'Master fleet table: IP addresses, ONVIF ports, RTSP endpoints, signal health, and firmware versions.'
  },
  {
    id: 53,
    moduleId: 'cameras',
    title: 'Add New Camera Page',
    path: '/cameras/new',
    navPath: '/cameras/new',
    badge: 'Wizard',
    description: 'Auto-scan local subnet, test RTSP authentication credentials, and assign initial AI inference stream.'
  },
  {
    id: 54,
    moduleId: 'cameras',
    title: 'Camera Details & Metrics',
    path: '/cameras/:camera_id',
    navPath: '/cameras/cam-01',
    badge: 'Telemetry',
    description: 'Stream health diagnostics, dropped packet graphs, real-time FPS, resolution, and uptime history.'
  },
  {
    id: 55,
    moduleId: 'cameras',
    title: 'PTZ Controls Config',
    path: '/cameras/:camera_id/ptz',
    navPath: '/cameras/cam-01/ptz',
    badge: 'PTZ',
    description: 'Set home positions, save 12-point presets, and program automated guard tour patrol routines.'
  },
  {
    id: 56,
    moduleId: 'cameras',
    title: 'Recording & Retention Schedule',
    path: '/cameras/:camera_id/storage',
    navPath: '/cameras/cam-01/storage',
    badge: 'Storage',
    description: 'Configure local NAS vs cloud storage rules, motion-triggered vs continuous recording, and retention days.'
  },
  {
    id: 57,
    moduleId: 'cameras',
    title: 'Firmware & Edge Node Updates',
    path: '/hardware/updates',
    navPath: '/hardware/updates',
    badge: 'OTA',
    description: 'Over-the-air firmware updates for IP cameras and Docker container upgrades for edge AI gateways.'
  },

  // 8. Notification Rules & Integrations (58-64)
  {
    id: 58,
    moduleId: 'notifications',
    title: 'Alert Rules Directory',
    path: '/notifications/rules',
    navPath: '/notifications/rules',
    badge: 'Automation',
    description: 'Active automation logic matrix with priority sorting, trigger counters, and toggle switches.'
  },
  {
    id: 59,
    moduleId: 'notifications',
    title: 'Alert Rule Builder',
    path: '/notifications/rules/new',
    navPath: '/notifications/rules/new',
    badge: 'IFTTT',
    description: 'Visual "IF-THIS-THEN-THAT" workflow builder: If human detected on North Fence after 10PM, sound strobe.'
  },
  {
    id: 60,
    moduleId: 'notifications',
    title: 'Schedule & Shift Management',
    path: '/notifications/schedules',
    navPath: '/notifications/schedules',
    badge: 'Shifts',
    description: 'Calendar view of guard shifts, armed vs disarmed hours, and weekend escalation routings.'
  },
  {
    id: 61,
    moduleId: 'notifications',
    title: 'Third-Party Integration Hub',
    path: '/integrations',
    navPath: '/integrations',
    badge: 'Connectors',
    description: 'Turnkey connections to Slack, Discord, Telegram, Microsoft Teams, PagerDuty, and SIEM Splunk.'
  },
  {
    id: 62,
    moduleId: 'notifications',
    title: 'Webhook Settings',
    path: '/integrations/webhooks',
    navPath: '/integrations/webhooks',
    badge: 'Webhooks',
    description: 'Configure HMAC SHA256 secret keys, custom JSON payload formats, retry policies, and delivery logs.'
  },
  {
    id: 63,
    moduleId: 'notifications',
    title: 'Slack / Telegram Bot Setup',
    path: '/integrations/chat',
    navPath: '/integrations/chat',
    badge: 'Bots',
    description: 'Bot token configuration, channel routing, and automated snapshot image delivery tests.'
  },
  {
    id: 64,
    moduleId: 'notifications',
    title: 'Physical Alarm System Integrations',
    path: '/integrations/relays',
    navPath: '/integrations/relays',
    badge: 'IoT / Relays',
    description: 'Hardware GPIO relays, smart strobe lights, IP megaphone audio deterrents, and electric gate interlocks.'
  },

  // 9. Analytics & Reporting (65-70)
  {
    id: 65,
    moduleId: 'analytics',
    title: 'Executive Security Dashboard',
    path: '/analytics/overview',
    navPath: '/analytics/overview',
    badge: 'Executive',
    description: 'C-level overview: Total incidents, average resolution time (4.2m), false alarm rate (0.4%), risk score.'
  },
  {
    id: 66,
    moduleId: 'analytics',
    title: 'Foot Traffic & Heatmaps',
    path: '/analytics/heatmaps',
    navPath: '/analytics/heatmaps',
    badge: 'Heatmaps',
    description: 'Color-coded spatial density heatmaps highlighting persistent human activity zones over 24h/7d.'
  },
  {
    id: 67,
    moduleId: 'analytics',
    title: 'Peak Hours & Dwell Time Analytics',
    path: '/analytics/traffic',
    navPath: '/analytics/traffic',
    badge: 'Traffic',
    description: 'Hourly histogram breakdown of human presence, median loitering duration, and zone ingress/egress rates.'
  },
  {
    id: 68,
    moduleId: 'analytics',
    title: 'False Alarm Analysis',
    path: '/analytics/accuracy',
    navPath: '/analytics/accuracy',
    badge: 'Precision',
    description: 'AI model precision metrics: analysis of environmental triggers (shadows, spiders, headlights) vs real breaches.'
  },
  {
    id: 69,
    moduleId: 'analytics',
    title: 'Scheduled Reports Setup',
    path: '/analytics/reports',
    navPath: '/analytics/reports',
    badge: 'Scheduler',
    description: 'Automate weekly PDF incident digests sent to facility managers, insurance underwriters, and compliance.'
  },
  {
    id: 70,
    moduleId: 'analytics',
    title: 'Generated Reports Library',
    path: '/analytics/reports/archive',
    navPath: '/analytics/reports/archive',
    badge: 'Archive',
    description: 'Download historical daily, weekly, and monthly forensic security reports in PDF and CSV format.'
  },

  // 10. User Administration & Workspace Settings (71-76)
  {
    id: 71,
    moduleId: 'settings',
    title: 'Organization Profile',
    path: '/settings/org',
    navPath: '/settings/org',
    badge: 'Profile',
    description: 'Manage workspace identity, company logo, primary SOC address, and default regional timezones.'
  },
  {
    id: 72,
    moduleId: 'settings',
    title: 'User Management Directory',
    path: '/settings/users',
    navPath: '/settings/users',
    badge: 'Users',
    description: 'Security operator directory: assigned roles, active sessions, 2FA status, and quick revocation.'
  },
  {
    id: 73,
    moduleId: 'settings',
    title: 'Invite User Page',
    path: '/settings/users/invite',
    navPath: '/settings/users/invite',
    badge: 'Invite',
    description: 'Dispatch secure invitation links with pre-configured camera scope permissions and role bounds.'
  },
  {
    id: 74,
    moduleId: 'settings',
    title: 'Roles & Permissions (RBAC)',
    path: '/settings/roles',
    navPath: '/settings/roles',
    badge: 'RBAC',
    description: 'Granular permissions matrix for Super Admin, SOC Operator, Guard Patrol, and Read-Only Auditor.'
  },
  {
    id: 75,
    moduleId: 'settings',
    title: 'Sites & Locations Management',
    path: '/settings/locations',
    navPath: '/settings/locations',
    badge: 'Multi-Site',
    description: 'Multi-tenant site hierarchy: group cameras by physical campus, facility, building, and floor.'
  },
  {
    id: 76,
    moduleId: 'settings',
    title: 'System Audit Logs',
    path: '/settings/audit-logs',
    navPath: '/settings/audit-logs',
    badge: 'Audit Trail',
    description: 'Cryptographically chained log of every operator login, PTZ manipulation, stream view, and export action.'
  },

  // 11. System Health & Infrastructure (77-79)
  {
    id: 77,
    moduleId: 'system',
    title: 'Edge Gateway Status',
    path: '/system/nodes',
    navPath: '/system/nodes',
    badge: 'Edge Nodes',
    description: 'Hardware monitoring for local Jetson/x86 nodes: NVIDIA GPU load (62%), temperature (54°C), RAM, and FPS.'
  },
  {
    id: 78,
    moduleId: 'system',
    title: 'Storage & Disk Allocation',
    path: '/system/storage',
    navPath: '/system/storage',
    badge: 'Disks',
    description: 'Breakdown of local RAID array vs AWS S3 archive: 82% utilized, automatic FIFO purging threshold.'
  },
  {
    id: 79,
    moduleId: 'system',
    title: 'Bandwidth & Streaming Diagnostics',
    path: '/system/network',
    navPath: '/system/network',
    badge: 'Network',
    description: 'Real-time telemetry: 148 Mbps uplink, packet jitter (4ms), WebRTC round-trip latency, and frame loss.'
  },

  // 12. Billing, Subscription & Account Management (80-84)
  {
    id: 80,
    moduleId: 'billing',
    title: 'Plan & Subscription Overview',
    path: '/billing',
    navPath: '/billing',
    badge: 'Tier',
    description: 'Enterprise Fortress tier: 32 active AI camera licenses, 30-day cloud retention, renewal on Nov 1st.'
  },
  {
    id: 81,
    moduleId: 'billing',
    title: 'Change / Upgrade Plan',
    path: '/billing/plans',
    navPath: '/billing/plans',
    badge: 'Upgrades',
    description: 'Compare Starter, Professional, and Enterprise Fortress packages with real-time stream quota scaling.'
  },
  {
    id: 82,
    moduleId: 'billing',
    title: 'Payment Methods Management',
    path: '/billing/payment-methods',
    navPath: '/billing/payment-methods',
    badge: 'Cards',
    description: 'Manage corporate corporate Visa/Mastercard, wire transfer configurations, and backup billing contacts.'
  },
  {
    id: 83,
    moduleId: 'billing',
    title: 'Invoices & Receipts Archive',
    path: '/billing/invoices',
    navPath: '/billing/invoices',
    badge: 'Invoices',
    description: 'Itemized monthly statements with downloadable PDF receipts and tax breakdown for accounting.'
  },
  {
    id: 84,
    moduleId: 'billing',
    title: 'Usage Breakdown',
    path: '/billing/usage',
    navPath: '/billing/usage',
    badge: 'Meters',
    description: 'Transparent telemetry on edge GPU compute hours, video transcoding storage, and API webhook calls.'
  },

  // 13. Support & Self-Service Help (85-87)
  {
    id: 85,
    moduleId: 'support',
    title: 'Support Ticket Center',
    path: '/support/tickets',
    navPath: '/support/tickets',
    badge: 'Help Desk',
    description: 'Track open and resolved technical tickets with SLA countdowns and dedicated solutions engineers.'
  },
  {
    id: 86,
    moduleId: 'support',
    title: 'Create Support Ticket',
    path: '/support/tickets/new',
    navPath: '/support/tickets/new',
    badge: 'New Ticket',
    description: 'Submit an issue with automatic edge diagnostics capture, camera stream logs, and severity tags.'
  },
  {
    id: 87,
    moduleId: 'support',
    title: 'Interactive Troubleshooting Wizard',
    path: '/support/troubleshoot',
    navPath: '/support/troubleshoot',
    badge: 'Self-Fix',
    description: 'Step-by-step diagnostic engine for stream drops, ONVIF authentication failures, and latency spikes.'
  }
];
