import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  cities: [],
  loading: false,
  error: null,
};

const citySlice = createSlice({
  name: 'cities',
  initialState,
  reducers: {
    setCitiesRequest: (state) => {
      state.loading = true;
    },
    setCitiesSuccess: (state, action) => {
      state.loading = false;
      state.cities = action.payload;
    },
    setCitiesFail: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    addCitySuccess: (state, action) => {
      state.cities.push(action.payload);
    },
    deleteCitySuccess: (state, action) => {
      state.cities = state.cities.filter((c) => c._id !== action.payload);
    },
  },
});

export const { 
  setCitiesRequest, 
  setCitiesSuccess, 
  setCitiesFail, 
  addCitySuccess, 
  deleteCitySuccess 
} = citySlice.actions;

export default citySlice.reducer;
