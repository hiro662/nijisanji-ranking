// src/config/constants.ts

// YouTube API related constants (from src/lib/youtube.ts)
export const MAX_RESULTS_PER_PLAYLIST_PAGE = 50;
export const MAX_TOTAL_VIDEOS_PER_PLAYLIST = 500; // API quota measure
export const VIDEO_DETAILS_CHUNK_SIZE = 30;
export const CHANNEL_DETAILS_CHUNK_SIZE = 50;

// API Route constants (from src/app/api/fetch-videos/route.ts)
export const ONE_HOUR_MS = 60 * 60 * 1000; // Video data cache duration
export const ONE_DAY_MS = 24 * 60 * 60 * 1000; // Channel icon cache duration
export const DEFAULT_PUBLISHED_AFTER = '2000-01-01T00:00:00Z'; // Default start date for fetching all videos

// Playlist IDs
export const VIDEO_PLAYLIST_IDS = [
  'UUeuNlK0yX-6_4930q0JUGNw',
  'UUqwNLpNEtNf7PYc_Kh7SOMw',
  'UUurCD5CZFluZu7Szcc8WXXg',
  'UUMGvmEqkVbl372DCyn3NLAw',
  'UU4E6OzPLcKbcCP1qRzGZlNg',//VTuver切り抜き隊
  'UUMZjGiJ8lD94DaRwfVrdWlA',//びーの【葛葉切り抜き】
  'UUBUp-mME0g9fI5UDeDcDTiw',//アクスタ収集家
  'UUrtNWROFeg4rvBVEQTwUWvQ',//Bari【手描き切り抜き】
  'UUsue0G_W5GC88t2zk4xJ6tQ',//にじさんじ新人応援団
  'UU8mMANcQmh1wGKF0rjtmmSA',//チキン南蛮
  'UUFtQqlHHjbXK3M35wOjD8qw',//ルンルンを推したいのです【るんちょま切り抜き】
  'UUSy4ovsHKC3OsmO3gfSupLw',//カワセミ
  'UUrTTE-QVXsb8QYwcyj3IMkQ',//ニコル
  'UUyeSJNb1CvGEsG4sMW7fdlA',//syo【V切り抜き】
  'UUHj5jWeRdBcHKYwjiZsZCJg',//にじさんじ切り抜きに命をかける
  'UUou8nvSNCCdBIkI2F7TSmng',//るんの【にじまとめ】
  'UU2CUdC6jl1WFw-P9CJ4CKqA',//ひよっこ【にじさんじ切り抜き】
  'UUU1SIeosDYrtxdWPxyw66Eg',//アップルパイ
  'UUaqTQRpZGJcMbSCLi5VbXhQ',//切り抜き茶
  'UUciBtTQyNZfeMzNEqdIBXfA',//しまえなが大佐
  'UUqqErSrScE_EtaRseIYE66A',//葛葉見どころ集
  'UUGCmKSnNMJHNWMSX7cMtTHg',//【フワフワ】V切り抜き隊
  'UUDiSljlYyoFVLLXQS18oiMg',//ChroNoiR【葛葉　叶】切り抜きch
  'UUfqJLG-70qg7utkZl6K7JEw',//朝と海
  'UU51LWG6BjjWu1FpB8n2YdhA',//ふわっち飛んで【にじさんじ切り抜き】
  'UUgb29XNE0ZA_a-CT7OxzS-A',//ぶいちゅば鑑賞室
  'UU-UxhoAxlq57uZ8BA0b1Jyw',//FPS切り抜きボット【ローレン・イロアス】
  'UUHrXDmdGru3AnP5JnF97DFA',//濃いめのにじさんじ【にじさんじ切り抜き】
  'UUHc4aZfStPWEiSEsGGA0ktA',//Vの秘密【切り抜き】
  'UU85U1p4YJIDks4dxXfpfqjQ',//まとめん
  'UUc6BFb8fECRw2xHc03vScjQ',//視聴者B
  'UUuawT-9P_-Vu9mxqx6w173Q',//ちょべりま【ルンルン切り抜き】
  'UU_G6WXPqyBQ3xRiR3YLUZng',//ぱんだくりっぷ
  'UUv8m8WskBCUBKULMpcfv_Hg',//NIJISORA
  'UURdoK4L-hbdaxU3KxzJgGPw',//くまさん【にじさんじ切り抜き】
  'UUI28Rj6vmcHJa-xqs3Go3ng',//ごじよんじ【切り抜き】
  'UUe70SEUTjot20dGdiUA2zcw',//葛葉の切り抜き手
  'UUbYfRwFlqe3WAyZsA57MFOg',//K3
  'UU_SdCv5WnvkCft0y9mRV8Iw',//ピヨードル
  'UU9ei8Md-AeYnnvPisB_hG0A',//Gin-Neko【V切り抜き】
  'UUdrq1RN7Vj322cTDSF-_7wQ',//にじ新聞
  'UUiVGQQ1Esso-PwjcrP98zzw',//ふわふわタイム【にじさんじ切り抜き】
  'UUccJO-CHCZPQXbFsCiQDVqg',//ちょまとめ
  'UUQbPnCjvbJjXW6uhpCOjuUA',//ぴぴ
  'UUJg4L61nQfryWXH5yY9713g',//ねむい【にじさんじ切り抜き】
  'UUiRLuiVjGt0_-0j42RU_Qyg',//サバンナ
  'UUJO6JRDoOvCN8cAeq0wqeAg',//乾杯はいぼーる
  'UU3HFLSrdDv9ITY4EkPFxWNA',//多量【Vの切り抜きch】
  'UUcfnpX5gC5RhRph15iNYUBw',//ぶいの切り抜き集
  'UUen7IZZX4ro0U2RTLpK6-7w',//チャイカを切り抜くぞチャンネル
  'UUdHyjRo4y_8LTTEfmB14fvQ',//ご来店ありがとうございます。
  'UUlLauCVnBzIv2oqItc5NZeA',//賑やかしく
  'UU8ab6BJ3W7F3pq5r7-Uh0EQ',//きりぬ菌
  'UUG65Bspo5wXMoOARHlFjKNg',//サロメお嬢様専門ch【にじさんじ切り抜き】
  'UU3jYbNBIEtNBGOkpfJEYvgQ',//ブイキリ！[V切り抜き]
  'UUNr_YZSTqPjxW40HU5X9zFQ',//あめのちにじさんじ【切り抜きch】
  'UUH_sACBxfxtVxMVRJpdH2vQ',//凝縮ちゃん【にじさんじ切り抜きチャンネル】
];
export const EXCEPTION_PLAYLIST_ID = 'PL_WIds0FOHm7cSq4UhF8aOGWlm1apAA6f';
export const RECOMMENDED_PLAYLIST_ID = 'PL_WIds0FOHm7W6WwVCtEHzcfylcm7-TmE';
