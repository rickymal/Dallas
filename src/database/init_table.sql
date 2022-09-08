drop table if exists dbo.purpose
drop table if exists dbo.boxed_tasks
drop table if exists dbo.did_task
drop table if exists dbo.gonna_task
drop table if exists dbo.did_purpose_task
drop table if exists dbo.gonna_purpose_task
drop table if exists dbo.purpose_relashionship
drop table if exists dbo.purpose_dependencies


create table purpose(
	id int primary key identity,
	title varchar(20),
	description varchar(50),
	done bit
)

create table boxed_tasks(
	id int primary key identity,
	create_at datetime,
)

create table did_task(
id int primary key identity,
created_at datetime,
boxed_task_id int
)

create table gonna_task(
id int primary key identity,
created_at datetime,
boxed_task_id int
)

create table did_purpose_task(
id int primary key identity,
did_task_id int,
purpose_id int
)

create table gonna_purpose_task(
id int primary key identity,
gonna_task_id int,
purpose_id int
)


create table purpose_relashionship(
	id int primary key identity,
	auditory_purpose int,
	audited_purpose int
)


create table purpose_dependencies(
	id int primary key identity,
	from_purpose int,
	to_purpose int
)