import type { Metadata } from 'next';
import { TemplateLibrary } from '@/components/pages/TemplateLibrary';

export const metadata: Metadata = { title: 'Templates' };
export default function Page() { return <TemplateLibrary />; }
