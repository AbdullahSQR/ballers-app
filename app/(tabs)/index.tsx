import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const mockUser = { username: 'Baller', ovr: 70, wins: 0, draws: 0, losses: 0 };

const MY_TEAMS = [
  { id: '1', name: 'FC Wolves', captain: true },
  { id: '2', name: 'Desert Eagles', captain: false },
];

const OPPONENT_TEAMS = [
  { id: 'o1', name: 'Al Nasr FC', ovr: 89.7 },
  { id: 'o2', name: 'Muscat United', ovr: 88.2 },
  { id: 'o3', name: 'Thunder Wolves', ovr: 87.5 },
  { id: 'o4', name: 'Royal Knights', ovr: 86.9 },
];

const NOTIFICATIONS = [
  { id: 1, icon: 'person-add-outline', message: 'Ahmed Al Balushi invited you to Desert Eagles', time: '2h ago', read: false },
  { id: 2, icon: 'football-outline', message: 'Your match on May 1 has been confirmed', time: '5h ago', read: false },
  { id: 3, icon: 'shield-outline', message: 'Muscat United challenged FC Wolves', time: '1d ago', read: true },
  { id: 4, icon: 'trophy-outline', message: "You've moved up to rank #8 this month", time: '2d ago', read: true },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DATES = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1);
  return d;
});

export default function HomeScreen() {
  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  const [challengeStep, setChallengeStep] = useState<'pick-team' | 'pick-opponent' | 'done'>('pick-team');
  const [myTeam, setMyTeam] = useState('');
  const [opponent, setOpponent] = useState('');
  const [challengeDate, setChallengeDate] = useState(DATES[0]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const joinMatch = () => {
    setActiveMatch({
      id: 'match_demo',
      location: 'Al Nasr Club, Muscat',
      date: 'Today',
      time: '9:00 PM',
      playersJoined: 1,
      status: 'waiting',
    });
  };

  const leaveMatch = () => setActiveMatch(null);

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const openChallenge = () => {
    setChallengeStep('pick-team');
    setMyTeam('');
    setOpponent('');
    setChallengeDate(DATES[0]);
    setShowChallenge(true);
  };

  const closeChallenge = () => {
    setShowChallenge(false);
    setChallengeStep('pick-team');
    setMyTeam('');
    setOpponent('');
  };

  const challengedOpponent = OPPONENT_TEAMS.find(o => o.id === opponent);

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/pitch.png')} style={styles.bgImage} resizeMode="cover" />
      <View style={styles.overlay} />
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back, {mockUser.username}</Text>
            <Text style={styles.headTitle}>Ready to play?</Text>
          </View>
          <TouchableOpacity style={styles.bell} onPress={() => setShowNotifs(true)}>
            <Ionicons name="notifications-outline" size={22} color="white" />
            {unreadCount > 0 && (
              <View style={styles.notifDot}>
                <Text style={styles.notifDotText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{mockUser.ovr}</Text>
            <Text style={styles.statLab}>OVR</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{mockUser.wins}</Text>
            <Text style={styles.statLab}>Wins</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{mockUser.draws}</Text>
            <Text style={styles.statLab}>Draws</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{mockUser.losses}</Text>
            <Text style={styles.statLab}>Losses</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.joinBtn} onPress={activeMatch ? leaveMatch : joinMatch}>
          <View style={styles.joinIcon}>
            <Ionicons name="flash" size={32} color="white" />
          </View>
          <Text style={styles.joinTitle}>{activeMatch ? 'In a Match' : 'Join a Match'}</Text>
          <Text style={styles.joinSub}>{activeMatch ? 'Tap to leave' : 'One tap. We find your game.'}</Text>
        </TouchableOpacity>

        {activeMatch && (
          <View style={styles.matchCard}>
            <View style={styles.matchTop}>
              <Text style={styles.matchTitle}>Your Next Match</Text>
              <View style={[
                styles.badge,
                { backgroundColor: activeMatch.status === 'confirmed' ? 'rgba(100,220,100,0.2)' : 'rgba(255,255,255,0.15)', borderColor: activeMatch.status === 'confirmed' ? 'rgba(100,220,100,0.4)' : 'rgba(255,255,255,0.2)' }
              ]}>
                <Text style={[styles.badgeText, { color: activeMatch.status === 'confirmed' ? '#69db7c' : 'white' }]}>
                  {activeMatch.status === 'confirmed' ? 'Confirmed' : `${activeMatch.playersJoined}/14 players`}
                </Text>
              </View>
            </View>
            <View style={styles.matchDetails}>
              <View style={styles.matchRow}>
                <Ionicons name="location-outline" size={15} color="#aaa" />
                <Text style={styles.matchText}>{activeMatch.location}</Text>
              </View>
              <View style={styles.matchRow}>
                <Ionicons name="calendar-outline" size={15} color="#aaa" />
                <Text style={styles.matchText}>{activeMatch.date} · {activeMatch.time}</Text>
              </View>
              <View style={styles.matchRow}>
                <Ionicons name="people-outline" size={15} color="#aaa" />
                <Text style={styles.matchText}>{activeMatch.playersJoined}/14 players joined</Text>
              </View>
            </View>
            <View style={styles.progBack}>
              <View style={[styles.progFill, { width: `${(activeMatch.playersJoined / 14) * 100}%` }]} />
            </View>
            <View style={styles.matchActions}>
              <TouchableOpacity style={styles.leaveBtn} onPress={leaveMatch}>
                <Text style={styles.leave}>Leave</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.viewBtn} onPress={() => setShowMatchDetails(true)}>
                <Text style={styles.view}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.challengeCard} onPress={openChallenge}>
          <View style={styles.challengeLeft}>
            <View style={styles.challengeIcon}>
              <Ionicons name="shield" size={24} color="white" />
            </View>
            <View>
              <Text style={styles.challengeTitle}>Challenge a Team</Text>
              <Text style={styles.challengeSub}>Pick your rival. Set the date.</Text>
            </View>
          </View>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>

      </ScrollView>

      {/* Notifications Modal */}
      <Modal visible={showNotifs} transparent animationType="slide">
        <View style={styles.overlay2}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.notifHeader}>
              <Text style={styles.sheetTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllRead}>
                  <Text style={styles.markRead}>Mark all read</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={{ gap: 10 }}>
              {notifications.map((n) => (
                <View key={n.id} style={[styles.notifRow, n.read && { opacity: 0.5 }]}>
                  <View style={styles.notifIcon}>
                    <Ionicons name={n.icon as any} size={18} color="white" />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.notifMsg}>{n.message}</Text>
                    <Text style={styles.notifTime}>{n.time}</Text>
                  </View>
                  {!n.read && <View style={styles.unreadDot} />}
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.secBtn} onPress={() => setShowNotifs(false)}>
              <Text style={styles.secText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Match Details Modal */}
      <Modal visible={showMatchDetails} transparent animationType="slide">
        <View style={styles.overlay2}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Match Details</Text>
            {activeMatch && (
              <View style={{ gap: 12 }}>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={18} color="#666" />
                  <View>
                    <Text style={styles.detailLabel}>Venue</Text>
                    <Text style={styles.detailVal}>{activeMatch.location}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={18} color="#666" />
                  <View>
                    <Text style={styles.detailLabel}>Date & Time</Text>
                    <Text style={styles.detailVal}>{activeMatch.date} · {activeMatch.time}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="people-outline" size={18} color="#666" />
                  <View>
                    <Text style={styles.detailLabel}>Players</Text>
                    <Text style={styles.detailVal}>{activeMatch.playersJoined} of 14 joined</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="radio-button-on-outline" size={18} color="#666" />
                  <View>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text style={[styles.detailVal, { color: activeMatch.status === 'confirmed' ? '#69db7c' : '#FFD700' }]}>
                      {activeMatch.status === 'confirmed' ? 'Confirmed' : 'Waiting for players'}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailProgBack}>
                  <View style={[styles.detailProgFill, { width: `${(activeMatch.playersJoined / 14) * 100}%` }]} />
                </View>
              </View>
            )}
            <TouchableOpacity style={[styles.leaveFullBtn]} onPress={() => { leaveMatch(); setShowMatchDetails(false); }}>
              <Text style={styles.leaveFullText}>Leave Match</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secBtn} onPress={() => setShowMatchDetails(false)}>
              <Text style={styles.secText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Challenge Modal */}
      <Modal visible={showChallenge} transparent animationType="slide">
        <View style={styles.overlay2}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            {challengeStep === 'pick-team' && (
              <>
                <Text style={styles.sheetTitle}>Challenge a Team</Text>
                <Text style={styles.sheetSub}>Which team are you representing?</Text>
                {MY_TEAMS.filter(t => t.captain).length === 0 ? (
                  <View style={styles.noCaptainWrap}>
                    <Ionicons name="shield-outline" size={36} color="#333" />
                    <Text style={styles.noCaptainText}>You need to be a captain of a team to send challenges.</Text>
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    {MY_TEAMS.filter(t => t.captain).map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.pickRow, myTeam === t.id && styles.pickRowOn]}
                        onPress={() => setMyTeam(t.id)}
                      >
                        <View style={styles.pickAvatar}>
                          <Ionicons name="shield" size={16} color="white" />
                        </View>
                        <Text style={styles.pickName}>{t.name}</Text>
                        {myTeam === t.id && <Ionicons name="checkmark-circle" size={20} color="white" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.primaryBtn, (!myTeam || MY_TEAMS.filter(t => t.captain).length === 0) && { opacity: 0.3 }]}
                  onPress={() => setChallengeStep('pick-opponent')}
                  disabled={!myTeam || MY_TEAMS.filter(t => t.captain).length === 0}
                >
                  <Text style={styles.primaryText}>Next</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secBtn} onPress={closeChallenge}>
                  <Text style={styles.secText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
            {challengeStep === 'pick-opponent' && (
              <>
                <Text style={styles.sheetTitle}>Pick your rival</Text>
                <Text style={styles.sheetSub}>As <Text style={{ color: 'white', fontWeight: '700' }}>{MY_TEAMS.find(t => t.id === myTeam)?.name}</Text></Text>
                <View style={{ gap: 8 }}>
                  {OPPONENT_TEAMS.map((opp) => (
                    <TouchableOpacity
                      key={opp.id}
                      style={[styles.pickRow, opponent === opp.id && styles.pickRowOn]}
                      onPress={() => setOpponent(opp.id)}
                    >
                      <View style={styles.pickAvatar}>
                        <Ionicons name="shield" size={16} color="white" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pickName}>{opp.name}</Text>
                        <Text style={styles.pickOvr}>{opp.ovr} OVR</Text>
                      </View>
                      {opponent === opp.id && <Ionicons name="checkmark-circle" size={20} color="white" />}
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.fieldLabel}>Preferred date</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                  {DATES.map((d, i) => {
                    const on = d.toDateString() === challengeDate.toDateString();
                    return (
                      <TouchableOpacity key={i} style={[styles.dateChip, on && styles.dateChipOn]} onPress={() => setChallengeDate(d)}>
                        <Text style={[styles.dayName, on && { color: '#bbb' }]}>{DAY_NAMES[d.getDay()]}</Text>
                        <Text style={[styles.dayNum, on && { color: 'white' }]}>{d.getDate()}</Text>
                        <Text style={[styles.dayMon, on && { color: '#aaa' }]}>{MONTH_NAMES[d.getMonth()]}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity
                  style={[styles.primaryBtn, !opponent && { opacity: 0.3 }]}
                  onPress={() => { if (opponent) setChallengeStep('done'); }}
                  disabled={!opponent}
                >
                  <Text style={styles.primaryText}>Send Challenge</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secBtn} onPress={() => setChallengeStep('pick-team')}>
                  <Text style={styles.secText}>Back</Text>
                </TouchableOpacity>
              </>
            )}
            {challengeStep === 'done' && (
              <>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark" size={32} color="white" />
                </View>
                <Text style={styles.sheetTitle}>Challenge Sent!</Text>
                <Text style={styles.sheetSub}>
                  {challengedOpponent?.name} has been challenged for{'\n'}
                  {DAY_NAMES[challengeDate.getDay()]}, {MONTH_NAMES[challengeDate.getMonth()]} {challengeDate.getDate()}.
                </Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={closeChallenge}>
                  <Text style={styles.primaryText}>Done</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  bgImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.78)' },
  scroll: { paddingTop: 65, gap: 14, paddingHorizontal: 22, paddingBottom: 110 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  greeting: { marginBottom: 4, fontSize: 13, color: '#888', fontWeight: '500' },
  headTitle: { fontWeight: '900', fontSize: 26, color: 'white', lineHeight: 34, letterSpacing: 0.3 },
  bell: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#ff6b6b', justifyContent: 'center', alignItems: 'center' },
  notifDotText: { color: 'white', fontSize: 9, fontWeight: '800' },
  statsCard: { flexDirection: 'row', borderRadius: 16, padding: 16, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontWeight: '800', color: 'white', fontSize: 18 },
  statLab: { fontWeight: '500', fontSize: 11, color: '#888' },
  statDiv: { height: 30, width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  joinBtn: { gap: 10, padding: 28, borderRadius: 24, alignItems: 'center', borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)' },
  joinIcon: { marginBottom: 4, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  joinTitle: { letterSpacing: 0.5, color: 'white', fontSize: 20, fontWeight: '900' },
  joinSub: { fontSize: 13, color: '#999' },
  matchCard: { gap: 14, borderRadius: 20, padding: 18, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' },
  matchTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  matchTitle: { fontWeight: '800', color: 'white', fontSize: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontWeight: '600', fontSize: 11 },
  matchDetails: { gap: 8 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matchText: { fontSize: 13, color: '#bbb' },
  progBack: { borderRadius: 2, height: 4, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)' },
  progFill: { borderRadius: 2, height: '100%', backgroundColor: 'white' },
  matchActions: { flexDirection: 'row', gap: 10 },
  leaveBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  leave: { fontWeight: '600', color: '#aaa', fontSize: 14 },
  viewBtn: { flex: 2, padding: 12, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  view: { color: 'white', fontWeight: '700', fontSize: 14 },
  challengeCard: { flexDirection: 'row', padding: 18, borderRadius: 20, alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  challengeLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  challengeIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  challengeTitle: { fontWeight: '800', fontSize: 16, marginBottom: 3, color: 'white' },
  challengeSub: { color: '#999', fontSize: 12 },
  overlay2: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48, gap: 14, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 8 },
  sheetTitle: { fontWeight: '900', fontSize: 22, color: 'white' },
  sheetSub: { color: '#666', fontSize: 13, lineHeight: 20 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  markRead: { color: '#666', fontSize: 13, fontWeight: '600' },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  notifIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  notifMsg: { color: 'white', fontSize: 13, fontWeight: '500', lineHeight: 18 },
  notifTime: { color: '#555', fontSize: 11 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  detailLabel: { color: '#666', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  detailVal: { color: 'white', fontSize: 14, fontWeight: '600', marginTop: 2 },
  detailProgBack: { height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)' },
  detailProgFill: { height: '100%', borderRadius: 3, backgroundColor: 'white' },
  leaveFullBtn: { padding: 16, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,80,80,0.3)', backgroundColor: 'rgba(255,80,80,0.1)' },
  leaveFullText: { fontWeight: '700', color: '#ff6b6b', fontSize: 15 },
  secBtn: { padding: 14, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  secText: { fontWeight: '600', color: '#666', fontSize: 15 },
  primaryBtn: { padding: 16, borderRadius: 24, alignItems: 'center', backgroundColor: 'white' },
  primaryText: { fontWeight: '800', fontSize: 16, color: 'black' },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 4 },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.05)' },
  pickRowOn: { borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.12)' },
  pickAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  pickName: { flex: 1, fontWeight: '700', color: 'white', fontSize: 14 },
  pickOvr: { color: '#666', fontSize: 11 },
  noCaptainWrap: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  noCaptainText: { color: '#555', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  fieldLabel: { fontWeight: '700', fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateChip: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', gap: 2 },
  dateChipOn: { borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.15)' },
  dayName: { fontSize: 10, color: '#555', fontWeight: '600' },
  dayNum: { fontSize: 16, fontWeight: '800', color: '#555' },
  dayMon: { fontSize: 9, color: '#444', fontWeight: '500' },
});
