import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const mockUser = { username: 'Baller', ovr: 70, wins: 0, draws: 0, losses: 0 };

export default function HomeScreen() {
  const [activeMatch, setActiveMatch] = useState<any>(null);

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

  const leaveMatch = () => {
    setActiveMatch(null);
  };

  return (
    <View style={styles.container}>

      <Image
        source={require('../../assets/images/pitch.png')}
        style={styles.bgImage}
        resizeMode="cover"
      />

      <View style={styles.overlay} />

      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back, {mockUser.username}</Text>
            <Text style={styles.headTitle}>Ready to play?</Text>
          </View>
          <TouchableOpacity style={styles.bell}>
            <Ionicons name="notifications-outline" size={22} color="white" />
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
          <Text style={styles.joinTitle}>
            {activeMatch ? 'In a Match' : 'Join a Match'}
          </Text>
          <Text style={styles.joinSub}>
            {activeMatch ? 'Tap to leave' : 'One tap. We find your game.'}
          </Text>
        </TouchableOpacity>

        {activeMatch && (
          <View style={styles.matchCard}>
            <View style={styles.matchTop}>
              <Text style={styles.matchTitle}>Your Next Match</Text>
              <View style={[
                styles.badge,
                {
                  backgroundColor: activeMatch.status === 'confirmed' ? 'rgba(100,220,100,0.2)' : 'rgba(255,255,255,0.15)',
                  borderColor: activeMatch.status === 'confirmed' ? 'rgba(100,220,100,0.4)' : 'rgba(255,255,255,0.2)',
                }
              ]}>
                <Text style={[
                  styles.badgeText,
                  { color: activeMatch.status === 'confirmed' ? '#69db7c' : 'white' }
                ]}>
                  {activeMatch.status === 'confirmed' ? 'Confirmed' : `${activeMatch.playersJoined}/14 players`}
                </Text>
              </View>
            </View>

            <View style={styles.matchDetails}>
              <View style={styles.matchRow}>
                <Ionicons name="location-outline" size={16} color="#aaa" />
                <Text style={styles.matchText}>{activeMatch.location}</Text>
              </View>
              <View style={styles.matchRow}>
                <Ionicons name="calendar-outline" size={16} color="#aaa" />
                <Text style={styles.matchText}>{activeMatch.date} · {activeMatch.time}</Text>
              </View>
              <View style={styles.matchRow}>
                <Ionicons name="people-outline" size={16} color="#aaa" />
                <Text style={styles.matchText}>
                  {activeMatch.playersJoined}/14 players joined
                </Text>
              </View>
            </View>

            <View style={styles.progBack}>
              <View style={[
                styles.progFill,
                { width: `${(activeMatch.playersJoined / 14) * 100}%` }
              ]} />
            </View>

            <View style={styles.matchActions}>
              <TouchableOpacity style={styles.leaveBtn} onPress={leaveMatch}>
                <Text style={styles.leave}>Leave</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.viewBtn}>
                <Text style={styles.view}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.challengeCard}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  bgImage: {
    top: 0,
    position: 'absolute',
    width: '100%',
    left: 0,
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.78)',
  },
  scroll: {
    paddingTop: 65,
    gap: 14,
    paddingHorizontal: 22,
    paddingBottom: 110,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  greeting: {
    marginBottom: 4,
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  headTitle: {
    fontWeight: '900',
    fontSize: 26,
    color: 'white',
    lineHeight: 34,
    letterSpacing: 0.3,
  },
  bell: {
    borderColor: 'rgba(255,255,255,0.15)',
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    borderWidth: 1,
  },
  statsCard: {
    borderWidth: 1,
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'space-between',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  statBox: {
    gap: 4,
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontWeight: '800',
    color: 'white',
    fontSize: 18,
  },
  statLab: {
    fontWeight: '500',
    fontSize: 11,
    color: '#888',
  },
  statDiv: {
    height: 30,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  joinBtn: {
    gap: 10,
    padding: 28,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  joinIcon: {
    marginBottom: 4,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  joinTitle: {
    letterSpacing: 0.5,
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
  },
  joinSub: {
    fontSize: 13,
    color: '#999',
    fontWeight: '400',
  },
  matchCard: {
    gap: 14,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  matchTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchTitle: {
    fontWeight: '800',
    color: 'white',
    fontSize: 16,
  },
  badge: {
    paddingHorizontal: 10,
    borderWidth: 1,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontWeight: '600',
    fontSize: 11,
  },
  matchDetails: {
    gap: 8,
  },
  matchRow: {
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchText: {
    fontSize: 13,
    color: '#bbb',
  },
  progBack: {
    borderRadius: 2,
    height: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progFill: {
    borderRadius: 2,
    height: '100%',
    backgroundColor: 'white',
  },
  matchActions: {
    gap: 10,
    flexDirection: 'row',
  },
  leaveBtn: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  leave: {
    fontWeight: '600',
    color: '#aaa',
    fontSize: 14,
  },
  viewBtn: {
    flex: 2,
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.25)',
  },
  view: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  challengeCard: {
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  challengeLeft: {
    gap: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeIcon: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    borderRadius: 25,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  challengeTitle: {
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 3,
    color: 'white',
  },
  challengeSub: {
    color: '#999',
    fontWeight: '400',
    fontSize: 12,
  },
})