import { FormEvent, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  buildLookupFromItem,
  fetchMediaDetails,
  fetchMediaList,
  getMediaKey,
} from "@/api/videobalancer";
import type { MediaItem, MediaTranslationOption } from "@/types/videobalancer";
import "./App.css";

const CATEGORY_OPTIONS = [
  { value: "movie", label: "Фильмы" },
  { value: "serial", label: "Сериалы" },
  { value: "anime", label: "Аниме" },
  { value: "anime-serial", label: "Аниме-сериалы" },
  { value: "tv-show", label: "TV-шоу" },
] as const;

const TEST_IFRAME_SRC = "https://api.apbugall.org/iframe/test";

type CategoryValue = (typeof CATEGORY_OPTIONS)[number]["value"];

interface SearchFilters {
  name: string;
  year: string;
  category: CategoryValue;
}

export default function App() {
  const [filters, setFilters] = useState<SearchFilters>({
    name: "",
    year: "",
    category: "movie",
  });
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(filters);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedTranslationId, setSelectedTranslationId] = useState<string | null>(
    null
  );

  const mediaListQuery = useQuery({
    queryKey: ["mediaList", appliedFilters],
    queryFn: () =>
      fetchMediaList({
        list: appliedFilters.category,
        name: appliedFilters.name || undefined,
        year: appliedFilters.year || undefined,
        order: "date",
      }),
  });

  const items = mediaListQuery.data ?? [];

  useEffect(() => {
    if (!items.length) {
      if (selectedKey !== null) {
        setSelectedKey(null);
      }
      return;
    }

    if (selectedKey) {
      const exists = items.some((item) => getMediaKey(item) === selectedKey);
      if (exists) {
        return;
      }
    }

    const firstKey = getMediaKey(items[0]);
    setSelectedKey(firstKey);
  }, [items, selectedKey]);

  const selectedItem = useMemo(() => {
    if (!selectedKey) {
      return null;
    }
    return items.find((item) => getMediaKey(item) === selectedKey) ?? null;
  }, [items, selectedKey]);

  const mediaDetailsQuery = useQuery({
    queryKey: ["mediaDetails", selectedKey],
    queryFn: () => fetchMediaDetails(buildLookupFromItem(selectedItem!)),
    enabled: Boolean(selectedItem),
  });

  const fullDetails: MediaItem | null = mediaDetailsQuery.data ?? selectedItem ?? null;

  const translationEntries = useMemo(() => {
    const translationMap = fullDetails?.translation_iframe ?? null;

    if (!translationMap) {
      return [] as Array<[string, MediaTranslationOption]>;
    }

    return Object.entries(translationMap).filter(
      ([, option]) => Boolean(option?.iframe || option?.name)
    ) as Array<[string, MediaTranslationOption]>;
  }, [fullDetails]);

  useEffect(() => {
    if (!translationEntries.length) {
      if (selectedTranslationId !== null) {
        setSelectedTranslationId(null);
      }
      return;
    }

    if (
      selectedTranslationId &&
      translationEntries.some(([id]) => id === selectedTranslationId)
    ) {
      return;
    }

    setSelectedTranslationId(translationEntries[0][0]);
  }, [translationEntries, selectedTranslationId]);

  const activeIframe = useMemo(() => {
    if (selectedTranslationId && fullDetails?.translation_iframe) {
      const option = fullDetails.translation_iframe[selectedTranslationId];
      if (option?.iframe) {
        return option.iframe;
      }
    }

    if (fullDetails?.iframe) {
      return fullDetails.iframe;
    }

    return TEST_IFRAME_SRC;
  }, [fullDetails, selectedTranslationId]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    const resetValue: SearchFilters = { name: "", year: "", category: "movie" };
    setFilters(resetValue);
    setAppliedFilters(resetValue);
  };

  const handleSelectItem = (item: MediaItem) => {
    const key = getMediaKey(item);
    setSelectedKey(key);
  };

  return (
    <div className="appShell">
      <header className="appHeader">
        <div>
          <h1>Videobalancer Cinema</h1>
          <p>
            Онлайн-кинотеатр с данными и плеером от Videobalancer. Используйте
            поиск, чтобы найти фильм или сериал, и сразу смотрите его в плеере.
          </p>
        </div>
      </header>

      <section className="filtersSection">
        <form className="filtersForm" onSubmit={handleSubmit}>
          <div className="fieldGroup">
            <label htmlFor="name">Название</label>
            <input
              id="name"
              name="name"
              placeholder="Например, Чебурашка"
              value={filters.name}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </div>
          <div className="fieldGroup">
            <label htmlFor="year">Год</label>
            <input
              id="year"
              name="year"
              placeholder="2023"
              value={filters.year}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, year: event.target.value }))
              }
            />
          </div>
          <div className="fieldGroup">
            <label htmlFor="category">Категория</label>
            <select
              id="category"
              name="category"
              value={filters.category}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  category: event.target.value as CategoryValue,
                }))
              }
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="formActions">
            <button type="submit" className="primaryButton">
              Найти
            </button>
            <button type="button" onClick={handleReset} className="ghostButton">
              Сбросить
            </button>
          </div>
        </form>
      </section>

      <section className="contentSection">
        <div className="listColumn">
          <div className="sectionTitleRow">
            <h2>Каталог</h2>
            {mediaListQuery.isFetching ? (
              <span className="statusTag">Обновление…</span>
            ) : null}
          </div>
          {mediaListQuery.isError ? (
            <div className="emptyState">
              Не удалось загрузить каталог: {formatError(mediaListQuery.error)}
            </div>
          ) : null}
          {!mediaListQuery.isLoading && items.length === 0 ? (
            <div className="emptyState">Ничего не найдено</div>
          ) : null}
          <div className="catalogGrid">
            {mediaListQuery.isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="catalogCard skeleton" />
                ))
              : items.map((item) => {
                  const key = getMediaKey(item);
                  const isActive = key === selectedKey;
                  const posterUrl = item.poster && item.poster !== "0" ? item.poster : null;

                  return (
                    <button
                      key={key}
                      type="button"
                      className={`catalogCard${isActive ? " active" : ""}`}
                      onClick={() => handleSelectItem(item)}
                    >
                      <div className="posterThumb">
                        {posterUrl ? (
                          <img src={posterUrl} alt="" loading="lazy" />
                        ) : (
                          <div className="posterFallback">Нет постера</div>
                        )}
                      </div>
                      <div className="cardContent">
                        <h3>{item.name}</h3>
                        <p className="muted">{item.year}</p>
                        <p className="muted smallText">
                          {item.genre || "Жанр не указан"}
                        </p>
                      </div>
                    </button>
                  );
                })}
          </div>
        </div>

        <div className="detailsColumn">
          <div className="sectionTitleRow">
            <h2>Информация</h2>
            {mediaDetailsQuery.isFetching ? (
              <span className="statusTag">Загрузка…</span>
            ) : null}
          </div>
          {mediaDetailsQuery.isError ? (
            <div className="emptyState">
              Не удалось загрузить детали: {formatError(mediaDetailsQuery.error)}
            </div>
          ) : null}
          {!fullDetails ? (
            <div className="emptyState">Выберите фильм или сериал из каталога.</div>
          ) : (
            <article className="detailsCard">
              <div className="detailsHeader">
                <div>
                  <h3>{fullDetails.name}</h3>
                  {fullDetails.original_name ? (
                    <p className="muted">{fullDetails.original_name}</p>
                  ) : null}
                </div>
                {fullDetails.rating_kp || fullDetails.rating_imdb ? (
                  <div className="ratings">
                    {fullDetails.rating_kp ? (
                      <span className="ratingBadge">KP {fullDetails.rating_kp}</span>
                    ) : null}
                    {fullDetails.rating_imdb ? (
                      <span className="ratingBadge">IMDb {fullDetails.rating_imdb}</span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="metaGrid">
                <MetaRow label="Год" value={fullDetails.year} />
                <MetaRow label="Жанр" value={fullDetails.genre} />
                <MetaRow label="Страна" value={fullDetails.country} />
                <MetaRow label="Режиссеры" value={fullDetails.directors} />
                <MetaRow label="Актеры" value={fullDetails.actors} />
                <MetaRow label="Продюсеры" value={fullDetails.producers} />
                <MetaRow label="Возраст" value={fullDetails.age_restrictions} />
                <MetaRow label="Продолжительность" value={fullDetails.time} />
              </div>

              {fullDetails.description ? (
                <p className="description">{fullDetails.description}</p>
              ) : null}

              <div className="translations">
                <h4>Озвучки</h4>
                {translationEntries.length === 0 ? (
                  <p className="muted">Озвучки не указаны</p>
                ) : (
                  <div className="translationChips">
                    {translationEntries.map(([id, option]) => (
                      <button
                        key={id}
                        type="button"
                        className={`chip${selectedTranslationId === id ? " active" : ""}`}
                        onClick={() => setSelectedTranslationId(id)}
                      >
                        <span>{option.name}</span>
                        {option.quality ? (
                          <span className="chipSub">{option.quality}</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="playerWrapper">
                <iframe
                  key={activeIframe}
                  src={activeIframe || TEST_IFRAME_SRC}
                  title={`Плеер ${fullDetails.name}`}
                  loading="lazy"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              </div>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}

interface MetaRowProps {
  label: string;
  value?: string | null;
}

function MetaRow({ label, value }: MetaRowProps) {
  if (!value || value === "0") {
    return null;
  }

  return (
    <div className="metaRow">
      <span className="metaLabel">{label}</span>
      <span className="metaValue">{value}</span>
    </div>
  );
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Неизвестная ошибка";
}
