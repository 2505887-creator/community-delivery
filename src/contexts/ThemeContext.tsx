import {createContext,useContext,useEffect,useMemo,useState,ReactNode} from 'react';
import {useAuth} from './AuthContext';
type Theme='system'|'light'|'dark';
const C=createContext<{theme:Theme,setTheme:(t:Theme)=>void}>({theme:'system',setTheme:()=>{}});
export function ThemeProvider({children}:{children:ReactNode}){const {session}=useAuth();const [theme,setThemeState]=useState<Theme>(()=>(localStorage.getItem('omniserve-theme') as Theme)||'system');
useEffect(()=>{localStorage.setItem('omniserve-theme',theme);const root=document.documentElement;root.dataset.theme=theme;const dark=theme==='dark'||(theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);root.classList.toggle('dark',dark);if(session?.access_token)fetch('/api/account/preferences',{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({theme})}).catch(()=>{})},[theme,session?.access_token]);
useEffect(()=>{const m=matchMedia('(prefers-color-scheme: dark)');const f=()=>{if(theme==='system')document.documentElement.classList.toggle('dark',m.matches)};m.addEventListener('change',f);return()=>m.removeEventListener('change',f)},[theme]);
return <C.Provider value={useMemo(()=>({theme,setTheme:setThemeState}),[theme])}>{children}</C.Provider>}
export const useTheme=()=>useContext(C);
