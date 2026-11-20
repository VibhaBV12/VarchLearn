import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useStudentData } from '../context/StudentDataContext';
import { VARCHLEARN_COLORS } from '../../../../shared/constants/theme';
import { AuthStackParamList, MainTabParamList, RootStackParamList } from './types';

import { SplashScreen } from '../screens/auth/SplashScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { RecoveryPinScreen } from '../screens/auth/RecoveryPinScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';

import { HomeDashboardScreen } from '../screens/main/HomeDashboardScreen';
import { AdventurePathScreen } from '../screens/main/AdventurePathScreen';
import { ActivitiesOverviewScreen } from '../screens/main/ActivitiesOverviewScreen';
import { RewardsAchievementsScreen } from '../screens/main/RewardsAchievementsScreen';
import { StudentProfileScreen } from '../screens/main/StudentProfileScreen';

import { ModalityActivitiesScreen } from '../screens/activities/ModalityActivitiesScreen';
import { ActivityIntroScreen } from '../screens/activities/ActivityIntroScreen';
import { ActivityPlayScreen } from '../screens/activities/ActivityPlayScreen';
import { ActivityCompleteScreen } from '../screens/activities/ActivityCompleteScreen';

import { AssessmentNotificationScreen } from '../screens/assessment/AssessmentNotificationScreen';
import { AssessmentDetailsScreen } from '../screens/assessment/AssessmentDetailsScreen';
import { AssessmentPlayScreen } from '../screens/assessment/AssessmentPlayScreen';
import { AssessmentProgressScreen } from '../screens/assessment/AssessmentProgressScreen';
import { AssessmentSubmitScreen } from '../screens/assessment/AssessmentSubmitScreen';
import { AssessmentResultsScreen } from '../screens/assessment/AssessmentResultsScreen';

import { AccountSettingsScreen } from '../screens/profile/AccountSettingsScreen';
import { ChangePasswordScreen } from '../screens/profile/ChangePasswordScreen';
import { ChangePinScreen } from '../screens/profile/ChangePinScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const MainTabs: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: VARCHLEARN_COLORS.primary,
      tabBarInactiveTintColor: VARCHLEARN_COLORS.textMuted,
      tabBarStyle: {
        height: 64,
        paddingBottom: 8,
        paddingTop: 6,
        borderTopColor: VARCHLEARN_COLORS.borderLavender,
      },
      tabBarIcon: ({ color, size }) => {
        const iconMap: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
          Home: 'home',
          Activities: 'grid',
          Achievements: 'star',
          Profile: 'person',
        };
        return <Ionicons name={iconMap[route.name]} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeDashboardScreen} />
    <Tab.Screen name="Activities" component={ActivitiesOverviewScreen} />
    <Tab.Screen name="Achievements" component={RewardsAchievementsScreen} />
    <Tab.Screen name="Profile" component={StudentProfileScreen} />
  </Tab.Navigator>
);

export const RootNavigator: React.FC = () => {
  const { student, loading } = useAuth();
  const { initialAssessment, loadingInitialCheck } = useStudentData();

  if (loading || (student && (loadingInitialCheck || !initialAssessment))) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: VARCHLEARN_COLORS.lavenderTint }}>
        <ActivityIndicator size="large" color={VARCHLEARN_COLORS.primary} />
      </View>
    );
  }

  // Phase 5: Initial Assessment Check
  // If Not Started or In Progress -> gate into AssessmentDetails (Start / Resume)
  // If Completed -> MainTabs (Student Home / Daily Learning Path)
  const mustTakeInitialAssessment =
    student &&
    initialAssessment &&
    initialAssessment.assessment &&
    initialAssessment.status !== 'completed';

  return (
    <NavigationContainer>
      {!student ? (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Splash" component={SplashScreen} />
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Register" component={RegisterScreen} />
          <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <AuthStack.Screen name="RecoveryPin" component={RecoveryPinScreen} />
          <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </AuthStack.Navigator>
      ) : (
        <RootStack.Navigator
          key={`${student.id}-${mustTakeInitialAssessment ? 'initial' : 'home'}`}
          initialRouteName={mustTakeInitialAssessment ? 'AssessmentDetails' : 'MainTabs'}
          screenOptions={{ headerShown: false }}
        >
          <RootStack.Screen name="MainTabs" component={MainTabs} />
          <RootStack.Screen name="AdventurePath" component={AdventurePathScreen} />
          <RootStack.Screen name="ModalityActivities" component={ModalityActivitiesScreen} />
          <RootStack.Screen name="ActivityIntro" component={ActivityIntroScreen} />
          <RootStack.Screen name="ActivityPlay" component={ActivityPlayScreen} />
          <RootStack.Screen name="ActivityComplete" component={ActivityCompleteScreen} />
          <RootStack.Screen name="AssessmentNotification" component={AssessmentNotificationScreen} />
          <RootStack.Screen
            name="AssessmentDetails"
            component={AssessmentDetailsScreen}
            initialParams={
              mustTakeInitialAssessment && initialAssessment?.assessment
                ? { assessment: initialAssessment.assessment }
                : undefined
            }
          />
          <RootStack.Screen name="AssessmentPlay" component={AssessmentPlayScreen} />
          <RootStack.Screen name="AssessmentProgress" component={AssessmentProgressScreen} />
          <RootStack.Screen name="AssessmentSubmit" component={AssessmentSubmitScreen} />
          <RootStack.Screen name="AssessmentResults" component={AssessmentResultsScreen} />
          <RootStack.Screen name="AccountSettings" component={AccountSettingsScreen} />
          <RootStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <RootStack.Screen name="ChangePin" component={ChangePinScreen} />
        </RootStack.Navigator>
      )}
    </NavigationContainer>
  );
};
