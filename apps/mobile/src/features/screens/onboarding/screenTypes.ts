export type OnboardingScreenProps = {
  onBack?: () => void;
  onNext: () => void;
  progress: number;
};
