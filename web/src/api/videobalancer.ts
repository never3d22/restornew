import type {
  ApiResponse,
  MediaItem,
  MediaListParams,
  MediaLookupParams,
} from "@/types/videobalancer";

const API_BASE_URL = "https://api.apbugall.org/";
const API_TOKEN = "115f79b05ff195bc531a3878101ee6";

function buildUrl(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();
  searchParams.set("token", API_TOKEN);

  Object.entries(params).forEach(([key, value]) => {
    if (value && value.trim()) {
      searchParams.set(key, value.trim());
    }
  });

  return `${API_BASE_URL}?${searchParams.toString()}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Ошибка запроса: ${response.status}`);
  }

  const json = (await response.json()) as ApiResponse<T>;

  if (json.status === "error") {
    throw new Error(json.error_info || "Неизвестная ошибка API");
  }

  return json.data;
}

function normalizeMediaItems(input: unknown): MediaItem[] {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input as MediaItem[];
  }

  if (typeof input === "object") {
    const maybeItem = input as Record<string, unknown>;

    if ("name" in maybeItem && typeof maybeItem.name === "string") {
      return [maybeItem as unknown as MediaItem];
    }

    return Object.values(maybeItem) as unknown as MediaItem[];
  }

  return [];
}

export async function fetchMediaList(params: MediaListParams): Promise<MediaItem[]> {
  const url = buildUrl({
    list: params.list,
    name: params.name,
    year: params.year,
    order: params.order,
    order_type: params.order_type,
    translation_name: params.translation_name,
    translation_id: params.translation_id,
    country: params.country,
    not_country: params.not_country,
    actor: params.actor,
    director: params.director,
    producer: params.producer,
    rating_kp: params.rating_kp,
    rating_imdb: params.rating_imdb,
    poster: params.poster,
    description: params.description,
    uhd: params.uhd,
    page: params.page,
  });

  const data = await fetchJson<unknown>(url);
  return normalizeMediaItems(data);
}

export async function fetchMediaDetails(
  lookup: MediaLookupParams
): Promise<MediaItem> {
  const url = buildUrl({
    kp: lookup.kp,
    imdb: lookup.imdb,
    world_art: lookup.world_art,
    name: lookup.name,
    year: lookup.year,
  });

  return fetchJson<MediaItem>(url);
}

export function buildLookupFromItem(item: MediaItem): MediaLookupParams {
  if (item.id_kp && item.id_kp !== "0") {
    return { kp: item.id_kp };
  }

  if (item.id_imdb && item.id_imdb !== "0") {
    return { imdb: item.id_imdb };
  }

  if (item.id_world_art && item.id_world_art !== "0") {
    return { world_art: item.id_world_art };
  }

  return {
    name: item.name,
    year: item.year,
  };
}

export function getMediaKey(item: MediaItem): string {
  if (item.id_kp && item.id_kp !== "0") {
    return `kp:${item.id_kp}`;
  }
  if (item.id_imdb && item.id_imdb !== "0") {
    return `imdb:${item.id_imdb}`;
  }
  if (item.id_world_art && item.id_world_art !== "0") {
    return `world:${item.id_world_art}`;
  }
  return `name:${item.name}-${item.year}`;
}
