import { User, Match, Message, Conversation, MatchCandidate } from '@/types/user';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Luna',
    age: 28,
    photos: ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&auto=format'],
    bio: 'Buscando conexões autênticas e crescimento mútuo. Amo astrologia, yoga e conversas profundas sob as estrelas.',
    location: 'São Paulo, SP',
    zodiacSign: 'Peixes',
    personalityType: 'INFP',
    intentions: ['Relacionamento sério', 'Crescimento pessoal'],
    interests: ['Astrologia', 'Yoga', 'Meditação', 'Arte', 'Natureza'],
    lastActive: '2 horas atrás'
  },
  {
    id: '2', 
    name: 'Gabriel',
    age: 32,
    photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop'],
    bio: 'Terapeuta holístico em busca de uma parceira para explorar os mistérios da vida juntos.',
    location: 'Rio de Janeiro, RJ',
    zodiacSign: 'Escorpião',
    personalityType: 'ENFJ',
    intentions: ['Relacionamento sério', 'Espiritualidade'],
    interests: ['Terapia', 'Astrologia', 'Música', 'Filosofia'],
    lastActive: '1 hora atrás'
  },
  {
    id: '3',
    name: 'Sofia',
    age: 26,
    photos: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop'],
    bio: 'Artista e sonhadora. Acredito que o universo conspira a favor do amor verdadeiro.',
    location: 'Florianópolis, SC',
    zodiacSign: 'Aquário',
    personalityType: 'ISFP',
    intentions: ['Conexões profundas', 'Arte'],
    interests: ['Pintura', 'Astrologia', 'Viagens', 'Fotografia'],
    lastActive: '30 min atrás'
  },
  {
    id: '4',
    name: 'Diego',
    age: 29,
    photos: ['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop'],
    bio: 'Aventureiro e apaixonado por fotografia. Sempre em busca de novas experiências e conexões genuínas.',
    location: 'Belo Horizonte, MG',
    zodiacSign: 'Sagitário',
    personalityType: 'ENFP',
    intentions: ['Aventuras', 'Relacionamento sério'],
    interests: ['Fotografia', 'Viagens', 'Escalada', 'Astrologia'],
    lastActive: '15 min atrás'
  },
  {
    id: '5',
    name: 'Mariana',
    age: 25,
    photos: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop&auto=format'],
    bio: 'Psicóloga e entusiasta da astrologia. Acredito no poder das conexões cósmicas.',
    location: 'Porto Alegre, RS',
    zodiacSign: 'Virgem',
    personalityType: 'INFJ',
    intentions: ['Relacionamento sério', 'Crescimento pessoal'],
    interests: ['Psicologia', 'Astrologia', 'Leitura', 'Yoga'],
    lastActive: '5 min atrás'
  },
  {
    id: '6',
    name: 'Rafael',
    age: 30,
    photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop'],
    bio: 'Músico e compositor. Acredito que a música é a linguagem universal da alma.',
    location: 'Salvador, BA',
    zodiacSign: 'Leão',
    personalityType: 'ESFP',
    intentions: ['Conexões criativas', 'Relacionamento sério'],
    interests: ['Música', 'Composição', 'Astrologia', 'Dança'],
    lastActive: '10 min atrás'
  },
  {
    id: '7',
    name: 'Camila',
    age: 27,
    photos: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop'],
    bio: 'Chef e apaixonada por gastronomia. Cozinho com amor e tempero com magia.',
    location: 'Curitiba, PR',
    zodiacSign: 'Touro',
    personalityType: 'ISFJ',
    intentions: ['Relacionamento sério', 'Família'],
    interests: ['Culinária', 'Astrologia', 'Jardinagem', 'Vinhos'],
    lastActive: '20 min atrás'
  },
  {
    id: '8',
    name: 'Lucas',
    age: 31,
    photos: ['https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=600&fit=crop'],
    bio: 'Arquiteto e designer. Construo espaços que nutrem a alma e elevam o espírito.',
    location: 'Brasília, DF',
    zodiacSign: 'Capricórnio',
    personalityType: 'INTJ',
    intentions: ['Relacionamento sério', 'Crescimento pessoal'],
    interests: ['Arquitetura', 'Design', 'Astrologia', 'Minimalismo'],
    lastActive: '1 hora atrás'
  },
  {
    id: '9',
    name: 'Isabela',
    age: 24,
    photos: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop'],
    bio: 'Estudante de filosofia e praticante de meditação. Em busca de conexões profundas e significativas.',
    location: 'Recife, PE',
    zodiacSign: 'Gêmeos',
    personalityType: 'ENTP',
    intentions: ['Crescimento pessoal', 'Filosofia'],
    interests: ['Filosofia', 'Meditação', 'Astrologia', 'Literatura'],
    lastActive: '3 horas atrás'
  },
  {
    id: '10',
    name: 'Thiago',
    age: 33,
    photos: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop'],
    bio: 'Personal trainer e instrutor de yoga. Acredito no equilíbrio entre corpo, mente e espírito.',
    location: 'Fortaleza, CE',
    zodiacSign: 'Áries',
    personalityType: 'ESTP',
    intentions: ['Vida saudável', 'Relacionamento sério'],
    interests: ['Fitness', 'Yoga', 'Astrologia', 'Surf'],
    lastActive: '45 min atrás'
  }
];

export const mockMatchCandidates: MatchCandidate[] = [
  {
    ...mockUsers[3],
    distance: 2.5,
    compatibilityScore: 89
  },
  {
    ...mockUsers[4],
    distance: 1.2,
    compatibilityScore: 94
  },
  {
    ...mockUsers[5],
    distance: 3.8,
    compatibilityScore: 91
  },
  {
    ...mockUsers[6],
    distance: 1.8,
    compatibilityScore: 86
  },
  {
    ...mockUsers[7],
    distance: 4.2,
    compatibilityScore: 88
  },
  {
    ...mockUsers[8],
    distance: 2.1,
    compatibilityScore: 92
  },
  {
    ...mockUsers[9],
    distance: 5.5,
    compatibilityScore: 85
  }
];

export const mockMessages: Message[] = [
  {
    id: '1',
    senderId: '1',
    receiverId: 'current-user',
    content: 'Oi! Adorei seu perfil, você parece ter uma energia incrível! ✨',
    type: 'text',
    timestamp: '2024-01-15T14:30:00Z',
    read: true
  },
  {
    id: '2',
    senderId: 'current-user',
    receiverId: '1',
    content: 'Oi Luna! Obrigado pelo match! Vi que você também ama astrologia 🌙',
    type: 'text',
    timestamp: '2024-01-15T14:32:00Z',
    read: true
  },
  {
    id: '3',
    senderId: '1',
    receiverId: 'current-user',
    content: 'Sim! Sou completamente apaixonada. Qual seu signo?',
    type: 'text',
    timestamp: '2024-01-15T14:35:00Z',
    read: true
  },
  {
    id: '4',
    senderId: 'current-user',
    receiverId: '1',
    content: 'Sou Escorpião com ascendente em Leão! E você?',
    type: 'text',
    timestamp: '2024-01-15T14:37:00Z',
    read: true
  },
  {
    id: '5',
    senderId: '1',
    receiverId: 'current-user',
    content: 'Peixes com lua em Câncer! Que combinação interessante a nossa 😊',
    type: 'text',
    timestamp: '2024-01-15T14:40:00Z',
    read: false,
    reactions: [
      {
        id: 'r1',
        userId: 'current-user',
        emoji: '❤️',
        timestamp: '2024-01-15T14:41:00Z'
      }
    ]
  }
];

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    participants: ['current-user', '1'],
    lastMessage: mockMessages[4],
    createdAt: '2024-01-15T14:30:00Z',
    updatedAt: '2024-01-15T14:40:00Z'
  },
  {
    id: 'conv-2',
    participants: ['current-user', '2'],
    lastMessage: {
      id: '6',
      senderId: '2',
      receiverId: 'current-user',
      content: 'Que tal conversarmos sobre terapia holística? Tenho algumas técnicas interessantes para compartilhar',
      type: 'text',
      timestamp: '2024-01-14T16:20:00Z',
      read: false
    },
    createdAt: '2024-01-14T15:45:00Z',
    updatedAt: '2024-01-14T16:20:00Z'
  }
];

export const mockMatches: Match[] = [
  {
    id: '1',
    user: mockUsers[0],
    compatibilityScore: 87,
    sharedValues: ['Espiritualidade', 'Crescimento pessoal', 'Autenticidade'],
    cosmicInsights: [
      'Vocês compartilham uma conexão água-água muito profunda',
      'Ambos valorizam a intuição e a sensibilidade emocional',
      'Potencial para uma comunicação muito empática'
    ],
    matchedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    user: mockUsers[1], 
    compatibilityScore: 92,
    sharedValues: ['Terapia', 'Transformação', 'Profundidade'],
    cosmicInsights: [
      'Escorpião e seu signo criam uma dinâmica de transformação mútua',
      'Ambos buscam conexões que vão além da superfície',
      'Potencial para crescimento espiritual conjunto'
    ],
    matchedAt: '2024-01-14T15:45:00Z'
  },
  {
    id: '3',
    user: mockUsers[2],
    compatibilityScore: 85,
    sharedValues: ['Arte', 'Criatividade', 'Liberdade'],
    cosmicInsights: [
      'Aquário traz inovação e originalidade para a relação',
      'Ambos valorizam a independência e a expressão criativa',
      'Potencial para uma parceria artística inspiradora'
    ],
    matchedAt: '2024-01-13T09:15:00Z'
  }
];