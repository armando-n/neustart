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
	firstName             varchar(50),
	lastName              varchar(50),
	email                 varchar(50) unique,
	timezone              varchar(50),
	country               varchar(50),
	picture               varchar(50) default 'profile_default.png',
	facebook              varchar(50),
	theme                 varchar(20),
	accentColor           char(7), -- example: '#0088BB'
	isProfilePublic       boolean default false,
	isPicturePublic       boolean default false,
	isReceivingTexts      boolean default false,
	isReceivingCalls      boolean default false,
	stayLoggedIn          boolean default false,
	userID                integer not null,
	foreign key (userID) references Users (userID) on delete cascade
);

drop table if exists WeeklyTextProfiles;
create table WeeklyTextProfiles(
	profileID             integer primary key auto_increment,
	name                  varchar(50),
	defaultStatus         enum('receive', 'mute') default 'mute',
	defaultStyle          enum('single', 'repeating') default 'single',
	customMessage         varchar(255),
	isProfileActive       boolean default false,
	userID                integer not null,
	foreign key (userID) references Users (userID) on delete cascade
);

drop table if exists WeeklyTextProfiles_TimeBlocks;
create table WeeklyTextProfiles_TimeBlocks(
	blockID               integer primary key auto_increment,
	status                enum('receive', 'mute') default 'receive',
	style                 enum('single', 'repeating') default 'single',
	dayOfWeek             enum('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday') not null,
	startHour             integer not null,
	startMinute           integer not null,
	endHour               integer not null,
	endMinute             integer not null,
	profileID             integer not null,
	foreign key (profileID) references WeeklyTextProfiles (profileID) on delete cascade
);

drop table if exists TransientTextTimeBlocks;
create table TransientTextTimeBlocks(
	blockID               integer primary key auto_increment,
	status                enum('receive', 'mute') default 'receive',
	style                 enum('single', 'repeating') default 'single',
	startTime             date not null,
	endTime               date not null,
	userID                integer not null,
	foreign key (userID) references Users (userID) on delete cascade
);

drop table if exists WeeklyCallProfiles;
create table WeeklyCallProfiles(
	profileID             integer primary key auto_increment,
	name                  varchar(50),
	defaultStatus         enum('receive', 'mute') default 'mute',
	customMessage         varchar(255),
	isProfileActive       boolean default false,
	userID                integer not null,
	foreign key (userID) references Users (userID) on delete cascade
);

drop table if exists WeeklyCallProfiles_TimeBlocks;
create table WeeklyCallProfiles_TimeBlocks(
	blockID               integer primary key auto_increment,
	status                enum('receive', 'mute') default 'receive',
	dayOfWeek             enum('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday') not null,
	startHour             integer not null,
	startMinute           integer not null,
	endHour               integer not null,
	endMinute             integer not null,
	profileID             integer not null,
	foreign key (profileID) references WeeklyCallProfiles (profileID) on delete cascade
);

drop table if exists TransientCallTimeBlocks;
create table TransientCallTimeBlocks(
	blockID               integer primary key auto_increment,
	status                enum('receive', 'mute') default 'receive',
	startTime             date not null,
	endTime               date not null,
	userID                integer not null,
	foreign key (userID) references Users (userID) on delete cascade
);

drop table if exists BundledWeeklyProfiles;
create table BundledWeeklyProfiles(
	profileID             integer primary key auto_increment,
	name                  varchar(50) not null,
	textProfileID         integer not null,
	callProfileID         integer not null,
	userID                integer not null,
	foreign key (textProfileID) references WeeklyTextProfiles (profileID) on delete cascade,
	foreign key (callProfileID) references WeeklyCallProfiles (profileID) on delete cascade,
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

-- create procedure insertVerificationCode(in code int, in userID int)
-- 	begin
-- 		set @eventname = concat('ver-code_', userID);
-- 		drop event if exists `@eventname`;
-- 		delete from VerificationCodes where userID = userID;

-- 		insert into VerificationCodes (code, userID)
-- 			values (code, userID);

-- 		create event @eventname
-- 		on schedule at CURRENT_TIMESTAMP + interval 2 minute
-- 		do delete from VerificationCodes where userID = userID;
-- 	end//

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

