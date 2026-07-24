import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AppIcon from '../components/AppIcon';
import { getBottomInset, getTopInset } from '../utils/layout';

const { width } = Dimensions.get('window');

type Props = {
  onLogout: () => void;
};

const TABS = ['Overview', 'Tasks', 'Maintenance', 'Issues', 'Events', 'Leaderboard', 'Certificates'];

const TREES = [
  { id: 'PM-T-001', name: 'Peepal', status: 'Excellent', color: '#bbf7d0', textColor: '#16a34a' },
  { id: 'PM-T-002', name: 'Neem', status: 'Good', color: '#dcfce7', textColor: '#22c55e' },
  { id: 'PM-T-003', name: 'Banyan', status: 'Moderate', color: '#fef08a', textColor: '#ca8a04' },
  { id: 'PM-T-004', name: 'Mango', status: 'Needs Attention', color: '#ffedd5', textColor: '#ea580c' },
  { id: 'PM-T-005', name: 'Ashoka', status: 'Good', color: '#dcfce7', textColor: '#22c55e' },
  { id: 'PM-T-006', name: 'Gulmohar', status: 'Excellent', color: '#bbf7d0', textColor: '#16a34a' },
];

const INITIAL_TASKS = [
  { id: 1, title: 'Verify 5 trees in Sector 4', assigned: '2026-06-25', due: '2026-07-05', priority: 'High', priorityBg: '#ffedd5', priorityColor: '#ea580c', progress: 40, status: 'pending' },
  { id: 2, title: 'Weekly watering round', assigned: '2026-06-28', due: '2026-07-02', priority: 'Medium', priorityBg: '#fef08a', priorityColor: '#a16207', progress: 0, status: 'pending' },
  { id: 3, title: 'Health check - Banyan grove', assigned: '2026-06-20', due: '2026-06-30', priority: 'Critical', priorityBg: '#ffe4e6', priorityColor: '#e11d48', progress: 75, status: 'pending' },
  { id: 4, title: 'Plantation monitoring - Zone A', assigned: '2026-06-15', due: '2026-06-28', priority: 'Low', priorityBg: '#dcfce7', priorityColor: '#059669', progress: 100, status: 'completed' },
];

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

const EVENTS = [
  {
    id: '1',
    title: 'Van Mahotsav Plantation',
    date: '2026-07-05',
    time: '07:00',
    location: 'Rau Ground, Indore',
    organizer: 'Paryavaran Prahri',
    attendanceMarked: true,
  },
  {
    id: '2',
    title: 'Monsoon Miyawaki Drive',
    date: '2026-07-12',
    time: '06:30',
    location: 'Bhamori Park',
    organizer: 'Nagar Nigam - PP',
    attendanceMarked: true,
  },
  {
    id: '3',
    title: 'Green Sunday Meetup',
    date: '2026-07-20',
    time: '08:00',
    location: 'Vijay Nagar',
    organizer: 'Mitra Zone A',
    attendanceMarked: false,
  },
];

const LEADERBOARD = [
  { id: '1', rank: 1, name: 'Aarav Patel', userId: 'PM-IND-RAU-0011', verified: 132, survival: 96, title: 'Green Guardian' },
  { id: '2', rank: 2, name: 'Neha Joshi', userId: 'PM-IND-VIJ-0007', verified: 118, survival: 94, title: 'Gold Mitra' },
  { id: '3', rank: 3, name: 'Vikram Singh', userId: 'PM-IND-DEP-0004', verified: 101, survival: 92, title: 'Gold Mitra' },
  { id: '4', rank: 4, name: 'Pooja Mehta', userId: 'PM-IND-RAU-0022', verified: 88, survival: 90, title: 'Silver Mitra' },
  { id: '5', rank: 5, name: 'Karthik Rao', userId: 'PM-IND-MHW-0009', verified: 72, survival: 88, title: 'Silver Mitra' },
  { id: '6', rank: 6, name: 'Anita Verma', userId: 'PM-IND-SAN-0015', verified: 55, survival: 87, title: 'Bronze Mitra' },
];

const CERTIFICATES = [
  {
    id: '1',
    title: 'Paryavaran Mitra Certificate',
    subtitle: 'Official recognition as a field guardian.',
  },
  {
    id: '2',
    title: 'Volunteer Recognition Certificate',
    subtitle: 'For active service in your assigned area.',
  },
  {
    id: '3',
    title: 'Monthly Achievement Certificate',
    subtitle: 'Best Tree Care - July 2026',
  }
];

export default function MitraDashboardScreen({ onLogout }: Props) {
  const [activeTab, setActiveTab] = useState('Overview');

  // Tasks State
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  const handleStartTask = (taskId: number) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'progress' } : t));
  };

  const handleCompleteTask = (taskId: number) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed', progress: 100 } : t));
  };

  // Maintenance Form State
  const [selectedTree, setSelectedTree] = useState(TREES[0].id);
  const [selectedActivity, setSelectedActivity] = useState(ACTIVITY_TYPES[0]);
  const [remarks, setRemarks] = useState('');
  const [recentActivities, setRecentActivities] = useState([
    { id: '1', tree: 'PM-T-004', activity: 'Fertilizer', date: '13/07/2026' }
  ]);

  // Dropdown Modal State
  const [dropdownType, setDropdownType] = useState<'tree' | 'activity' | 'issueType' | 'issuePriority' | null>(null);

  // Issues Form State
  const [selectedIssueType, setSelectedIssueType] = useState(ISSUE_TYPES[0]);
  const [selectedPriority, setSelectedPriority] = useState(PRIORITIES[1]);
  const [issueDesc, setIssueDesc] = useState('');
  const [reportedIssues, setReportedIssues] = useState([
    { id: '1', type: 'Water Shortage', priority: 'Medium', desc: 'Ggg', date: '13/07/2026' }
  ]);

  const handleSaveLog = () => {
    const newActivity = {
      id: Date.now().toString(),
      tree: selectedTree,
      activity: selectedActivity,
      date: new Date().toLocaleDateString('en-GB') // DD/MM/YYYY format
    };
    setRecentActivities([newActivity, ...recentActivities]);
    setRemarks('');
  };

  const handleSubmitIssue = () => {
    const newIssue = {
      id: Date.now().toString(),
      type: selectedIssueType,
      priority: selectedPriority,
      desc: issueDesc,
      date: new Date().toLocaleDateString('en-GB')
    };
    setReportedIssues([newIssue, ...reportedIssues]);
    setIssueDesc('');
  };

  return (
    <View style={styles.root}>
      {/* BACKGROUND GRADIENT */}
      <LinearGradient
        colors={['#e8faef', '#f4f9f4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: getTopInset(16) }]}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.backButton} onPress={onLogout}>
            <AppIcon name="arrow-left" size={20} color="#111827" />
          </Pressable>
          <View>
            <Text style={styles.headerTitle}>Mitra Dashboard</Text>
            <Text style={styles.headerSubtitle}>Rau · Zone A · Sector 4</Text>
          </View>
        </View>
        <Pressable style={styles.bellButton}>
          <AppIcon name="bell-outline" size={20} color="#111827" />
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
                <Text style={styles.avatarText}>GY</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Goutam Yadav</Text>
                <Text style={styles.profileRole}>Farmer</Text>
                <Text style={styles.profileId}>PM-IND-RAU-0112</Text>
              </View>
            </View>

            <View style={styles.profileStatsRow}>
              <View style={styles.profileStatBox}>
                <Text style={styles.profileStatLabel}>Joined</Text>
                <Text style={styles.profileStatValue}>2026-07-08</Text>
              </View>
              <View style={styles.profileStatBox}>
                <Text style={styles.profileStatLabel}>Mobile</Text>
                <Text style={styles.profileStatValue}>8817678132</Text>
              </View>
              <View style={styles.profileStatBox}>
                <Text style={styles.profileStatLabel}>Area</Text>
                <Text style={styles.profileStatValue}>Zone A/Sector 4</Text>
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
            <Text style={styles.gridValue}>8</Text>
            <Text style={styles.gridLabel}>Trees Under Care</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.gridIconCircle}>
              <AppIcon name="check-circle-outline" size={16} color="#059669" />
            </View>
            <Text style={styles.gridValue}>0</Text>
            <Text style={styles.gridLabel}>Verified / Month</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.gridIconCircle}>
              <AppIcon name="clipboard-text-outline" size={16} color="#d97706" />
            </View>
            <Text style={styles.gridValue}>3</Text>
            <Text style={styles.gridLabel}>Pending Tasks</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.gridIconCircle}>
              <AppIcon name="ribbon" size={16} color="#059669" />
            </View>
            <Text style={styles.gridValue}>1</Text>
            <Text style={styles.gridLabel}>Completed</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.gridIconCircle}>
              <AppIcon name="file-alert-outline" size={16} color="#e11d48" />
            </View>
            <Text style={styles.gridValue}>0</Text>
            <Text style={styles.gridLabel}>Issues</Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.gridIconCircle}>
              <AppIcon name="heart-pulse" size={16} color="#059669" />
            </View>
            <Text style={styles.gridValue}>88%</Text>
            <Text style={styles.gridLabel}>Survival</Text>
          </View>
        </View>

        {/* ACTIONS ROW */}
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionItem} onPress={() => Alert.alert('Coming Soon', 'This feature is coming soon.')}>
            <View style={styles.actionCircle}>
              <AppIcon name="camera-outline" size={24} color="#059669" />
            </View>
            <Text style={styles.actionText}>Verify Tree</Text>
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
                  <Text style={styles.areaValue}>0</Text>
                  <Text style={styles.areaLabel}>Verified</Text>
                </View>
                <View style={styles.areaBox}>
                  <Text style={styles.areaValue}>4</Text>
                  <Text style={styles.areaLabel}>Missing verification</Text>
                </View>
                <View style={styles.areaBox}>
                  <Text style={styles.areaValue}>2</Text>
                  <Text style={styles.areaLabel}>Needing watering</Text>
                </View>
                <View style={styles.areaBox}>
                  <Text style={styles.areaValue}>1</Text>
                  <Text style={styles.areaLabel}>Requiring attention</Text>
                </View>
              </View>
            </View>

            {/* Survival Analytics */}
            <View style={styles.cardSection}>
              <Text style={styles.cardSectionTitle}>Survival Analytics</Text>

              <View style={styles.survivalRow}>
                <View style={[styles.survivalBox, { backgroundColor: '#eefcf3' }]}>
                  <Text style={[styles.survivalValue, { color: '#059669' }]}>5</Text>
                  <Text style={styles.survivalLabel}>Healthy</Text>
                </View>
                <View style={[styles.survivalBox, { backgroundColor: '#fffbeb' }]}>
                  <Text style={[styles.survivalValue, { color: '#d97706' }]}>2</Text>
                  <Text style={styles.survivalLabel}>At Risk</Text>
                </View>
                <View style={[styles.survivalBox, { backgroundColor: '#fff1f2' }]}>
                  <Text style={[styles.survivalValue, { color: '#e11d48' }]}>1</Text>
                  <Text style={styles.survivalLabel}>Dead</Text>
                </View>
              </View>

              <Text style={styles.chartTitle}>Monthly survival trend</Text>
              <View style={styles.chartRow}>
                {/* Fake Bar Chart */}
                {[40, 50, 55, 60, 65, 70].map((height, i) => (
                  <View key={i} style={styles.barWrap}>
                    <LinearGradient
                      colors={['#34d399', '#059669']}
                      style={[styles.bar, { height }]}
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* Trees Under Your Care */}
            <View style={styles.cardSection}>
              <Text style={styles.cardSectionTitle}>Trees Under Your Care</Text>

              <View style={styles.treeList}>
                {TREES.map((tree, index) => (
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
                    <Pressable
                      style={[styles.taskBtn, styles.taskBtnStart]}
                      onPress={() => handleStartTask(task.id)}
                    >
                      <AppIcon name={task.status === 'progress' ? 'update' : 'play-outline'} size={16} color="#fff" />
                      <Text style={styles.taskBtnText}>
                        {task.status === 'progress' ? 'Progress' : 'Start'}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.taskBtn, styles.taskBtnMark]}
                      onPress={() => handleCompleteTask(task.id)}
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
                      {selectedTree} · {TREES.find(t => t.id === selectedTree)?.name}
                    </Text>
                    <AppIcon name={dropdownType === 'tree' ? 'chevron-up' : 'chevron-down'} size={16} color={dropdownType === 'tree' ? '#059669' : '#6b7280'} />
                  </Pressable>

                  {dropdownType === 'tree' && (
                    <View style={styles.floatingDropdown}>
                      {TREES.map((tree) => {
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
                <Pressable style={styles.photoBox}>
                  <AppIcon name="camera-outline" size={24} color="#059669" />
                  <Text style={styles.photoText}>Before photo</Text>
                </Pressable>
                <Pressable style={styles.photoBox}>
                  <AppIcon name="camera-outline" size={24} color="#059669" />
                  <Text style={styles.photoText}>After photo</Text>
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

              <Pressable style={styles.saveLogBtn} onPress={handleSaveLog}>
                <Text style={styles.saveLogBtnText}>Save Maintenance Log</Text>
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
            {EVENTS.map((event) => (
              <View key={event.id} style={styles.taskCard}>

                <View style={[styles.taskHeaderRow, { marginBottom: 16 }]}>
                  <View style={styles.taskIconBg}>
                    <AppIcon name="calendar-outline" size={20} color="#059669" />
                  </View>
                  <View style={styles.taskTitleCol}>
                    <Text style={styles.taskTitle}>{event.title}</Text>
                    <Text style={styles.taskSubtitle}>
                      {event.date} · {event.time} · {event.location}
                    </Text>
                    <Text style={styles.eventOrganizer}>
                      By {event.organizer}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.taskActionRow}>
                  <Pressable style={[styles.taskBtn, styles.taskBtnStart]}>
                    <Text style={[styles.taskBtnText, { marginLeft: 0 }]}>Join Event</Text>
                  </Pressable>

                  {event.attendanceMarked ? (
                    <Pressable style={[styles.taskBtn, styles.taskBtnMark]}>
                      <Text style={[styles.taskBtnText, { marginLeft: 0 }]}>Attendance ✓</Text>
                    </Pressable>
                  ) : (
                    <Pressable style={[styles.taskBtn, styles.taskBtnOutline]}>
                      <Text style={styles.taskBtnOutlineText}>Mark Attendance</Text>
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
                {LEADERBOARD.map((user) => {
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
                        <Text style={styles.leaderboardStatValue}>{user.verified} verified</Text>
                        <Text style={styles.leaderboardStatLabel}>{user.survival}% survival</Text>
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

              <Pressable style={[styles.photoBox, { height: 50, flexDirection: 'row', marginBottom: 8 }]}>
                <AppIcon name="camera-outline" size={20} color="#059669" />
                <Text style={[styles.photoText, { marginTop: 0, marginLeft: 8 }]}>Attach photo (optional)</Text>
              </Pressable>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <AppIcon name="map-marker-outline" size={14} color="#6b7280" />
                <Text style={{ fontSize: 11, color: '#6b7280', marginLeft: 4 }}>
                  GPS location captured automatically on submit.
                </Text>
              </View>

              <Pressable style={[styles.saveLogBtn, { backgroundColor: '#e11d48' }]} onPress={handleSubmitIssue}>
                <Text style={styles.saveLogBtnText}>Submit Report</Text>
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
            {CERTIFICATES.map((cert) => (
              <View key={cert.id} style={styles.taskCard}>

                <View style={[styles.taskHeaderRow, { marginBottom: 16 }]}>
                  <View style={[styles.taskIconBg, { backgroundColor: '#fef3c7' }]}>
                    <AppIcon name="ribbon" size={20} color="#d97706" />
                  </View>
                  <View style={styles.taskTitleCol}>
                    <Text style={styles.taskTitle}>{cert.title}</Text>
                    <Text style={styles.taskSubtitle}>{cert.subtitle}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.taskActionRow}>
                  <Pressable style={[styles.taskBtn, styles.taskBtnStart]}>
                    <AppIcon name="download-outline" size={16} color="#fff" />
                    <Text style={styles.taskBtnText}>Download</Text>
                  </Pressable>

                  <Pressable style={[styles.taskBtn, styles.taskBtnOutline, { borderColor: '#e5e7eb' }]}>
                    <Text style={[styles.taskBtnOutlineText, { color: '#111827' }]}>Share</Text>
                  </Pressable>
                </View>

              </View>
            ))}
          </View>
        )}

      </ScrollView>

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
    height: 80,
    gap: 8,
  },
  barWrap: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
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

});
