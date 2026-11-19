import { Redirect, type Href } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardIndex() {
  const { homePage } = useAuth();
  return <Redirect href={`/dashboard/${homePage}` as Href} />;
}
