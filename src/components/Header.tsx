'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  filter: 'day' | 'week' | 'month' | 'all' | 'recommended';
  setFilter: (filter: 'day' | 'week' | 'month' | 'all' | 'recommended') => void;
}

export default function Header({ filter, setFilter }: HeaderProps) {
  return (
    <header className="w-full px-4 py-2 flex items-center border-b flex-wrap">
      {/* Logo and Title Group */}
      <div className="flex items-center gap-3">
        <Image src="/logo.png" alt="Logo" width={40} height={40} />
        {/* Add margin-right to the title to push buttons slightly right, achieving a "more left" feel relative to the overall header width */}
        <h1 className="text-lg font-bold text-black mr-6">にじさんじ切り抜きランキング</h1>
      </div>

      {/* Filter buttons Group - Aligned left */}
      <div className="flex gap-2 flex-wrap"> {/* Removed justify-center */}
        <Button
          onClick={() => setFilter('day')}
          variant={filter === 'day' ? 'destructive' : 'ghost'}
          className={`px-3 py-1 h-auto text-sm rounded-full transition-all duration-150 ease-in-out ${
            filter === 'day'
              ? 'bg-red-700 text-white font-semibold scale-105 shadow-md' // より濃い赤、太字、スケールアップ、影
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          今日
        </Button>
        <Button
          onClick={() => setFilter('week')}
          variant={filter === 'week' ? 'destructive' : 'ghost'}
          className={`px-3 py-1 h-auto text-sm rounded-full transition-all duration-150 ease-in-out ${
            filter === 'week'
              ? 'bg-red-700 text-white font-semibold scale-105 shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          今週
        </Button>
        <Button
          onClick={() => setFilter('month')}
          variant={filter === 'month' ? 'destructive' : 'ghost'}
          className={`px-3 py-1 h-auto text-sm rounded-full transition-all duration-150 ease-in-out ${
            filter === 'month'
              ? 'bg-red-700 text-white font-semibold scale-105 shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          今月
        </Button>
        <Button
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'destructive' : 'ghost'}
          className={`px-3 py-1 h-auto text-sm rounded-full transition-all duration-150 ease-in-out ${
            filter === 'all'
              ? 'bg-red-700 text-white font-semibold scale-105 shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          全期間
        </Button>
        <Button
          onClick={() => setFilter('recommended')}
          variant={filter === 'recommended' ? 'destructive' : 'ghost'}
          className={`px-3 py-1 h-auto text-sm rounded-full transition-all duration-150 ease-in-out ${
            filter === 'recommended'
              ? 'bg-red-700 text-white font-semibold scale-105 shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          おすすめ
        </Button>
      </div>
    </header>
  );
}
