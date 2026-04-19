import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Clock, Plus, Trash2, Calendar } from 'lucide-react-native';
import { addReminder, getReminders, deleteReminder } from '../utils/storage';
import DateTimePicker from '@react-native-community/datetimepicker';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RemindersScreen() {
  const [reminders, setReminders] = useState([]);
  const [text, setText] = useState('');
  const [date, setDate] = useState(new Date());
  const [mode, setMode] = useState('date');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReminders();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Разрешите уведомления для работы напоминаний');
    }
  };

  const loadReminders = async () => {
    setLoading(true);
    const data = await getReminders();
    const mapped = data.map(item => ({
        id: item.id.toString(),
        text: item.title,
        time: item.time, // ISO string
        enabled: !item.completed
    }));
    setReminders(mapped);
    setLoading(false);
  };

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const showMode = (currentMode) => {
    setShow(true);
    setMode(currentMode);
  };

  const handleAddReminder = async () => {
    if (!text) {
      Alert.alert('Ошибка', 'Введите текст напоминания');
      return;
    }

    if (date < new Date()) {
        Alert.alert('Ошибка', 'Время напоминания не может быть в прошлом');
        return;
    }

    // 1. Schedule local notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'CyberBloom Напоминание',
        body: text,
      },
      trigger: {
        date: date,
      },
    });

    // 2. Save to Supabase
    await addReminder({
        title: text,
        time: date.toISOString(),
        type: 'General',
    });

    await loadReminders();
    setText('');
    setDate(new Date());
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Удаление', 'Вы действительно хотите удалить это напоминание?',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', style: 'destructive', onPress: async () => {
            const success = await deleteReminder(id);
            if (success) loadReminders();
            else Alert.alert('Ошибка', 'Не удалось удалить');
        }}
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputCard}>
        <TextInput
          style={styles.input}
          placeholder="О чем напомнить?"
          value={text}
          onChangeText={setText}
        />
        
        <View style={styles.pickerContainer}>
            <TouchableOpacity style={styles.pickerButton} onPress={() => showMode('date')}>
                <Calendar size={20} color="#00BFA5" />
                <Text style={styles.pickerButtonText}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerButton} onPress={() => showMode('time')}>
                <Clock size={20} color="#00BFA5" />
                <Text style={styles.pickerButtonText}>
                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </TouchableOpacity>
        </View>

        {show && (
          <DateTimePicker
            value={date}
            mode={mode}
            is24Hour={true}
            display="default"
            onChange={onChange}
          />
        )}

        <TouchableOpacity style={styles.addButton} onPress={handleAddReminder}>
          <Plus color="white" size={24} />
          <Text style={styles.addButtonText}>Добавить напоминание</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={reminders}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.reminderItem}>
            <View style={styles.reminderInfo}>
              <View style={styles.timeTag}>
                <Text style={styles.timeTagText}>
                    {new Date(item.time).toLocaleDateString()}
                </Text>
                <Text style={styles.timeTagHour}>
                    {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={styles.reminderText}>{item.text}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Trash2 size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
        ListHeaderComponent={<Text style={styles.listTitle}>Ваши напоминания</Text>}
        ListEmptyComponent={<Text style={styles.emptyText}>Напоминаний пока нет</Text>}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadReminders}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inputCard: { padding: 20, backgroundColor: '#f8f9fa', borderBottomWidth: 1, borderBottomColor: '#eee' },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#ddd', fontSize: 16 },
  pickerContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  pickerButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: 'white', borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  pickerButtonText: { marginLeft: 8, fontSize: 16, fontWeight: '500', color: '#333' },
  addButton: { backgroundColor: '#00BFA5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 10 },
  addButtonText: { color: 'white', fontSize: 18, fontWeight: '600', marginLeft: 10 },
  list: { padding: 20 },
  listTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  reminderItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: 'white', borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee', elevation: 1 },
  reminderInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  timeTag: { backgroundColor: '#e2f9e1', padding: 6, borderRadius: 8, marginRight: 12, alignItems: 'center', minWidth: 80 },
  timeTagText: { fontSize: 10, color: '#00BFA5', fontWeight: 'bold' },
  timeTagHour: { fontSize: 16, fontWeight: '700', color: '#00BFA5' },
  reminderText: { fontSize: 16, color: '#444', flex: 1 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' }
});
