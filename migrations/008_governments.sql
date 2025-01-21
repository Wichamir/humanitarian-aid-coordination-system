-- migrate:up

create table "governments" (
  "id" uuid primary key default gen_random_uuid() not null,
  "name" text not null
);

create table "reports" (
  "id" uuid primary key default gen_random_uuid() not null,
  "government_id" uuid default gen_random_uuid(), -- default for government id
  "generated_on" date not null,
  "source" text not null
);

-- migrate:down

drop table "reports";
drop table "governments";
