import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const mockUser = { username: 'Baller', ovr: 70, level: 1, xp: 0, wins: 0, draws: 0, losses: 0 };

const achievements = [
  { id: 1, title: 'First Blood', description: 'Won your first match', icon: 'football', rarity: 'Common', color: '#aaa', unlockRate: 82 },
  { id: 2, title: 'Hat Trick', description: 'Won 3 matches in a row', icon: 'flame', rarity: 'Rare', color: '#4FC3F7', unlockRate: 34 },
  { id: 3, title: 'Captain Fantastic', description: 'Created your first team', icon: 'shield', rarity: 'Rare', color: '#4FC3F7', unlockRate: 41 },
  { id: 4, title: 'Unbeatable', description: 'Won 10 matches in a row', icon: 'trophy', rarity: 'Epic', color: '#CE93D8', unlockRate: 12 },
  { id: 5, title: 'Legend', description: 'Reached 90+ OVR', icon: 'star', rarity: 'Legendary', color: '#FFD700', unlockRate: 3 },
  { id: 6, title: 'Social Baller', description: 'Joined 3 different teams', icon: 'people', rarity: 'Common', color: '#aaa', unlockRate: 58 },
];

const rarityOrder = ['Legendary', 'Epic', 'Rare', 'Common'];

const sorted = [...achievements].sort(
  (a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
);

export default function ProfileScreen() {
  const userData = mockUser;

  return (
    <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        <View style={styles.header}>
          <Text style={styles.headTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => router.replace('/')}>
            <Ionicons name="settings-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={44} color="white" />
            </View>
            <TouchableOpacity style={styles.editAvatar}>
              <Ionicons name="camera-outline" size={14} color="white" />
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>{userData.username}</Text>
          <Text style={styles.uid}>ID: DEMO</Text>

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
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="create-outline" size={20} color="white" />
            <Text style={styles.actionText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="time-outline" size={20} color="white" />
            <Text style={styles.actionText}>Match History</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.achSection}>
          <View style={styles.achHeader}>
            <Text style={styles.achTitle}>Achievements</Text>
            <Text style={styles.achCount}>{achievements.length} unlocked</Text>
          </View>

          <View style={styles.achGrid}>
            {sorted.map((a) => (
              <View
                key={a.id}
                style={[styles.achCard, { borderColor: `${a.color}40` }]}
              >
                <View style={[styles.achIcon, { backgroundColor: `${a.color}20` }]}>
                  <Ionicons name={a.icon as any} size={24} color={a.color} />
                </View>
                <Text style={styles.achName}>{a.title}</Text>
                <Text style={styles.achDesc}>{a.description}</Text>
                <View style={styles.achFooter}>
                  <View style={[styles.rarityBadge, { backgroundColor: `${a.color}20`, borderColor: `${a.color}60` }]}>
                    <Text style={[styles.rarityText, { color: a.color }]}>{a.rarity}</Text>
                  </View>
                  <Text style={styles.unlockRate}>{a.unlockRate}% unlocked</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingTop: 65,
    gap: 16,
    paddingHorizontal: 22,
    paddingBottom: 110,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headTitle: {
    fontWeight: '900',
    fontSize: 26,
    color: 'white',
    letterSpacing: 0.3,
  },
  settingsBtn: {
    borderWidth: 1,
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    gap: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  avatar: {
    borderColor: 'rgba(255,255,255,0.2)',
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    borderWidth: 2,
  },
  editAvatar: {
    bottom: 0,
    position: 'absolute',
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  name: {
    fontWeight: '900',
    fontSize: 22,
    color: 'white',
    letterSpacing: 0.3,
  },
  uid: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  ovrBadge: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  ovr: {
    letterSpacing: 1,
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
  levelWrap: {
    gap: 8,
    width: '100%',
  },
  levelRow: {
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  level: {
    fontWeight: '600',
    color: '#aaa',
    fontSize: 12,
  },
  xp: {
    color: '#aaa',
    fontWeight: '600',
    fontSize: 12,
  },
  progBack: {
    borderRadius: 3,
    height: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: 'white',
  },
  stats: {
    width: '100%',
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'space-between',
  },
  statBox: {
    gap: 4,
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontWeight: '800',
    color: 'white',
    fontSize: 20,
  },
  statLab: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  statDiv: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actions: {
    gap: 12,
    flexDirection: 'row',
  },
  actionBtn: {
    flex: 1,
    gap: 8,
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  actionText: {
    fontWeight: '600',
    color: 'white',
    fontSize: 13,
  },
  achSection: {
    gap: 14,
  },
  achHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  achTitle: {
    fontWeight: '800',
    color: 'white',
    fontSize: 18,
  },
  achCount: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  achGrid: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    gap: 12,
  },
  achCard: {
    gap: 8,
    width: '47%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  achIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achName: {
    fontWeight: '800',
    fontSize: 13,
    color: 'white',
  },
  achDesc: {
    lineHeight: 16,
    color: '#888',
    fontSize: 11,
  },
  achFooter: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rarityBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rarityText: {
    fontWeight: '700',
    fontSize: 10,
  },
  unlockRate: {
    color: '#555',
    fontSize: 10,
    fontWeight: '500',
  },
})