'use client';

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDuration as formatDurationUtil } from '@/lib/utils'; // parseDuration is no longer needed here
import { EnrichedVideoDetails } from '@/lib/youtube'; // Import EnrichedVideoDetails
import { formatDistanceToNowStrict } from 'date-fns';
import { ja } from 'date-fns/locale';
import Image from 'next/image';

// Removed local Video interface definition

interface VideoGridProps {
  videos: EnrichedVideoDetails[]; // Use EnrichedVideoDetails
  loading: boolean;
}

// Placeholder image URL (replace with your actual placeholder if you have one)
const PLACEHOLDER_THUMBNAIL = '/placeholder-thumbnail.png'; // Example path

const formatViewCount = (views: number) => {
  if (views >= 10000) return `${(views / 10000).toFixed(1)}万`;
  return views.toLocaleString();
};

// Removed local parseDuration and formatDuration

const formatPublishedAt = (publishedAt: string) => {
  try {
    const date = new Date(publishedAt);
    // Check if date is valid before formatting
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date string received: ${publishedAt}`);
      return '日付不明'; // Return a fallback string
    }
    return formatDistanceToNowStrict(date, { addSuffix: true, locale: ja });
  } catch (error) {
    console.error(`Error formatting date: ${publishedAt}`, error);
    return '日付エラー'; // Return error fallback
  }
};

// lastVideoRef removed from destructuring
export default function VideoGrid({ videos, loading }: VideoGridProps) {
  return (
    <div className="w-full md:w-4/6">
      {/* ローディング中はスケルトンを表示 */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => ( // 6つのスケルトンを表示
            <Card key={index} className="overflow-hidden border rounded-lg">
              <CardContent className="p-0">
                <Skeleton className="w-full aspect-video" /> {/* サムネイル部分 */}
                <div className="p-3 space-y-2">
                  <Skeleton className="h-5 w-3/4" /> {/* タイトル */}
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" /> {/* チャンネルアイコン */}
                    <Skeleton className="h-4 w-1/2" /> {/* チャンネル名 */}
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-1/4" /> {/* 再生回数 */}
                    <Skeleton className="h-4 w-1/4" /> {/* 公開日 */}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 動画グリッド (ローディング完了後に表示) */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-300 ease-in-out opacity-100"> {/* フェードインアニメーションを追加 */}
          {videos.map((video, index) => (
              // ref removed from Card
              <Card
                key={video.videoId} // Use videoId
                className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border rounded-lg"
              >
                <a
                  href={`https://www.youtube.com/watch?v=${video.videoId}`} // Use videoId
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <CardContent className="p-0">
                  {/* Thumbnail and Duration */}
                  <div className="relative">
                    <Image
                      src={video.thumbnail || PLACEHOLDER_THUMBNAIL}
                      alt={video.title}
                      width={320} // Example width, adjust as needed
                      height={180} // Example height (16:9), adjust as needed
                      className="w-full h-auto aspect-video object-cover bg-gray-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== PLACEHOLDER_THUMBNAIL) {
                           target.src = PLACEHOLDER_THUMBNAIL;
                           target.alt = 'サムネイル読み込みエラー';
                        }
                      }}
                      unoptimized={video.thumbnail?.startsWith('http://') || video.thumbnail?.startsWith('https://') ? undefined : true} // For external images, optimization might be enabled by default. For local placeholders, it might not be needed or configured.
                    />
                    <span className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
                      {formatDurationUtil(video.duration)}
                    </span>
                    {/* Ranking Badge - Simplified */}
                    <span className="absolute top-1.5 left-1.5 bg-black bg-opacity-60 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
                      {index + 1}
                    </span>
                  </div>

                  {/* Video Info */}
                  <div className="p-3">
                    {/* Title */}
                    <h3 className="text-sm font-semibold text-black mb-1.5 line-clamp-2 h-10 hover:text-blue-700"> {/* Allow 2 lines for title */}
                      {video.title}
                    </h3>

                    {/* Channel Info */}
                    <div className="flex items-center gap-2 mb-1.5">
                      {video.channelIcon ? (
                        <Image
                          src={video.channelIcon}
                          alt={`${video.channelTitle} icon`}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full object-cover border"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            // Simple fallback: hide the image or show a placeholder div
                            target.style.display = 'none';
                            // Optionally, replace with a placeholder div if you have one styled
                          }}
                          unoptimized={video.channelIcon?.startsWith('http://') || video.channelIcon?.startsWith('https://') ? undefined : true}
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 border flex items-center justify-center">
                          <span className="text-xs text-gray-500">?</span>
                        </div>
                      )}
                      <span className="text-xs text-gray-700 truncate hover:text-blue-600">{video.channelTitle}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex justify-between items-center text-xs text-gray-600">
                      <p className="font-medium text-pink-600">
                        {formatViewCount(video.viewCount)} 回再生 {/* Use viewCount */}
                      </p>
                      <p>{formatPublishedAt(video.publishedAt)}</p> {/* Use publishedAt */}
                    </div>
                  </div>
                </CardContent>
                </a>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
