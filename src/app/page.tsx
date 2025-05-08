// src/app/page.tsx
// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import VideoGrid from '@/components/VideoGrid';
import Footer from '@/components/Footer';
import { parseDuration } from '@/lib/utils'; // Import parseDuration from utils
import { EnrichedVideoDetails } from '@/lib/youtube'; // Import EnrichedVideoDetails

// Removed local Video interface definition
// Import Video interface from API route (or a shared types file if created)
interface Video { // This should ideally be imported if defined in a shared location
  title: string;
  video_id: string;
  view_count: number;
  published_at: string;
  thumbnail: string;
  duration: string;
  channelTitle: string;
  channelIcon?: string | null;
  channelId?: string; // Added based on usage below
}


export default function Home() {
  const [videos, setVideos] = useState<EnrichedVideoDetails[]>([]); // Use EnrichedVideoDetails
  const [filter, setFilter] = useState<'day' | 'week' | 'month' | 'all' | 'recommended'>('all');
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  useEffect(() => {
    fetchVideos();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Removed local parseDuration definition

  const fetchVideos = async () => {
    setLoading(true);
    try {
      // Fetch all videos from the API (no pagination params)
      const response = await fetch('/api/fetch-videos');
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      console.log('APIから取得したデータ:', data);

      // APIレスポンスにlastFetchTimeが含まれているか確認
      if (data.lastFetchTime) {
          setLastFetchTime(data.lastFetchTime);
      } else {
          // lastFetchTimeがない場合、現在の時刻を使用するか、キャッシュ時刻を使う
          // この例ではキャッシュ時刻がないため、現在時刻を設定
          setLastFetchTime(Date.now());
      }

      // Determine which video list to use based on filter
      const relevantVideos = filter === 'recommended' ? data.recommendedVideos : data.videos;

      // Filter and sort videos client-side based on the selected filter
      const now = new Date();
      let publishedAfter: string;

      if (filter === 'day') {
        publishedAfter = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      } else if (filter === 'week') {
        publishedAfter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (filter === 'month') {
        publishedAfter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      } else {
        // 'all' or 'recommended'
        publishedAfter = '2000-01-01T00:00:00Z'; // Effectively no start date limit
      }

      // Assuming relevantVideos from API matches or can be mapped to EnrichedVideoDetails
      // If the API returns a different structure, mapping might be needed here.
      // For now, assume it's compatible or already mapped in the API route.
      // const typedRelevantVideos: EnrichedVideoDetails[] = relevantVideos || [];
      // APIレスポンスの型 (view_countなどスネークケース) から EnrichedVideoDetails (キャメルケース) へマッピング
      const typedRelevantVideos: EnrichedVideoDetails[] = (relevantVideos || []).map((apiVideo: Video) => ({
        videoId: apiVideo.video_id,
        title: apiVideo.title,
        viewCount: apiVideo.view_count, // スネークケースからキャメルケースへ
        publishedAt: apiVideo.published_at,
        thumbnail: apiVideo.thumbnail,
        duration: apiVideo.duration,
        channelTitle: apiVideo.channelTitle,
        channelIcon: apiVideo.channelIcon || null,
        isShort: parseDuration(apiVideo.duration) <= 60,
        channelId: apiVideo.channelId || '', // APIレスポンスにchannelIdがない場合があるためフォールバック
      }));
      console.log(`APIレスポンスをマッピング後の動画 (${typedRelevantVideos.length}件):`, typedRelevantVideos.map(v => ({title: v.title, channel: v.channelTitle, views: v.viewCount, published: v.publishedAt })));


      const videosAfterDateAndDurationFilter = typedRelevantVideos
        .filter((video: EnrichedVideoDetails) => { // Use EnrichedVideoDetails
          // Apply date filtering only if not 'recommended'
          if (filter !== 'recommended') {
            const publishedDate = new Date(video.publishedAt); // Correct property name
            const startDate = new Date(publishedAfter);
            // Duration check (>= 60 seconds) - Moved parseDuration definition earlier
            // isShort プロパティで判定するように変更も可能だが、既存ロジックを維持
            const durationInSeconds = parseDuration(video.duration);
            return (filter === 'all' || publishedDate >= startDate) && durationInSeconds >= 60;
          }
          // For 'recommended', duration check might still be relevant if API doesn't pre-filter shorts
           // const durationInSeconds = parseDuration(video.duration);
           // return durationInSeconds >= 60;
          return !video.isShort; // おすすめ動画は短編を除外 (isShortを使用)
        });
      console.log(`期間・時間フィルター (${filter}) 後の動画 (${videosAfterDateAndDurationFilter.length}件, ソート・スライス前):`, videosAfterDateAndDurationFilter.map(v => ({title: v.title, channel: v.channelTitle, views: v.viewCount, published: v.publishedAt })));

      const filteredAndSortedVideos = videosAfterDateAndDurationFilter
        .sort((a: EnrichedVideoDetails, b: EnrichedVideoDetails) => b.viewCount - a.viewCount) // Use viewCount from EnrichedVideoDetails
        .slice(0, filter === 'day' ? 12 : 30); // Apply limit based on filter
      console.log(`最終的な表示動画 (${filter}, ${filteredAndSortedVideos.length}件, ソート・スライス後):`, filteredAndSortedVideos.map(v => ({title: v.title, channel: v.channelTitle, views: v.viewCount, published: v.publishedAt })));

      setVideos(filteredAndSortedVideos);

    } catch (error) {
      console.error('データ取得エラー:', error);
      setVideos([]); // Clear videos on error
    } finally {
      setLoading(false); // Ensure loading is set to false in all cases
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Headerコンポーネントを使用 */}
      <Header filter={filter} setFilter={setFilter} />

      <main className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-4 px-4 pt-4">
        {/* Left Sidebar */}
        <aside className="hidden md:block w-1/6 sticky top-4 h-96"></aside>

        {/* VideoGridコンポーネントを使用 */}
        {/* No lastVideoRef needed */}
        <VideoGrid
          videos={videos}
          loading={loading} // Pass the single loading state
        />

        {/* Right Sidebar */}
        <aside className="hidden md:block w-1/6 sticky top-4 h-96"></aside>
      </main>

       {/* Remove loading indicators for infinite scroll */}

      {/* Footerコンポーネントを使用 */}
      <Footer lastFetchTime={lastFetchTime} />
    </div>
  );
}
