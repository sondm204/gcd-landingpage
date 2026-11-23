CREATE TABLE public.game_availability (
 game text PRIMARY KEY CHECK (game IN ('craft','print','rhythm','place','postcard')),
 is_open boolean NOT NULL DEFAULT true
);
INSERT INTO public.game_availability(game) VALUES ('craft'),('print'),('rhythm'),('place'),('postcard');
ALTER TABLE public.game_availability ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.game_availability FROM anon, authenticated;
GRANT ALL ON public.game_availability TO service_role;
