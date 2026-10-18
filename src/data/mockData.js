// Comprehensive Realistic CCTV & Perimeter Surveillance Mock State

export const MOCK_CAMERAS = [
  {
    id: 'cam-01',
    name: 'North Perimeter Fence - Cam 01',
    location: 'Perimeter Boundary A',
    ip: '192.168.1.101',
    rtsp: 'rtsp://admin:••••••@192.168.1.101:554/live/ch0',
    model: 'Hikvision DS-2CD2386G2-ISU',
    resolution: '4K (3840x2160)',
    fps: 30,
    bitrate: '4.8 Mbps',
    latency: '42 ms',
    status: 'alert', // 'online', 'alert', 'recording', 'offline'
    ptzSupported: true,
    audioSupported: true,
    aiModel: 'Perimeter Breach & Intrusion',
    confidenceThreshold: 88,
    minTargetSize: 45,
    dwellTimeSec: 5,
    nightMode: 'Infrared Smart-IR',
    storageRetentionDays: 30,
    activeThreats: 1,
    floorplanCoordinates: { x: 28, y: 18 }
  },
  {
    id: 'cam-02',
    name: 'Main Gate Vehicle & Pedestrian Ingress',
    location: 'Gate 1 Entrance',
    ip: '192.168.1.102',
    rtsp: 'rtsp://admin:••••••@192.168.1.102:554/live/ch0',
    model: 'Axis Q3538-LVE',
    resolution: '4K (3840x2160)',
    fps: 30,
    bitrate: '5.2 Mbps',
    latency: '38 ms',
    status: 'online',
    ptzSupported: true,
    audioSupported: true,
    aiModel: 'Vehicle ANPR & Human Presence',
    confidenceThreshold: 85,
    minTargetSize: 40,
    dwellTimeSec: 3,
    nightMode: 'Color at Night (Lightfinder)',
    storageRetentionDays: 45,
    activeThreats: 0,
    floorplanCoordinates: { x: 50, y: 85 }
  },
  {
    id: 'cam-03',
    name: 'Loading Bay Logistics Dock 3',
    location: 'Warehouse District',
    ip: '192.168.1.103',
    rtsp: 'rtsp://admin:••••••@192.168.1.103:554/live/ch0',
    model: 'Dahua IPC-HDBW5842R-ASE-S2',
    resolution: '1080p (1920x1080)',
    fps: 25,
    bitrate: '3.4 Mbps',
    latency: '45 ms',
    status: 'alert',
    ptzSupported: false,
    audioSupported: false,
    aiModel: 'Loitering & Unattended Object',
    confidenceThreshold: 90,
    minTargetSize: 50,
    dwellTimeSec: 15,
    nightMode: 'Active Deterrence Strobe',
    storageRetentionDays: 30,
    activeThreats: 1,
    floorplanCoordinates: { x: 74, y: 45 }
  },
  {
    id: 'cam-04',
    name: 'Server Vault & High-Sec Corridor 104',
    location: 'Datacenter Wing B',
    ip: '192.168.1.104',
    rtsp: 'rtsp://admin:••••••@192.168.1.104:554/live/ch0',
    model: 'Hanwha Techwin XNV-8080R',
    resolution: '4K (3840x2160)',
    fps: 30,
    bitrate: '6.1 Mbps',
    latency: '29 ms',
    status: 'online',
    ptzSupported: true,
    audioSupported: true,
    aiModel: 'Facial Match & Tailgating',
    confidenceThreshold: 94,
    minTargetSize: 35,
    dwellTimeSec: 2,
    nightMode: 'Low-lux Monochrome',
    storageRetentionDays: 90,
    activeThreats: 0,
    floorplanCoordinates: { x: 42, y: 55 }
  },
  {
    id: 'cam-05',
    name: 'West Employee Parking & EV Bays',
    location: 'Outdoor Zone W',
    ip: '192.168.1.105',
    rtsp: 'rtsp://admin:••••••@192.168.1.105:554/live/ch0',
    model: 'Uniview IPC3238SR3-DVPZ',
    resolution: '1080p (1920x1080)',
    fps: 30,
    bitrate: '3.8 Mbps',
    latency: '51 ms',
    status: 'online',
    ptzSupported: false,
    audioSupported: false,
    aiModel: 'Suspicious Loitering',
    confidenceThreshold: 82,
    minTargetSize: 50,
    dwellTimeSec: 60,
    nightMode: 'Smart IR 50m',
    storageRetentionDays: 30,
    activeThreats: 0,
    floorplanCoordinates: { x: 15, y: 65 }
  },
  {
    id: 'cam-06',
    name: 'Rooftop Helipad & HVAC Perimeter',
    location: 'Building Top Tier',
    ip: '192.168.1.106',
    rtsp: 'rtsp://admin:••••••@192.168.1.106:554/live/ch0',
    model: 'Bosch MIC IP starlight 7100i',
    resolution: '1080p (1920x1080)',
    fps: 60,
    bitrate: '7.5 Mbps',
    latency: '34 ms',
    status: 'online',
    ptzSupported: true,
    audioSupported: true,
    aiModel: 'Restricted Rooftop Zone Incursion',
    confidenceThreshold: 92,
    minTargetSize: 45,
    dwellTimeSec: 3,
    nightMode: 'Thermal / Starlight dual-sensor',
    storageRetentionDays: 60,
    activeThreats: 0,
    floorplanCoordinates: { x: 50, y: 20 }
  },
  {
    id: 'cam-07',
    name: 'Zone B Active Construction Site',
    location: 'Sector 4 Hardhat Zone',
    ip: '192.168.1.107',
    rtsp: 'rtsp://admin:••••••@192.168.1.107:554/live/ch0',
    model: 'Mobotix M73 AllroundDual',
    resolution: '4K (3840x2160)',
    fps: 25,
    bitrate: '4.4 Mbps',
    latency: '62 ms',
    status: 'alert',
    ptzSupported: false,
    audioSupported: true,
    aiModel: 'PPE Compliance & Danger Zone Ingress',
    confidenceThreshold: 86,
    minTargetSize: 50,
    dwellTimeSec: 1,
    nightMode: 'Monochrome Floodlit',
    storageRetentionDays: 30,
    activeThreats: 1,
    floorplanCoordinates: { x: 88, y: 80 }
  },
  {
    id: 'cam-08',
    name: 'Emergency Stairwell & Exit B-2',
    location: 'Fire Corridor South',
    ip: '192.168.1.108',
    rtsp: 'rtsp://admin:••••••@192.168.1.108:554/live/ch0',
    model: 'Axis M3077-PLVE 360°',
    resolution: '6MP 360 Panoramic',
    fps: 25,
    bitrate: '3.9 Mbps',
    latency: '40 ms',
    status: 'online',
    ptzSupported: false,
    audioSupported: true,
    aiModel: 'Door Propped & Human Ingress',
    confidenceThreshold: 89,
    minTargetSize: 30,
    dwellTimeSec: 10,
    nightMode: 'Optimized IR 360',
    storageRetentionDays: 30,
    activeThreats: 0,
    floorplanCoordinates: { x: 35, y: 82 }
  }
];

export const MOCK_ALERTS = [
  {
    id: 'alt-101',
    cameraId: 'cam-01',
    cameraName: 'North Perimeter Fence - Cam 01',
    type: 'Perimeter Fence Climbing Breach',
    severity: 'critical', // 'critical', 'high', 'medium', 'low'
    confidence: 98.4,
    timestamp: '2 mins ago (11:27:14)',
    status: 'Pending Review', // 'Pending Review', 'True Positive', 'False Alarm', 'Escalated'
    location: 'Perimeter Boundary A - Sector 3',
    subjectCount: 1,
    attributes: {
      clothing: 'Dark hooded jacket, dark jeans',
      direction: 'Southbound climbing inward',
      speed: 'Rapid (1.8 m/s)',
      dwellTime: '12 seconds'
    },
    snapshotNote: 'Human target crossed outer virtual tripwire and scaled chainlink barrier.',
    dispatchStatus: 'Guards Notified'
  },
  {
    id: 'alt-102',
    cameraId: 'cam-03',
    cameraName: 'Loading Bay Logistics Dock 3',
    type: 'Suspicious Loitering Near Cargo',
    severity: 'high',
    confidence: 94.2,
    timestamp: '9 mins ago (11:20:42)',
    status: 'Pending Review',
    location: 'Warehouse District - Dock 3',
    subjectCount: 1,
    attributes: {
      clothing: 'Grey sweater, backpack',
      direction: 'Stationary behind trailer',
      speed: 'Static (0.1 m/s)',
      dwellTime: '4m 15s'
    },
    snapshotNote: 'Subject loitering inside restricted staging bay without logistics manifest.',
    dispatchStatus: 'Pending Operator Triage'
  },
  {
    id: 'alt-103',
    cameraId: 'cam-07',
    cameraName: 'Zone B Active Construction Site',
    type: 'Missing PPE (Hardhat / Vest Violation)',
    severity: 'medium',
    confidence: 91.8,
    timestamp: '24 mins ago (11:05:12)',
    status: 'True Positive',
    location: 'Sector 4 Excavation Zone',
    subjectCount: 2,
    attributes: {
      clothing: 'Civilian attire, no safety vest',
      direction: 'Entering crane swing perimeter',
      speed: 'Walking',
      dwellTime: '45 seconds'
    },
    snapshotNote: 'Subcontractor entered crane drop zone without required high-visibility gear.',
    dispatchStatus: 'Safety Officer Dispatched'
  },
  {
    id: 'alt-104',
    cameraId: 'cam-02',
    cameraName: 'Main Gate Vehicle & Pedestrian Ingress',
    type: 'Vehicle Tailgating Ingress Barrier',
    severity: 'high',
    confidence: 96.1,
    timestamp: '1 hour ago (10:28:19)',
    status: 'True Positive',
    location: 'Gate 1 Entrance',
    subjectCount: 1,
    attributes: {
      clothing: 'Silver Sedan behind Delivery Truck',
      direction: 'Follow-through before barrier drop',
      speed: 'Moderate',
      dwellTime: '4 seconds'
    },
    snapshotNote: 'Unauthorized silver sedan bypassed credential badge reader behind FedEx van.',
    dispatchStatus: 'Barrier Locked Down'
  },
  {
    id: 'alt-105',
    cameraId: 'cam-05',
    cameraName: 'West Employee Parking & EV Bays',
    type: 'Tree Branch Motion Trigger',
    severity: 'low',
    confidence: 52.3,
    timestamp: '3 hours ago (08:15:33)',
    status: 'False Alarm',
    location: 'Outdoor Zone W',
    subjectCount: 0,
    attributes: {
      clothing: 'Foliage wind gust',
      direction: 'Oscillating',
      speed: 'Variable',
      dwellTime: '18 seconds'
    },
    snapshotNote: 'High winds caused pine tree branch to simulate human bounding volume.',
    dispatchStatus: 'Auto-filtered'
  }
];

export const MOCK_EDGE_NODES = [
  {
    id: 'node-alpha',
    name: 'SOC Edge Gateway Alpha (US-East)',
    hardware: 'Dual NVIDIA Jetson AGX Orin 64GB',
    ip: '10.0.10.15',
    streamsProcessing: 4,
    gpuUtil: 64,
    cpuUtil: 41,
    ramUtil: 52,
    tempC: 53,
    fpsThroughput: 120,
    latency: '18 ms',
    uptime: '49 days 12h',
    status: 'healthy'
  },
  {
    id: 'node-beta',
    name: 'Industrial Facility Gateway Beta',
    hardware: 'Custom 2U Xeon Silver + RTX 4090 24GB',
    ip: '10.0.20.18',
    streamsProcessing: 4,
    gpuUtil: 78,
    cpuUtil: 55,
    ramUtil: 67,
    tempC: 61,
    fpsThroughput: 110,
    latency: '24 ms',
    uptime: '112 days 4h',
    status: 'healthy'
  },
  {
    id: 'node-backup',
    name: 'Failover Standby Node Gamma',
    hardware: 'Jetson Orin Nano 8GB',
    ip: '10.0.30.99',
    streamsProcessing: 0,
    gpuUtil: 4,
    cpuUtil: 8,
    ramUtil: 18,
    tempC: 38,
    fpsThroughput: 0,
    latency: '12 ms',
    uptime: '204 days',
    status: 'standby'
  }
];

export const MOCK_USERS = [
  {
    id: 'usr-1',
    name: 'Major Sarah Vance (Ret.)',
    email: 's.vance@aegis-security.io',
    role: 'Super Administrator / SOC Chief',
    mfaEnabled: true,
    lastActive: 'Active Now',
    status: 'active'
  },
  {
    id: 'usr-2',
    name: 'Marcus Brody',
    email: 'm.brody@aegis-security.io',
    role: 'Senior Surveillance Operator',
    mfaEnabled: true,
    lastActive: '5 mins ago',
    status: 'active'
  },
  {
    id: 'usr-3',
    name: 'Elena Rostova',
    email: 'e.rostova@aegis-security.io',
    role: 'Tactical Incident Dispatcher',
    mfaEnabled: true,
    lastActive: '18 mins ago',
    status: 'active'
  },
  {
    id: 'usr-4',
    name: 'David Chen',
    email: 'd.chen@compliance-audit.org',
    role: 'Read-Only Compliance Auditor',
    mfaEnabled: false,
    lastActive: 'Yesterday',
    status: 'pending-mfa'
  }
];

export const MOCK_RULES = [
  {
    id: 'rule-1',
    name: 'Nighttime Perimeter Breach Alert (10 PM - 6 AM)',
    trigger: 'Human Detected in Polygon Zone "North Fence Exclusion"',
    condition: 'Time between 22:00 and 06:00 AND Confidence > 85%',
    actions: ['Trigger IP Strobe Siren (Relay #1)', 'Send SMS to On-Duty Guard', 'Dispatch High-Priority Push Notification'],
    enabled: true,
    executions24h: 3
  },
  {
    id: 'rule-2',
    name: 'Loading Dock Loitering Timeout (> 3 mins)',
    trigger: 'Subject stationary in Dock 3 for > 180 seconds',
    condition: 'Unscheduled after business hours',
    actions: ['Audio Warning: "Restricted Area"', 'Post Snapshot to #security-dispatch Slack'],
    enabled: true,
    executions24h: 7
  },
  {
    id: 'rule-3',
    name: 'PPE Hardhat Violation Alert',
    trigger: 'Worker missing hardhat inside Sector 4 polygon',
    condition: 'During active site crane operation hours',
    actions: ['Log Compliance Event', 'Alert Site Safety Officer via Telegram'],
    enabled: true,
    executions24h: 12
  }
];

export const MOCK_TICKETS = [
  {
    id: 'tkt-8821',
    subject: 'RTSP Stream Packet Drops on Camera 07 (Zone B)',
    severity: 'High',
    status: 'In Progress',
    assignedTo: 'Lead Network Engineer',
    createdAt: 'Oct 17, 2026',
    slaTimeRemaining: '3h 15m'
  },
  {
    id: 'tkt-8819',
    subject: 'Thermal Calibration Optimization for Cam 06 Rooftop',
    severity: 'Normal',
    status: 'Resolved',
    assignedTo: 'Computer Vision Specialist',
    createdAt: 'Oct 15, 2026',
    slaTimeRemaining: 'Completed'
  }
];
