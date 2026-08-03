create index if not exists shop_orders_status_total_id_idx
    on shop_orders (status, total desc, id desc);

create table if not exists lab_inventory (
    sku varchar(100) primary key,
    available integer not null check (available >= 0),
    version bigint not null default 0
);

create table if not exists lab_deadlock_account (
    id integer primary key,
    balance integer not null
);
