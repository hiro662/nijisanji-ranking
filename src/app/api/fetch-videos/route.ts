import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { fetchPlaylistVideos, fetchVideoDetails, PlaylistItem, EnrichedVideoDetails } from '../../../lib/youtube';
import { VIDEO_PLAYLIST_IDS } from '../../../config/constants';

// 型定義（page.tsx から再利用）
interface Video {
  title: string;
  video_id: string;
  view_count: number;
  published_at: string;
  thumbnail: string;
  duration: string;
  channelTitle: string;
  channelIcon?: string | null;
}

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000; // 12時間

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('force') === 'true';
  const currentTime = Date.now();

  try {
    // キャッシュからデータを取得
    const cachedVideos = await kv.get<Video[]>('videos');
    const cachedRecommendedVideos = await kv.get<Video[]>('recommendedVideos');
    const cachedLastFetchTime = await kv.get<number>('lastFetchTime');

    // キャッシュが有効かつforceRefreshがfalseの場合、キャッシュを返す
    if (
      !forceRefresh &&
      cachedVideos &&
      cachedRecommendedVideos &&
      cachedLastFetchTime &&
      currentTime - cachedLastFetchTime < TWELVE_HOURS_MS
    ) {
      console.log('キャッシュからデータを返します');
      return NextResponse.json({
        videos: cachedVideos,
        recommendedVideos: cachedRecommendedVideos,
        lastFetchTime: cachedLastFetchTime,
      });
    }

    console.log('YouTube APIからデータを取得開始');

    // 既存のデータ取得ロジック（変更なし）
    const now = new Date();
    const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
    const publishedBefore = new Date().toISOString();

    // config/constants.ts からインポートした VIDEO_PLAYLIST_IDS を使用
    // const videoPlaylistIds = [
    //   'UUeuNlK0yX-6_4930q0JUGNw',
    //   // 他のプレイリストID（省略）
    // ];

    // 並列処理でプレイリスト動画を取得
    const playlistPromises = VIDEO_PLAYLIST_IDS.map(id =>
      fetchPlaylistVideos(id, oneMonthAgo, publishedBefore)
    );
    const playlistResults = await Promise.all(playlistPromises);
    let allVideoPlaylistVideos = playlistResults.flat();

    // 例外プレイリスト
    const exceptionPlaylistId = 'PL_WIds0FOHm7cSq4UhF8aOGWlm1apAA6f';
    const exceptionPlaylistVideos = await fetchPlaylistVideos(
      exceptionPlaylistId,
      '2000-01-01T00:00:00Z',
      publishedBefore
    );
    allVideoPlaylistVideos = allVideoPlaylistVideos.concat(exceptionPlaylistVideos);

    // 動画IDの重複を除去
    const uniqueVideoMap = new Map<string, PlaylistItem>();
    allVideoPlaylistVideos.forEach((video: PlaylistItem) =>
      uniqueVideoMap.set(video.snippet.resourceId.videoId, video)
    );
    allVideoPlaylistVideos = Array.from(uniqueVideoMap.values());
    console.log(`重複除去後の動画数: ${allVideoPlaylistVideos.length}`);

    // 動画詳細を取得
    const videoIds = allVideoPlaylistVideos.map((video: PlaylistItem) => video.snippet.resourceId.videoId);
    const videoDetails = videoIds.length ? await fetchVideoDetails(videoIds) : [];

    const youtubeVideoData: Video[] = allVideoPlaylistVideos
      .map((playlistItem: PlaylistItem) => {
        const details = videoDetails.find((d: EnrichedVideoDetails) => d.videoId === playlistItem.snippet.resourceId.videoId);
        if (!details || details.isShort) return null;
        return {
          title: playlistItem.snippet.title,
          video_id: playlistItem.snippet.resourceId.videoId,
          view_count: Number(details.viewCount) || 0,
          published_at: details.publishedAt,
          thumbnail: playlistItem.snippet.thumbnails?.medium?.url ?? '/fallback-thumbnail.png',
          duration: details.duration,
          channelTitle: details.channelTitle,
          channelIcon: details.channelIcon,
        };
      })
      .filter((video: Video | null): video is Video => video !== null) as Video[];

    // おすすめプレイリスト
    const recommendedPlaylistId = 'PL_WIds0FOHm7W6WwVCtEHzcfylcm7-TmE';
    const recommendedPlaylistVideos = await fetchPlaylistVideos(
      recommendedPlaylistId,
      '2000-01-01T00:00:00Z',
      publishedBefore
    );
    const uniqueRecommendedMap = new Map<string, PlaylistItem>();
    recommendedPlaylistVideos.forEach((video: PlaylistItem) =>
      uniqueRecommendedMap.set(video.snippet.resourceId.videoId, video)
    );
    const uniqueRecommendedVideos = Array.from(uniqueRecommendedMap.values());

    const recommendedVideoIds = uniqueRecommendedVideos.map((video: PlaylistItem) => video.snippet.resourceId.videoId);
    const recommendedVideoDetails = recommendedVideoIds.length
      ? await fetchVideoDetails(recommendedVideoIds)
      : [];

    const recommendedVideoData: Video[] = uniqueRecommendedVideos
      .map((playlistItem: PlaylistItem) => {
        const details = recommendedVideoDetails.find(
          (d: EnrichedVideoDetails) => d.videoId === playlistItem.snippet.resourceId.videoId
        );
        if (!details || details.isShort) return null;
        return {
          title: playlistItem.snippet.title,
          video_id: playlistItem.snippet.resourceId.videoId,
          view_count: Number(details.viewCount) || 0,
          published_at: details.publishedAt,
          thumbnail: playlistItem.snippet.thumbnails?.medium?.url ?? '/fallback-thumbnail.png',
          duration: details.duration,
          channelTitle: details.channelTitle,
          channelIcon: details.channelIcon,
        };
      })
      .filter((video: Video | null): video is Video => video !== null) as Video[];

    // 動画が取得できなかった場合
    if (!youtubeVideoData.length && !recommendedVideoData.length) {
      console.warn('すべてのプレイリストから動画が取得できませんでした');
      return NextResponse.json({ error: 'No videos found in any playlist' }, { status: 404 });
    }

    console.log('取得した動画データ:', youtubeVideoData.length);
    console.log('取得したおすすめ動画データ:', recommendedVideoData.length);

    // キャッシュを更新（12時間有効）
    await kv.set('videos', youtubeVideoData, { ex: TWELVE_HOURS_MS / 1000 });
    await kv.set('recommendedVideos', recommendedVideoData, { ex: TWELVE_HOURS_MS / 1000 });
    await kv.set('lastFetchTime', currentTime, { ex: TWELVE_HOURS_MS / 1000 });

    return NextResponse.json({
      videos: youtubeVideoData,
      recommendedVideos: recommendedVideoData,
      lastFetchTime: currentTime,
    });
  } catch (error: unknown) {
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('動画取得エラー:', { message: error.message, stack: error.stack });
    } else {
      console.error('動画取得エラー (unknown type):', error);
    }
    return NextResponse.json({ error: `Failed to fetch videos: ${errorMessage}` }, { status: 500 });
  }
}
