import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  users: [],
  vendors: [],
  reports: null,
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setAdminRequest: (state) => {
      state.loading = true;
    },
    setAdminUsersSuccess: (state, action) => {
      state.loading = false;
      state.users = action.payload;
    },
    setAdminVendorsSuccess: (state, action) => {
      state.loading = false;
      state.vendors = action.payload;
    },
    setAdminReportsSuccess: (state, action) => {
      state.loading = false;
      state.reports = action.payload;
    },
    setAdminFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    toggleUserBlockSuccess: (state, action) => {
      const { user } = action.payload;
      if (user.role === 'vendor') {
        const index = state.vendors.findIndex((v) => v._id === user._id);
        if (index !== -1) state.vendors[index] = user;
      } else {
        const index = state.users.findIndex((u) => u._id === user._id);
        if (index !== -1) state.users[index] = user;
      }
    },
    deleteUserSuccess: (state, action) => {
      state.users = state.users.filter((u) => u._id !== action.payload);
      state.vendors = state.vendors.filter((v) => v._id !== action.payload);
    },
  },
});

export const { 
  setAdminRequest, 
  setAdminUsersSuccess, 
  setAdminVendorsSuccess, 
  setAdminReportsSuccess, 
  setAdminFail,
  toggleUserBlockSuccess,
  deleteUserSuccess
} = adminSlice.actions;

export default adminSlice.reducer;
