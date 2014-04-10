-- Database generated with pgModeler (PostgreSQL Database Modeler).
-- pgModeler  version: 0.7.0-alpha
-- PostgreSQL version: 9.3
-- Project Site: pgmodeler.com.br
-- Model Author: ---

SET check_function_bodies = false;
-- ddl-end --


-- Database creation must be done outside an multicommand file.
-- These commands were put in this file only for convenience.
-- -- object: new_database | type: DATABASE --
-- -- DROP DATABASE new_database;
-- CREATE DATABASE new_database
-- ;
-- -- ddl-end --
-- 

-- object: public.users | type: TABLE --
-- DROP TABLE public.users;
CREATE TABLE public.users(
    id serial NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    secret text NOT NULL,
    registration_ip inet NOT NULL,
    registration_timestamp timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
    CONSTRAINT user_id_primary PRIMARY KEY (id),
    CONSTRAINT user_email_unique UNIQUE (email),
    CONSTRAINT user_name_unique UNIQUE (username)

);
-- ddl-end --
-- object: public.ratings | type: TABLE --
-- DROP TABLE public.ratings;
CREATE TABLE public.ratings(
    id serial NOT NULL,
    label text NOT NULL,
    slug text NOT NULL,
    value smallint NOT NULL,
    CONSTRAINT rating_id_primary PRIMARY KEY (id),
    CONSTRAINT rating_label_unique UNIQUE (label),
    CONSTRAINT rating_slug_unique UNIQUE (slug),
    CONSTRAINT rating_value_unique UNIQUE (value)

);
-- ddl-end --
-- object: public.logins | type: TABLE --
-- DROP TABLE public.logins;
CREATE TABLE public.logins(
    id serial NOT NULL,
    ip inet NOT NULL,
    timestamp timestamp NOT NULL DEFAULT localtimestamp,
    id_users integer NOT NULL
);
-- ddl-end --
-- object: users_fk | type: CONSTRAINT --
-- ALTER TABLE public.logins DROP CONSTRAINT users_fk;
ALTER TABLE public.logins ADD CONSTRAINT users_fk FOREIGN KEY (id_users)
REFERENCES public.users (id) MATCH FULL
ON DELETE CASCADE ON UPDATE CASCADE;
-- ddl-end --


-- object: public.user_ratings | type: TABLE --
-- DROP TABLE public.user_ratings;
CREATE TABLE public.user_ratings(
    id serial NOT NULL,
    id_users integer NOT NULL,
    id_ratings integer NOT NULL,
    edited_date timestamp NOT NULL DEFAULT LOCALTIMESTAMP,
    entry text NOT NULL,
    created_date timestamp NOT NULL DEFAULT LOCALTIMESTAMP
);
-- ddl-end --
-- object: users_fk | type: CONSTRAINT --
-- ALTER TABLE public.user_ratings DROP CONSTRAINT users_fk;
ALTER TABLE public.user_ratings ADD CONSTRAINT users_fk FOREIGN KEY (id_users)
REFERENCES public.users (id) MATCH FULL
ON DELETE RESTRICT ON UPDATE CASCADE;
-- ddl-end --


-- object: ratings_fk | type: CONSTRAINT --
-- ALTER TABLE public.user_ratings DROP CONSTRAINT ratings_fk;
ALTER TABLE public.user_ratings ADD CONSTRAINT ratings_fk FOREIGN KEY (id_ratings)
REFERENCES public.ratings (id) MATCH FULL
ON DELETE RESTRICT ON UPDATE CASCADE;
-- ddl-end --



