import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { saveLog, getLogs, deleteLog } from '../utils/storage';
import { Plus, Share2, Trash2, AlertTriangle } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { supabase } from '../utils/supabase';
import { useIsFocused } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';

export default function DiaryScreen() {
  const [logs, setLogs] = useState([]);
  const [sugar, setSugar] = useState('');
  const [food, setFood] = useState('');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  const { minLimit, maxLimit, getAdjustedFontSize } = useSettings();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadData();
      fetchProfile();
    }
  }, [isFocused]);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setUserProfile(data);
  };

  const loadData = async () => {
    setLoading(true);
    const data = await getLogs();
    setLogs(data);
    setLoading(false);
  };

  const handleAddLog = async () => {
    if (!sugar && !food) {
      Alert.alert('Ошибка', 'Пожалуйста, введите данные');
      return;
    }

    const value = parseFloat(sugar);
    let status = 'Норма';
    if (!isNaN(value)) {
      if (value < minLimit) status = 'Низкий';
      if (value > maxLimit) status = 'Высокий';
    }

    const newLogData = {
      value: sugar || '0',
      notes: food || '-',
      status,
    };

    setLoading(true);
    const result = await saveLog(newLogData);
    if (result) {
        await loadData();
        setSugar('');
        setFood('');
    } else {
        Alert.alert('Ошибка', 'Не удалось сохранить запись.');
    }
    setLoading(false);
  };

  const handleShare = async () => {
    if (logs.length === 0) {
      Alert.alert('Инфо', 'Нет данных для отправки');
      return;
    }

    if (!userProfile?.assigned_doctor_id) {
        Alert.alert('Внимание', 'Сначала выберите лечащего врача в разделе "Чат"');
        return;
    }

    Alert.alert(
        'Отправка отчета',
        'Отправить текущий отчет за дневник вашему лечащему врачу?',
        [
            { text: 'Отмена', style: 'cancel' },
            { 
              text: 'Отправить', 
              onPress: async () => {
                const report = `📋 КЛИНИЧЕСКИЙ ОТЧЕТ (${new Date().toLocaleDateString()})\n` + 
                    logs.map(l => `• ${new Date(l.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}: Сахар ${l.sugar_level}, ${l.notes}`).join('\n');
                
                const { error } = await supabase.from('messages').insert([{
                    sender_id: userProfile.id,
                    receiver_id: userProfile.assigned_doctor_id,
                    text: report,
                    is_system: true
                }]);

                if (error) Alert.alert('Ошибка', 'Не удалось отправить отчет');
                else Alert.alert('Успех', 'Отчет успешно отправлен врачу через чат');
              }
            }
        ]
    );
  };

  const handleDeleteLog = (id) => {
    Alert.alert(
      'Удаление',
      'Вы действительно хотите удалить эту запись?',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить', style: 'destructive', onPress: async () => {
            const success = await deleteLog(id);
            if (success) {
                loadData();
            } else {
                Alert.alert('Ошибка', 'Не удалось удалить запись.');
            }
        }}
      ]
    );
  };

  const renderWarningBanner = () => {
    if (logs.length === 0) return null;
    const latestLog = logs[0];
    const sugarVal = parseFloat(latestLog.sugar_level);
    if (isNaN(sugarVal)) return null;

    if (sugarVal < minLimit) {
      return (
        <View style={styles.warningBanner}>
          <AlertTriangle color="#FF3B30" size={24} style={styles.warningIcon} />
          <View style={styles.warningTextContainer}>
            <Text style={[styles.warningTitle, { fontSize: getAdjustedFontSize(15) }]}>Внимание! Сахар слишком низкий</Text>
            <Text style={[styles.warningSubtitle, { fontSize: getAdjustedFontSize(13) }]}>
              Последний показатель сахара: {sugarVal} ммоль/л (ниже нормы {minLimit} ммоль/л)
            </Text>
          </View>
        </View>
      );
    }

    if (sugarVal > maxLimit) {
      return (
        <View style={styles.warningBanner}>
          <AlertTriangle color="#FF3B30" size={24} style={styles.warningIcon} />
          <View style={styles.warningTextContainer}>
            <Text style={[styles.warningTitle, { fontSize: getAdjustedFontSize(15) }]}>Внимание! Сахар слишком высокий</Text>
            <Text style={[styles.warningSubtitle, { fontSize: getAdjustedFontSize(13) }]}>
              Последний показатель сахара: {sugarVal} ммоль/л (выше нормы {maxLimit} ммоль/л)
            </Text>
          </View>
        </View>
      );
    }

    return null;
  };

  const renderItem = ({ item }) => (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <Text style={[styles.timestamp, { fontSize: getAdjustedFontSize(14) }]}>{new Date(item.timestamp).toLocaleString('ru-RU')}</Text>
        <View style={[styles.statusBadge, 
          item.status === 'Низкий' ? styles.statusLow : 
          item.status === 'Высокий' ? styles.statusHigh : styles.statusNormal]}>
          <Text style={[styles.statusText, { fontSize: getAdjustedFontSize(12) }]}>{item.status}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteLog(item.id)}>
          <Trash2 size={18} color="#FF3B30" />
        </TouchableOpacity>
      </View>
      <Text style={[styles.logLabel, { fontSize: getAdjustedFontSize(16) }]}>Сахар: <Text style={[styles.logValue, { fontSize: getAdjustedFontSize(16) }]}>{item.sugar_level} ммоль/л</Text></Text>
      <Text style={[styles.logLabel, { fontSize: getAdjustedFontSize(16) }]}>Питание: <Text style={[styles.logValue, { fontSize: getAdjustedFontSize(16) }]}>{item.notes}</Text></Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderWarningBanner()}
      
      <View style={styles.inputSection}>
        <TextInput
          style={[styles.input, { fontSize: getAdjustedFontSize(16) }]}
          placeholder="Сахар (ммоль/л)"
          keyboardType="numeric"
          value={sugar}
          onChangeText={setSugar}
        />
        <TextInput
          style={[styles.input, { fontSize: getAdjustedFontSize(16) }]}
          placeholder="Что ели/пили?"
          value={food}
          onChangeText={setFood}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddLog}>
          <Plus color="white" size={24} />
          <Text style={[styles.addButtonText, { fontSize: getAdjustedFontSize(18) }]}>Записать</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historyHeader}>
        <Text style={[styles.title, { fontSize: getAdjustedFontSize(22) }]}>История</Text>
        <TouchableOpacity onPress={handleShare}>
          <Share2 color="#00BFA5" size={24} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={logs}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={[styles.emptyText, { fontSize: getAdjustedFontSize(16) }]}>Записей пока нет</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inputSection: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#00BFA5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    padding: 20,
    paddingTop: 0,
  },
  logItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timestamp: {
    color: '#666',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusNormal: { backgroundColor: '#e2f9e1' },
  statusLow: { backgroundColor: '#fff0f0' },
  statusHigh: { backgroundColor: '#fff8e1' },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  logLabel: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  logValue: {
    color: '#000',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
    fontSize: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    padding: 15,
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFB2B2',
  },
  warningIcon: {
    marginRight: 12,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    color: '#D32F2F',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  warningSubtitle: {
    color: '#C62828',
  },
});
