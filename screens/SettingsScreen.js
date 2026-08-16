import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Plus, Minus, RotateCcw, Info } from 'lucide-react-native';
import { useSettings } from '../context/SettingsContext';

export default function SettingsScreen({ navigation }) {
  const { 
    minLimit: globalMin, 
    maxLimit: globalMax, 
    fontSize: globalFontSize, 
    updateFontSize, 
    updateLimits, 
    getAdjustedFontSize 
  } = useSettings();

  const [minLimit, setMinLimit] = useState(globalMin.toString());
  const [maxLimit, setMaxLimit] = useState(globalMax.toString());
  const [fontSize, setFontSize] = useState(globalFontSize);

  useEffect(() => {
    setMinLimit(globalMin.toString());
    setMaxLimit(globalMax.toString());
    setFontSize(globalFontSize);
  }, [globalMin, globalMax, globalFontSize]);

  const handleSave = async () => {
    const min = parseFloat(minLimit);
    const max = parseFloat(maxLimit);

    if (isNaN(min) || isNaN(max)) {
      Alert.alert('Ошибка', 'Пожалуйста, введите корректные числовые значения для лимитов сахара');
      return;
    }

    if (min >= max) {
      Alert.alert('Ошибка', 'Минимальный лимит должен быть меньше максимального');
      return;
    }

    try {
      await updateLimits(min, max);
      await updateFontSize(fontSize);
      
      Alert.alert('Успех', 'Настройки сохранены', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось сохранить настройки');
    }
  };

  const handleResetFontSize = () => {
    setFontSize(16);
  };

  const incrementFontSize = () => {
    if (fontSize < 24) {
      setFontSize(prev => prev + 1);
    }
  };

  const decrementFontSize = () => {
    if (fontSize > 12) {
      setFontSize(prev => prev - 1);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Target range inputs */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: getAdjustedFontSize(18) }]}>
          Целевой диапазон сахара
        </Text>
        
        <View style={styles.infoBox}>
          <Info size={18} color="#00BFA5" style={styles.infoIcon} />
          <Text style={[styles.infoText, { fontSize: getAdjustedFontSize(13) }]}>
            Показатели сахара вне этого диапазона вызовут предупреждение на главном экране дневника.
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { fontSize: getAdjustedFontSize(14) }]}>Минимум (ммоль/л)</Text>
            <TextInput
              style={[styles.input, { fontSize: getAdjustedFontSize(16) }]}
              keyboardType="numeric"
              value={minLimit}
              onChangeText={setMinLimit}
              placeholder="3.9"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { fontSize: getAdjustedFontSize(14) }]}>Максимум (ммоль/л)</Text>
            <TextInput
              style={[styles.input, { fontSize: getAdjustedFontSize(16) }]}
              keyboardType="numeric"
              value={maxLimit}
              onChangeText={setMaxLimit}
              placeholder="7.8"
            />
          </View>
        </View>
      </View>

      {/* Font Size Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: getAdjustedFontSize(18) }]}>
          Размер шрифта
        </Text>
        
        <View style={styles.stepperContainer}>
          <TouchableOpacity 
            style={[styles.stepperButton, fontSize <= 12 && styles.stepperButtonDisabled]} 
            onPress={decrementFontSize}
            disabled={fontSize <= 12}
          >
            <Minus size={20} color={fontSize <= 12 ? '#ccc' : '#333'} />
          </TouchableOpacity>
          
          <View style={styles.fontSizeValueContainer}>
            <Text style={[styles.fontSizeValue, { fontSize: getAdjustedFontSize(18) }]}>
              {fontSize}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.stepperButton, fontSize >= 24 && styles.stepperButtonDisabled]} 
            onPress={incrementFontSize}
            disabled={fontSize >= 24}
          >
            <Plus size={20} color={fontSize >= 24 ? '#ccc' : '#333'} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={handleResetFontSize}>
          <RotateCcw size={16} color="#666" style={styles.resetIcon} />
          <Text style={[styles.resetButtonText, { fontSize: getAdjustedFontSize(14) }]}>
            Сбросить по умолчанию (16)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Preview Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontSize: getAdjustedFontSize(16) }]}>
          Предварительный просмотр
        </Text>
        <View style={styles.previewBox}>
          <Text style={[styles.previewLabel, { fontSize: getAdjustedFontSize(14) }]}>
            Сахар: <Text style={styles.previewValue}>5.4 ммоль/л</Text>
          </Text>
          <Text style={[styles.previewLabel, { fontSize: getAdjustedFontSize(14) }]}>
            Питание: <Text style={styles.previewValue}>Завтрак: овсянка с ягодами</Text>
          </Text>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={[styles.saveButtonText, { fontSize: getAdjustedFontSize(18) }]}>
          Сохранить настройки
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2f9e1',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    color: '#00796b',
    flex: 1,
  },
  inputGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    width: '47%',
  },
  label: {
    color: '#666',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    color: '#333',
    textAlign: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  stepperButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  stepperButtonDisabled: {
    backgroundColor: '#f1f1f1',
    borderColor: '#e1e1e1',
  },
  fontSizeValueContainer: {
    width: 60,
    alignItems: 'center',
  },
  fontSizeValue: {
    fontWeight: 'bold',
    color: '#333',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    padding: 8,
  },
  resetIcon: {
    marginRight: 6,
  },
  resetButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  previewBox: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  previewLabel: {
    color: '#555',
    marginBottom: 4,
  },
  previewValue: {
    color: '#000',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#00BFA5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
