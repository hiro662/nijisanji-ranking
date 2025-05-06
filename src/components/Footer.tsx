'use client';

interface FooterProps {
  lastFetchTime: number | null;
}

export default function Footer({ lastFetchTime }: FooterProps) {
  return (
    <footer className="w-full max-w-7xl mx-auto p-4 mt-12 text-center border-t border-gray-200">
      <div className="text-gray-500 text-xs space-y-2"> {/* Adjusted text size and spacing */}
        <p>にじさんじ切り抜きランキングは、にじさんじの切り抜き動画をランキング形式で紹介する非公式ファンサイトです。<br />ファンの皆様が人気の動画を簡単に見つけられるようサポートします。</p> {/* Combined first two lines */}
        <p>このランキングは必ず正しいわけではありません。<br/>表示されるデータはYouTube APIから取得したものであり、正確性や完全性を保証するものではありません。</p> {/* Added line break */}
        <p className="mt-4">© 2025 にじさんじ切り抜きランキング. All rights reserved. データ提供: YouTube API</p> {/* Adjusted mt */}
        <p className="mt-2">最終更新: {lastFetchTime ? new Date(lastFetchTime).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '取得中'} (JST)</p> {/* Adjusted mt */}
      </div>
    </footer>
  );
}
