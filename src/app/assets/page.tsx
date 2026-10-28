import type { Metadata } from 'next';
import { AssetLibrary } from '@/components/pages/AssetLibrary';

export const metadata: Metadata = { title: 'Assets' };
export default function Page() { return <AssetLibrary />; }
