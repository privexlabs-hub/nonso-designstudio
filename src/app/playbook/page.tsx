import type { Metadata } from 'next';
import { BrandPlaybook } from '@/components/pages/BrandPlaybook';

export const metadata: Metadata = { title: 'Brand playbook' };
export default function Page() { return <BrandPlaybook />; }
