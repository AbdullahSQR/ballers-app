export type Question = {
  question: string;
  options: string[];
  type: 'position' | 'standard';
};

export type RoleOption = { name: string; description: string };

export const roles: Record<string, { question: string; options: RoleOption[] }> = {
  Goalkeeper: {
    question: "What is your style in goal?",
    options: [
      { name: 'Alisson Becker', description: 'Calm, just gets it done quietly' },
      { name: 'Manuel Neuer', description: 'Plays like an outfield player honestly' },
      { name: 'Thibaut Courtois', description: 'Big saves when it matters most' },
    ],
  },
  Defender: {
    question: "What is your style in defense?",
    options: [
      { name: 'Virgil Van Dijk', description: 'Never panics, always in control' },
      { name: 'Trent Alexander-Arnold', description: 'More of an attacker from the back' },
      { name: 'Sergio Ramos', description: 'Will do whatever it takes to win' },
    ],
  },
  Midfielder: {
    question: "What is your role in midfield?",
    options: [
      { name: 'Sergio Busquets', description: 'Slows it down and picks the right pass' },
      { name: 'Kevin De Bruyne', description: 'The guy everyone wants in their team' },
      { name: "N'Golo Kante", description: 'Everywhere at once, never gets tired' },
      { name: 'Luka Modric', description: 'Makes it look easy when it really isnt' },
    ],
  },
  Forward: {
    question: "What is your attacking style?",
    options: [
      { name: 'Erling Haaland', description: 'In the box, ball, goal, simple' },
      { name: 'Kylian Mbappe', description: 'Just runs in behind, impossible to catch' },
      { name: 'Lionel Messi', description: 'Gets the ball and something always happens' },
      { name: 'Neymar Junior', description: 'Give him space and he will embarrass you' },
    ],
  },
};

export const questions: Question[] = [
  {
    question: "What is your main playing position?",
    options: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
    type: 'position',
  },
  {
    question: 'How would you rate your skill level?',
    options: ['Beginner', 'Intermediate', 'Advanced'],
    type: 'standard',
  },
  {
    question: 'How often do you usually play football?',
    options: ['Rarely', 'Sometimes', 'Weekly', 'Quite Often'],
    type: 'standard',
  },
  {
    question: 'What type of games do you prefer?',
    options: ['Casual', 'Competitive', 'Both'],
    type: 'standard',
  },
  {
    question: 'What days are you available to play?',
    options: ['Weekdays', 'Weekends', 'Both'],
    type: 'standard',
  },
  {
    question: 'What time of day do you prefer to play?',
    options: ['Morning', 'Afternoon', 'Evening'],
    type: 'standard',
  },
  {
    question: 'How far are you willing to travel?',
    options: ['1 to 3 km', '5 km', '10+ km'],
    type: 'standard',
  },
  {
    question: 'Friends or new players?',
    options: ['Friends', 'New players', 'Both'],
    type: 'standard',
  },
  {
    question: "Main goal for using Ballers?",
    options: ['Staying Fit', 'Improve Abilities and Skills', 'Compete and Rank Up', 'Just Have Fun'],
    type: 'standard',
  },
];
