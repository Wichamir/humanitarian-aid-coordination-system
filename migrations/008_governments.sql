-- migrate:up

create table "governments" (
  "id" uuid primary key default gen_random_uuid() not null,
  "name" text not null
);

create table "reports" (
  "id" uuid primary key default gen_random_uuid() not null,
  "government_id" uuid references governments (id) on delete cascade not null,
  "generated_on" date not null,
  "source" text not null
);

-- migrate:down

drop table "reports";
drop table "governments";
