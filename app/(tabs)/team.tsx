import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const myTeams = [
  {
    id: 1,
    name: 'FC Wolves',
    ovr: 88.4,
    wins: 12,
    draws: 3,
    losses: 5,
    captain: true,
    members: [
      { id: 1, name: 'Pedri Gonzalez', position: 'Midfielder', ovr: 93.3, captain: true },
      { id: 2, name: 'Ahmed Al Balushi', position: 'Forward', ovr: 88.1 },
      { id: 3, name: 'Khalid Al Farsi', position: 'Defender', ovr: 85.6 },
      { id: 4, name: 'Omar Al Rashdi', position: 'Goalkeeper', ovr: 87.2 },
      { id: 5, name: 'Salim Al Habsi', position: 'Midfielder', ovr: 84.9 },
    ],
  },
  {
    id: 2,
    name: 'Desert Eagles',
    ovr: 85.1,
    wins: 7,
    draws: 5,
    losses: 8,
    captain: false,
    members: [
      { id: 1, name: 'Faisal Al Khaifi', position: 'Forward', ovr: 91.0, captain: true },
      { id: 2, name: 'Pedri Gonzalez', position: 'Midfielder', ovr: 93.3 },
      { id: 3, name: 'Tariq Al Siyabi', position: 'Defender', ovr: 82.4 },
    ],
  },
];

export default function TeamScreen() {
  return (
    <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        <View style={styles.header}>
          <View>
            <Text style={styles.headTitle}>My Teams</Text>
            <Text style={styles.headSub}>{myTeams.length}/3 teams</Text>
          </View>
          <TouchableOpacity style={styles.createBtn}>
            <Ionicons name="add" size={20} color="black" />
            <Text style={styles.createText}>New Team</Text>
          </TouchableOpacity>
        </View>

        {myTeams.map((team) => (
          <TouchableOpacity
            key={team.id}
            style={styles.teamCard}
            onPress={() => router.push({ pathname: '/team-details', params: { id: String(team.id) } })}
          >

            <View style={styles.teamTop}>
              <View style={styles.teamIcon}>
                <Ionicons name="shield" size={28} color="white" />
              </View>
              <View style={styles.teamInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  {team.captain && (
                    <View style={styles.capBadge}>
                      <Text style={styles.capText}>Captain</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.teamOvr}>{team.ovr} OVR</Text>
              </View>
            </View>

            <View style={styles.stats}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{team.wins}</Text>
                <Text style={styles.statLab}>Wins</Text>
              </View>
              <View style={styles.statDiv} />
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{team.draws}</Text>
                <Text style={styles.statLab}>Draws</Text>
              </View>
              <View style={styles.statDiv} />
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{team.losses}</Text>
                <Text style={styles.statLab}>Losses</Text>
              </View>
            </View>

            <Text style={styles.memTitle}>Members</Text>
            <View style={styles.memList}>
              {team.members.map((member) => (
                <View key={member.id} style={styles.memRow}>
                  <View style={styles.memAvatar}>
                    <Ionicons name="person" size={16} color="white" />
                  </View>
                  <View style={styles.memInfo}>
                    <View style={styles.memNameRow}>
                      <Text style={styles.memName}>{member.name}</Text>
                      {member.captain && (
                        <Ionicons name="star" size={12} color="#FFD700" />
                      )}
                    </View>
                    <Text style={styles.memPos}>{member.position}</Text>
                  </View>
                  <Text style={styles.memOvr}>{member.ovr}</Text>
                </View>
              ))}
            </View>

            <View style={styles.teamActions}>
              {team.captain && (
                <TouchableOpacity style={styles.inviteBtn}>
                  <Ionicons name="person-add-outline" size={16} color="white" />
                  <Text style={styles.invite}>Invite</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.challengeBtn}>
                <Ionicons name="shield-outline" size={16} color="white" />
                <Text style={styles.challenge}>Challenge</Text>
              </TouchableOpacity>
            </View>

          </TouchableOpacity>
        ))}

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
    gap: 16,
    paddingBottom: 110,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  headTitle: {
    fontWeight: '900',
    fontSize: 26,
    color: 'white',
    letterSpacing: 0.3,
  },
  headSub: {
    marginTop: 2,
    color: '#888',
    fontSize: 13,
  },
  createBtn: {
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    backgroundColor: 'white',
    paddingVertical: 8,
  },
  createText: {
    fontWeight: '700',
    color: 'black',
    fontSize: 13,
  },
  teamCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  teamTop: {
    gap: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamIcon: {
    borderColor: 'rgba(255,255,255,0.15)',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    borderWidth: 1,
  },
  teamInfo: {
    gap: 4,
  },
  nameRow: {
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamName: {
    fontWeight: '800',
    color: 'white',
    fontSize: 18,
  },
  capBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderColor: 'rgba(255,215,0,0.4)',
  },
  capText: {
    fontWeight: '700',
    color: '#FFD700',
    fontSize: 10,
  },
  teamOvr: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  stats: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
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
    fontSize: 18,
    color: 'white',
  },
  statLab: {
    color: '#888',
    fontWeight: '500',
    fontSize: 11,
  },
  statDiv: {
    height: 30,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  memTitle: {
    letterSpacing: 1,
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  memList: {
    gap: 10,
  },
  memRow: {
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memAvatar: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  memInfo: {
    flex: 1,
    gap: 2,
  },
  memNameRow: {
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memName: {
    fontWeight: '600',
    fontSize: 14,
    color: 'white',
  },
  memPos: {
    color: '#888',
    fontSize: 12,
  },
  memOvr: {
    fontWeight: '700',
    color: '#aaa',
    fontSize: 13,
  },
  teamActions: {
    gap: 10,
    flexDirection: 'row',
  },
  inviteBtn: {
    flex: 1,
    gap: 6,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  invite: {
    fontWeight: '600',
    color: 'white',
    fontSize: 14,
  },
  challengeBtn: {
    flex: 1,
    gap: 6,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  challenge: {
    fontWeight: '600',
    fontSize: 14,
    color: 'white',
  },
})