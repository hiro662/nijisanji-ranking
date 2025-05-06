// src/app/api/fetch-videos/route.ts
import { NextResponse } from 'next/server';
// Import interfaces along with functions
import { fetchPlaylistVideos, fetchVideoDetails, PlaylistItem, EnrichedVideoDetails } from '@/lib/youtube';
import {
  ONE_HOUR_MS,
  VIDEO_PLAYLIST_IDS,
  EXCEPTION_PLAYLIST_ID,
  RECOMMENDED_PLAYLIST_ID,
  DEFAULT_PUBLISHED_AFTER
} from '@/config/constants';

// Use EnrichedVideoDetails for cache type
let cachedVideos: EnrichedVideoDetails[] = [];
let cachedRecommendedVideos: EnrichedVideoDetails[] = [];
let lastFetchTime: number = 0;
// ONE_HOUR_MS is now imported

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('force') === 'true';
  const currentTime = Date.now();

  // キャッシュが有効（1時間以内）かつforceRefreshがfalseの場合、キャッシュを返す
  if (!forceRefresh && cachedVideos.length > 0 && cachedRecommendedVideos.length > 0 && currentTime - lastFetchTime < ONE_HOUR_MS) {
    console.log('キャッシュからデータを返します');
    // Return the full cached data, not paginated
    return NextResponse.json({ videos: cachedVideos, recommendedVideos: cachedRecommendedVideos, lastFetchTime });
  }

  try {
    console.log('YouTube APIからデータを取得開始');

    const now = new Date();
    const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
    const publishedBefore = new Date().toISOString();

    // Fetch videos from regular playlists in parallel
    const videoPlaylistPromises = VIDEO_PLAYLIST_IDS.map(playlistId =>
      fetchPlaylistVideos(playlistId, oneMonthAgo, publishedBefore) // Pass single ID
        .catch(error => { // Add individual catch for robustness
          console.error(`プレイリスト ${playlistId} の並列取得中にエラー:`, error);
          return []; // Return empty array on error for this playlist
        })
    );

    // Fetch exception playlist videos (can be done in parallel too)
    const exceptionPlaylistPromise = fetchPlaylistVideos(EXCEPTION_PLAYLIST_ID, DEFAULT_PUBLISHED_AFTER, publishedBefore) // Pass single ID
      .catch(error => {
        console.error(`例外プレイリスト ${EXCEPTION_PLAYLIST_ID} の取得中にエラー:`, error);
        return [];
      });

    // Fetch recommended playlist videos (can be done in parallel too)
    const recommendedPlaylistPromise = fetchPlaylistVideos(RECOMMENDED_PLAYLIST_ID, DEFAULT_PUBLISHED_AFTER, publishedBefore) // Pass single ID
      .catch(error => {
        console.error(`おすすめプレイリスト ${RECOMMENDED_PLAYLIST_ID} の取得中にエラー:`, error);
        return [];
      });

    // Wait for all fetches to complete
    const [videoPlaylistResults, exceptionPlaylistVideos, recommendedPlaylistResult] = await Promise.all([
      Promise.all(videoPlaylistPromises), // Wait for all regular playlist fetches
      exceptionPlaylistPromise,
      recommendedPlaylistPromise
    ]);

    // Flatten the results from regular playlists and combine with exception playlist
    let allVideoPlaylistVideos = videoPlaylistResults.flat().concat(exceptionPlaylistVideos);
    console.log(`通常+例外プレイリストから取得した合計動画数 (重複除去前): ${allVideoPlaylistVideos.length}`);

    // video_idの重複を除去 (Combined regular and exception)
    const uniqueVideoMap = new Map();
    allVideoPlaylistVideos.forEach((video) => {
      // Ensure snippet and resourceId exist before accessing videoId
      const videoId = video?.snippet?.resourceId?.videoId;
      if (videoId && !uniqueVideoMap.has(videoId)) {
        uniqueVideoMap.set(videoId, video);
      }
    });
    allVideoPlaylistVideos = Array.from(uniqueVideoMap.values());
    console.log(`重複除去後の動画数: ${allVideoPlaylistVideos.length}`);

    if (!allVideoPlaylistVideos.length) {
      console.warn('すべてのプレイリストから動画が取得できませんでした');
    }

    // Use PlaylistItem type for mapping
    const videoIds = allVideoPlaylistVideos
      .map((video: PlaylistItem) => video.snippet?.resourceId?.videoId)
      .filter((id): id is string => !!id); // Ensure IDs are strings and filter out null/undefined

    // videoDetails will be EnrichedVideoDetails[]
    const videoDetails = videoIds.length ? await fetchVideoDetails(videoIds) : [];

    // Map directly to EnrichedVideoDetails structure
    const youtubeVideoData: EnrichedVideoDetails[] = allVideoPlaylistVideos
      .map((playlistItem: PlaylistItem) => {
        // Find the corresponding details using videoId
        const details = videoDetails.find((d: EnrichedVideoDetails) => d.videoId === playlistItem?.snippet?.resourceId?.videoId);
        // If details are not found or the video is short, filter it out
        if (!details || details.isShort) return null;
        // Return the details object directly as it already matches EnrichedVideoDetails
        // We might only need title and thumbnail from playlistItem if they weren't added to EnrichedVideoDetails,
        // but they were added in the previous step.
        return details; // Return the found details object
      })
      // Filter out the null values and ensure the result is EnrichedVideoDetails[]
      .filter((video): video is EnrichedVideoDetails => video !== null);

    // Process recommended videos result
    const recommendedPlaylistVideos = recommendedPlaylistResult; // Already fetched
    console.log(`おすすめプレイリスト ${RECOMMENDED_PLAYLIST_ID} から取得した動画数: ${recommendedPlaylistVideos.length}`);

    // おすすめ動画でも重複を除去
    const uniqueRecommendedMap = new Map();
    recommendedPlaylistVideos.forEach((video) => { // Use recommendedPlaylistVideos directly
      const videoId = video?.snippet?.resourceId?.videoId;
      if (videoId && !uniqueRecommendedMap.has(videoId)) {
        uniqueRecommendedMap.set(videoId, video);
      }
    });
    const uniqueRecommendedVideos = Array.from(uniqueRecommendedMap.values());
    console.log(`重複除去後のおすすめ動画数: ${uniqueRecommendedVideos.length}`);

    // Use PlaylistItem type for mapping recommended videos
    const recommendedVideoIds = uniqueRecommendedVideos
      .map((video: PlaylistItem) => video.snippet?.resourceId?.videoId)
      .filter((id): id is string => !!id);

    // recommendedVideoDetails will be EnrichedVideoDetails[]
    const recommendedVideoDetails = recommendedVideoIds.length ? await fetchVideoDetails(recommendedVideoIds) : [];

    // Map directly to EnrichedVideoDetails structure for recommended videos
    const recommendedVideoData: EnrichedVideoDetails[] = uniqueRecommendedVideos
      .map((playlistItem: PlaylistItem) => {
        // Find corresponding details
        const details = recommendedVideoDetails.find((d: EnrichedVideoDetails) => d.videoId === playlistItem?.snippet?.resourceId?.videoId);
        // Filter out if no details or is short
        if (!details || details.isShort) return null;
        // Return the details object
        return details;
      })
      // Filter out nulls and ensure type
      .filter((video): video is EnrichedVideoDetails => video !== null);

    if (!youtubeVideoData.length && !recommendedVideoData.length) {
      console.error('すべてのプレイリストから動画が取得できませんでした');
      // Return empty arrays instead of 404 if one list has data but the other doesn't
      // return NextResponse.json({ error: 'No videos found in any playlist' }, { status: 404 });
    }

    console.log('取得した動画データ:', youtubeVideoData.length);
    console.log('取得したおすすめ動画データ:', recommendedVideoData.length);

    // Cache the full data
    cachedVideos = youtubeVideoData;
    cachedRecommendedVideos = recommendedVideoData;
    lastFetchTime = currentTime;

    // Return the full data
    return NextResponse.json({
      videos: youtubeVideoData,
      recommendedVideos: recommendedVideoData,
      lastFetchTime,
    });
  } catch (error: any) {
    console.error('動画取得エラー:', error.message, error.stack);
    return NextResponse.json({ error: `Failed to fetch videos: ${error.message}` }, { status: 500 });
  }
}
