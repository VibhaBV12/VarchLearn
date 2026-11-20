import { ActivityItem, Assessment, AssessmentResultRecord, ModalityKey } from '../../../../shared/types';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  RecoveryPin: { username: string };
  ResetPassword: { username: string; recoveryPin?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Activities: undefined;
  Achievements: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  AdventurePath: undefined;
  ModalityActivities: { modality: ModalityKey };
  ActivityIntro: { activity: ActivityItem; pathNodeId?: string };
  ActivityPlay: { activity: ActivityItem; pathNodeId?: string };
  ActivityComplete: {
    activity: ActivityItem;
    correctCount: number;
    totalCount: number;
    earnedStars: number;
    pathNodeId?: string;
  };
  AssessmentNotification: { assessment: Assessment };
  AssessmentDetails: { assessment: Assessment };
  AssessmentPlay: { assessment: Assessment };
  AssessmentProgress: { assessment: Assessment };
  AssessmentSubmit: { assessment: Assessment };
  AssessmentResults: { result: AssessmentResultRecord; showPercentages: boolean };
  AccountSettings: undefined;
  ChangePassword: undefined;
  ChangePin: undefined;
};
