import { processAiChat, getRecentQueriesList, fetchMatchingProperties, extractSearchFilters } from '../services/aiService.js';
import Property from '../models/propertyModel.js';

// Default preference state
let userPreferencesStore = {
  budget: 'Up to ₹80 Lakhs',
  propertyType: '3 BHK',
  preferredLocation: 'Hyderabad',
  minPrice: 5000000,
  maxPrice: 8000000
};

// @desc    Chat with AI Assistant (Node.js -> MongoDB -> APInex -> AI Answer)
// @route   POST /api/ai/chat
// @access  Public
export const chatWithAi = async (req, res) => {
  try {
    const { message, conversationHistory = [], preferences = {} } = req.body || {};

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Message prompt is required' });
    }

    const safeHistory = Array.isArray(conversationHistory) ? conversationHistory : [];
    const safePreferences = preferences && typeof preferences === 'object' && !Array.isArray(preferences)
      ? preferences
      : {};

    const mergedPreferences = { ...userPreferencesStore, ...safePreferences };
    const result = await processAiChat({
      message,
      conversationHistory: safeHistory,
      userPreferences: mergedPreferences
    });

    res.json(result);
  } catch (error) {
    console.error('AI Controller Chat Error:', error);
    res.status(500).json({ message: error.message || 'Internal AI Assistant Error' });
  }
};

// @desc    Get recent search queries
// @route   GET /api/ai/recent-queries
// @access  Public
export const getRecentQueries = async (req, res) => {
  try {
    const queries = getRecentQueriesList();
    res.json(queries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user preferences for AI recommendations
// @route   GET /api/ai/preferences
// @access  Public
export const getPreferences = async (req, res) => {
  try {
    res.json(userPreferencesStore);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user preferences for AI recommendations
// @route   POST /api/ai/preferences
// @access  Public
export const updatePreferences = async (req, res) => {
  try {
    const { budget, propertyType, preferredLocation } = req.body;
    if (budget) userPreferencesStore.budget = budget;
    if (propertyType) userPreferencesStore.propertyType = propertyType;
    if (preferredLocation) userPreferencesStore.preferredLocation = preferredLocation;

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: userPreferencesStore
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get AI property recommendations based on preferences
// @route   GET /api/ai/recommendations
// @access  Public
export const getAiRecommendations = async (req, res) => {
  try {
    const filters = extractSearchFilters('', userPreferencesStore);
    const properties = await fetchMatchingProperties(filters);
    res.json({
      preferences: userPreferencesStore,
      properties
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
