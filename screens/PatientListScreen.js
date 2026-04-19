import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../utils/supabase';
import { User, MessageSquare, Phone } from 'lucide-react-native';

export default function PatientListScreen({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch patients where assigned_doctor_id matches current doctor
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('assigned_doctor_id', user.id);
      
      if (error) throw error;
      setPatients(data || []);
    } catch (e) {
      console.error('Error fetching patients:', e);
      Alert.alert('Ошибка', 'Не удалось загрузить список пациентов');
    } finally {
      setLoading(false);
    }
  };

  const renderPatient = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('Chat', { patientId: item.id, patientName: item.full_name })}
    >
      <View style={styles.avatar}>
        <User color="white" size={24} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.full_name}</Text>
        <Text style={styles.details}>{item.description || 'Нет описания'}</Text>
      </View>
      <MessageSquare color="#00BFA5" size={20} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#00BFA5" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={patients}
          renderItem={renderPatient}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>У вас пока нет назначенных пациентов</Text>
          }
          refreshing={loading}
          onRefresh={fetchPatients}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00BFA5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#333' },
  details: { fontSize: 13, color: '#666', marginTop: 2 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#999', fontSize: 16 }
});
