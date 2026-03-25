import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Member = {
  id: number;
  name: string;
  position: string;
  ovr: number;
  captain?: boolean;
};

type Team = {
  id: number;
  name: string;
  ovr: number;
  wins: number;
  draws: number;
  losses: number;
  captain: boolean;
  formed: string;
  matchesPlayed: number;
  members: Member[];
};

const teamsData: { [key: string]: Team } = {
  '1': {
    id: 1,
    name: 'FC Wolves',
    ovr: 88.4,
    wins: 12,
    draws: 3,
    losses: 5,
    captain: true,
    formed: 'January 2024',
    matchesPlayed: 20,
    members: [
      { id: 1, name: 'Pedri Gonzalez', position: 'Midfielder', ovr: 93.3, captain: true },
      { id: 2, name: 'Ahmed Al Balushi', position: 'Forward', ovr: 88.1 },
      { id: 3, name: 'Khalid Al Farsi', position: 'Defender', ovr: 85.6 },
      { id: 4, name: 'Omar Al Rashdi', position: 'Goalkeeper', ovr: 87.2 },
      { id: 5, name: 'Salim Al Habsi', position: 'Midfielder', ovr: 84.9 },
    ],
  },
  '2': {
    id: 2,
    name: 'Desert Eagles',
    ovr: 85.1,
    wins: 7,
    draws: 5,
    losses: 8,
    captain: false,
    formed: 'March 2024',
    matchesPlayed: 20,
    members: [
      { id: 1, name: 'Faisal Al Maqbali', position: 'Forward', ovr: 91.0, captain: true },
      { id: 2, name: 'Pedri Gonzalez', position: 'Midfielder', ovr: 93.3 },
      { id: 3, name: 'Tariq Al Siyabi', position: 'Defender', ovr: 82.4 },
    ],
  },
};

export default function TeamDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const team = teamsData[id];

  if (!team) {
    return (
      <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white' }}>Team not found</Text>
        </View>
      </LinearGradient>
    );
  }

  const winRate = Math.round((team.wins / team.matchesPlayed) * 100);

  return (
    <LinearGradient colors={['#2a2a2a', '#000000']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <View style={styles.teamHeader}>
          <View style={styles.teamIcon}>
            <Ionicons name="shield" size={40} color="white" />
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.teamName}>{team.name}</Text>
            {team.captain && (
              <View style={styles.capBadge}>
                <Text style={styles.capBadgeText}>Captain</Text>
              </View>
            )}
          </View>
          <Text style={styles.ovr}>{team.ovr} OVR</Text>
          <Text style={styles.formed}>Formed {team.formed}</Text>
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
          <View style={styles.statDiv} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{winRate}%</Text>
            <Text style={styles.statLab}>Win Rate</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.secHeader}>
            <Text style={styles.secTitle}>Members</Text>
            <Text style={styles.memCount}>{team.members.length}/12</Text>
          </View>

          <View style={styles.progBack}>
            <View style={[styles.progFill, { width: `${(team.members.length / 12) * 100}%` }]} />
          </View>

          <View style={styles.memList}>
            {team.members.map((member: Member) => (
              <View key={member.id} style={styles.memRow}>
                <View style={styles.memAvatar}>
                  <Ionicons name="person" size={18} color="white" />
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
                <Text style={styles.memOvr}>{member.ovr} OVR</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          {team.captain && (
            <TouchableOpacity style={styles.inviteBtn}>
              <Ionicons name="person-add-outline" size={18} color="white" />
              <Text style={styles.invite}>Invite Player</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.challengeBtn}>
            <Ionicons name="shield-outline" size={18} color="white" />
            <Text style={styles.challenge}>Challenge a Team</Text>
          </TouchableOpacity>
          {!team.captain && (
            <TouchableOpacity style={styles.leaveBtn}>
              <Text style={styles.leave}>Leave Team</Text>
            </TouchableOpacity>
          )}
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
    paddingTop: 60,
    paddingHorizontal: 22,
    gap: 16,
    paddingBottom: 110,
  },
  backBtn: {
    marginBottom: 8,
  },
  back: {
    fontSize: 24,
    color: 'white',
  },
  teamHeader: {
    gap: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  teamIcon: {
    borderColor: 'rgba(255,255,255,0.2)',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  nameRow: {
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamName: {
    fontWeight: '900',
    color: 'white',
    fontSize: 26,
    letterSpacing: 0.5,
  },
  capBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingVertical: 2,
    borderRadius: 10,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  capBadgeText: {
    fontWeight: '700',
    color: '#FFD700',
    fontSize: 10,
  },
  ovr: {
    fontSize: 15,
    color: '#aaa',
    fontWeight: '600',
  },
  formed: {
    color: '#666',
    fontSize: 12,
  },
  stats: {
    borderWidth: 1,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'space-between',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  statVal: {
    fontWeight: '800',
    fontSize: 18,
    color: 'white',
  },
  statLab: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  statDiv: {
    height: 30,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  section: {
    gap: 12,
  },
  secHeader: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  secTitle: {
    fontSize: 16,
    color: 'white',
    fontWeight: '800',
  },
  memCount: {
    fontWeight: '600',
    color: '#888',
    fontSize: 13,
  },
  progBack: {
    borderRadius: 2,
    height: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: 'white',
  },
  memList: {
    gap: 12,
  },
  memRow: {
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  memAvatar: {
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  memInfo: {
    gap: 2,
    flex: 1,
  },
  memNameRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  memName: {
    fontWeight: '600',
    fontSize: 14,
    color: 'white',
  },
  memPos: {
    fontSize: 12,
    color: '#888',
  },
  memOvr: {
    color: '#aaa',
    fontWeight: '700',
    fontSize: 13,
  },
  actions: {
    gap: 10,
  },
  inviteBtn: {
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    gap: 8,
    justifyContent: 'center',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  invite: {
    fontSize: 15,
    color: 'white',
    fontWeight: '600',
  },
  challengeBtn: {
    gap: 8,
    padding: 14,
    flexDirection: 'row',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  challenge: {
    fontWeight: '600',
    color: 'white',
    fontSize: 15,
  },
  leaveBtn: {
    borderColor: 'rgba(255,0,0,0.3)',
    padding: 14,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
  },
  leave: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ff6b6b',
  },
})