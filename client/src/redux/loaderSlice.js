// This is a reducer related to the loader
import { createSlice } from '@reduxjs/toolkit'

const loaderSlice = createSlice({
  name: 'loader',
  initialState: {
    loader: false,
  },
  reducers: {
    showLoader: (state) => {
      state.loader = true
    },
    hideLoader: (state) => {
      state.loader = false
    },
  },
})

export const { showLoader, hideLoader } = loaderSlice.actions
export default loaderSlice.reducer
