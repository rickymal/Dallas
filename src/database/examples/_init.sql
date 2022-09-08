USE WorkanaDb
GO
use TestDB_08;

drop table if exists dbo.task;
drop table if exists dbo.daily;
drop table if exists dbo.SEQUENCE_DAILY;
drop table if exists dbo.task_group;
drop table if exists dbo.daily;

select * from daily
select * from task_group

	select * from task 
select count(*) from task where task_group_id = 9


select top(2) * from task_group order by ID desc

begin transaction
	select * from task 

commit
go


CREATE TABLE TASK(
 ID INT PRIMARY KEY IDENTITY,
 title VARCHAR(20),
 description VARCHAR(50),
 task_group_id int,
)

CREATE TABLE DAILY(
data DATETIME,
did_group_task int,
gonna_group_task int,
ID INT PRIMARY KEY IDENTITY
)
GO

CREATE TABLE SEQUENCE_DAILY(
ID INT PRIMARY KEY IDENTITY,
LAST_DAILY INT,
NEW_DAILY INT
)
GO


create table task_group(
id int primary key identity,
created_at datetime
)
go


-- sequence_daily -> daily -> task_group -> tasks

-- A construção da dail'y vai ser dividido em etapas
	-- Buildar a daily propriamente dita
	-- Colocar na sequence daily
	-- injetar as tarefas colocando a dail'y respectiva


select * from task
select * from daily
 
select * from SEQUENCE_DAILY
go

create procedure will
as

insert into task_group values(GETDATE())
insert into task_group values(GETDATE())

select top(2) * from task_group order by ID desc
insert into task values('um título','uma descrição do que foi feito 1',5)
insert into task values('um título','uma descrição do que foi feito  2',5)
insert into task values('um título','uma descrição do que foi feito  3',5)
insert into task values('um título','uma descrição do que foi feito  4',5)

insert into task values('um título','uma descrição do que foi feito 1',6)
insert into task values('um título','uma descrição do que foi feito  2',6)
insert into task values('um título','uma descrição do que foi feito  3',6)
insert into task values('um título','uma descrição do que foi feito  4',6)

insert into daily values(GETDATE(), 5, 6)

-- (2)

select * from sequence_daily
select top(1) new_daily from sequence_daily order by ID desc

insert into sequence_daily values(null, 1)

insert into sequence_daily values((
select top(1) new_daily from sequence_daily order by ID desc
), (
select top(1) ID from daily order by ID desc
))
go



CREATE TABLE TASK(
 ID INT PRIMARY KEY IDENTITY,
 title VARCHAR(20),
 description VARCHAR(50),
 id_daily INT
)

CREATE TABLE DAILY(
ID INT PRIMARY KEY IDENTITY
)
GO

-- exemplos para consulta
CREATE TABLE BOOKS(
	 ID INT PRIMARY KEY IDENTITY,
	 title VARCHAR(30) NOT NULL,
	 descr VARCHAR(100) NOT NULL,
	 userId INT 
)


CREATE TABLE RESERVATIONS(
	ID INT PRIMARY KEY IDENTITY,
	userId INT,
	bookId INT UNIQUE
)

CREATE TABLE USERS(
	ID INT PRIMARY KEY IDENTITY,
	email VARCHAR(50) NOT NULL,
	pwd VARCHAR(50) NOT NULL,
)

CREATE TABLE HISTORIC(
	ID INT PRIMARY KEY IDENTITY,
	old_title VARCHAR(20),
	old_description VARCHAR(100),
	new_title VARCHAR(20),
	new_description VARCHAR(100)
)
GO


ALTER TABLE BOOKS ADD CONSTRAINT FK_USER_BOOK
FOREIGN KEY(userId) REFERENCES USERS(ID)
GO

ALTER TABLE RESERVATIONS ADD CONSTRAINT FK_USER_REVERSATION
FOREIGN KEY(userId) REFERENCES USERS(ID)
GO

ALTER TABLE RESERVATIONS ADD CONSTRAINT FK_BOOK_RESERVATION
FOREIGN KEY(bookId) REFERENCES BOOKS(ID)
GO



/* Criar um conjunto de tabelas para uso */

INSERT INTO USERS VALUES('henriquemauler@fakemail.com','123456789')
INSERT INTO USERS VALUES('pamela@fakemail.com','123456789')
INSERT INTO USERS VALUES('gustavo@fakemail.com','123456789')
GO

INSERT INTO BOOKS VALUES('Knowing yorself','This is a book that make you know about yourself better',1)
INSERT INTO BOOKS VALUES('The narnia Chronics','This is a book that will teach you about a imaginary space',1)
INSERT INTO BOOKS VALUES('The homo Sapiens story','The history of homo sapiens is good',2)
INSERT INTO BOOKS VALUES('Homo Deus','The homo Deus content',2)
INSERT INTO BOOKS VALUES('Discovering linux','This is an book for discovering the linux',3)
INSERT INTO BOOKS VALUES('The Dará God','This book was made for the most beauiful woman that I have meet',3)
GO

/* Fazendo a reserva do livros choose_book */
 
-- DROP PROCEDURE RESERVE_BOOK
-- GO
CREATE PROCEDURE RESERVE_BOOK @userId INT, @bookId INT
AS
DECLARE @VAR1 INT
 
	SELECT @VAR1 = COUNT(*) FROM RESERVATIONS WHERE RESERVATIONS.userId = @userId

	IF @VAR1 = 0
	BEGIN
		INSERT INTO RESERVATIONS VALUES(@userId,@bookId)
		SELECT * FROM RESERVATIONS
	END

	IF @VAR1 > 0
	BEGIN
		PRINT 'Uma reserva já foi feita?'
	END
GO

call reserve_book()


/* Devolvendo livro reservado api_devolve_reserved_book */
CREATE PROCEDURE DEVOLVE_BOOK @bookId INT, @userId INT
AS
	DECLARE @userSource INT;
	
	SELECT @userSource = RESERVATIONS.userId FROM RESERVATIONS
	INNER JOIN BOOKS ON BOOKS.userId = RESERVATIONS.userId
	WHERE RESERVATIONS.bookId = @bookId


	IF @userSource != @userId
	BEGIN
		RAISERROR('O livro em questão não pertence ao usuário',-1,-1)
	END

	
	PRINT 'VALOR DO USER SOURCE 1'
		
	IF ISNULL(COUNT(@userSource),0) != 0
	BEGIN
		DELETE FROM RESERVATIONS WHERE RESERVATIONS.bookId = @bookId
	END

	PRINT 'VALOR DO USER SOURCE 2'

	IF ISNULL(COUNT(@userSource),0) = 0
	BEGIN
		RAISERROR('O livro em questão já foi devolvio, ou não existe',-1,-1)
	END

	PRINT 'VALOR DO USER SOURCE 3'
GO




CREATE TRIGGER HISTORIC_BOOKS_TRIGGER
ON DBO.BOOKS
FOR UPDATE
AS
	DECLARE @OLD_TITLE VARCHAR(20)
	DECLARE @OLD_DESCRIPTION VARCHAR(100)
	DECLARE @NEW_TITLE VARCHAR(20)
	DECLARE @NEW_DESCRIPTION VARCHAR(100)
	SELECT @OLD_TITLE = deleted.title from deleted
	SELECT @OLD_DESCRIPTION = deleted.descr from deleted
	SELECT @NEW_TITLE = inserted.title from inserted
	SELECT @NEW_DESCRIPTION = inserted.descr from inserted
	INSERT INTO HISTORIC VALUES(@OLD_TITLE,@OLD_DESCRIPTION,@NEW_TITLE,@NEW_DESCRIPTION)
GO



/* Essa trigger é desnecessária por causa da restrição, mas só me toquei depois. Mas já que já fiz, deixa aqui.. */
CREATE TRIGGER DELETE_RESERVED_BOOKS
ON DBO.BOOKS
FOR DELETE
AS
	DECLARE @RESERVATIONS INT
	DECLARE @BOOK_ID INT

	SELECT @BOOK_ID = deleted.ID FROM deleted
	SELECT @RESERVATIONS = COUNT(*) FROM RESERVATIONS WHERE RESERVATIONS.bookId = @BOOK_ID

	IF @RESERVATIONS > 0
	BEGIN
		RAISERROR('Não é possível apagar um livro reservado',-1,-1)
		ROLLBACK TRANSACTION
	END
GO