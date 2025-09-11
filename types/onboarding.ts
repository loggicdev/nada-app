export interface OnboardingData {
  email?: string;
  password?: string;
  name?: string;
  age?: number;
  gender?: 'feminine' | 'masculine' | 'non-binary';
  lookingFor?: 'women' | 'men' | 'everyone';
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  goals?: ('dating' | 'serious' | 'marriage' | 'friendship')[];
  interests?: string[];
  lifestyle?: {
    alcohol?: 'never' | 'socially' | 'regularly';
    smoking?: 'never' | 'socially' | 'regularly';
    exercise?: 'never' | 'sometimes' | 'regularly' | 'daily';
  };
}

export interface OnboardingStep {
  id: number;
  title: string;
  completed: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 0, title: 'Boas-vindas', completed: false },
  { id: 1, title: 'Conta', completed: false },
  { id: 2, title: 'Informações', completed: false },
  { id: 3, title: 'Astrologia', completed: false },
  { id: 4, title: 'Objetivos', completed: false },
  { id: 5, title: 'Interesses', completed: false },
  { id: 6, title: 'Estilo de vida', completed: false },
  { id: 7, title: 'Finalização', completed: false },
];

export const TOTAL_STEPS = ONBOARDING_STEPS.length;