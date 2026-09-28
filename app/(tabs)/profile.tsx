import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

const AVATARS: { id: number; source: any }[] = [
  { id: 1, source: require('../../assets/avatars/avatar1.png') },
  { id: 2, source: require('../../assets/avatars/avatar2.png') },
  { id: 3, source: require('../../assets/avatars/avatar3.png') },
  { id: 4, source: require('../../assets/avatars/avatar4.png') },
  { id: 5, source: require('../../assets/avatars/avatar5.png') },
];

const POSITION_LABEL: Record<string, string> = { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', ATT: 'Forward' };
const SKILL_LABEL: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
const RESULT_COLOR: Record<string, string> = { W: '#69db7c', D: '#FFD700', L: '#ff6b6b' };

const achievements = [
  { id: 1, title: 'First Blood', description: 'Won your first match', icon: 'football', rarity: 'Common', color: '#aaa', unlockRate: 82 },
  { id: 2, title: 'Hat Trick', description: 'Won 3 matches in a row', icon: 'flame', rarity: 'Rare', color: '#4FC3F7', unlockRate: 34 },
  { id: 3, title: 'Captain Fantastic', description: 'Created your first team', icon: 'shield', rarity: 'Rare', color: '#4FC3F7', unlockRate: 41 },
  { id: 4, title: 'Unbeatable', description: 'Won 10 matches in a row', icon: 'trophy', rarity: 'Epic', color: '#CE93D8', unlockRate: 12 },
  { id: 5, title: 'Legend', description: 'Reached 90+ OVR', icon: 'star', rarity: 'Legendary', color: '#FFD700', unlockRate: 3 },
  { id: 6, title: 'Social Baller', description: 'Joined 3 different teams', icon: 'people', rarity: 'Common', color: '#aaa', unlockRate: 58 },
];
const rarityOrder = ['Legendary', 'Epic', 'Rare', 'Common'];
const sortedAchievements = [...achievements].sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity));

const getAvatarById = (id: number) => AVATARS.find(a => a.id === id) ?? AVATARS[0];
const getAvatarFromUrl = (url: string | null) => {
  const id = parseInt(url ?? '1');
  return isNaN(id) ? AVATARS[0] : getAvatarById(id);
};

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<any[]>([]);

  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [showAvatar, setShowAvatar] = useState(false);
  const [tempAvatar, setTempAvatar] = useState(AVATARS[0]);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const [showHistory, setShowHistory] = useState(false);

  // Rating modal
  const [showRating,      setShowRating]      = useState(false);
  const [ratingMatchId,   setRatingMatchId]   = useState<string | null>(null);
  const [ratingMatch,     setRatingMatch]     = useState<any | null>(null);
  const [ratingLoading,   setRatingLoading]   = useState(false);
  const [ratingSubmitting,setRatingSubmitting]= useState(false);
  const [ratingDone,      setRatingDone]      = useState(false);
  const [ratingError,     setRatingError]     = useState('');
  const [ratings,         setRatings]         = useState<Record<string, number>>({});

  useEffect(() => {
    fetchProfile();
    fetchMatches();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/me');
      const data = res.data.data;
      setProfile(data);
      const av = getAvatarFromUrl(data.avatar_url);
      setSelectedAvatar(av);
      setTempAvatar(av);
    } catch {}
    finally { setLoading(false); }
  };

  const fetchMatches = async () => {
    try {
      const res = await api.get('/users/me/matches');
      setMatches(res.data.data);
    } catch {}
  };

  const handleLogout = async () => {
    await logout();
    // AuthGate handles redirect automatically once user is null
  };

  const openEdit = () => {
    setEditUsername(profile?.username ?? '');
    setEditError('');
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!editUsername.trim()) return;
    setSaving(true);
    setEditError('');
    try {
      await api.put('/users/me', { username: editUsername.trim() });
      await refreshUser();
      await fetchProfile();
      setShowEdit(false);
    } catch (err: any) {
      setEditError(err.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const saveAvatar = async () => {
    setSavingAvatar(true);
    try {
      await api.put('/users/me', { avatar_url: String(tempAvatar.id) });
      setSelectedAvatar(tempAvatar);
      await refreshUser();
      setShowAvatar(false);
    } catch {}
    finally { setSavingAvatar(false); }
  };

  // ── Rating handlers ───────────────────────────────────────────────────────

  const openRating = async (matchId: string) => {
    setRatingMatchId(matchId);
    setRatings({});
    setRatingDone(false);
    setRatingError('');
    setShowHistory(false);
    setRatingLoading(true);
    setShowRating(true);
    try {
      const res = await api.get(`/matches/${matchId}`);
      setRatingMatch(res.data.data);
    } catch {
      setRatingError('Could not load match details.');
    } finally {
      setRatingLoading(false);
    }
  };

  const submitRating = async () => {
    const ratingsArr = Object.entries(ratings).map(([user_id, rating]) => ({ user_id, rating }));
    if (ratingsArr.length === 0) { setRatingError('Rate at least one teammate.'); return; }
    setRatingSubmitting(true);
    setRatingError('');
    try {
      await api.post(`/matches/${ratingMatchId}/ratings`, { ratings: ratingsArr });
      setRatingDone(true);
    } catch (err: any) {
      if (err?.code === 'ALREADY_RATED') { setRatingDone(true); return; }
      setRatingError(err?.message ?? 'Could not submit. Try again.');
    } finally {
      setRatingSubmitting(false);
    }
  };

  const closeRating = () => {
    setShowRating(false);
    setRatingMatch(null);
    setRatingMatchId(null);
    setRatings({});
    setRatingDone(false);
    setRatingError('');
  };

  const getMatchResult = (match: any) => {
    if (match.status !== 'completed' || match.home_score === null) return null;
    const isHome = match.team_side === 'home';
    const myScore = isHome ? match.home_score : match.away_score;
    const theirScore = isHome ? match.away_score : match.home_score;
    if (myScore > theirScore) return 'W';
    if (myScore < theirScore) return 'L';
    return 'D';
  };

  const p = profile?.player_profile;
  const level = p ? Math.floor(p.matches_played / 10) + 1 : 1;
  const xp = p ? (p.matches_played % 10) * 10 : 0;

  if (loading) {
    return (
      <LinearGradient colors={['#2a2a2a', '#000000']} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="white" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.header}>
          <Text style={styles.headTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => { setTempAvatar(selectedAvatar); setShowAvatar(true); }}>
              <View style={styles.avatar}>
                <Image source={selectedAvatar.source} style={styles.avatarImg} resizeMode="cover" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editAvatar} onPress={() => { setTempAvatar(selectedAvatar); setShowAvatar(true); }}>
              <Ionicons name="pencil-outline" size={13} color="white" />
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>{profile?.username ?? user?.username}</Text>
          <Text style={styles.uid}>
            {p ? `${POSITION_LABEL[p.position] ?? p.position} · ${SKILL_LABEL[p.skill_level] ?? p.skill_level}` : 'No profile yet'}
          </Text>

          <View style={styles.ovrBadge}>
            <Text style={styles.ovr}>{p?.ovr ?? 70} OVR</Text>
          </View>

          <View style={styles.levelWrap}>
            <View style={styles.levelRow}>
              <Text style={styles.level}>Level {level}</Text>
              <Text style={styles.xp}>{xp}/100 XP</Text>
            </View>
            <View style={styles.progBack}>
              <View style={[styles.progFill, { width: `${xp}%` }]} />
            </View>
          </View>

          <View style={styles.stats}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{p?.wins ?? 0}</Text>
              <Text style={styles.statLab}>Wins</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{p?.draws ?? 0}</Text>
              <Text style={styles.statLab}>Draws</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{p?.losses ?? 0}</Text>
              <Text style={styles.statLab}>Losses</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={openEdit}>
            <Ionicons name="create-outline" size={19} color="white" />
            <Text style={styles.actionText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowHistory(true)}>
            <Ionicons name="time-outline" size={19} color="white" />
            <Text style={styles.actionText}>Match History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.achSection}>
          <View style={styles.achHeader}>
            <Text style={styles.achTitle}>Achievements</Text>
            <Text style={styles.achCount}>{achievements.length} unlocked</Text>
          </View>
          <View style={styles.achGrid}>
            {sortedAchievements.map((a) => (
              <View key={a.id} style={[styles.achCard, { borderColor: `${a.color}40` }]}>
                <View style={[styles.achIcon, { backgroundColor: `${a.color}20` }]}>
                  <Ionicons name={a.icon as any} size={24} color={a.color} />
                </View>
                <Text style={styles.achName}>{a.title}</Text>
                <Text style={styles.achDesc}>{a.description}</Text>
                <View style={styles.achFooter}>
                  <View style={[styles.rarityBadge, { backgroundColor: `${a.color}20`, borderColor: `${a.color}60` }]}>
                    <Text style={[styles.rarityText, { color: a.color }]}>{a.rarity}</Text>
                  </View>
                  <Text style={styles.unlockRate}>{a.unlockRate}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* Avatar Picker Modal */}
      <Modal visible={showAvatar} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Choose Avatar</Text>
            <Text style={styles.fieldLabel}>Pick an icon that represents you</Text>
            <View style={styles.avatarGrid}>
              {AVATARS.map((av) => {
                const isSelected = tempAvatar.id === av.id;
                return (
                  <TouchableOpacity key={av.id} activeOpacity={0.8} onPress={() => setTempAvatar(av)}>
                    <View style={[styles.avatarOption, isSelected && styles.avatarOptionOn]}>
                      <Image source={av.source} style={styles.avatarOptionImg} resizeMode="cover" />
                      {isSelected && (
                        <View style={styles.avatarCheck}>
                          <Ionicons name="checkmark" size={12} color="white" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={saveAvatar} disabled={savingAvatar}>
              <Text style={styles.primaryText}>{savingAvatar ? 'Saving...' : 'Save Avatar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secBtn} onPress={() => setShowAvatar(false)}>
              <Text style={styles.secText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={showEdit} transparent animationType="slide">
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>Edit Profile</Text>
              <Text style={styles.fieldLabel}>Username</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={editUsername}
                  onChangeText={setEditUsername}
                  placeholder="Username"
                  placeholderTextColor="#555"
                  autoFocus
                />
              </View>
              {editError ? <Text style={styles.errorText}>{editError}</Text> : null}
              <TouchableOpacity
                style={[styles.primaryBtn, (!editUsername.trim() || saving) && { opacity: 0.3 }]}
                onPress={saveEdit}
                disabled={!editUsername.trim() || saving}
              >
                <Text style={styles.primaryText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secBtn} onPress={() => setShowEdit(false)}>
                <Text style={styles.secText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Match History Modal */}
      <Modal visible={showHistory} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.sheet, { maxHeight: '85%' }]}>
            <View style={styles.handle} />
            <View style={styles.historyHeader}>
              <Text style={styles.sheetTitle}>Match History</Text>
              <Text style={styles.historyCount}>{matches.length} matches</Text>
            </View>
            {(() => {
              const visible = matches.filter(m => m.status !== 'cancelled');
              if (visible.length === 0) return <Text style={styles.emptyText}>No matches played yet.</Text>;
              return (
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                  <View style={{ gap: 10, paddingBottom: 16 }}>
                    {visible.map((match) => {
                      const result     = getMatchResult(match);
                      const isHome     = match.team_side === 'home';
                      const matchDate  = match.date ?? match.scheduled_at;
                      const isCompleted = match.status === 'completed';
                      const RowComp: any = isCompleted ? TouchableOpacity : View;
                      return (
                        <RowComp
                          key={match.id}
                          style={[styles.matchRow, isCompleted && styles.matchRowTappable]}
                          onPress={isCompleted ? () => openRating(match.id) : undefined}
                          activeOpacity={0.7}
                        >
                          {result ? (
                            <View style={[styles.resultBadge, { backgroundColor: `${RESULT_COLOR[result]}20`, borderColor: `${RESULT_COLOR[result]}40` }]}>
                              <Text style={[styles.resultText, { color: RESULT_COLOR[result] }]}>{result}</Text>
                            </View>
                          ) : (
                            <View style={[styles.resultBadge, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                              <Text style={[styles.resultText, { color: '#666' }]}>
                                {match.status === 'filling' || match.status === 'ready' ? '▶' : '—'}
                              </Text>
                            </View>
                          )}
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text style={styles.matchOpponent}>{match.home_team ?? 'Home'} vs {match.away_team ?? 'Away'}</Text>
                            <Text style={styles.matchMeta}>
                              {isHome ? 'Home' : 'Away'}
                              {match.stadium ? ` · ${match.stadium}` : ''}
                            </Text>
                            {matchDate && (
                              <Text style={styles.matchDate}>{new Date(matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                            )}
                          </View>
                          <View style={{ alignItems: 'flex-end', gap: 4 }}>
                            {match.home_score !== null && match.away_score !== null && (
                              <Text style={styles.matchScore}>{match.home_score}–{match.away_score}</Text>
                            )}
                            {isCompleted && (
                              <Text style={styles.rateHint}>Tap to rate</Text>
                            )}
                          </View>
                        </RowComp>
                      );
                    })}
                  </View>
                </ScrollView>
              );
            })()}
            <TouchableOpacity style={styles.secBtn} onPress={() => setShowHistory(false)}>
              <Text style={styles.secText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Rating Modal ── */}
      <Modal visible={showRating} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={[styles.sheet, { maxHeight: '90%' }]}>
            <View style={styles.handle} />

            {ratingDone ? (
              /* ── Success state ── */
              <>
                <View style={styles.ratingSuccessIcon}>
                  <Ionicons name="checkmark" size={32} color="white" />
                </View>
                <Text style={styles.sheetTitle}>Ratings Submitted!</Text>
                <Text style={[styles.fieldLabel, { textAlign: 'center', marginBottom: 4 }]}>
                  Your teammates' OVR will update based on your feedback.
                </Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={closeRating}>
                  <Text style={styles.primaryText}>Done</Text>
                </TouchableOpacity>
              </>
            ) : ratingLoading ? (
              /* ── Loading state ── */
              <>
                <Text style={styles.sheetTitle}>Rate Teammates</Text>
                <ActivityIndicator color="white" style={{ paddingVertical: 32 }} />
              </>
            ) : (() => {
              /* ── Rating form ── */
              const myId = user?.id;
              const me = (ratingMatch?.participants ?? []).find((p: any) => p.user_id === myId);
              const myTeamSide = me?.team_side;
              const teammates = (ratingMatch?.participants ?? []).filter(
                (p: any) => p.user_id !== myId && p.team_side === myTeamSide
              );
              const canSubmit = Object.keys(ratings).length > 0 && !ratingSubmitting;

              return (
                <>
                  <Text style={styles.sheetTitle}>Rate Teammates</Text>
                  <Text style={[styles.fieldLabel, { marginBottom: 4 }]}>
                    Tap a score for each player · 1 (poor) → 10 (outstanding)
                  </Text>

                  {teammates.length === 0 ? (
                    <Text style={styles.emptyText}>No teammates found for this match.</Text>
                  ) : (
                    <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                      <View style={{ gap: 14, paddingBottom: 8 }}>
                        {teammates.map((p: any) => {
                          const uid  = p.user_id;
                          const name = p.user?.username ?? p.username ?? uid;
                          const pos  = p.position_played;
                          const sel  = ratings[uid];
                          return (
                            <View key={uid} style={styles.ratingCard}>
                              <View style={styles.ratingCardHeader}>
                                <View style={styles.posBadgeRating}>
                                  <Text style={styles.posBadgeText}>{pos}</Text>
                                </View>
                                <Text style={styles.ratingPlayerName}>{name}</Text>
                                {sel && (
                                  <View style={styles.selectedScoreBadge}>
                                    <Text style={styles.selectedScoreText}>{sel}/10</Text>
                                  </View>
                                )}
                              </View>
                              <View style={styles.ratingBtns}>
                                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                  <TouchableOpacity
                                    key={n}
                                    style={[styles.ratingBtn, sel === n && styles.ratingBtnOn]}
                                    onPress={() => setRatings(prev => ({ ...prev, [uid]: n }))}
                                  >
                                    <Text style={[styles.ratingBtnText, sel === n && { color: 'black' }]}>{n}</Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </ScrollView>
                  )}

                  {ratingError ? <Text style={styles.errorText}>{ratingError}</Text> : null}

                  <TouchableOpacity
                    style={[styles.primaryBtn, !canSubmit && { opacity: 0.35 }]}
                    onPress={submitRating}
                    disabled={!canSubmit}
                  >
                    {ratingSubmitting
                      ? <ActivityIndicator color="black" />
                      : <Text style={styles.primaryText}>Submit Ratings</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secBtn} onPress={closeRating}>
                    <Text style={styles.secText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingTop: 65, gap: 16, paddingHorizontal: 22, paddingBottom: 110 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headTitle: { fontWeight: '900', fontSize: 26, color: 'white', letterSpacing: 0.3 },
  settingsBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  profileCard: { borderWidth: 1, borderRadius: 24, padding: 24, gap: 12, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  avatar: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  avatarImg: { position: 'absolute', top: -12, left: -12, width: 110, height: 110 },
  editAvatar: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center' },
  avatarOption: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', borderWidth: 3, borderColor: 'rgba(255,255,255,0.1)' },
  avatarOptionOn: { borderColor: 'white' },
  avatarOptionImg: { position: 'absolute', top: -12, left: -12, width: 104, height: 104 },
  avatarCheck: { position: 'absolute', bottom: 2, right: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  name: { fontWeight: '900', fontSize: 22, color: 'white', letterSpacing: 0.3 },
  uid: { fontSize: 12, color: '#666', fontWeight: '500' },
  ovrBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  ovr: { letterSpacing: 1, color: 'white', fontSize: 14, fontWeight: '800' },
  levelWrap: { gap: 8, width: '100%' },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  level: { fontWeight: '600', color: '#aaa', fontSize: 12 },
  xp: { color: '#aaa', fontWeight: '600', fontSize: 12 },
  progBack: { borderRadius: 3, height: 6, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)' },
  progFill: { height: '100%', borderRadius: 3, backgroundColor: 'white' },
  stats: { width: '100%', flexDirection: 'row', padding: 14, borderRadius: 14, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'space-between' },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontWeight: '800', color: 'white', fontSize: 20 },
  statLab: { fontSize: 11, color: '#888', fontWeight: '500' },
  statDiv: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)' },
  actionText: { fontWeight: '600', color: 'white', fontSize: 13 },
  achSection: { gap: 14 },
  achHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  achTitle: { fontWeight: '800', color: 'white', fontSize: 18 },
  achCount: { fontSize: 13, color: '#888', fontWeight: '500' },
  achGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  achCard: { width: '47%', gap: 8, padding: 14, borderRadius: 16, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  achIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  achName: { fontWeight: '800', fontSize: 13, color: 'white' },
  achDesc: { lineHeight: 16, color: '#888', fontSize: 11 },
  achFooter: { marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rarityBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  rarityText: { fontWeight: '700', fontSize: 10 },
  unlockRate: { color: '#555', fontSize: 10, fontWeight: '500' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48, gap: 14, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginBottom: 8 },
  sheetTitle: { fontWeight: '900', fontSize: 22, color: 'white' },
  fieldLabel: { fontWeight: '700', fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' },
  input: { flex: 1, color: 'white', fontSize: 15 },
  errorText: { color: '#ff6b6b', fontSize: 13, textAlign: 'center' },
  primaryBtn: { padding: 16, borderRadius: 24, alignItems: 'center', backgroundColor: 'white' },
  primaryText: { fontWeight: '800', fontSize: 16, color: 'black' },
  secBtn: { padding: 14, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  secText: { fontWeight: '600', color: '#666', fontSize: 15 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyCount: { color: '#666', fontSize: 13, fontWeight: '500' },
  emptyText: { color: '#555', textAlign: 'center', fontSize: 14, paddingVertical: 20 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' },
  matchRowTappable: { borderColor: 'rgba(255,215,0,0.2)', backgroundColor: 'rgba(255,215,0,0.04)' },
  resultBadge: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  resultText: { fontWeight: '800', fontSize: 14 },
  matchOpponent: { fontWeight: '700', color: 'white', fontSize: 14 },
  matchMeta: { color: '#666', fontSize: 11 },
  matchDate: { color: '#555', fontSize: 11 },
  matchScore: { fontWeight: '800', color: 'white', fontSize: 16 },
  rateHint: { fontSize: 10, color: '#FFD700', fontWeight: '600' },

  // Rating modal
  ratingSuccessIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(105,219,124,0.15)', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', borderWidth: 1, borderColor: 'rgba(105,219,124,0.3)', marginBottom: 4 },
  ratingCard: { borderRadius: 14, padding: 14, gap: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  ratingCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  posBadgeRating: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  posBadgeText: { fontSize: 11, fontWeight: '800', color: '#ccc', letterSpacing: 0.3 },
  ratingPlayerName: { flex: 1, color: 'white', fontWeight: '700', fontSize: 15 },
  selectedScoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(255,215,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)' },
  selectedScoreText: { color: '#FFD700', fontWeight: '800', fontSize: 12 },
  ratingBtns: { flexDirection: 'row', gap: 5 },
  ratingBtn: { flex: 1, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  ratingBtnOn: { backgroundColor: '#FFD700', borderColor: '#FFD700' },
  ratingBtnText: { fontSize: 12, fontWeight: '700', color: '#888' },
});
