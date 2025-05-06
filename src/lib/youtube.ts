// src/lib/youtube.ts
import {
  MAX_RESULTS_PER_PLAYLIST_PAGE,
  MAX_TOTAL_VIDEOS_PER_PLAYLIST,
  VIDEO_DETAILS_CHUNK_SIZE,
  CHANNEL_DETAILS_CHUNK_SIZE,
  ONE_DAY_MS // Import channel icon cache duration
} from '@/config/constants';
import { parseDuration } from './utils'; // Import parseDuration

// Define interfaces for YouTube API responses
interface PlaylistItemSnippet {
  title: string;
  resourceId: { videoId: string };
  thumbnails: {
    medium?: { url: string };
    default?: { url: string };
    high?: { url: string }; // Add other potential sizes
    standard?: { url: string };
    maxres?: { url: string };
  };
  publishedAt: string;
  channelTitle: string;
  channelId: string; // Added channelId based on usage in fetchVideoDetails
  description?: string; // Optional description
}

// Export PlaylistItem interface
export interface PlaylistItem {
  kind: string;
  etag: string;
  id: string;
  snippet: PlaylistItemSnippet;
}

interface VideoStatistics {
  viewCount: string; // API returns string
  likeCount?: string;
  dislikeCount?: string; // May not be available
  favoriteCount?: string;
  commentCount?: string;
}

interface VideoContentDetails {
  duration: string;
  dimension?: string;
  definition?: string;
  caption?: string;
  licensedContent?: boolean;
  projection?: string;
}

interface VideoSnippet extends PlaylistItemSnippet { // Reuse parts of PlaylistItemSnippet
  tags?: string[];
  categoryId?: string;
  liveBroadcastContent?: string;
  // publishedAt, channelId, title, description, thumbnails, channelTitle are inherited
}

interface VideoDetailsItem {
  kind: string;
  etag: string;
  id: string;
  snippet: VideoSnippet;
  statistics: VideoStatistics;
  contentDetails: VideoContentDetails;
}

// Define the structure for the enriched video details returned by fetchVideoDetails
export interface EnrichedVideoDetails {
  videoId: string;
  viewCount: number;
  isShort: boolean;
  duration: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  channelIcon: string | null;
  title: string; // Added title
  thumbnail: string; // Added thumbnail (using medium or default)
}


// In-memory cache for channel icons (allow null values)
let channelIconCache: { [key: string]: string | null } = {};
let lastChannelIconFetchTime: number = 0;

// Modified to accept a single playlistId and return PlaylistItem[]
export async function fetchPlaylistVideos(
  playlistId: string,
  publishedAfter: string,
  publishedBefore: string
): Promise<PlaylistItem[]> { // Updated return type
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY!;
  const playlistVideos: PlaylistItem[] = []; // Use PlaylistItem[] type
  let nextPageToken: string | undefined;

  // Removed the outer loop for playlistIds
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&publishedAfter=${publishedAfter}&publishedBefore=${publishedBefore}&maxResults=${MAX_RESULTS_PER_PLAYLIST_PAGE}&pageToken=${nextPageToken || ''}&key=${apiKey}`;
    try { // Added try...catch for individual playlist fetch
      const response = await fetch(url);
      // Check for HTTP errors
      if (!response.ok) {
        console.error(`プレイリスト ${playlistId} の取得HTTPエラー: ${response.status} ${response.statusText}`);
        // Optionally try to parse error message from response body
        try {
          const errorData = await response.json();
          console.error('APIエラー詳細:', errorData);
        } catch (parseError) {
          // Ignore if response body is not JSON or empty
        }
        break; // Stop fetching for this playlist on HTTP error
      }

      const data = await response.json();
      console.log(`プレイリスト ${playlistId} のデータ (pageToken: ${nextPageToken}):`, data); // Keep logging for debug

      // Check for API errors within the JSON response
      if (data.error) {
        console.error(`プレイリスト ${playlistId} のAPIエラー:`, data.error.message);
        break; // Stop fetching for this playlist on API error
      }

      if (!data.items || !Array.isArray(data.items)) {
        console.warn(`プレイリスト ${playlistId} にアイテムがありません (pageToken: ${nextPageToken})`);
        // Don't break here, nextPageToken might be null, ending the loop naturally
      } else {
        playlistVideos.push(...data.items);
      }

      nextPageToken = data.nextPageToken;

    } catch (error: any) {
      console.error(`プレイリスト ${playlistId} の取得中にネットワークエラーまたはJSON解析エラー:`, error.message);
      break; // Stop fetching for this playlist on network/parse error
    }
  } while (nextPageToken && playlistVideos.length < MAX_TOTAL_VIDEOS_PER_PLAYLIST); // Use constant

  console.log(`プレイリスト ${playlistId} から取得した動画数: ${playlistVideos.length}`);
  return playlistVideos;
}

// Updated to return EnrichedVideoDetails[]
export async function fetchVideoDetails(videoIds: string[]): Promise<EnrichedVideoDetails[]> {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY!;
  const validVideoIds = videoIds.filter((id): id is string => !!id && typeof id === 'string'); // Type guard
  if (!validVideoIds.length) {
    console.warn('有効なvideoIdsがありません');
    return [];
  }

  // Use constant for chunk size
  const allDetails: EnrichedVideoDetails[] = []; // Use EnrichedVideoDetails[] type

  for (let i = 0; i < validVideoIds.length; i += VIDEO_DETAILS_CHUNK_SIZE) {
    const chunk = validVideoIds.slice(i, i + VIDEO_DETAILS_CHUNK_SIZE);
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${chunk.join(',')}&key=${apiKey}`;
    console.log(`リクエストURL (${chunk.length}件):`, url);
    const response = await fetch(url);
    const data = await response.json();

    console.log(`チャンクレスポンス (${chunk.length}件):`, data);

    if (data.error) {
      console.error('動画詳細取得エラー (チャンク):', data.error.message);
      continue;
    }

    if (!data.items || !Array.isArray(data.items)) {
      console.warn('動画詳細がありません (チャンク)');
      continue;
    }

    // Map VideoDetailsItem to EnrichedVideoDetails
    const detailsChunk: EnrichedVideoDetails[] = data.items.map((item: VideoDetailsItem) => {
      // Choose a thumbnail, fallback from medium to default, then provide an empty string if none exist
      const thumbnailUrl = item.snippet.thumbnails?.medium?.url ?? item.snippet.thumbnails?.default?.url ?? '';
      return {
        videoId: item.id,
        viewCount: parseInt(item.statistics.viewCount, 10) || 0, // Added radix 10
        isShort: parseDuration(item.contentDetails.duration) <= 60, // Assuming parseDuration handles potential errors
        duration: item.contentDetails.duration, // Keep original duration string
        publishedAt: item.snippet.publishedAt,
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        title: item.snippet.title, // Add title
        thumbnail: thumbnailUrl, // Add thumbnail URL
        channelIcon: null, // Initialize channelIcon as null, will be fetched later
      };
    });
    allDetails.push(...detailsChunk);
  }

  // チャンネルIDを収集 (Type assertion needed if allDetails wasn't strictly typed before)
  const channelIds = allDetails
    .map(detail => detail.channelId)
    .filter((id, index, self): id is string => !!id && self.indexOf(id) === index); // Filter out undefined/null and duplicates

  // チャンネルアイコンを取得
  const channelIcons = await fetchChannelIcons(channelIds);

  // 動画詳細にチャンネル情報をマージ (Mutate allDetails directly or create new array)
  const enrichedDetailsWithIcons = allDetails.map(detail => ({
    ...detail,
    // Use nullish coalescing for fallback, although || null works similarly here
    channelIcon: channelIcons[detail.channelId] ?? null,
  }));

  return enrichedDetailsWithIcons;
}

// チャンネルIDのリストからチャンネルアイコンを取得するヘルパー関数（キャッシュ対応）
// Return type updated to allow null
async function fetchChannelIcons(channelIds: string[]): Promise<{ [key: string]: string | null }> {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY!;
  const currentTime = Date.now();

  // キャッシュが有効かチェック (1日以内)
  // キャッシュが有効かチェック (1日以内)
  if (Object.keys(channelIconCache).length > 0 && currentTime - lastChannelIconFetchTime < ONE_DAY_MS) {
    console.log('チャンネルアイコンをキャッシュから返します');
    // 要求されたIDのみをフィルタリングして返す
    // Type updated to allow null
    const requestedIcons: { [key: string]: string | null } = {};
    channelIds.forEach(id => {
      // Assign cached value (which might be null)
      if (channelIconCache[id] !== undefined) {
        requestedIcons[id] = channelIconCache[id];
      }
    });
    // キャッシュにないIDがあれば、それらだけをAPIで取得する（より高度な実装）
    // 今回はシンプルに、キャッシュがあればそれを返し、なければ全取得
    const missingIds = channelIds.filter(id => channelIconCache[id] === undefined);
    if (missingIds.length === 0) {
        return requestedIcons;
    }
     console.log(`キャッシュにないチャンネルID (${missingIds.length}件) を取得します:`, missingIds);
     // ここでは簡単化のため、キャッシュが一部でも欠けていたら全取得し直す
     // return requestedIcons; // キャッシュのみ返す場合
  }

  console.log('チャンネルアイコンをAPIから取得します');
  if (!channelIds.length) return {};

  // Type updated to allow null
  const newChannelIconMap: { [key: string]: string | null } = {};

  for (let i = 0; i < channelIds.length; i += CHANNEL_DETAILS_CHUNK_SIZE) {
    const chunk = channelIds.slice(i, i + CHANNEL_DETAILS_CHUNK_SIZE);
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${chunk.join(',')}&key=${apiKey}`;
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error('チャンネル情報取得エラー:', data.error.message);
        continue; // エラーが発生しても次のチャンクへ
      }

      if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item: any) => {
          newChannelIconMap[item.id] = item.snippet?.thumbnails?.default?.url || null;
        });
      }
    } catch (error: any) {
      console.error('チャンネル情報取得中にネットワークエラー:', error.message);
      // エラーが発生しても処理を続ける場合がある
    }
  }

  // キャッシュを更新
  channelIconCache = { ...channelIconCache, ...newChannelIconMap }; // 新しいデータをマージ
  lastChannelIconFetchTime = currentTime;

  // 要求されたIDに対応するアイコンのみを返す
  // Type updated to allow null
  const requestedIcons: { [key: string]: string | null } = {};
    channelIds.forEach(id => {
      // Assign cached value (which might be null)
      requestedIcons[id] = channelIconCache[id] !== undefined ? channelIconCache[id] : null;
    });


  return requestedIcons;
}
