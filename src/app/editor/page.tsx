import type { Metadata } from 'next';
import { Editor } from '@/components/editor/Editor';

export const metadata: Metadata = { title: 'Editor' };
export default function Page() { return <Editor />; }
