import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { supabase } from '../utils/supabase';
import { User, Mail, Lock, Briefcase, FileText, ChevronRight } from 'lucide-react-native';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('patient'); // 'patient' or 'doctor'
  const [affiliation, setAffiliation] = useState('');
  const [description, setDescription] = useState('');

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните основные поля.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        // Signup
        if (!fullName || !phoneNumber) {
          Alert.alert('Ошибка', 'Введите ФИО и номер телефона.');
          setLoading(false);
          return;
        }

        const { data: authData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone_number: phoneNumber,
              role: role,
              affiliation: affiliation,
              description: description,
            },
          },
        });
        
        if (error) throw error;

        // Manually create profile to ensure it exists regardless of SQL triggers
        if (authData?.user) {
           await supabase.from('profiles').upsert([{
                id: authData.user.id,
                email: email,
                full_name: fullName,
                phone_number: phoneNumber,
                role: role,
                affiliation: affiliation,
                description: description,
           }]);
        }

        Alert.alert('Успех', 'Аккаунт создан! Пожалуйста, проверьте почту (или просто войдите).');
      }
    } catch (error) {
      Alert.alert('Ошибка авторизации', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>CB</Text>
          </View>
          <Text style={styles.title}>{isLogin ? 'С возвращением' : 'Создайте аккаунт'}</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Войдите в систему CyberBloom' : 'Начните заботу о здоровье прямо сейчас'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Mail size={20} color="#00BFA5" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Lock size={20} color="#00BFA5" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Пароль"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {!isLogin && (
            <>
              <View style={styles.inputWrapper}>
                <User size={20} color="#00BFA5" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Полное имя (ФИО)"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Briefcase size={20} color="#00BFA5" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Номер телефона"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.roleContainer}>
                <Text style={styles.label}>Вы регистрируетесь как:</Text>
                <View style={styles.roleButtons}>
                  <TouchableOpacity
                    style={[styles.roleButton, role === 'patient' && styles.roleButtonActive]}
                    onPress={() => setRole('patient')}
                  >
                    <Text style={[styles.roleButtonText, role === 'patient' && styles.roleButtonTextActive]}>Пациент</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleButton, role === 'doctor' && styles.roleButtonActive]}
                    onPress={() => setRole('doctor')}
                  >
                    <Text style={[styles.roleButtonText, role === 'doctor' && styles.roleButtonTextActive]}>Врач</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {role === 'doctor' && (
                <View style={styles.inputWrapper}>
                  <Briefcase size={20} color="#00BFA5" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Место работы / Специализация"
                    value={affiliation}
                    onChangeText={setAffiliation}
                  />
                </View>
              )}

              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <FileText size={20} color="#00BFA5" style={[styles.inputIcon, { marginTop: 12 }]} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder={role === 'doctor' ? 'О себе / Квалификация' : 'Особенности заболевания / Примечания'}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </>
          )}

          <TouchableOpacity
            style={styles.authButton}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.authButtonText}>{isLogin ? 'Войти' : 'Зарегистрироваться'}</Text>
                <ChevronRight size={20} color="white" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchText}>
              {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#00BFA5',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#00BFA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'BOLD',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#E1E5EB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  textAreaWrapper: {
    height: 100,
    alignItems: 'flex-start',
  },
  textArea: {
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  roleContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#00BFA5',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  roleButtonActive: {
    backgroundColor: '#00BFA5',
  },
  roleButtonText: {
    color: '#00BFA5',
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: 'white',
  },
  authButton: {
    backgroundColor: '#00BFA5',
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  authButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#00BFA5',
    fontSize: 14,
    fontWeight: '500',
  },
});
