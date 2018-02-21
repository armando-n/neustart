drop database if exists neustart;
create database neustart;
use neustart;

drop table if exists Users;
create table Users(
	userID          integer primary key auto_increment,
	userName        varchar(20) unique not null,
	password        varchar(255) not null,
	mainName        varchar(25) unique not null,
	phone           varchar(20) not null,
	isVerified      boolean not null default false,
	isPhoneVerified boolean not null default false,
	isAdministrator boolean not null default false,
	dateCreated     timestamp not null default CURRENT_TIMESTAMP
);

drop table if exists VerificationCodes;
create table VerificationCodes(
	codeID          integer primary key auto_increment,
	code            varchar(6) not null unique,
	sent            timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP,
	userID          integer not null,
	foreign key (userID) references Users (userID) on delete cascade
);

drop table if exists UserProfiles;
create table UserProfiles(
	profileID             integer primary key auto_increment,
	timezoneOffset        varchar(50),
	country               varchar(50),
	stayLoggedIn          boolean default false,
	isSnoozed             boolean default false,
	userID                integer not null,
	foreign key (userID) references Users (userID) on delete cascade
);

drop table if exists WeeklyContactProfiles;
create table WeeklyContactProfiles(
	profileID             integer primary key auto_increment,
	name                  varchar(50) not null,
	customMessage         varchar(255),
	isProfileActive       boolean not null default false,
	userID                integer not null,
	foreign key (userID) references Users (userID) on delete cascade,
	constraint unique_profile_name unique(name, userID)
);

drop table if exists WeeklyContactProfiles_TimeBlocks;
create table WeeklyContactProfiles_TimeBlocks(
	blockID               integer primary key auto_increment,
	dayOfWeek             enum('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday') not null,
	startHour             integer not null,
	startMinute           integer not null,
	endHour               integer not null,
	endMinute             integer not null,
	isReceivingTexts      boolean not null default false,
	isReceivingCalls      boolean not null default false,
	isTextRepeating       boolean not null default false,
	isCallRepeating       boolean not null default false,
	repeatTextDuration    integer not null default 5,
	repeatCallDuration    integer not null default 10,
	comment               varchar(255),
	profileID             integer not null,
	foreign key (profileID) references WeeklyContactProfiles (profileID) on delete cascade
);

drop table if exists TransientContactTimeBlocks;
create table TransientContactTimeBlocks(
	blockID               integer primary key auto_increment,
	startTime             datetime not null,
	endTime               datetime not null,
	isReceivingTexts      boolean not null default false,
	isReceivingCalls      boolean not null default false,
	isTextRepeating       boolean not null default false,
	isCallRepeating       boolean not null default false,
	repeatTextDuration    integer not null default 5,
	repeatCallDuration    integer not null default 10,
	comment               varchar(255),
	userID                integer not null,
	foreign key (userID) references Users (userID) on delete cascade
);

drop table if exists Characters;
create table Characters(
	characterID           integer primary key auto_increment,
	name                  varchar(50) not null,
	class                 varchar(50) not null,
	isMain                boolean not null default false,
	userID                integer not null,
	foreign key (userID) references Users (userID) on delete cascade
);

-- delimiter //

-- stored procedures, functions, triggers, etc. goes here

-- delimiter ;

-- User data (passwords are hashes for 'pass123', except admin password is 'admin')
insert into Users (userName, password, mainName, phone) values
	('member', '$2y$10$Xvd13JJMs0aNuXI3DeCDQOmSOPmdBuYzxuc8pTrTiDz80GwL2VrWO', 'Wardin', "+12345678901"),
	('robbins', '$2y$10$o0oZQSAgFCIjwdJ5yZ5s7uAtg3i5J7jOU.oUOFTLM0ENe7hKVc8pe', 'Napnotes', "+12345678901"),
	('john-s', '$2y$10$YsgDH7ayR07IUObGbuLWlO57CVIfACO5T0C4Y9gUyfGXakZZGRFtu', 'Bigclaw', "+12345678901"),
	('bob', '$2y$10$OLf1V4sBXJXVwmay2JuwSe.lFx.Ch9tuAnVnIcJCzcH.nui05ZRd2', 'Nhorm', "+12345678901"),
	('sarahk', '$2y$10$53fpNRPHq7v.PSTNesgkxuZ3DfJG3cO.qmovlV1r8B4/QErxgv7ym', 'Gordon', "+12345678901"),
	('whatup', '$2y$10$tQWN1Uh0Y8eBtE1hRwaqPO3HkNIOC8k75EV/CAGAvgQltG6o5JJrC', 'Blindside', "+12345678901"),
	('delete-me-1', '$2y$10$tDIy3lCQbSy.IHDy5HmSouroejYV.0.vLWuXBZj1HPDLQspyrSRwi', 'Torrin', "+12345678901"),
	('delete-me-2', '$2y$10$J3T8PHNfo5XeF0la8I2Rgei0FrSJkQ8nMbt2wsFVPp7UIOYgXALVu', 'Mindcandie', "+12345678901"),
	('delete-me-3', '$2y$10$NbL.oq.o/k0TpW7cccc9bO1PLvZ/1MZASkuJwMidTZaBiSfpMokJi', 'Swaga', "+12345678901"),
	('admin', '$2y$10$D7IJ76T54m8EcNL4UwhYLO.N1xXoGnYijwhJ9TCksQNMTJNvC6aUq', 'TheMan', "+12345678901");
update Users set isAdministrator = true where userName = 'admin';

-- UserProfile data
insert into UserProfiles (firstName, lastName, email, country, picture, facebook, theme, accentColor, isProfilePublic,  isPicturePublic, stayLoggedIn, userID)
	values
		("Member", "Guy", "member@email.com", "United States of America", "member.jpg", null, "light", "#0088BB", true, true, false, 1),
		("Robin", "Scherbatsky", "robbins@email.com", "United States of America", "robbins.jpg", "http://www.facebook.com/robbins", "light", "#0088BB", true, true, true, 2),
		("John", "Smith", "johns@email.com", "United States of America", "john-s.jpg", null, "dark", "#BB0000", false, false, true, 3),
		("Bob", "Roberts", "bobrob@email.com", "United States of America", "bob.jpg", null, "light", "#44DD88", true, false, true, 4),
		("Sarah", "Kinberg", "sarahk@email.com", "United States of America", "sarahk.jpg", null, "light", "#0088BB", true, true, false, 5),
		("Jason", "McMann", "jason@email.com", "United States of America", "whatup.jpg", null, "dark", "#0088BB", true, true, false, 6);
insert into UserProfiles(email, userID)
	values
		('deleteme1@email.com', 7),
		('deleteme2@email.com', 8),
		('deleteme3@email.com', 9);
insert into UserProfiles(email, userID) values ('admin@email.com', 10);

