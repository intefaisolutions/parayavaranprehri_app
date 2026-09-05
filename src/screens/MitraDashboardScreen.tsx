import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import AppIcon from '../components/AppIcon';
import { getBottomInset, getTopInset } from '../utils/layout';
import {
  API_BASE_URL,
  ApiError,
  certificatesService,
  fieldIssuesService,
  getStoredMitraId,
  leaderboardService,
  maintenanceLogsService,
  mitraEventsService,
  mitrasService,
  notificationsService,
  reportsService,
  tasksService,
  treesService,
  unwrapList,
  uploadsService,
  type MitraEventApi,
  type TaskItem,
} from '../api';

const { width } = Dimensions.get('window');

type PickedPhoto = { uri: string; name: string; type: string };

async function ensureCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
    {
      title: 'Camera permission',
      message: 'Allow camera to capture tree photos',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

async function pickMedia(): Promise<PickedPhoto | null> {
  return new Promise(resolve => {
    Alert.alert('Attach Media', 'Choose source', [
      {
        text: 'Camera (Photo)',
        onPress: () => {
          void (async () => {
            const ok = await ensureCameraPermission();
            if (!ok) {
              Alert.alert('Permission needed', 'Camera permission is required.');
              resolve(null);
              return;
            }
            const result = await launchCamera({
              mediaType: 'photo',
              quality: 0.8,
              saveToPhotos: false,
            });
            const asset = result.assets?.[0];
            if (result.didCancel || !asset?.uri) { resolve(null); return; }
            resolve({ uri: asset.uri, name: asset.fileName || `media-${Date.now()}.jpg`, type: asset.type || 'image/jpeg' });
          })();
        },
      },
      {
        text: 'Camera (Video)',
        onPress: () => {
          void (async () => {
            const ok = await ensureCameraPermission();
            if (!ok) {
              Alert.alert('Permission needed', 'Camera permission is required.');
              resolve(null);
              return;
            }
            const result = await launchCamera({
              mediaType: 'video',
              videoQuality: 'low',
              saveToPhotos: false,
            });
            const asset = result.assets?.[0];
            if (result.didCancel || !asset?.uri) { resolve(null); return; }
            resolve({ uri: asset.uri, name: asset.fileName || `media-${Date.now()}.mp4`, type: asset.type || 'video/mp4' });
          })();
        },
      },
      {
        text: 'Gallery (Any)',
        onPress: () => {
          void (async () => {
            const result = await launchImageLibrary({
              mediaType: 'mixed',
              quality: 0.8,
              selectionLimit: 1,
            });
            const asset = result.assets?.[0];
            if (result.didCancel || !asset?.uri) { resolve(null); return; }
            resolve({ uri: asset.uri, name: asset.fileName || `media-${Date.now()}`, type: asset.type || 'application/octet-stream' });
          })();
        },
      },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}

async function pickMaintenancePhoto(): Promise<PickedPhoto | null> {
  return new Promise(resolve => {
    Alert.alert('Photo', 'Choose image source', [
      {
        text: 'Camera',
        onPress: () => {
          void (async () => {
            const ok = await ensureCameraPermission();
            if (!ok) {
              Alert.alert('Permission needed', 'Camera permission is required.');
              resolve(null);
              return;
            }
            const result = await launchCamera({
              mediaType: 'photo',
              quality: 0.8,
              saveToPhotos: false,
            });
            const asset = result.assets?.[0];
            if (result.didCancel || !asset?.uri) {
              resolve(null);
              return;
            }
            resolve({
              uri: asset.uri,
              name: asset.fileName || `maintenance-${Date.now()}.jpg`,
              type: asset.type || 'image/jpeg',
            });
          })();
        },
      },
      {
        text: 'Gallery',
        onPress: () => {
          void (async () => {
            const result = await launchImageLibrary({
              mediaType: 'photo',
              quality: 0.8,
              selectionLimit: 1,
            });
            const asset = result.assets?.[0];
            if (result.didCancel || !asset?.uri) {
              resolve(null);
              return;
            }
            resolve({
              uri: asset.uri,
              name: asset.fileName || `maintenance-${Date.now()}.jpg`,
              type: asset.type || 'image/jpeg',
            });
          })();
        },
      },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}

const TABS = ['Overview', 'Tasks', 'Maintenance', 'Issues', 'Events', 'Leaderboard', 'Certificates'];

function priorityStyle(priority?: string) {
  const p = (priority || 'Medium').toLowerCase();
  if (p === 'high') return { priorityBg: '#ffedd5', priorityColor: '#ea580c' };
  if (p === 'low') return { priorityBg: '#dcfce7', priorityColor: '#059669' };
  return { priorityBg: '#fef08a', priorityColor: '#a16207' };
}

function mapTaskStatus(status?: string) {
  if (status === 'Completed') return 'completed';
  if (status === 'In Progress') return 'progress';
  return 'pending';
}

function taskProgressFromStatus(status?: string) {
  if (status === 'Completed') return 100;
  if (status === 'In Progress') return 50;
  return 0;
}

function mapApiTasks(items: TaskItem[]) {
  return items.map((item, index) => ({
    id: index + 1,
    apiId: item._id,
    title: item.taskTitle,
    assigned: item.createdAt
      ? new Date(item.createdAt).toISOString().slice(0, 10)
      : '',
    due: item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : '',
    priority: item.priority || 'Medium',
    ...priorityStyle(item.priority),
    progress: taskProgressFromStatus(item.status),
    status: mapTaskStatus(item.status),
  }));
}

function mapApiTrees(apiTrees: any[]) {
  const colors = [
    { color: '#bbf7d0', textColor: '#16a34a' },
    { color: '#dcfce7', textColor: '#22c55e' },
    { color: '#fef08a', textColor: '#ca8a04' },
    { color: '#ffedd5', textColor: '#ea580c' },
  ];
  return apiTrees.map((tree, index) => ({
    id: tree._id || tree.treeId || `T-${index + 1}`,
    treeCode: tree.treeId || tree._id || `T-${index + 1}`,
    name: tree.species || tree.treeName || 'Tree',
    status: String(tree.status || 'PLANTED').toUpperCase(),
    verified: Boolean(tree.verifiedAt),
    plantedDate: tree.plantedDate
      ? String(tree.plantedDate)
      : tree.createdAt
        ? String(tree.createdAt)
        : undefined,
    ...colors[index % colors.length],
  }));
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (name.trim().slice(0, 2) || 'M').toUpperCase();
}

function isTreeHealthy(status: string) {
  return status === 'HEALTHY' || status === 'GROWING';
}

function isTreeAtRisk(status: string) {
  return status === 'PLANTED' || status === 'DAMAGED';
}

function isTreeDead(status: string) {
  return status === 'DEAD';
}

const ACTIVITY_TYPES = [
  'Watering',
  'Tree Guard',
  'Fertilizer',
  'Pruning',
  'Replaced',
  'Soil',
];

const ISSUE_TYPES = [
  'Missing',
  'Water Shortage',
  'Dead Tree',
  'Damaged Guard',
  'Disease/Pest',
];

const PRIORITIES = [
  'Low',
  'Medium',
  'High',
  'Critical',
];

type LeaderboardRow = {
  id: string;
  rank: number;
  name: string;
  userId: string;
  verified: number;
  survival: number;
  title: string;
};

export const isEventStarted = (dateStr?: string, timeStr?: string): boolean => {
  if (!dateStr) return true;
  try {
    let year: number, month: number, day: number;

    if (dateStr.includes('T')) {
      const d = new Date(dateStr);
      year = d.getFullYear();
      month = d.getMonth();
      day = d.getDate();
    } else if (dateStr.includes('-')) {
      const parts = dateStr.split('-').map(p => parseInt(p, 10));
      year = parts[0];
      month = parts[1] - 1;
      day = parts[2];
    } else if (dateStr.includes('/')) {
      const parts = dateStr.split('/').map(p => parseInt(p, 10));
      if (parts[2] > 1000) {
        day = parts[0];
        month = parts[1] - 1;
        year = parts[2];
      } else {
        year = parts[2];
        month = parts[0] - 1;
        day = parts[1];
      }
    } else {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true;
      year = d.getFullYear();
      month = d.getMonth();
      day = d.getDate();
    }

    let hours = 0;
    let minutes = 0;

    if (timeStr && timeStr.trim().length > 0) {
      const trimmedTime = timeStr.trim();
      const match12 = trimmedTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (match12) {
        let h = parseInt(match12[1], 10);
        const m = parseInt(match12[2], 10);
        const ampm = match12[3].toUpperCase();
        if (ampm === 'PM' && h < 12) h += 12;
        if (ampm === 'AM' && h === 12) h = 0;
        hours = h;
        minutes = m;
      } else {
        const match24 = trimmedTime.match(/^(\d{1,2}):(\d{2})$/);
        if (match24) {
          hours = parseInt(match24[1], 10);
          minutes = parseInt(match24[2], 10);
        }
      }
    }

    const eventStartDate = new Date(year, month, day, hours, minutes, 0, 0);
    return new Date().getTime() >= eventStartDate.getTime();
  } catch (e) {
    return true;
  }
};

const SAMPLE_DEFAULT_EVENTS = [
  {
    id: 'sample-event-1',
    title: 'Clean & Green City Plantation Drive',
    eventType: 'Offline',
    date: '2026-08-25',
    time: '10:00 AM',
    endTime: '01:00 PM',
    location: 'Central City Park, Sector 4',
    organizer: 'Paryavaran Prahri Team',
    attendanceMarked: false,
    offlineDetails: {
      venue: 'Central City Park',
      address: 'Gate 2, Sector 4',
      city: 'Delhi',
    },
    description: 'Join us for a massive plantation drive to expand green cover across the sector.',
  },
  {
    id: 'sample-event-2',
    title: 'Mitra Monthly Orientation & Strategy Briefing',
    eventType: 'Online',
    date: '2026-08-28',
    time: '04:00 PM',
    endTime: '05:30 PM',
    location: 'Google Meet',
    organizer: 'Paryavaran Prahri Admin',
    attendanceMarked: false,
    onlineDetails: {
      platform: 'Google Meet',
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      meetingId: 'abc-defg-hij',
      passcode: 'mitra2026',
    },
    description: 'Monthly briefing for all Paryavaran Mitras to discuss upcoming initiatives and field strategies.',
  },
];

const DEFAULT_SAMPLE_TASKS = [
  {
    id: 1,
    apiId: 'task-sample-1',
    title: 'Weekly Tree Maintenance & Irrigation Check',
    assigned: '2026-08-20',
    due: '2026-08-30',
    priority: 'High',
    priorityBg: '#ffe4e6',
    priorityColor: '#e11d48',
    progress: 50,
    status: 'progress',
  },
  {
    id: 2,
    apiId: 'task-sample-2',
    title: 'Plantation Geo-tagging & Photo Audit',
    assigned: '2026-08-22',
    due: '2026-09-05',
    priority: 'Medium',
    priorityBg: '#fef08a',
    priorityColor: '#a16207',
    progress: 0,
    status: 'pending',
  },
  {
    id: 3,
    apiId: 'task-sample-3',
    title: 'Soil Quality Inspection & Organic Manure Drive',
    assigned: '2026-08-15',
    due: '2026-08-24',
    priority: 'Low',
    priorityBg: '#dcfce7',
    priorityColor: '#059669',
    progress: 100,
    status: 'completed',
  },
];

const DEFAULT_SAMPLE_CERTS = [
  {
    id: 'cert-sample-1',
    title: 'Paryavaran Mitra Excellence Certificate',
    subtitle: 'Outstanding contribution to Green Canopy Drive 2026',
    code: 'PM-CERT-2026-001',
    recipientName: 'Paryavaran Mitra',
    downloadPath: `${API_BASE_URL}/certificates/download-pdf/PM-CERT-2026-001`,
  },
  {
    id: 'cert-sample-2',
    title: 'Tree Guardian Recognition Award',
    subtitle: 'Successful plantation & maintenance of 50+ healthy trees',
    code: 'PM-CERT-2026-002',
    recipientName: 'Paryavaran Mitra',
    downloadPath: `${API_BASE_URL}/certificates/download-pdf/PM-CERT-2026-002`,
  },
];

type Props = {
  onLogout: () => void;
  onNotifications?: () => void;
  onBack?: () => void;
};

export default function MitraDashboardScreen({
  onLogout,
  onNotifications,
  onBack,
}: Props) {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState('Overview');
  const [trees, setTrees] = useState<
    {
      id: string;
      treeCode: string;
      name: string;
      status: string;
      verified: boolean;
      plantedDate?: string;
      color: string;
      textColor: string;
    }[]
  >([]);
  const [verifyingTree, setVerifyingTree] = useState(false);
  const [tasks, setTasks] = useState<ReturnType<typeof mapApiTasks>>([]);
  const [certificates, setCertificates] = useState<
    { id: string; title: string; subtitle: string; code?: string; recipientName?: string; downloadPath?: string | null }[]
  >([]);
  const [events, setEvents] = useState<
    {
      id: string;
      title: string;
      eventType?: string;
      date: string;
      time: string;
      endTime?: string;
      location?: string;
      organizer: string;
      attendanceMarked: boolean;
      offlineDetails?: { venue?: string; address?: string; city?: string };
      onlineDetails?: { platform?: string; meetingUrl?: string; meetingId?: string; passcode?: string };
      description?: string;
      bannerImage?: string;
    }[]
  >([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [mitraName, setMitraName] = useState('Mitra');
  const [mitraCode, setMitraCode] = useState('');
  const [mitraMobile, setMitraMobile] = useState('');
  const [mitraProfession, setMitraProfession] = useState('Paryavaran Mitra');
  const [mitraZone, setMitraZone] = useState('');
  const [mitraVidhanSabha, setMitraVidhanSabha] = useState('');
  const [mitraJoined, setMitraJoined] = useState('');
  const [plantationMonths, setPlantationMonths] = useState<
    Array<{ label: string; count: number; heightPct: number }>
  >([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [markingEventId, setMarkingEventId] = useState<string | null>(null);

  // Proof of work state
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  const [proofDescription, setProofDescription] = useState('');
  const [proofMedia, setProofMedia] = useState<PickedPhoto | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);

  // Maintenance Form State
  const [selectedTree, setSelectedTree] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(ACTIVITY_TYPES[0]);
  const [remarks, setRemarks] = useState('');
  const [beforePhoto, setBeforePhoto] = useState<PickedPhoto | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<PickedPhoto | null>(null);
  const [savingLog, setSavingLog] = useState(false);
  const [recentActivities, setRecentActivities] = useState<
    { id: string; tree: string; activity: string; date: string }[]
  >([]);

  // Dropdown Modal State
  const [dropdownType, setDropdownType] = useState<'tree' | 'activity' | 'issueType' | 'issuePriority' | null>(null);

  // Issues Form State
  const [selectedIssueType, setSelectedIssueType] = useState(ISSUE_TYPES[0]);
  const [selectedPriority, setSelectedPriority] = useState(PRIORITIES[1]);
  const [issueDesc, setIssueDesc] = useState('');
  const [issuePhoto, setIssuePhoto] = useState<PickedPhoto | null>(null);
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [reportedIssues, setReportedIssues] = useState<
    {
      id: string;
      type: string;
      priority: string;
      desc: string;
      date: string;
      status?: string;
    }[]
  >([]);

  const mapCerts = (list: any[]) =>
    list.map((c: any, i: number) => {
      const code = c.verificationCode || c.code || '';
      return {
        id: c._id || String(i + 1),
        title: c.title || 'Certificate',
        subtitle: c.description || c.eventName || 'Official recognition',
        code,
        recipientName: c.recipientName || '',
        downloadPath: c.pdfUrl || (code ? `${API_BASE_URL}/certificates/download-pdf/${code}` : null),
      };
    });

  const mapEvents = (list: MitraEventApi[]) =>
    list.map(event => {
      const dateValue = event.date ? new Date(event.date) : null;
      const dateStr = dateValue
        ? dateValue.toISOString().slice(0, 10)
        : '';
      return {
        id: event._id,
        title: event.title,
        eventType: event.eventType || 'Offline',
        date: dateStr,
        time: event.time || '',
        endTime: event.endTime || '',
        location: event.location,
        organizer: event.organizer || 'Paryavaran Prahri',
        attendanceMarked: Boolean(event.attendanceMarked),
        offlineDetails: event.offlineDetails,
        onlineDetails: event.onlineDetails,
        description: event.description,
        bannerImage: event.bannerImage,
      };
    });

  useEffect(() => {
    let mounted = true;
    (async () => {
      let fetchedMitraName = '';
      try {
        const mitra = (await mitrasService.getMe()) as any;
        if (mounted && mitra) {
          if (mitra.name) {
            fetchedMitraName = String(mitra.name);
            setMitraName(fetchedMitraName);
          }
          setMitraCode(mitra.mitraId || '');
          if (mitra.mobile) setMitraMobile(String(mitra.mobile));
          if (mitra.profession) {
            setMitraProfession(String(mitra.profession));
          }
          const zone =
            mitra.assignedZone ||
            [mitra.vidhanSabha, mitra.district].filter(Boolean).join(' · ') ||
            '';
          setMitraZone(zone);
          if (mitra.vidhanSabha) {
            setMitraVidhanSabha(String(mitra.vidhanSabha));
          }
          if (mitra.createdAt) {
            setMitraJoined(
              new Date(mitra.createdAt).toISOString().slice(0, 10),
            );
          }
        }
      } catch {
        setMitraName('Mitra');
      }

      try {
        const certs: any = await certificatesService.listMine();
        let list: any[] = [];
        if (Array.isArray(certs)) {
          list = certs;
        } else if (certs && Array.isArray(certs.data)) {
          list = certs.data;
        } else if (certs && Array.isArray(certs.items)) {
          list = certs.items;
        }
        if (mounted && list.length > 0) {
          setCertificates(mapCerts(list));
        } else if (mounted) {
          setCertificates(DEFAULT_SAMPLE_CERTS);
        }
      } catch {
        if (mounted) {
          setCertificates(DEFAULT_SAMPLE_CERTS);
        }
      }

      try {
        const localMitraId = await getStoredMitraId();
        const apiTrees = await treesService.list(localMitraId || undefined);
        if (mounted && Array.isArray(apiTrees)) {
          const mapped = mapApiTrees(apiTrees);
          setTrees(mapped);
          if (mapped[0]?.id) setSelectedTree(mapped[0].id);
        }
      } catch {
        // trees may be empty for this mitra
      }

      try {
        const mitraId = await getStoredMitraId();
        const monthly = await reportsService.monthlyPlantations({
          months: 6,
          mitraId: mitraId || undefined,
        });
        if (mounted && monthly?.months) {
          setPlantationMonths(
            monthly.months.map(m => ({
              label: m.label,
              count: m.count,
              heightPct: m.heightPct,
            })),
          );
        }
      } catch {
        // optional chart
      }

      try {
        const unread = await notificationsService.getUnreadCount();
        if (mounted) setUnreadNotifs(Number(unread.unreadCount) || 0);
      } catch {
        // optional
      }

      try {
        const apiTasks = await tasksService.list({
          page: 1,
          limit: 50,
          assignedMitra: fetchedMitraName || undefined,
        });
        const list = unwrapList(apiTasks);
        if (mounted && list.length > 0) {
          setTasks(mapApiTasks(list));
        } else if (mounted) {
          setTasks(DEFAULT_SAMPLE_TASKS);
        }
      } catch {
        if (mounted) {
          setTasks(DEFAULT_SAMPLE_TASKS);
        }
      }

      try {
        const apiEvents = await mitraEventsService.listMine();
        const list = Array.isArray(apiEvents) ? apiEvents : [];
        if (mounted && list.length > 0) {
          setEvents(mapEvents(list));
        } else if (mounted) {
          setEvents(SAMPLE_DEFAULT_EVENTS);
        }
      } catch {
        if (mounted) {
          setEvents(SAMPLE_DEFAULT_EVENTS);
        }
      }

      try {
        const logs = await maintenanceLogsService.list({ mine: true });
        const list = Array.isArray(logs) ? logs : [];
        if (mounted) {
          setRecentActivities(
            list.map((log: any) => ({
              id: log._id,
              tree: log.treeCode,
              activity: log.activity,
              date: log.loggedAt
                ? new Date(log.loggedAt).toLocaleDateString('en-GB')
                : new Date(log.createdAt || Date.now()).toLocaleDateString(
                    'en-GB',
                  ),
            })),
          );
        }
      } catch {
        // logs may be empty
      }

      try {
        const issues = await fieldIssuesService.list({ mine: true });
        const list = Array.isArray(issues) ? issues : [];
        if (mounted) {
          setReportedIssues(
            list.map((issue: any) => ({
              id: issue._id,
              type: issue.type,
              priority: issue.priority,
              desc: issue.description,
              date: issue.createdAt
                ? new Date(issue.createdAt).toLocaleDateString('en-GB')
                : new Date().toLocaleDateString('en-GB'),
              status: issue.status,
            })),
          );
        }
      } catch {
        // issues may be empty
      }

      try {
        const board = await leaderboardService.list({
          scope: 'vidhan-sabha',
          limit: 20,
        });
        if (mounted && Array.isArray(board?.items) && board.items.length > 0) {
          setLeaderboard(
            board.items.map((entry, index) => ({
              id: String(entry.personId || entry.rank || index + 1),
              rank: entry.rank || index + 1,
              name: entry.name || 'Mitra',
              userId: entry.badge || entry.mobile || `PM-${index + 1}`,
              verified: entry.trees || 0,
              survival: Math.round(entry.survivalPct ?? 0),
              title: entry.badge || 'Mitra',
            })),
          );
        }
      } catch {
        // empty until rankings exist
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleStartTask = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, status: 'progress', progress: 50 }
          : t,
      ),
    );
    if (task?.apiId) {
      try {
        await tasksService.updateStatus(task.apiId, 'In Progress');
      } catch (error) {
        if (__DEV__) {
          console.warn(
            error instanceof ApiError ? error.message : 'Task update failed',
          );
        }
      }
    }
  };

  const openProofModal = (taskId: number) => {
    setCompletingTaskId(taskId);
    setProofDescription('');
    setProofMedia(null);
    setProofModalVisible(true);
  };

  const submitTaskCompletion = async () => {
    if (!completingTaskId) return;
    if (!proofDescription.trim()) {
      Alert.alert('Required', 'Please describe the work done.');
      return;
    }
    const task = tasks.find(t => t.id === completingTaskId);
    if (!task) return;

    setSubmittingProof(true);
    
    try {
      let mediaUrl;
      if (proofMedia) {
        const uploaded = await uploadsService.upload(proofMedia, 'general');
        if (uploaded?.url) mediaUrl = uploaded.url;
      }
      
      if (task.apiId) {
        await tasksService.updateStatus(task.apiId, 'Completed', {
          description: proofDescription,
          mediaUrl,
        });
      }

      setTasks(prev =>
        prev.map(t =>
          t.id === completingTaskId
            ? { ...t, status: 'completed', progress: 100 }
            : t,
        ),
      );
      setProofModalVisible(false);
      Alert.alert('Success', 'Task marked as completed!');
    } catch (error) {
      if (__DEV__) {
        console.warn(error instanceof ApiError ? error.message : 'Task update failed');
      }
      Alert.alert(
        'Update failed',
        error instanceof ApiError ? error.message : 'Could not complete task',
      );
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleVerifyTree = () => {
    if (!trees.length) {
      Alert.alert('No trees', 'No trees available to verify yet.');
      return;
    }
    const pending = trees.filter(t => !t.verified);
    const options = (pending.length ? pending : trees).slice(0, 8);
    Alert.alert(
      'Verify Tree',
      'Select a tree to mark as field-verified',
      [
        ...options.map(tree => ({
          text: `${tree.name} (${tree.treeCode})`,
          onPress: () => void confirmVerifyTree(tree.id, tree.name),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );
  };

  const confirmVerifyTree = async (treeId: string, treeName: string) => {
    if (verifyingTree) return;
    setVerifyingTree(true);
    try {
      const updated = await treesService.verify(treeId, {
        status: 'HEALTHY',
        remarks: 'Verified by Mitra via app',
      });
      setTrees(prev =>
        prev.map(t =>
          t.id === treeId
            ? {
                ...t,
                verified: true,
                status: updated.status || 'HEALTHY',
              }
            : t,
        ),
      );
      Alert.alert('Verified', `${treeName} marked as verified.`);
    } catch (error) {
      Alert.alert(
        'Verify failed',
        error instanceof ApiError
          ? error.message
          : 'Could not verify tree. Please try again.',
      );
    } finally {
      setVerifyingTree(false);
    }
  };

  const verifiedCount = trees.filter(t => t.verified).length;
  const missingVerifyCount = Math.max(0, trees.length - verifiedCount);

  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const openIssues = reportedIssues.filter(issue => {
    const s = String(issue.status || 'Open').toLowerCase();
    return s !== 'resolved' && s !== 'closed';
  }).length;

  const healthyCount = trees.filter(t => isTreeHealthy(t.status)).length;
  const atRiskCount = trees.filter(t => isTreeAtRisk(t.status)).length;
  const deadCount = trees.filter(t => isTreeDead(t.status)).length;
  const needingWaterCount = trees.filter(
    t => t.status === 'PLANTED' || t.status === 'GROWING',
  ).length;
  const attentionCount = trees.filter(t => t.status === 'DAMAGED').length;

  const survivalPercent =
    trees.length === 0
      ? 0
      : Math.round(((trees.length - deadCount) / trees.length) * 100);

  const headerSubtitle =
    [mitraVidhanSabha, mitraZone].filter(Boolean).join(' · ') ||
    'Assigned area';

  const handleSaveLog = async () => {
    if (savingLog) return;
    if (!selectedTree) {
      Alert.alert('Required', 'Select a tree first.');
      return;
    }
    setSavingLog(true);
    const optimistic = {
      id: Date.now().toString(),
      tree: selectedTree,
      activity: selectedActivity,
      date: new Date().toLocaleDateString('en-GB'),
    };
    setRecentActivities([optimistic, ...recentActivities]);
    const note = remarks;
    const before = beforePhoto;
    const after = afterPhoto;
    setRemarks('');
    try {
      const photoUrls: string[] = [];
      for (const file of [before, after]) {
        if (!file) continue;
        const uploaded = await uploadsService.upload(file, 'trees');
        if (uploaded?.url) photoUrls.push(uploaded.url);
      }
      const saved: any = await maintenanceLogsService.create({
        treeCode: selectedTree,
        activity: selectedActivity,
        remarks: note || undefined,
        photoUrls: photoUrls.length ? photoUrls : undefined,
      });
      setBeforePhoto(null);
      setAfterPhoto(null);
      if (saved?._id) {
        setRecentActivities(prev =>
          prev.map(item =>
            item.id === optimistic.id
              ? {
                  id: saved._id,
                  tree: saved.treeCode || selectedTree,
                  activity: saved.activity || selectedActivity,
                  date: saved.loggedAt
                    ? new Date(saved.loggedAt).toLocaleDateString('en-GB')
                    : optimistic.date,
                }
              : item,
          ),
        );
      }
    } catch (error) {
      Alert.alert(
        'Save failed',
        error instanceof ApiError
          ? error.message
          : 'Could not save maintenance log',
      );
    } finally {
      setSavingLog(false);
    }
  };

  const handleSubmitIssue = async () => {
    if (submittingIssue) return;
    if (!issueDesc.trim()) {
      Alert.alert('Required', 'Please describe the issue.');
      return;
    }
    setSubmittingIssue(true);
    const optimistic = {
      id: Date.now().toString(),
      type: selectedIssueType,
      priority: selectedPriority,
      desc: issueDesc,
      date: new Date().toLocaleDateString('en-GB'),
      status: 'Open',
    };
    setReportedIssues([optimistic, ...reportedIssues]);
    const desc = issueDesc;
    const photo = issuePhoto;
    setIssueDesc('');
    try {
      const photoUrls: string[] = [];
      if (photo) {
        const uploaded = await uploadsService.upload(photo, 'trees');
        if (uploaded?.url) photoUrls.push(uploaded.url);
      }
      const saved: any = await fieldIssuesService.create({
        type: selectedIssueType,
        priority: selectedPriority,
        description: desc,
        photoUrls: photoUrls.length ? photoUrls : undefined,
      });
      setIssuePhoto(null);
      if (saved?._id) {
        setReportedIssues(prev =>
          prev.map(item =>
            item.id === optimistic.id
              ? {
                  id: saved._id,
                  type: saved.type || selectedIssueType,
                  priority: saved.priority || selectedPriority,
                  desc: saved.description || desc,
                  date: saved.createdAt
                    ? new Date(saved.createdAt).toLocaleDateString('en-GB')
                    : optimistic.date,
                  status: saved.status || 'Open',
                }
              : item,
          ),
        );
      }
    } catch (error) {
      setReportedIssues(prev => prev.filter(item => item.id !== optimistic.id));
      Alert.alert(
        'Submit failed',
        error instanceof ApiError
          ? error.message
          : 'Could not submit field issue',
      );
    } finally {
      setSubmittingIssue(false);
    }
  };

  const handleMarkAttendance = async (eventId: string) => {
    const targetEvent = events.find(e => e.id === eventId);
    if (targetEvent && !isEventStarted(targetEvent.date, targetEvent.time)) {
      Alert.alert(
        'Attendance Not Available',
        `Attendance can only be marked on or after the scheduled date and time of the event (${targetEvent.date}${targetEvent.time ? ' at ' + targetEvent.time : ''}).`,
      );
      return;
    }
    setMarkingEventId(eventId);
    try {
      await mitraEventsService.markAttendance(eventId);
      setEvents(prev =>
        prev.map(event =>
          event.id === eventId
            ? { ...event, attendanceMarked: true }
            : event,
        ),
      );
      Alert.alert('Attendance marked', 'Your attendance has been recorded.');
    } catch (error) {
      Alert.alert(
        'Attendance failed',
        error instanceof ApiError
          ? error.message
          : 'Could not mark attendance',
      );
    } finally {
      setMarkingEventId(null);
    }
  };

  return (
    <View style={styles.root}>
      {/* BACKGROUND GRADIENT */}
      <LinearGradient
        colors={['#e8faef', '#f4f9f4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: getTopInset(16) }]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.backButton} onPress={onBack ? onBack : onLogout}>
            <AppIcon name="arrow-left" size={20} color="#111827" />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Mitra Dashboard</Text>
            <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
          </View>
        </View>
        <Pressable style={styles.bellButton} onPress={onNotifications}>
          <AppIcon name="bell-outline" size={20} color="#111827" />
          {unreadNotifs > 0 ? <View style={styles.notifDot} /> : null}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PROFILE CARD */}
        <View style={styles.profileCardBorder}>
          <View style={styles.profileCard}>
            <View style={styles.profileTopRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {initialsFromName(mitraName)}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{mitraName}</Text>
                <Text style={styles.profileRole}>{mitraProfession}</Text>
                <Text style={styles.profileId}>
                  {mitraCode || 'Mitra ID pending'}
                </Text>
              </View>
            </View>

            <View style={styles.profileStatsRow}>
              <View style={styles.profileStatBox}>
                <Text style={styles.profileStatLabel}>Joined</Text>
                <Text style={styles.profileStatValue}>
                  {mitraJoined || '—'}
                </Text>
              </View>
              <View style={styles.profileStatBox}>
                <Text style={styles.profileStatLabel}>Mobile</Text>
                <Text style={styles.profileStatValue}>
                  {mitraMobile || '—'}
                </Text>
              </View>
              <View style={styles.profileStatBox}>
                <Text style={styles.profileStatLabel}>Area</Text>
                <Text style={styles.profileStatValue}>
                  {mitraZone || mitraVidhanSabha || '—'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* QUICK STATS GRID */}
        <View style={styles.gridContainer}>
          <View style={styles.gridCard}>
            <View style={styles.gridIconCircle}>
              <AppIcon name="leaf" size={16} color="#059669" />
            </View>
            <Text style={styles.gridValue}>{trees.length}</Text>
            <Text style={styles.gridLabel}>Trees Under Care</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.gridIconCircle}>
              <AppIcon name="check-circle-outline" size={16} color="#059669" />
            </View>
            <Text style={styles.gridValue}>{verifiedCount}</Text>
            <Text style={styles.gridLabel}>Verified</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.gridIconCircle}>
              <AppIcon name="clipboard-text-outline" size={16} color="#d97706" />
            </View>
            <Text style={styles.gridValue}>{pendingTasks}</Text>
            <Text style={styles.gridLabel}>Pending Tasks</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.gridIconCircle}>
              <AppIcon name="ribbon" size={16} color="#059669" />
            </View>
            <Text style={styles.gridValue}>{completedTasks}</Text>
            <Text style={styles.gridLabel}>Completed</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.gridIconCircle}>
              <AppIcon name="file-alert-outline" size={16} color="#e11d48" />
            </View>
            <Text style={styles.gridValue}>{openIssues}</Text>
            <Text style={styles.gridLabel}>Issues</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.gridIconCircle}>
              <AppIcon name="heart-pulse" size={16} color="#059669" />
            </View>
            <Text style={styles.gridValue}>{survivalPercent}%</Text>
            <Text style={styles.gridLabel}>Survival</Text>
          </View>
        </View>

        {/* ACTIONS ROW */}
        <View style={styles.actionsRow}>
          <Pressable
            style={styles.actionItem}
            onPress={handleVerifyTree}
            disabled={verifyingTree}>
            <View style={styles.actionCircle}>
              {verifyingTree ? (
                <ActivityIndicator color="#059669" />
              ) : (
                <AppIcon name="camera-outline" size={24} color="#059669" />
              )}
            </View>
            <Text style={styles.actionText}>
              {verifyingTree ? 'Verifying…' : 'Verify Tree'}
            </Text>
          </Pressable>

          <Pressable style={styles.actionItem} onPress={() => setActiveTab('Tasks')}>
            <View style={styles.actionCircle}>
              <AppIcon name="clipboard-check-outline" size={24} color="#059669" />
            </View>
            <Text style={styles.actionText}>My Tasks</Text>
          </Pressable>

          <Pressable style={styles.actionItem} onPress={() => setActiveTab('Maintenance')}>
            <View style={styles.actionCircle}>
              <AppIcon name="wrench-outline" size={24} color="#059669" />
            </View>
            <Text style={styles.actionText}>Maintain</Text>
          </Pressable>

          <Pressable style={styles.actionItem} onPress={() => setActiveTab('Issues')}>
            <View style={styles.actionCircle}>
              <AppIcon name="file-document-edit-outline" size={24} color="#059669" />
            </View>
            <Text style={styles.actionText}>Report</Text>
          </Pressable>
        </View>

        {/* TABS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {TABS.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* TAB CONTENT (OVERVIEW) */}
        {activeTab === 'Overview' && (
          <View style={styles.tabContent}>

            {/* Assigned Area Overview */}
            <View style={styles.cardSection}>
              <Text style={styles.cardSectionTitle}>Assigned Area Overview</Text>
              <View style={styles.areaGrid}>
                <View style={styles.areaBox}>
                  <Text style={styles.areaValue}>{verifiedCount}</Text>
                  <Text style={styles.areaLabel}>Verified</Text>
                </View>
                <View style={styles.areaBox}>
                  <Text style={styles.areaValue}>{missingVerifyCount}</Text>
                  <Text style={styles.areaLabel}>Missing verification</Text>
                </View>
                <View style={styles.areaBox}>
                  <Text style={styles.areaValue}>{needingWaterCount}</Text>
                  <Text style={styles.areaLabel}>Needing watering</Text>
                </View>
                <View style={styles.areaBox}>
                  <Text style={styles.areaValue}>{attentionCount}</Text>
                  <Text style={styles.areaLabel}>Requiring attention</Text>
                </View>
              </View>
            </View>

            {/* Survival Analytics */}
            <View style={styles.cardSection}>
              <Text style={styles.cardSectionTitle}>Survival Analytics</Text>

              <View style={styles.survivalRow}>
                <View style={[styles.survivalBox, { backgroundColor: '#eefcf3' }]}>
                  <Text style={[styles.survivalValue, { color: '#059669' }]}>
                    {healthyCount}
                  </Text>
                  <Text style={styles.survivalLabel}>Healthy</Text>
                </View>
                <View style={[styles.survivalBox, { backgroundColor: '#fffbeb' }]}>
                  <Text style={[styles.survivalValue, { color: '#d97706' }]}>
                    {atRiskCount}
                  </Text>
                  <Text style={styles.survivalLabel}>At Risk</Text>
                </View>
                <View style={[styles.survivalBox, { backgroundColor: '#fff1f2' }]}>
                  <Text style={[styles.survivalValue, { color: '#e11d48' }]}>
                    {deadCount}
                  </Text>
                  <Text style={styles.survivalLabel}>Dead</Text>
                </View>
              </View>

              <Text style={styles.chartTitle}>
                Monthly plantations ({plantationMonths.reduce((s, m) => s + m.count, 0)} total)
              </Text>
              <View style={styles.chartRow}>
                {(plantationMonths.length > 0
                  ? plantationMonths
                  : Array.from({ length: 6 }, () => ({
                      label: '—',
                      count: 0,
                      heightPct: 8,
                    }))
                ).map((month, i) => (
                  <View key={`${month.label}-${i}`} style={styles.barWrap}>
                    <LinearGradient
                      colors={['#34d399', '#059669']}
                      style={[
                        styles.bar,
                        {
                          height: Math.max(
                            8,
                            Math.round((month.heightPct / 100) * 72),
                          ),
                        },
                      ]}
                    />
                    <Text style={styles.barLabel}>{month.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Trees Under Your Care */}
            <View style={styles.cardSection}>
              <Text style={styles.cardSectionTitle}>Trees Under Your Care</Text>

              <View style={styles.treeList}>
                {trees.map((tree, index) => (
                  <View key={index} style={styles.treeRow}>
                    <View style={styles.treeLeft}>
                      <AppIcon name="leaf" size={16} color="#059669" />
                      <Text style={styles.treeId}>{tree.id}</Text>
                      <Text style={styles.treeName}>{tree.name}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: tree.color }]}>
                      <Text style={[styles.statusText, { color: tree.textColor }]}>
                        {tree.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

          </View>
        )}

        {/* TAB CONTENT (TASKS) */}
        {activeTab === 'Tasks' && (
          <View style={styles.tabContent}>
            {tasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>

                <View style={styles.taskHeaderRow}>
                  <View style={styles.taskHeaderLeft}>
                    <View style={styles.taskIconBg}>
                      <AppIcon name="clipboard-text-outline" size={20} color="#059669" />
                    </View>
                    <View style={styles.taskTitleCol}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <Text style={styles.taskSubtitle}>
                        Assigned {task.assigned} · Due {task.due}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: task.priorityBg }]}>
                    <Text style={[styles.priorityText, { color: task.priorityColor }]}>
                      {task.priority}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.taskProgressBarBg}>
                  <View style={[styles.taskProgressBarFill, { width: `${task.progress}%` }]} />
                </View>

                {/* Action Buttons */}
                {task.status === 'completed' ? (
                  <View style={styles.taskCompletedBtn}>
                    <AppIcon name="check-circle-outline" size={16} color="#059669" />
                    <Text style={styles.taskCompletedText}>Completed</Text>
                  </View>
                ) : (
                  <View style={styles.taskActionRow}>
                    {task.status === 'progress' ? (
                      <View style={[styles.taskBtn, { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#f59e0b' }]}>
                        <AppIcon name="clock-outline" size={16} color="#d97706" />
                        <Text style={[styles.taskBtnText, { color: '#d97706' }]}>Pending</Text>
                      </View>
                    ) : (
                      <Pressable
                        style={[styles.taskBtn, styles.taskBtnStart]}
                        onPress={() => handleStartTask(task.id)}
                      >
                        <AppIcon name="play-outline" size={16} color="#fff" />
                        <Text style={styles.taskBtnText}>Start</Text>
                      </Pressable>
                    )}
                    <Pressable
                      style={[styles.taskBtn, styles.taskBtnMark]}
                      onPress={() => openProofModal(task.id)}
                    >
                      <AppIcon name="check-circle-outline" size={16} color="#fff" />
                      <Text style={styles.taskBtnText}>Mark Completed</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* TAB CONTENT (MAINTENANCE) */}
        {activeTab === 'Maintenance' && (
          <View style={styles.tabContent}>

            <View style={styles.cardSection}>
              <View style={styles.maintenanceHeaderRow}>
                <AppIcon name="wrench-outline" size={18} color="#4b5563" />
                <Text style={[styles.cardSectionTitle, { marginBottom: 0, marginLeft: 8 }]}>
                  Log Maintenance Activity
                </Text>
              </View>

              <View style={[styles.dropdownRow, { zIndex: 100 }]}>
                {/* Tree Dropdown */}
                <View style={[{ flex: 1 }, dropdownType === 'tree' && { zIndex: 200 }]}>
                  <Pressable
                    style={[styles.dropdownBtn, dropdownType === 'tree' && { borderColor: '#059669', backgroundColor: '#f0fdf4' }]}
                    onPress={() => setDropdownType(dropdownType === 'tree' ? null : 'tree')}
                  >
                    <Text style={styles.dropdownText} numberOfLines={1}>
                      {selectedTree} · {trees.find(t => t.id === selectedTree)?.name}
                    </Text>
                    <AppIcon name={dropdownType === 'tree' ? 'chevron-up' : 'chevron-down'} size={16} color={dropdownType === 'tree' ? '#059669' : '#6b7280'} />
                  </Pressable>

                  {dropdownType === 'tree' && (
                    <View style={styles.floatingDropdown}>
                      {trees.map((tree) => {
                        const isSelected = selectedTree === tree.id;
                        return (
                          <Pressable
                            key={tree.id}
                            style={[styles.floatingDropdownItem, isSelected && { backgroundColor: '#f0fdf4' }]}
                            onPress={() => {
                              setSelectedTree(tree.id);
                              setDropdownType(null);
                            }}
                          >
                            <Text style={[styles.floatingDropdownText, isSelected && { color: '#059669', fontWeight: '700' }]}>{tree.id} · {tree.name}</Text>
                            {isSelected && <AppIcon name="check-circle" size={16} color="#059669" />}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Activity Dropdown */}
                <View style={[{ flex: 1 }, dropdownType === 'activity' && { zIndex: 200 }]}>
                  <Pressable
                    style={[styles.dropdownBtn, dropdownType === 'activity' && { borderColor: '#059669', backgroundColor: '#f0fdf4' }]}
                    onPress={() => setDropdownType(dropdownType === 'activity' ? null : 'activity')}
                  >
                    <Text style={styles.dropdownText} numberOfLines={1}>
                      {selectedActivity}
                    </Text>
                    <AppIcon name={dropdownType === 'activity' ? 'chevron-up' : 'chevron-down'} size={16} color={dropdownType === 'activity' ? '#059669' : '#6b7280'} />
                  </Pressable>

                  {dropdownType === 'activity' && (
                    <View style={styles.floatingDropdown}>
                      {ACTIVITY_TYPES.map((activity) => {
                        const isSelected = selectedActivity === activity;
                        return (
                          <Pressable
                            key={activity}
                            style={[styles.floatingDropdownItem, isSelected && { backgroundColor: '#f0fdf4' }]}
                            onPress={() => {
                              setSelectedActivity(activity);
                              setDropdownType(null);
                            }}
                          >
                            <Text style={[styles.floatingDropdownText, isSelected && { color: '#059669', fontWeight: '700' }]}>{activity}</Text>
                            {isSelected && <AppIcon name="check-circle" size={16} color="#059669" />}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.photoRow}>
                <Pressable
                  style={styles.photoBox}
                  onPress={() => {
                    void pickMaintenancePhoto().then(photo => {
                      if (photo) setBeforePhoto(photo);
                    });
                  }}>
                  {beforePhoto ? (
                    <Image
                      source={{ uri: beforePhoto.uri }}
                      style={styles.photoPreview}
                    />
                  ) : (
                    <>
                      <AppIcon name="camera-outline" size={24} color="#059669" />
                      <Text style={styles.photoText}>Before photo</Text>
                    </>
                  )}
                </Pressable>
                <Pressable
                  style={styles.photoBox}
                  onPress={() => {
                    void pickMaintenancePhoto().then(photo => {
                      if (photo) setAfterPhoto(photo);
                    });
                  }}>
                  {afterPhoto ? (
                    <Image
                      source={{ uri: afterPhoto.uri }}
                      style={styles.photoPreview}
                    />
                  ) : (
                    <>
                      <AppIcon name="camera-outline" size={24} color="#059669" />
                      <Text style={styles.photoText}>After photo</Text>
                    </>
                  )}
                </Pressable>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.remarksInput}
                  placeholder="Remarks..."
                  placeholderTextColor="#9ca3af"
                  value={remarks}
                  onChangeText={setRemarks}
                  multiline
                />
              </View>

              <Pressable
                style={styles.saveLogBtn}
                onPress={handleSaveLog}
                disabled={savingLog}>
                <Text style={styles.saveLogBtnText}>
                  {savingLog ? 'Saving…' : 'Save Maintenance Log'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.cardSection}>
              <Text style={styles.cardSectionTitle}>Recent Activity</Text>

              {recentActivities.map((item) => (
                <View key={item.id} style={styles.activityRow}>
                  <View style={styles.activityLeft}>
                    <AppIcon name="water-outline" size={16} color="#059669" />
                    <Text style={styles.activityTree}>{item.tree}</Text>
                    <Text style={styles.activityName}>{item.activity}</Text>
                  </View>
                  <Text style={styles.activityDate}>{item.date}</Text>
                </View>
              ))}
            </View>

          </View>
        )}
        {/* TAB CONTENT (EVENTS) */}
        {activeTab === 'Events' && (
          <View style={styles.tabContent}>
            {events.map((event) => (
              <View key={event.id} style={styles.taskCard}>

                <View style={styles.taskHeaderRow}>
                  <View style={styles.taskHeaderLeft}>
                    <View style={[styles.taskIconBg, { backgroundColor: event.eventType === 'Online' ? '#3b82f620' : event.eventType === 'Hybrid' ? '#8b5cf620' : '#10b98120' }]}>
                      <Icon name="calendar" size={24} color={event.eventType === 'Online' ? '#3b82f6' : event.eventType === 'Hybrid' ? '#8b5cf6' : '#10b981'} />
                    </View>
                    <View style={styles.taskTitleCol}>
                    <Text style={styles.taskTitle}>{event.title}</Text>
                    <Text style={[styles.taskSubtitle, { color: event.eventType === 'Online' ? '#3b82f6' : event.eventType === 'Hybrid' ? '#8b5cf6' : '#10b981', fontFamily: 'Outfit-Medium', marginBottom: 2 }]}>
                      {event.eventType?.toUpperCase() || 'OFFLINE'}
                    </Text>
                    <Text style={styles.taskSubtitle}>
                      {event.date} • {event.time}
                    </Text>
                    <Text style={[styles.taskSubtitle, { marginTop: 2 }]}>
                      {event.eventType === 'Online' 
                        ? (event.onlineDetails?.platform || 'Online Meeting') 
                        : event.eventType === 'Hybrid' 
                        ? `${event.offlineDetails?.city || event.location} + Online`
                        : (event.offlineDetails?.city || event.location)
                      }
                    </Text>
                  </View>
                </View>
              </View>

                {/* Action Buttons */}
                <View style={styles.taskActionRow}>
                  <Pressable 
                    style={[styles.taskBtn, styles.taskBtnStart]}
                    onPress={() =>
                      navigation.navigate('EventDetail', { 
                        event,
                        onMarkAttendance: () => {
                          setEvents(prev =>
                            prev.map(e =>
                              e.id === event.id ? { ...e, attendanceMarked: true } : e,
                            ),
                          );
                        },
                      })
                    }
                  >
                    <Text style={[styles.taskBtnText, { marginLeft: 0 }]}>View Details</Text>
                  </Pressable>

                  {event.attendanceMarked ? (
                    <Pressable style={[styles.taskBtn, styles.taskBtnMark]}>
                      <Text style={[styles.taskBtnText, { marginLeft: 0 }]}>Attendance ✓</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      style={[
                        styles.taskBtn,
                        isEventStarted(event.date, event.time)
                          ? styles.taskBtnOutline
                          : { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1', borderWidth: 1 }
                      ]}
                      disabled={markingEventId === event.id}
                      onPress={() => {
                        if (!isEventStarted(event.date, event.time)) {
                          Alert.alert(
                            'Attendance Not Available',
                            `Attendance can only be marked on or after the scheduled date and time of the event (${event.date}${event.time ? ' at ' + event.time : ''}).`,
                          );
                        } else {
                          handleMarkAttendance(event.id);
                        }
                      }}>
                      <Text
                        style={
                          isEventStarted(event.date, event.time)
                            ? styles.taskBtnOutlineText
                            : { fontSize: 13, fontFamily: 'Outfit-Medium', color: '#94a3b8' }
                        }>
                        {markingEventId === event.id
                          ? 'Marking...'
                          : isEventStarted(event.date, event.time)
                          ? 'Mark Attendance'
                          : 'Attendance Locked'}
                      </Text>
                    </Pressable>
                  )}
                </View>

              </View>
            ))}
          </View>
        )}

        {/* TAB CONTENT (LEADERBOARD) */}
        {activeTab === 'Leaderboard' && (
          <View style={styles.tabContent}>
            <View style={styles.cardSection}>

              <View style={styles.leaderboardHeaderRow}>
                <AppIcon name="trophy-outline" size={20} color="#4b5563" />
                <Text style={styles.leaderboardTitle}>Top Paryavaran Mitras</Text>
              </View>

              <View style={styles.leaderboardList}>
                {leaderboard.length === 0 ? (
                  <Text style={styles.emptyHint}>
                    Leaderboard data not available yet.
                  </Text>
                ) : null}
                {leaderboard.map((user) => {
                  let rankColor = '#059669'; // Default green
                  if (user.rank === 1) rankColor = '#f59e0b';
                  else if (user.rank === 2) rankColor = '#8ba1b9'; // Silver/slate
                  else if (user.rank === 3) rankColor = '#b45309'; // Bronze/amber-dark

                  return (
                    <View key={user.id} style={styles.leaderboardRow}>
                      <View style={[styles.rankCircle, { backgroundColor: rankColor }]}>
                        <Text style={styles.rankText}>{user.rank}</Text>
                      </View>

                      <View style={styles.leaderboardUserCol}>
                        <Text style={styles.leaderboardName}>{user.name}</Text>
                        <Text style={styles.leaderboardUserId}>{user.userId}</Text>
                      </View>

                      <View style={styles.leaderboardStatsCol}>
                        <Text style={styles.leaderboardStatValue}>{user.verified} trees</Text>
                        <Text style={styles.leaderboardStatLabel}>
                          {user.survival}% survival
                        </Text>
                      </View>

                      <View style={styles.leaderboardBadge}>
                        <Text style={styles.leaderboardBadgeText}>{user.title}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

            </View>
          </View>
        )}

        {/* TAB CONTENT (ISSUES) */}
        {activeTab === 'Issues' && (
          <View style={styles.tabContent}>

            <View style={styles.cardSection}>
              <View style={styles.maintenanceHeaderRow}>
                <AppIcon name="file-document-outline" size={18} color="#4b5563" />
                <Text style={[styles.cardSectionTitle, { marginBottom: 0, marginLeft: 8 }]}>
                  Report Issue
                </Text>
              </View>

              <View style={[styles.dropdownRow, { zIndex: 100 }]}>
                {/* Issue Type Dropdown */}
                <View style={[{ flex: 1 }, dropdownType === 'issueType' && { zIndex: 200 }]}>
                  <Pressable
                    style={[styles.dropdownBtn, dropdownType === 'issueType' && { borderColor: '#059669', backgroundColor: '#f0fdf4' }]}
                    onPress={() => setDropdownType(dropdownType === 'issueType' ? null : 'issueType')}
                  >
                    <Text style={styles.dropdownText} numberOfLines={1}>
                      {selectedIssueType}
                    </Text>
                    <AppIcon name={dropdownType === 'issueType' ? 'chevron-up' : 'chevron-down'} size={16} color={dropdownType === 'issueType' ? '#059669' : '#6b7280'} />
                  </Pressable>

                  {dropdownType === 'issueType' && (
                    <View style={styles.floatingDropdown}>
                      {ISSUE_TYPES.map((type) => {
                        const isSelected = selectedIssueType === type;
                        return (
                          <Pressable
                            key={type}
                            style={[styles.floatingDropdownItem, isSelected && { backgroundColor: '#f0fdf4' }]}
                            onPress={() => {
                              setSelectedIssueType(type);
                              setDropdownType(null);
                            }}
                          >
                            <Text style={[styles.floatingDropdownText, isSelected && { color: '#059669', fontWeight: '700' }]}>{type}</Text>
                            {isSelected && <AppIcon name="check-circle" size={16} color="#059669" />}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Issue Priority Dropdown */}
                <View style={[{ flex: 1 }, dropdownType === 'issuePriority' && { zIndex: 200 }]}>
                  <Pressable
                    style={[styles.dropdownBtn, dropdownType === 'issuePriority' && { borderColor: '#059669', backgroundColor: '#f0fdf4' }]}
                    onPress={() => setDropdownType(dropdownType === 'issuePriority' ? null : 'issuePriority')}
                  >
                    <Text style={styles.dropdownText} numberOfLines={1}>
                      {selectedPriority}
                    </Text>
                    <AppIcon name={dropdownType === 'issuePriority' ? 'chevron-up' : 'chevron-down'} size={16} color={dropdownType === 'issuePriority' ? '#059669' : '#6b7280'} />
                  </Pressable>

                  {dropdownType === 'issuePriority' && (
                    <View style={styles.floatingDropdown}>
                      {PRIORITIES.map((priority) => {
                        const isSelected = selectedPriority === priority;
                        return (
                          <Pressable
                            key={priority}
                            style={[styles.floatingDropdownItem, isSelected && { backgroundColor: '#f0fdf4' }]}
                            onPress={() => {
                              setSelectedPriority(priority);
                              setDropdownType(null);
                            }}
                          >
                            <Text style={[styles.floatingDropdownText, isSelected && { color: '#059669', fontWeight: '700' }]}>{priority}</Text>
                            {isSelected && <AppIcon name="check-circle" size={16} color="#059669" />}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.remarksInput}
                  placeholder="Describe what you observed..."
                  placeholderTextColor="#9ca3af"
                  value={issueDesc}
                  onChangeText={setIssueDesc}
                  multiline
                />
              </View>

              <Pressable
                style={[
                  styles.photoBox,
                  { height: 50, flexDirection: 'row', marginBottom: 8 },
                ]}
                onPress={() => {
                  void pickMaintenancePhoto().then(photo => {
                    if (photo) setIssuePhoto(photo);
                  });
                }}>
                <AppIcon name="camera-outline" size={20} color="#059669" />
                <Text style={[styles.photoText, { marginTop: 0, marginLeft: 8 }]}>
                  {issuePhoto ? 'Photo attached' : 'Attach photo (optional)'}
                </Text>
              </Pressable>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <AppIcon name="map-marker-outline" size={14} color="#6b7280" />
                <Text style={{ fontSize: 11, color: '#6b7280', marginLeft: 4 }}>
                  GPS location captured automatically on submit.
                </Text>
              </View>

              <Pressable
                style={[styles.saveLogBtn, { backgroundColor: '#e11d48' }]}
                onPress={handleSubmitIssue}
                disabled={submittingIssue}>
                <Text style={styles.saveLogBtnText}>
                  {submittingIssue ? 'Submitting…' : 'Submit Report'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.cardSection}>
              <Text style={styles.cardSectionTitle}>Reported Issues</Text>

              {reportedIssues.map((item) => {
                let badgeBg = '#fef08a';
                let badgeColor = '#a16207';
                if (item.priority === 'High' || item.priority === 'Critical') {
                  badgeBg = '#ffe4e6';
                  badgeColor = '#e11d48';
                } else if (item.priority === 'Low') {
                  badgeBg = '#dcfce7';
                  badgeColor = '#059669';
                }

                return (
                  <View key={item.id} style={[styles.activityRow, { backgroundColor: '#fff5f5', flexDirection: 'column', alignItems: 'flex-start' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.activityName}>{item.type}</Text>
                        <View style={[styles.priorityBadge, { backgroundColor: badgeBg, paddingVertical: 2, paddingHorizontal: 6, marginLeft: 8 }]}>
                          <Text style={[styles.priorityText, { color: badgeColor, fontSize: 10 }]}>{item.priority}</Text>
                        </View>
                      </View>
                      <Text style={styles.activityDate}>{item.date}</Text>
                    </View>
                    {item.desc ? (
                      <Text style={{ fontSize: 12, color: '#4b5563' }}>{item.desc}</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>

          </View>
        )}

        {/* TAB CONTENT (CERTIFICATES) */}
        {activeTab === 'Certificates' && (
          <View style={styles.tabContent}>
            {certificates.map(cert => (
              <View key={cert.id} style={styles.taskCard}>
                <View style={[styles.taskHeaderRow, { marginBottom: 16 }]}>
                  <View
                    style={[styles.taskIconBg, { backgroundColor: '#fef3c7' }]}>
                    <AppIcon name="ribbon" size={20} color="#d97706" />
                  </View>
                  <View style={styles.taskTitleCol}>
                    <Text style={styles.taskTitle}>{cert.title}</Text>
                    <Text style={styles.taskSubtitle}>
                      {cert.subtitle}
                      {cert.recipientName ? ` · Issued to: ${cert.recipientName}` : ''}
                    </Text>
                  </View>
                </View>

                <View style={[styles.taskActionRow, { gap: 12 }]}>
                  <Pressable
                    style={[
                      styles.taskBtn,
                      styles.taskBtnOutline,
                      { borderColor: '#059669', flex: 1, backgroundColor: '#f0fdf4' },
                    ]}
                    onPress={async () => {
                      try {
                        const path = (cert as any).downloadPath;
                        if (!path) {
                          Alert.alert('Not available', 'Certificate PDF is not available yet.');
                          return;
                        }
                        const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
                        await Linking.openURL(url);
                      } catch {
                        Alert.alert('Error', 'Failed to open download link.');
                      }
                    }}>
                    <AppIcon name="download-outline" size={16} color="#059669" />
                    <Text
                      style={[styles.taskBtnOutlineText, { color: '#059669', marginLeft: 6 }]}>
                      Download
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.taskBtn,
                      styles.taskBtnOutline,
                      { borderColor: '#e5e7eb', flex: 1 },
                    ]}
                    onPress={async () => {
                      try {
                        const result: any = await certificatesService.shareWhatsapp(
                          cert.id,
                        );
                        if (result?.success === false) {
                          throw new Error(
                            result.error || 'WhatsApp share failed',
                          );
                        }
                        Alert.alert(
                          'Shared',
                          'Certificate share was sent via WhatsApp.',
                        );
                      } catch (error) {
                        const text = encodeURIComponent(
                          `Paryavaran Prahri Certificate\n${cert.title}\n${cert.subtitle}${
                            (cert as any).code
                              ? `\nCode: ${(cert as any).code}`
                              : ''
                          }`,
                        );
                        try {
                          await Linking.openURL(`https://wa.me/?text=${text}`);
                        } catch {
                          Alert.alert(
                            'Share failed',
                            error instanceof ApiError
                              ? error.message
                              : 'Could not share certificate on WhatsApp.',
                          );
                        }
                      }
                    }}>
                    <AppIcon name="whatsapp" size={16} color="#111827" />
                    <Text
                      style={[styles.taskBtnOutlineText, { color: '#111827', marginLeft: 6 }]}>
                      Share
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Proof of Work Modal */}
      <Modal
        visible={proofModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProofModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Proof of Work</Text>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setProofModalVisible(false)}>
                <AppIcon name="close" size={20} color="#6b7280" />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Please describe the work done and optionally attach a photo or video as proof.
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.remarksInput}
                placeholder="Describe the completed task..."
                placeholderTextColor="#9ca3af"
                multiline
                textAlignVertical="top"
                value={proofDescription}
                onChangeText={setProofDescription}
              />
            </View>

            <Pressable
              style={styles.uploadBtn}
              onPress={async () => {
                const photo = await pickMedia();
                if (photo) setProofMedia(photo);
              }}>
              <AppIcon name="camera-plus" size={20} color="#059669" />
              <Text style={styles.uploadBtnText}>
                {proofMedia ? proofMedia.name : 'Attach Photo or Video'}
              </Text>
            </Pressable>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <Pressable
                style={[styles.btnOutline, { flex: 1 }]}
                onPress={() => setProofModalVisible(false)}>
                <Text style={styles.btnOutlineText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.btnPrimary,
                  { flex: 1 },
                  (!proofDescription.trim() || submittingProof) && styles.btnDisabled,
                ]}
                disabled={!proofDescription.trim() || submittingProof}
                onPress={submitTaskCompletion}>
                {submittingProof ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <AppIcon name="check-circle" size={18} color="#fff" />
                    <Text style={styles.btnPrimaryText}>Submit</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f4f9f4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  scrollContent: {
    paddingBottom: 120, // Extra space for BottomNav
  },
  profileCardBorder: {
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 2,
    backgroundColor: '#bbf7d0', // Light green border color
    marginBottom: 20,
  },
  profileCard: {
    backgroundColor: '#eafcfa',
    borderRadius: 22,
    padding: 20,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0c4a34',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#064e3b',
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 4,
  },
  profileId: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  profileStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  profileStatBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  profileStatLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  profileStatValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  gridCard: {
    width: (width - 32 - 12 - 12) / 3, // 3 columns
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  gridIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gridValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  gridLabel: {
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionItem: {
    alignItems: 'center',
  },
  actionCircle: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  actionText: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
  },
  tabsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  tabButtonActive: {
    backgroundColor: '#059669',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabContent: {
    paddingHorizontal: 16,
  },
  cardSection: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  areaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  areaBox: {
    width: '48%', // using percentage is safer for cross-device compatibility
    backgroundColor: '#ebfdf2',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 12,
  },
  areaValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#059669',
    marginBottom: 6,
  },
  areaLabel: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  survivalRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  survivalBox: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  survivalValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  survivalLabel: {
    fontSize: 12,
    color: '#4b5563',
  },
  chartTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 96,
    gap: 8,
  },
  barWrap: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    marginTop: 4,
    fontSize: 9,
    color: '#6b7280',
    fontWeight: '600',
  },
  treeList: {
    gap: 12,
  },
  treeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 16,
  },
  treeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  treeId: {
    fontSize: 12,
    color: '#4b5563',
    marginLeft: 8,
    marginRight: 8,
  },
  treeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  taskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  taskHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
    paddingRight: 12,
  },
  taskIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskTitleCol: {
    flex: 1,
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  taskSubtitle: {
    fontSize: 11,
    color: '#6b7280',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  taskProgressBarBg: {
    height: 6,
    backgroundColor: '#d1fae5',
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  taskProgressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3,
  },
  taskActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  taskBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 100,
  },
  taskBtnStart: {
    backgroundColor: '#059669',
  },
  taskBtnMark: {
    backgroundColor: '#064e3b',
  },
  taskBtnOutline: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#34d399',
  },
  taskBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  taskBtnOutlineText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
  },
  eventOrganizer: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  leaderboardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  leaderboardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  leaderboardList: {
    gap: 12,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ebfdf2',
    padding: 12,
    borderRadius: 20,
  },
  rankCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  leaderboardUserCol: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  leaderboardUserId: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  leaderboardStatsCol: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  leaderboardStatValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  leaderboardStatLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  leaderboardBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0fdf4',
  },
  leaderboardBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  taskCompletedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 100,
    backgroundColor: '#ecfdf5',
  },
  taskCompletedText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  maintenanceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  floatingDropdown: {
    marginTop: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  floatingDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  floatingDropdownText: {
    fontSize: 14,
    color: '#374151',
  },
  photoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoBox: {
    flex: 1,
    height: 80,
    borderWidth: 1.5,
    borderColor: '#34d399',
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoText: {
    fontSize: 12,
    color: '#059669',
    marginTop: 4,
  },
  inputContainer: {
    backgroundColor: '#f4fbf6',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  remarksInput: {
    minHeight: 60,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#111827',
    padding: 0,
  },
  saveLogBtn: {
    backgroundColor: '#059669',
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveLogBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTree: {
    fontSize: 12,
    color: '#4b5563',
    marginLeft: 8,
    marginRight: 8,
  },
  activityName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  activityDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyHint: {
    fontSize: 13,
    color: '#6b7280',
    paddingVertical: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 16,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#34d399',
    borderStyle: 'dashed',
    backgroundColor: '#f4fbf6',
  },
  uploadBtnText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  btnPrimary: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 100,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  btnDisabled: {
    backgroundColor: '#9ca3af',
  },
  btnOutline: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 100,
  },
  btnOutlineText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },
});
