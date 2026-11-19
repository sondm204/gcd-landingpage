# Self-hosted fonts

Be Vietnam Pro (400, 500, 600, 700) and Playfair Display (variable 400–900), from the Google Fonts files already used by this project. Vietnamese, Latin and extended Latin subsets are declared with their original Unicode ranges in `app/fonts.css`; the Playfair Cyrillic subset is retained as well.

Files are served directly from `/fonts/`. No Google Fonts request or generated `next/font` class is needed during development or builds, keeping the root HTML attributes stable between SSR and hydration. Both families are distributed under the included SIL Open Font License files, fetched from the Google Fonts repository.
