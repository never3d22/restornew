export interface MediaTranslationOption {
  iframe: string | null;
  name: string;
  quality: string | null;
  adv?: boolean;
}

export interface MediaEpisodeTranslation extends MediaTranslationOption {}

export interface MediaEpisode {
  translation?: Record<string, MediaEpisodeTranslation> | null;
  iframe?: string | null;
  episode: string;
}

export interface MediaSeason {
  iframe?: string | null;
  season: string;
  episodes?: Record<string, MediaEpisode> | null;
}

export interface MediaItem {
  name: string;
  original_name: string | null;
  alternative_name: string | null;
  year: string;
  category: string;
  id_kp: string | null;
  alternative_id_kp: string | null;
  id_imdb: string | null;
  id_world_art: string | null;
  seasons_count?: string | null;
  quality?: string | null;
  translation?: string | null;
  country?: string | null;
  genre?: string | null;
  actors?: string | null;
  directors?: string | null;
  producers?: string | null;
  premiere_ru?: string | null;
  premiere?: string | null;
  age_restrictions?: string | null;
  rating_mpaa?: string | null;
  rating_kp?: string | null;
  rating_imdb?: string | null;
  time?: string | null;
  tagline?: string | null;
  poster?: string | null;
  description?: string | null;
  iframe?: string | null;
  iframe_last?: string | null;
  seasons?: Record<string, MediaSeason> | null;
  translation_iframe?: Record<string, MediaTranslationOption> | null;
}

export interface ApiSuccessResponse<T> {
  status: "success";
  data: T;
}

export interface ApiErrorResponse {
  status: "error";
  error_info: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface MediaListParams {
  list?: "movie" | "serial" | "anime" | "anime-serial" | "tv-show";
  name?: string;
  year?: string;
  order?: string;
  order_type?: "ASC" | "DESC";
  translation_name?: string;
  translation_id?: string;
  country?: string;
  not_country?: string;
  actor?: string;
  director?: string;
  producer?: string;
  rating_kp?: string;
  rating_imdb?: string;
  poster?: "0" | "1";
  description?: "0" | "1";
  uhd?: string;
  page?: string;
}

export interface MediaLookupParams {
  kp?: string;
  imdb?: string;
  world_art?: string;
  name?: string;
  year?: string;
}
