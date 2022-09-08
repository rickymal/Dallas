begin transaction
select * from purpose where id in (select purpose_id from did_purpose_task where did_task_id = (select id from did_task where boxed_task_id = 1))
select * from purpose where id in (select purpose_id from gonna_purpose_task where gonna_task_id = (select id from gonna_task where boxed_task_id = 1))
commit