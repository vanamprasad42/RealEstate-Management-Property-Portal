import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  inquiries: [],
  loading: false,
  error: null,
};

const inquirySlice = createSlice({
  name: 'inquiries',
  initialState,
  reducers: {
    setInquiriesRequest: (state) => {
      state.loading = true;
    },
    setInquiriesSuccess: (state, action) => {
      state.loading = false;
      state.inquiries = action.payload;
    },
    setInquiriesFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateInquirySuccess: (state, action) => {
      const index = state.inquiries.findIndex((i) => i._id === action.payload._id);
      if (index !== -1) {
        state.inquiries[index] = action.payload;
      }
    },
  },
});

export const { 
  setInquiriesRequest, 
  setInquiriesSuccess, 
  setInquiriesFail, 
  updateInquirySuccess 
} = inquirySlice.actions;

export default inquirySlice.reducer;
