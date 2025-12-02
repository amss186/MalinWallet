import { redirect } from 'next/navigation';

export default function Home() {
  // We cannot check local storage here (server component), so we redirect to onboarding.
  // The Onboarding page will check for existing wallets and redirect to dashboard if found.
  redirect('/onboarding');
}
