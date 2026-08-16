import React, { useState, useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, ActivityIndicator } from 'react-native';
import { Book, Bell, MessageSquare, Users, Settings as SettingsIcon } from 'lucide-react-native';
import { supabase } from '../utils/supabase';

import DiaryScreen from '../screens/DiaryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RemindersScreen from '../screens/RemindersScreen';
import ChatScreen from '../screens/ChatScreen';
import AIScreen from '../screens/AIScreen';
import AuthScreen from '../screens/AuthScreen';
import PatientListScreen from '../screens/PatientListScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastErrorTime = useRef(0);

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('AppNavigator: Initializing session...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        console.log('AppNavigator: Session found:', session ? 'Yes' : 'No');
        setSession(session);
        if (session) await fetchProfile(session.user.id);
        else setLoading(false);
      } catch (err) {
        console.error('AppNavigator: Auth initialization failed:', err.message);
        
        // If we are stuck in a network loop with a session, clear it to rescue the app
        if (err.message?.includes('Network') && session) {
            console.warn('AppNavigator: Permanent network failure detected with active session. Clearing session.');
            await supabase.auth.signOut();
            setSession(null);
            setRole(null);
        }
        setLoading(false);
      }
    };

    // Safety Timeout: Ensure app doesn't stay blank forever
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn('AppNavigator: Safety timeout reached. Forcing render.');
        setLoading(false);
      }
    }, 10000);

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      clearTimeout(safetyTimeout);
      console.log('AppNavigator: Event:', _event);
      setSession(session);
      if (session) await fetchProfile(session.user.id);
      else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    console.log('AppNavigator: Fetching profile for:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.warn('AppNavigator: Profile find error:', error.message);
      }
      
      if (!data && !error) {
        console.warn('AppNavigator: Profile missing for user. Attempting fallback creation.');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const roleFallback = user.user_metadata?.role || 'patient';
            await supabase.from('profiles').insert([{
                id: userId,
                email: user.email,
                full_name: user.user_metadata?.full_name || 'Неизвестный',
                role: roleFallback,
                phone_number: user.user_metadata?.phone_number || null,
                affiliation: user.user_metadata?.affiliation || null,
                description: user.user_metadata?.description || null,
            }]);
            setRole(roleFallback);
        }
      } else if (data) {
        console.log('AppNavigator: Profile role:', data.role);
        setRole(data.role);
      }
    } catch (e) {
      console.error('AppNavigator: Profile fetch exception:', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' }}>
        <ActivityIndicator size="large" color="#00BFA5" />
        <Text style={{ marginTop: 12, color: '#666' }}>Подключение к CyberBloom...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session ? (
        role === 'doctor' ? (
          <Tab.Navigator
            screenOptions={{
              tabBarActiveTintColor: '#00BFA5',
              tabBarInactiveTintColor: 'gray',
              headerStyle: { backgroundColor: '#f8f9fa' },
            }}
          >
            <Tab.Screen 
              name="Patients" 
              component={PatientListScreen} 
              options={{ 
                title: 'Мои Пациенты',
                tabBarIcon: ({ color, size }) => <Users size={size} color={color} />
              }} 
            />
          </Tab.Navigator>
        ) : (
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ color, size }) => {
                if (route.name === 'Diary') return <Book size={size} color={color} />;
                if (route.name === 'Reminders') return <Bell size={size} color={color} />;
                if (route.name === 'Chat') return <MessageSquare size={size} color={color} />;
                if (route.name === 'Settings') return <SettingsIcon size={size} color={color} />;
              },
              tabBarActiveTintColor: '#00BFA5',
              tabBarInactiveTintColor: 'gray',
              headerStyle: { backgroundColor: '#f8f9fa' },
              headerTitleStyle: { fontWeight: '600' },
            })}
          >
            <Tab.Screen name="Diary" component={DiaryScreen} options={{ title: 'Дневник' }} />
            <Tab.Screen name="Reminders" component={RemindersScreen} options={{ title: 'Напоминания' }} />
            <Tab.Screen name="Chat" component={ChatScreen} options={{ title: 'Чат' }} />
            <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Настройки' }} />
          </Tab.Navigator>
        )
      ) : (
        <AuthScreen />
      )}
    </NavigationContainer>
  );
}
