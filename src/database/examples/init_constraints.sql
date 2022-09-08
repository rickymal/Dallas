use TestDB_08;

alter table purpose_relashionship with check add constraint fk_delete_auditory
foreign key(auditory_purpose) references purpose(id)
on delete cascade