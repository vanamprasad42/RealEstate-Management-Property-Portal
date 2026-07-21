import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  properties: [],
  page: 1,
  pages: 1,
  total: 0,
  loading: false,
  error: null,
};

const propertySlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    setPropertiesRequest: (state) => {
      state.loading = true;
    },
    setPropertiesSuccess: (state, action) => {
      state.loading = false;
      state.properties = action.payload.properties;
      state.page = action.payload.page;
      state.pages = action.payload.pages;
      state.total = action.payload.total;
    },
    setPropertiesFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const { setPropertiesRequest, setPropertiesSuccess, setPropertiesFail } = propertySlice.actions;
export default propertySlice.reducer;
