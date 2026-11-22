'use client';
import { useEffect, useState } from 'react';
import { loadKanaProgress } from '@/lib/kana/progress';
export function useKanaProgress() {
  const [learned, setLearned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let current = true;
    setLoading(true); setError('');
    loadKanaProgress().then(ids => { if (current) setLearned(new Set(ids)); }).catch(() => { if (current) setError('Progres belum dapat dimuat. Silakan coba lagi.'); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [revision]);
  return { learned, loading, error, reload: () => setRevision(n => n + 1) };
}
