import dynamic from 'next/dynamic';

export const DynamicEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
}); 