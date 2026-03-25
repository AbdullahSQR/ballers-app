import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const players = [
  { id: 1, name: 'Lionel Messi', ovr: 96.3, wins: 45 },
  { id: 2, name: 'Frank Ribery', ovr: 94.1, wins: 38 },
  { id: 3, name: 'Neymar Junior', ovr: 92.9, wins: 35 },
  { id: 4, name: 'Lamine Yamal', ovr: 95.1, wins: 33 },
  { id: 5, name: 'Arjen Robben', ovr: 91.7, wins: 30 },
  { id: 6, name: 'Harry Maguire', ovr: 88.4, wins: 28 },
  { id: 7, name: 'Cristiano Ronaldo', ovr: 90.2, wins: 26 },
  { id: 8, name: 'Pedri Gonzalez', ovr: 93.3, wins: 24 },
  { id: 9, name: 'Kylian Mbappe', ovr: 94.8, wins: 22 },
  { id: 10, name: 'Erling Haaland', ovr: 93.7, wins: 20 },
  { id: 11, name: 'Vinicius Junior', ovr: 92.1, wins: 18 },
  { id: 12, name: 'Jude Bellingham', ovr: 91.4, wins: 16 },
];

const teams = [
  { id: 1, name: 'FC Wolves', ovr: 92.1, wins: 32 },
  { id: 2, name: 'Desert Eagles', ovr: 90.4, wins: 28 },
  { id: 3, name: 'Al Nasr FC', ovr: 89.7, wins: 25 },
  { id: 4, name: 'Muscat United', ovr: 88.2, wins: 22 },
  { id: 5, name: 'Thunder Wolves', ovr: 87.5, wins: 20 },
  { id: 6, name: 'Royal Knights', ovr: 86.9, wins: 18 },
  { id: 7, name: 'FC Nizwa', ovr: 85.3, wins: 16 },
  { id: 8, name: 'Oman Ballers', ovr: 84.1, wins: 14 },
  { id: 9, name: 'Muscat City FC', ovr: 83.7, wins: 12 },
  { id: 10, name: 'Al Seeb Stars', ovr: 82.9, wins: 10 },
  { id: 11, name: 'Sohar United', ovr: 81.4, wins: 8 },
  { id: 12, name: 'Salalah FC', ovr: 80.2, wins: 6 },
];

const podiumColors: { [key: number]: string } = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

export default function RankingsScreen() {
  const [tab, setTab] = useState<'individual' | 'team'>('individual');
  const [query, setQuery] = useState('');

  const data = tab === 'individual' ? players : teams;
  const top3 = data.slice(0, 3);
  const searching = query.length > 0;

  const filtered = searching
    ? data.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
    : data.slice(3);

  return (
    <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        <View style={styles.header}>
          <Text style={styles.headTitle}>Rankings</Text>
          <Text style={styles.headSub}>Monthly leaderboard</Text>
        </View>

        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, tab === 'individual' && styles.toggleOn]}
            onPress={() => setTab('individual')}
          >
            <Text style={[styles.toggleText, tab === 'individual' && styles.toggleTextOn]}>
              Individual
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, tab === 'team' && styles.toggleOn]}
            onPress={() => setTab('team')}
          >
            <Text style={[styles.toggleText, tab === 'team' && styles.toggleTextOn]}>
              Teams
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder={tab === 'individual' ? 'Search players...' : 'Search teams...'}
            placeholderTextColor="#666"
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {!searching && (
          <View style={styles.podium}>

            <View style={styles.podiumItem}>
              <View style={[styles.podiumAvatar, { borderColor: podiumColors[2] }]}>
                <Ionicons name="person" size={22} color="white" />
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{top3[1]?.name}</Text>
              <Text style={styles.podiumOvr}>{top3[1]?.ovr} OVR</Text>
              <View style={[styles.podiumBase, { height: 60, backgroundColor: 'rgba(192,192,192,0.2)', borderColor: podiumColors[2] }]}>
                <Text style={[styles.podiumRank, { color: podiumColors[2] }]}>2nd</Text>
              </View>
            </View>

            <View style={styles.podiumItem}>
              <Ionicons name="trophy" size={20} color="#FFD700" style={{ marginBottom: 4 }} />
              <View style={[styles.podiumAvatar, styles.podiumBig, { borderColor: podiumColors[1] }]}>
                <Ionicons name="person" size={28} color="white" />
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{top3[0]?.name}</Text>
              <Text style={styles.podiumOvr}>{top3[0]?.ovr} OVR</Text>
              <View style={[styles.podiumBase, { height: 80, backgroundColor: 'rgba(255,215,0,0.2)', borderColor: podiumColors[1] }]}>
                <Text style={[styles.podiumRank, { color: podiumColors[1] }]}>1st</Text>
              </View>
            </View>

            <View style={styles.podiumItem}>
              <View style={[styles.podiumAvatar, { borderColor: podiumColors[3] }]}>
                <Ionicons name="person" size={22} color="white" />
              </View>
              <Text style={styles.podiumName} numberOfLines={1}>{top3[2]?.name}</Text>
              <Text style={styles.podiumOvr}>{top3[2]?.ovr} OVR</Text>
              <View style={[styles.podiumBase, { height: 45, backgroundColor: 'rgba(205,127,50,0.2)', borderColor: podiumColors[3] }]}>
                <Text style={[styles.podiumRank, { color: podiumColors[3] }]}>3rd</Text>
              </View>
            </View>

          </View>
        )}

        <View style={styles.list}>
          {searching && filtered.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={40} color="#444" />
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          )}
          {filtered.map((item, index) => {
            const rank = searching
              ? data.findIndex((r) => r.id === item.id) + 1
              : index + 4;
            return (
              <View key={item.id} style={styles.row}>
                <View style={styles.rankBox}>
                  <Text style={styles.rankText}>{rank}</Text>
                </View>
                <View style={styles.rowAvatar}>
                  <Ionicons name="person" size={18} color="white" />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  <Text style={styles.rowWins}>{item.wins} wins</Text>
                </View>
                <Text style={styles.rowOvr}>{item.ovr} OVR</Text>
              </View>
            );
          })}
        </View>

        {!searching && (
          <TouchableOpacity style={styles.viewRankBtn}>
            <Text style={styles.viewRank}>View Your Rank</Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </TouchableOpacity>
        )}

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
    paddingHorizontal: 22,
    gap: 20,
    paddingBottom: 110,
  },
  header: {
    gap: 4,
  },
  headTitle: {
    fontWeight: '900',
    fontSize: 26,
    color: 'white',
    letterSpacing: 0.3,
  },
  headSub: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  toggle: {
    gap: 4,
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleOn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  toggleText: {
    fontWeight: '600',
    color: '#666',
    fontSize: 14,
  },
  toggleTextOn: {
    color: 'white',
    fontWeight: '700',
  },
  searchBox: {
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 15,
  },
  podium: {
    gap: 8,
    flexDirection: 'row',
    paddingHorizontal: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  podiumItem: {
    flex: 1,
    gap: 6,
    alignItems: 'center',
  },
  podiumAvatar: {
    borderWidth: 2,
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  podiumBig: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  podiumName: {
    fontWeight: '700',
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  podiumOvr: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
  podiumBase: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumRank: {
    fontWeight: '800',
    fontSize: 13,
  },
  list: {
    gap: 10,
  },
  empty: {
    gap: 12,
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontWeight: '600',
    color: '#444',
    fontSize: 15,
  },
  row: {
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  rankBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  rankText: {
    fontWeight: '700',
    color: '#888',
    fontSize: 13,
  },
  rowAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    fontWeight: '600',
    color: 'white',
    fontSize: 14,
  },
  rowWins: {
    color: '#888',
    fontSize: 12,
  },
  rowOvr: {
    fontWeight: '700',
    color: '#aaa',
    fontSize: 13,
  },
  viewRankBtn: {
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  viewRank: {
    fontWeight: '700',
    color: 'white',
    fontSize: 15,
  },
})