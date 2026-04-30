import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const AVATARS: { id: number; source: any }[] = [
  { id: 1, source: require('../../assets/avatars/avatar1.png') },
  { id: 2, source: require('../../assets/avatars/avatar2.png') },
  { id: 3, source: require('../../assets/avatars/avatar3.png') },
  { id: 4, source: require('../../assets/avatars/avatar4.png') },
  { id: 5, source: require('../../assets/avatars/avatar5.png') },
];

type UserData = { username: string; ovr: number; level: number; xp: number; wins: number; draws: number; losses: number; position: string; skillLevel: string };

const INITIAL_USER: UserData = {
  username: 'Baller', ovr: 70, level: 1, xp: 0,
  wins: 0, draws: 0, losses: 0,
  position: 'Midfielder', skillLevel: 'Intermediate',
};

const MATCH_HISTORY = [
  { id: 1, date: 'Apr 20, 2026', opponent: 'Desert Eagles', result: 'W', score: '4–2', venue: 'Al Nasr Club', team: 'FC Wolves' },
  { id: 2, date: 'Apr 14, 2026', opponent: 'Muscat United', result: 'D', score: '1–1', venue: 'Al Seeb Ground', team: 'FC Wolves' },
  { id: 3, date: 'Apr 6, 2026', opponent: 'Thunder Wolves', result: 'L', score: '1–3', venue: 'Al Nasr Club', team: 'Desert Eagles' },
  { id: 4, date: 'Mar 29, 2026', opponent: 'Royal Knights', result: 'W', score: '3–0', venue: 'Al Nasr Club', team: 'FC Wolves' },
  { id: 5, date: 'Mar 22, 2026', opponent: 'Al Nasr FC', result: 'W', score: '2–1', venue: 'Muscat Sports Complex', team: 'FC Wolves' },
];

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

const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function ProfileScreen() {
  const [userData, setUserData] = useState<UserData>(INITIAL_USER);

  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [showAvatar, setShowAvatar] = useState(false);
  const [tempAvatar, setTempAvatar] = useState(AVATARS[0]);

  const [showEdit, setShowEdit] = useState(false);
  const [editUsername, setEditUsername] = useState(userData.username);
  const [editPosition, setEditPosition] = useState(userData.position);
  const [editSkill, setEditSkill] = useState(userData.skillLevel);

  const [showHistory, setShowHistory] = useState(false);

  const openEdit = () => {
    setEditUsername(userData.username);
    setEditPosition(userData.position);
    setEditSkill(userData.skillLevel);
    setShowEdit(true);
  };

  const saveEdit = () => {
    if (!editUsername.trim()) return;
    setUserData(prev => ({ ...prev, username: editUsername.trim(), position: editPosition, skillLevel: editSkill }));
    setShowEdit(false);
  };

  return (
    <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.header}>
          <Text style={styles.headTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => router.replace('/')}>
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

          <Text style={styles.name}>{userData.username}</Text>
          <Text style={styles.uid}>{userData.position} · {userData.skillLevel}</Text>

          <View style={styles.ovrBadge}>
            <Text style={styles.ovr}>{userData.ovr} OVR</Text>
          </View>

          <View style={styles.levelWrap}>
            <View style={styles.levelRow}>
              <Text style={styles.level}>Level {userData.level}</Text>
              <Text style={styles.xp}>{userData.xp}/100 XP</Text>
            </View>
            <View style={styles.progBack}>
              <View style={[styles.progFill, { width: `${(userData.xp / 100) * 100}%` }]} />
            </View>
          </View>

          <View style={styles.stats}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{userData.wins}</Text>
              <Text style={styles.statLab}>Wins</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{userData.draws}</Text>
              <Text style={styles.statLab}>Draws</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{userData.losses}</Text>
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
                  <TouchableOpacity
                    key={av.id}
                    activeOpacity={0.8}
                    onPress={() => setTempAvatar(av)}
                  >
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
            <TouchableOpacity style={styles.primaryBtn} onPress={() => { setSelectedAvatar(tempAvatar); setShowAvatar(false); }}>
              <Text style={styles.primaryText}>Save Avatar</Text>
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

            <Text style={styles.fieldLabel}>Position</Text>
            <View style={styles.chipRow}>
              {POSITIONS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.chip, editPosition === p && styles.chipOn]}
                  onPress={() => setEditPosition(p)}
                >
                  <Text style={[styles.chipText, editPosition === p && { color: 'white' }]}>
                    {p === 'Goalkeeper' ? 'GK' : p === 'Defender' ? 'DEF' : p === 'Midfielder' ? 'MID' : 'FWD'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Skill Level</Text>
            <View style={styles.chipRow}>
              {SKILL_LEVELS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, editSkill === s && styles.chipOn]}
                  onPress={() => setEditSkill(s)}
                >
                  <Text style={[styles.chipText, editSkill === s && { color: 'white' }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, !editUsername.trim() && { opacity: 0.3 }]}
              onPress={saveEdit}
              disabled={!editUsername.trim()}
            >
              <Text style={styles.primaryText}>Save Changes</Text>
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
              <Text style={styles.historyCount}>{MATCH_HISTORY.length} matches</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <View style={{ gap: 10, paddingBottom: 16 }}>
                {MATCH_HISTORY.map((match) => (
                  <View key={match.id} style={styles.matchRow}>
                    <View style={[styles.resultBadge, { backgroundColor: `${RESULT_COLOR[match.result]}20`, borderColor: `${RESULT_COLOR[match.result]}40` }]}>
                      <Text style={[styles.resultText, { color: RESULT_COLOR[match.result] }]}>{match.result}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.matchOpponent}>vs {match.opponent}</Text>
                      <Text style={styles.matchMeta}>{match.team} · {match.venue}</Text>
                      <Text style={styles.matchDate}>{match.date}</Text>
                    </View>
                    <Text style={styles.matchScore}>{match.score}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.secBtn} onPress={() => setShowHistory(false)}>
              <Text style={styles.secText}>Close</Text>
            </TouchableOpacity>
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
  avatarImg: { position: 'absolute', top: 0, left: 0, width: 90, height: 90 },
  editAvatar: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center' },
  avatarOption: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', borderWidth: 3, borderColor: 'rgba(255,255,255,0.1)' },
  avatarOptionOn: { borderColor: 'white' },
  avatarOptionImg: { position: 'absolute', top: 0, left: 0, width: 80, height: 80 },
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
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' },
  chipOn: { borderColor: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.15)' },
  chipText: { fontWeight: '700', fontSize: 12, color: '#555' },
  primaryBtn: { padding: 16, borderRadius: 24, alignItems: 'center', backgroundColor: 'white' },
  primaryText: { fontWeight: '800', fontSize: 16, color: 'black' },
  secBtn: { padding: 14, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  secText: { fontWeight: '600', color: '#666', fontSize: 15 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyCount: { color: '#666', fontSize: 13, fontWeight: '500' },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' },
  resultBadge: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  resultText: { fontWeight: '800', fontSize: 14 },
  matchOpponent: { fontWeight: '700', color: 'white', fontSize: 14 },
  matchMeta: { color: '#666', fontSize: 11 },
  matchDate: { color: '#555', fontSize: 11 },
  matchScore: { fontWeight: '800', color: 'white', fontSize: 16 },
});
