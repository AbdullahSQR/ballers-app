import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { DAY_NAMES, MONTH_NAMES, generateDates } from '../../lib/constants';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  related_entity_id: string | null;
  created_at: string;
};

type Participant = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  team_side: string;
  position_played: string;
};

type ActiveMatch = {
  id: string;
  match_type: string;
  status: string;
  scheduled_at: string;
  max_players: number;
  players_joined: number;
  team_side: string;
  stadium: { id: string; name: string; address: string } | null;
  is_creator: boolean;
  participants: Participant[];
};

type MyTeam = {
  id: string;
  name: string;
  logo_url: string | null;
  is_captain: boolean;
  member_count: number;
  ovr: number;
};

type LeaderboardTeam = {
  rank: number;
  id: string;
  name: string;
  ovr: number;
  wins: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DATES = generateDates(14);

function formatMatchDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

function formatMatchTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function notifIcon(type: string): string {
  switch (type) {
    case 'challenge':    return 'shield-outline';
    case 'match_filled': return 'football-outline';
    case 'match_invite': return 'person-add-outline';
    case 'ranking':      return 'trophy-outline';
    default:             return 'notifications-outline';
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user } = useAuth();
  const profile = user?.player_profile as any;

  // ── State ────────────────────────────────────────────────────────────────

  const [activeMatch, setActiveMatch] = useState<ActiveMatch | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  const [showMatchDetails, setShowMatchDetails] = useState(false);

  // ── Invite (inside match details modal) ──────────────────────────────────
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteLoading,  setInviteLoading]  = useState(false);
  const [inviteMsg,      setInviteMsg]      = useState<{ ok: boolean; text: string } | null>(null);

  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeStep, setChallengeStep] = useState<'pick-team' | 'pick-opponent' | 'done'>('pick-team');
  const [myTeams, setMyTeams] = useState<MyTeam[]>([]);
  const [opponentTeams, setOpponentTeams] = useState<LeaderboardTeam[]>([]);
  const [myTeamId, setMyTeamId] = useState('');
  const [opponentTeamId, setOpponentTeamId] = useState('');
  const [challengeDate, setChallengeDate] = useState(DATES[0]);
  const [challengeSending, setChallengeSending] = useState(false);
  const [challengedName, setChallengedName] = useState('');

  // ── Fetch on focus (runs on mount and every time tab is re-visited) ─────────

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
      fetchActiveMatch();
    }, [])
  );

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data ?? []);
    } catch {
      // silently fail — not critical
    }
  };

  const fetchActiveMatch = async () => {
    try {
      const res = await api.get('/users/me/active-match');
      const data = res.data.data;
      if (data) {
        setActiveMatch({
          ...data,
          participants: (data.participants ?? []).map((p: any) => ({
            user_id:         p.user_id,
            username:        p.username ?? '—',
            avatar_url:      p.avatar_url ?? null,
            team_side:       p.team_side,
            position_played: p.position_played,
          })),
        });
      } else {
        setActiveMatch(null);
      }
    } catch {
      // silently fail
    }
  };

  // ── Notifications ─────────────────────────────────────────────────────────

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {
      // silently fail
    }
  };

  // ── Matchmaking ───────────────────────────────────────────────────────────

  const joinMatch = async () => {
    setMatchLoading(true);
    try {
      const res = await api.post('/matchmaking/find');
      const match = res.data.data?.match;
      const participants = match?.participants?.length ?? 1;
      setActiveMatch({
        id:             match.id,
        match_type:     match.match_type ?? 'open',
        status:         match.status,
        scheduled_at:   match.scheduled_at,
        max_players:    match.max_players,
        players_joined: participants,
        team_side:      match.participants?.find((p: any) => p.user_id === user?.id)?.team_side ?? 'home',
        stadium:        match.stadium ?? null,
        is_creator:     match.creator_id === user?.id,
        participants:   (match.participants ?? []).map((p: any) => ({
          user_id:         p.user_id,
          username:        p.user?.username ?? p.username ?? '—',
          avatar_url:      p.user?.avatar_url ?? p.avatar_url ?? null,
          team_side:       p.team_side,
          position_played: p.position_played,
        })),
      });
    } catch (err: any) {
      const code = err?.response?.data?.code ?? err?.code;
      const msg =
        code === 'ALREADY_IN_MATCH' ? 'You are already in an active match.' :
        code === 'NO_PROFILE'       ? 'Complete your profile first.' :
        err?.response?.data?.message ?? err.message ?? 'Could not find a match. Try again.';
      Alert.alert('Oops', msg);
      fetchActiveMatch(); // restore if they're already in one
    } finally {
      setMatchLoading(false);
    }
  };

  const leaveMatch = async () => {
    if (!activeMatch) return;
    Alert.alert('Leave Match', 'Are you sure you want to leave this match?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/matches/${activeMatch.id}/leave`);
            setActiveMatch(null);
            setShowMatchDetails(false);
          } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Could not leave match.');
          }
        },
      },
    ]);
  };

  const cancelMatch = async () => {
    if (!activeMatch) return;
    Alert.alert('Cancel Match', 'Are you sure you want to cancel this match? This cannot be undone.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel Match', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/matches/${activeMatch.id}`);
            setActiveMatch(null);
            setShowMatchDetails(false);
          } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Could not cancel match.');
          }
        },
      },
    ]);
  };

  // ── Challenge ─────────────────────────────────────────────────────────────

  const openChallenge = async () => {
    setMyTeamId('');
    setOpponentTeamId('');
    setChallengeDate(DATES[0]);
    setChallengeStep('pick-team');
    setShowChallenge(true);

    try {
      const [myRes, leaderRes] = await Promise.all([
        api.get('/teams'),
        api.get('/leaderboard/teams'),
      ]);
      const mine: MyTeam[] = myRes.data.data ?? [];
      const all: LeaderboardTeam[] = leaderRes.data.data ?? [];
      const myIds = new Set(mine.map(t => t.id));
      setMyTeams(mine);
      setOpponentTeams(all.filter(t => !myIds.has(t.id)));
    } catch {
      // silently fail — modal will show empty state
    }
  };

  const closeChallenge = () => {
    setShowChallenge(false);
    setChallengeStep('pick-team');
    setMyTeamId('');
    setOpponentTeamId('');
    setChallengeSending(false);
  };

  const sendChallenge = async () => {
    if (!myTeamId || !opponentTeamId) return;
    setChallengeSending(true);
    try {
      // Set time to 6pm on selected date
      const date = new Date(challengeDate);
      date.setHours(18, 0, 0, 0);
      await api.post('/challenges', {
        my_team_id: myTeamId,
        opponent_team_id: opponentTeamId,
        scheduled_at: date.toISOString(),
      });
      const opp = opponentTeams.find(t => t.id === opponentTeamId);
      setChallengedName(opp?.name ?? 'the team');
      setChallengeStep('done');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not send challenge.');
    } finally {
      setChallengeSending(false);
    }
  };

  const myCaptainTeams = myTeams.filter(t => t.is_captain);

  // ── Invite a player to active match ──────────────────────────────────────

  const sendInvite = async () => {
    if (!activeMatch || !inviteUsername.trim()) return;
    setInviteLoading(true);
    setInviteMsg(null);
    try {
      await api.post(`/matches/${activeMatch.id}/invite`, { username: inviteUsername.trim() });
      setInviteMsg({ ok: true, text: `Invite sent to ${inviteUsername.trim()}` });
      setInviteUsername('');
    } catch (err: any) {
      const code = err?.response?.data?.code ?? '';
      const text =
        code === 'USER_NOT_FOUND'     ? 'Player not found' :
        code === 'ALREADY_IN_MATCH'   ? 'Player is already in this match' :
        code === 'ALREADY_INVITED'    ? 'Player already invited' :
        code === 'CANNOT_INVITE_SELF' ? 'You cannot invite yourself' :
        'Could not send invite';
      setInviteMsg({ ok: false, text });
    } finally {
      setInviteLoading(false);
    }
  };

  // ── Accept a match invite from the notifications panel ───────────────────

  const joinFromInvite = async (matchId: string) => {
    try {
      await api.post(`/matches/${matchId}/join`);
      setShowNotifs(false);
      fetchActiveMatch();
    } catch (err: any) {
      const code = err?.response?.data?.code ?? '';
      Alert.alert(
        'Could not join',
        code === 'ALREADY_JOINED'  ? 'You are already in this match.' :
        code === 'MATCH_FULL'      ? 'This match is already full.' :
        code === 'ALREADY_IN_MATCH'? 'You are already in an active match.' :
        'Something went wrong.',
      );
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/pitch.png')} style={styles.bgImage} resizeMode="cover" />
      <View style={styles.overlay} />
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back, {user?.username ?? 'Baller'}</Text>
            <Text style={styles.headTitle}>Ready to play?</Text>
          </View>
          <TouchableOpacity style={styles.bell} onPress={() => { fetchNotifications(); setShowNotifs(true); }}>
            <Ionicons name="notifications-outline" size={22} color="white" />
            {unreadCount > 0 && (
              <View style={styles.notifDot}>
                <Text style={styles.notifDotText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{profile?.ovr?.toFixed(1) ?? '—'}</Text>
            <Text style={styles.statLab}>OVR</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{profile?.wins ?? 0}</Text>
            <Text style={styles.statLab}>Wins</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{profile?.draws ?? 0}</Text>
            <Text style={styles.statLab}>Draws</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{profile?.losses ?? 0}</Text>
            <Text style={styles.statLab}>Losses</Text>
          </View>
        </View>

        {/* Join / In a Match button */}
        <TouchableOpacity
          style={[styles.joinBtn, matchLoading && { opacity: 0.6 }]}
          onPress={activeMatch ? () => setShowMatchDetails(true) : joinMatch}
          disabled={matchLoading}
          activeOpacity={0.8}
        >
          {matchLoading ? (
            <ActivityIndicator color="white" size="large" style={{ marginBottom: 8 }} />
          ) : (
            <View style={styles.joinIcon}>
              <Ionicons name={activeMatch ? 'football' : 'flash'} size={32} color="white" />
            </View>
          )}
          <Text style={styles.joinTitle}>{activeMatch ? 'In a Match' : matchLoading ? 'Finding game…' : 'Join a Match'}</Text>
          <Text style={styles.joinSub}>{activeMatch ? 'Tap to view details' : 'One tap. We find your game.'}</Text>
        </TouchableOpacity>

        {/* Active match card */}
        {activeMatch && (
          <View style={styles.matchCard}>
            <View style={styles.matchTop}>
              <Text style={styles.matchTitle}>Your Next Match</Text>
              <View style={[
                styles.badge,
                activeMatch.status === 'ready'
                  ? { backgroundColor: 'rgba(100,220,100,0.2)', borderColor: 'rgba(100,220,100,0.4)' }
                  : { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }
              ]}>
                <Text style={[styles.badgeText, { color: activeMatch.status === 'ready' ? '#69db7c' : 'white' }]}>
                  {activeMatch.status === 'ready' ? 'Ready!' : `${activeMatch.players_joined}/${activeMatch.max_players} players`}
                </Text>
              </View>
            </View>
            <View style={styles.matchDetails}>
              <View style={styles.matchRow}>
                <Ionicons name="location-outline" size={15} color="#aaa" />
                <Text style={styles.matchText}>
                  {activeMatch.stadium?.name ?? 'Location TBD'}
                </Text>
              </View>
              <View style={styles.matchRow}>
                <Ionicons name="calendar-outline" size={15} color="#aaa" />
                <Text style={styles.matchText}>
                  {formatMatchDate(activeMatch.scheduled_at)} · {formatMatchTime(activeMatch.scheduled_at)}
                </Text>
              </View>
              <View style={styles.matchRow}>
                <Ionicons name="people-outline" size={15} color="#aaa" />
                <Text style={styles.matchText}>{activeMatch.players_joined}/{activeMatch.max_players} players joined</Text>
              </View>
            </View>
            <View style={styles.progBack}>
              <View style={[styles.progFill, { width: `${(activeMatch.players_joined / activeMatch.max_players) * 100}%` }]} />
            </View>
            <View style={styles.matchActions}>
              <TouchableOpacity
                style={styles.leaveBtn}
                onPress={activeMatch?.is_creator ? cancelMatch : leaveMatch}
              >
                <Text style={styles.leave}>{activeMatch?.is_creator ? 'Cancel' : 'Leave'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.viewBtn} onPress={() => setShowMatchDetails(true)}>
                <Text style={styles.view}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Challenge card */}
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

      {/* ── Notifications Modal ── */}
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
            {notifications.length === 0 ? (
              <View style={styles.emptyNotif}>
                <Ionicons name="notifications-off-outline" size={40} color="#333" />
                <Text style={styles.emptyNotifText}>No notifications yet</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <View style={{ gap: 10, paddingBottom: 8 }}>
                  {notifications.map((n) => (
                    <View key={n.id} style={[styles.notifRow, n.is_read && { opacity: 0.45 }]}>
                      <View style={styles.notifIcon}>
                        <Ionicons name={notifIcon(n.type) as any} size={18} color="white" />
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.notifMsg}>{n.body}</Text>
                        <Text style={styles.notifTime}>{timeAgo(n.created_at)}</Text>
                        {n.type === 'match_invite' && n.related_entity_id && !activeMatch && (
                          <TouchableOpacity
                            style={styles.joinInviteBtn}
                            onPress={() => joinFromInvite(n.related_entity_id!)}
                          >
                            <Text style={styles.joinInviteText}>Join Match</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {!n.is_read && <View style={styles.unreadDot} />}
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
            <TouchableOpacity style={styles.secBtn} onPress={() => setShowNotifs(false)}>
              <Text style={styles.secText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Match Details Modal ── */}
      <Modal visible={showMatchDetails} transparent animationType="slide">
        <View style={styles.overlay2}>
          <View style={[styles.sheet, { maxHeight: '90%' }]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Match Details</Text>
            {activeMatch && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
                {/* ── Info rows ── */}
                <View style={{ gap: 12, marginBottom: 16 }}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={18} color="#666" />
                    <View>
                      <Text style={styles.detailLabel}>Venue</Text>
                      <Text style={styles.detailVal}>{activeMatch.stadium?.name ?? 'Location TBD'}</Text>
                      {activeMatch.stadium?.address && (
                        <Text style={styles.detailSub}>{activeMatch.stadium.address}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={18} color="#666" />
                    <View>
                      <Text style={styles.detailLabel}>Date & Time</Text>
                      <Text style={styles.detailVal}>
                        {formatMatchDate(activeMatch.scheduled_at)} · {formatMatchTime(activeMatch.scheduled_at)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="radio-button-on-outline" size={18} color="#666" />
                    <View>
                      <Text style={styles.detailLabel}>Status</Text>
                      <Text style={[styles.detailVal, { color: activeMatch.status === 'ready' ? '#69db7c' : '#FFD700' }]}>
                        {activeMatch.status === 'ready' ? 'Ready to play!' : `Waiting for players · ${activeMatch.players_joined}/${activeMatch.max_players}`}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.detailProgBack}>
                    <View style={[styles.detailProgFill, { width: `${(activeMatch.players_joined / activeMatch.max_players) * 100}%` }]} />
                  </View>
                </View>

                {/* ── Team Rosters ── */}
                {activeMatch.participants.length > 0 && (() => {
                  const home = activeMatch.participants.filter(p => p.team_side === 'home');
                  const away = activeMatch.participants.filter(p => p.team_side === 'away');
                  const POS_ORDER: Record<string, number> = { GK: 0, DEF: 1, MID: 2, ATT: 3 };
                  const sortPos = (a: Participant, b: Participant) =>
                    (POS_ORDER[a.position_played] ?? 9) - (POS_ORDER[b.position_played] ?? 9);
                  const renderTeam = (players: Participant[], label: string, isMyTeam: boolean) => (
                    <View style={styles.teamBlock}>
                      <View style={styles.teamLabelRow}>
                        <Text style={[styles.teamLabel, isMyTeam && { color: '#FFD700' }]}>{label}</Text>
                        {isMyTeam && <Text style={styles.myTeamTag}>You're here</Text>}
                      </View>
                      {players.length === 0 ? (
                        <Text style={styles.noPlayers}>No players yet</Text>
                      ) : (
                        [...players].sort(sortPos).map(p => (
                          <View key={p.user_id} style={styles.rosterRow}>
                            <View style={styles.posBadge}>
                              <Text style={styles.posText}>{p.position_played}</Text>
                            </View>
                            <Text style={[styles.rosterName, p.user_id === user?.id && { color: '#FFD700' }]}>
                              {p.username}{p.user_id === user?.id ? ' (You)' : ''}
                            </Text>
                          </View>
                        ))
                      )}
                    </View>
                  );
                  return (
                    <View style={{ gap: 12 }}>
                      {renderTeam(home, 'Home Team', activeMatch.team_side === 'home')}
                      {renderTeam(away, 'Away Team', activeMatch.team_side === 'away')}
                    </View>
                  );
                })()}
              </ScrollView>
            )}
            {/* ── Invite section (creator only) ── */}
            {activeMatch?.is_creator && (
              <View style={styles.inviteSection}>
                <Text style={styles.inviteSectionLabel}>Invite a Player</Text>
                <View style={styles.inviteRow}>
                  <TextInput
                    style={styles.inviteInput}
                    placeholder="Username"
                    placeholderTextColor="#444"
                    value={inviteUsername}
                    onChangeText={t => { setInviteUsername(t); setInviteMsg(null); }}
                    onSubmitEditing={sendInvite}
                    autoCapitalize="none"
                    returnKeyType="send"
                  />
                  <TouchableOpacity
                    style={[styles.inviteBtn, (!inviteUsername.trim() || inviteLoading) && { opacity: 0.4 }]}
                    onPress={sendInvite}
                    disabled={!inviteUsername.trim() || inviteLoading}
                  >
                    {inviteLoading
                      ? <ActivityIndicator color="black" size="small" />
                      : <Ionicons name="paper-plane" size={18} color="black" />}
                  </TouchableOpacity>
                </View>
                {!!inviteMsg && (
                  <Text style={[styles.inviteFeedback, { color: inviteMsg.ok ? '#69db7c' : '#ff6b6b' }]}>
                    {inviteMsg.text}
                  </Text>
                )}
              </View>
            )}
            <TouchableOpacity
              style={styles.leaveFullBtn}
              onPress={() => { setShowMatchDetails(false); activeMatch?.is_creator ? cancelMatch() : leaveMatch(); }}
            >
              <Text style={styles.leaveFullText}>{activeMatch?.is_creator ? 'Cancel Match' : 'Leave Match'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secBtn} onPress={() => { setShowMatchDetails(false); setInviteMsg(null); setInviteUsername(''); }}>
              <Text style={styles.secText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Challenge Modal ── */}
      <Modal visible={showChallenge} transparent animationType="slide">
        <View style={styles.overlay2}>
          <View style={styles.sheet}>
            <View style={styles.handle} />

            {challengeStep === 'pick-team' && (
              <>
                <Text style={styles.sheetTitle}>Challenge a Team</Text>
                <Text style={styles.sheetSub}>Which team are you representing?</Text>
                {myCaptainTeams.length === 0 ? (
                  <View style={styles.noCaptainWrap}>
                    <Ionicons name="shield-outline" size={36} color="#333" />
                    <Text style={styles.noCaptainText}>
                      You need to be a captain of a team to send challenges.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    {myCaptainTeams.map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.pickRow, myTeamId === t.id && styles.pickRowOn]}
                        onPress={() => setMyTeamId(t.id)}
                      >
                        <View style={styles.pickAvatar}>
                          <Ionicons name="shield" size={16} color="white" />
                        </View>
                        <Text style={styles.pickName}>{t.name}</Text>
                        {myTeamId === t.id && <Ionicons name="checkmark-circle" size={20} color="white" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.primaryBtn, (!myTeamId || myCaptainTeams.length === 0) && { opacity: 0.3 }]}
                  onPress={() => { if (myTeamId) setChallengeStep('pick-opponent'); }}
                  disabled={!myTeamId || myCaptainTeams.length === 0}
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
                <Text style={styles.sheetSub}>
                  As <Text style={{ color: 'white', fontWeight: '700' }}>
                    {myTeams.find(t => t.id === myTeamId)?.name}
                  </Text>
                </Text>
                {opponentTeams.length === 0 ? (
                  <View style={styles.noCaptainWrap}>
                    <Ionicons name="search-outline" size={36} color="#333" />
                    <Text style={styles.noCaptainText}>No other teams available yet.</Text>
                  </View>
                ) : (
                  <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                    <View style={{ gap: 8 }}>
                      {opponentTeams.map((opp) => (
                        <TouchableOpacity
                          key={opp.id}
                          style={[styles.pickRow, opponentTeamId === opp.id && styles.pickRowOn]}
                          onPress={() => setOpponentTeamId(opp.id)}
                        >
                          <View style={styles.pickAvatar}>
                            <Ionicons name="shield" size={16} color="white" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.pickName}>{opp.name}</Text>
                            <Text style={styles.pickOvr}>{opp.ovr.toFixed(1)} OVR · Rank #{opp.rank}</Text>
                          </View>
                          {opponentTeamId === opp.id && <Ionicons name="checkmark-circle" size={20} color="white" />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                )}
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
                  style={[styles.primaryBtn, (!opponentTeamId || challengeSending) && { opacity: 0.3 }]}
                  onPress={sendChallenge}
                  disabled={!opponentTeamId || challengeSending}
                >
                  {challengeSending
                    ? <ActivityIndicator color="black" />
                    : <Text style={styles.primaryText}>Send Challenge</Text>
                  }
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
                  {challengedName} has been challenged for{'\n'}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  emptyNotif: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyNotifText: { color: '#444', fontSize: 14, fontWeight: '500' },

  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  detailLabel: { color: '#666', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  detailVal: { color: 'white', fontSize: 14, fontWeight: '600', marginTop: 2 },
  detailSub: { color: '#666', fontSize: 12, marginTop: 1 },
  detailProgBack: { height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)' },
  detailProgFill: { height: '100%', borderRadius: 3, backgroundColor: 'white' },
  leaveFullBtn: { padding: 16, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,80,80,0.3)', backgroundColor: 'rgba(255,80,80,0.1)' },
  leaveFullText: { fontWeight: '700', color: '#ff6b6b', fontSize: 15 },
  secBtn: { padding: 14, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  secText: { fontWeight: '600', color: '#666', fontSize: 15 },

  // Team roster
  teamBlock: { borderRadius: 14, padding: 14, gap: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  teamLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  teamLabel: { fontWeight: '800', fontSize: 14, color: 'white', textTransform: 'uppercase', letterSpacing: 0.5 },
  myTeamTag: { fontSize: 10, fontWeight: '700', color: '#FFD700', backgroundColor: 'rgba(255,215,0,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)' },
  noPlayers: { color: '#555', fontSize: 12, fontStyle: 'italic' },
  rosterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  posBadge: { width: 38, paddingVertical: 4, borderRadius: 8, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  posText: { fontSize: 11, fontWeight: '800', color: '#ccc', letterSpacing: 0.3 },
  rosterName: { color: 'white', fontSize: 14, fontWeight: '600' },
  primaryBtn: { padding: 16, borderRadius: 24, alignItems: 'center', backgroundColor: 'white' },
  primaryText: { fontWeight: '800', fontSize: 16, color: 'black' },
  successIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 4 },

  // Invite inside match details modal
  inviteSection:      { gap: 8, paddingTop: 4 },
  inviteSectionLabel: { fontWeight: '700', fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 },
  inviteRow:          { flexDirection: 'row', gap: 8 },
  inviteInput:        { flex: 1, height: 44, borderRadius: 12, paddingHorizontal: 14, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', color: 'white', fontSize: 14 },
  inviteBtn:          { width: 44, height: 44, borderRadius: 12, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  inviteFeedback:     { fontSize: 12, fontWeight: '600' },

  // Join from invite notification
  joinInviteBtn:  { alignSelf: 'flex-start', marginTop: 2, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, backgroundColor: 'rgba(255,215,0,0.15)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.35)' },
  joinInviteText: { color: '#FFD700', fontSize: 12, fontWeight: '700' },

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
