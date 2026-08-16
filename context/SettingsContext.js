import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [minLimit, setMinLimit] = useState(3.9);
  const [maxLimit, setMaxLimit] = useState(7.8);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedMin = await AsyncStorage.getItem('@sugar_min_limit');
      const savedMax = await AsyncStorage.getItem('@sugar_max_limit');
      const savedFontSize = await AsyncStorage.getItem('@preferable_font_size');
      
      if (savedMin) setMinLimit(parseFloat(savedMin));
      if (savedMax) setMaxLimit(parseFloat(savedMax));
      if (savedFontSize) setFontSize(parseInt(savedFontSize, 10));
    } catch (e) {
      console.error('Failed to load settings in context', e);
    }
  };

  const updateFontSize = async (newSize) => {
    try {
      setFontSize(newSize);
      await AsyncStorage.setItem('@preferable_font_size', newSize.toString());
    } catch (e) {
      console.error('Failed to save font size setting', e);
    }
  };

  const updateLimits = async (newMin, newMax) => {
    try {
      setMinLimit(newMin);
      setMaxLimit(newMax);
      await AsyncStorage.setItem('@sugar_min_limit', newMin.toString());
      await AsyncStorage.setItem('@sugar_max_limit', newMax.toString());
    } catch (e) {
      console.error('Failed to save limits settings', e);
    }
  };

  const resetFontSize = async () => {
    await updateFontSize(16);
  };

  const getAdjustedFontSize = (defaultSize) => {
    return defaultSize * (fontSize / 16);
  };

  return (
    <SettingsContext.Provider value={{
      minLimit,
      maxLimit,
      fontSize,
      updateFontSize,
      updateLimits,
      resetFontSize,
      getAdjustedFontSize
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
