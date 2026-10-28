import type { Metadata } from 'next';
import { DesignSystem } from '@/components/pages/DesignSystem';

export const metadata: Metadata = { title: 'Design system' };
export default function Page() { return <DesignSystem />; }
