import { Redirect, type Href } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

/** Lands each role on its own dashboard (admin dashboard for the non-teaching staff roles). */
export default function Home() {
  const { homePage } = useAuth();
  return <Redirect href={`/dashboard/${homePage}` as Href} />;
}
