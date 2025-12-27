export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  totalPoint: number; 
  point: number;
  streak: number;
  currentTheme: string;
}