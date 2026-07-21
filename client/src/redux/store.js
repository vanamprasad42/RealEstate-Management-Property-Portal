import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import propertyReducer from './slices/propertySlice';
import cityReducer from './slices/citySlice';
import inquiryReducer from './slices/inquirySlice';
import adminReducer from './slices/adminSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    properties: propertyReducer,
    cities: cityReducer,
    inquiries: inquiryReducer,
    admin: adminReducer,
  },
});
