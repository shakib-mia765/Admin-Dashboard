import { configureStore, createSlice } from '@reduxjs/toolkit';
const session=createSlice({name:'session',initialState:{user:null},reducers:{setUser:(state,action)=>{state.user=action.payload;},clearUser:state=>{state.user=null;}}});
export const { setUser, clearUser }=session.actions;
export const store=configureStore({reducer:{session:session.reducer}});
