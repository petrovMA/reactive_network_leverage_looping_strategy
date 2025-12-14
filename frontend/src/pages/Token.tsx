import TokenInterface from '@/components/TokenInterface';
import { Navigation } from '@/components/Navigation';

export default function Token() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <TokenInterface />
    </div>
  );
}
