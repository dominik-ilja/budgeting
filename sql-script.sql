CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY,
	role_id INTEGER NOT NULL REFERENCES roles (id),
	username TEXT NOT NULL UNIQUE,
	password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
	id INTEGER PRIMARY KEY,
	description TEXT
	name TEXT NOT NULL UNIQUE,
);

CREATE TABLE IF NOT EXISTS import_profiles (
	id INTEGER PRIMARY KEY,
	user_id INTEGER NOT NULL REFERENCES users (id),
	target_table_id INTEGER NOT NULL REFERENCES target_tables (id),
	name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS target_tables (
	id INTEGER PRIMARY KEY,
	name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS column_mappings (
	id INTEGER PRIMARY KEY,
	import_profile_id INTEGER NOT NULL REFERENCES import_profiles (id),
	source_column TEXT NOT NULL,
	target_column TEXT NOT NULL,
	data_type TEXT NOT NULL,
	UNIQUE (import_profile_id, source_column),
	UNIQUE (import_profile_id, target_column)
);

CREATE TABLE IF NOT EXISTS transactions (
	id INTEGER PRIMARY KEY,
	account_id INTEGER NOT NULL REFERENCES accounts (id),
	transaction_sub_category_id INTEGER NOT NULL REFERENCES transaction_sub_categories (id),
	user_id INTEGER NOT NULL REFERENCES users (id),
	amount DECIMAL(10, 2) NOT NULL,
	description TEXT NOT NULL,
	note TEXT,
	transaction_date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transaction_categories (
	id INTEGER PRIMARY KEY,
	name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS transaction_sub_categories (
	id INTEGER PRIMARY KEY,
	transaction_category_id INTEGER NOT NULL REFERENCES transaction_categories (id),
	user_id INTEGER NOT NULL REFERENCES users (id),
	name TEXT NOT NULL,
	UNIQUE (transaction_category_id, user_id, name)
);

CREATE TABLE IF NOT EXISTS accounts (
	id INTEGER PRIMARY KEY,
	account_type_id INTEGER NOT NULL REFERENCES account_types (id),
	user_id INTEGER NOT NULL REFERENCES users (id),
	issuer TEXT NOT NULL,
	name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS account_types (
	id INTEGER PRIMARY KEY,
	name TEXT NOT NULL UNIQUE,
	amount_polarity INTEGER NOT NULL CHECK (amount_polarity IN (0, 1))
);