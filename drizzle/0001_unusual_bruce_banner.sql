CREATE TABLE IF NOT EXISTS `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int NOT NULL,
	`targetUserId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`entityId` int,
	`oldValue` json,
	`newValue` json,
	`reason` text,
	`requestId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`teacherId` int NOT NULL,
	`startAt` timestamp NOT NULL,
	`endAt` timestamp NOT NULL,
	`timezone` varchar(64) NOT NULL DEFAULT 'UTC',
	`status` enum('pending','confirmed','cancelled','completed','rejected') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentUserId` int NOT NULL,
	`role` varchar(100),
	`grade` varchar(100),
	`stage` varchar(100),
	`subject` varchar(150),
	`goal` text,
	`level` varchar(100),
	`difficulties` text,
	`needs` text,
	`format` varchar(150),
	`availability` varchar(150),
	`time` varchar(150),
	`answers` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `learning_profiles_studentUserId_unique` UNIQUE(`studentUserId`)
);
--> statement-breakpoint
CREATE TABLE `parent_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parent_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `parent_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `parent_student_relationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parentUserId` int NOT NULL,
	`studentUserId` int NOT NULL,
	`relationshipType` varchar(50) DEFAULT 'parent',
	`status` enum('pending','active','revoked') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parent_student_relationships_id` PRIMARY KEY(`id`),
	CONSTRAINT `parent_student_unique` UNIQUE(`parentUserId`,`studentUserId`)
);
--> statement-breakpoint
CREATE TABLE `student_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentUserId` int NOT NULL,
	`favoriteType` enum('teacher','course') NOT NULL,
	`targetId` varchar(128) NOT NULL,
	`title` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `student_favorites_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_favorite_unique` UNIQUE(`studentUserId`,`favoriteType`,`targetId`)
);
--> statement-breakpoint
CREATE TABLE `student_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` varchar(255),
	`educationStage` varchar(100),
	`grade` varchar(100),
	`preferredSubjects` json NOT NULL,
	`learningLevel` varchar(100),
	`learningGoals` text,
	`strengths` text,
	`difficulties` text,
	`preferredLearningFormat` varchar(100),
	`preferredAvailability` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `teacher_availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teacherId` int NOT NULL,
	`dayOfWeek` int,
	`specificDate` date,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`timezone` varchar(64) NOT NULL DEFAULT 'UTC',
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teacher_availability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teacher_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`phone` varchar(50),
	`country` varchar(100),
	`city` varchar(100),
	`profilePhotoUrl` varchar(500),
	`bio` text,
	`qualification` varchar(255),
	`specialization` varchar(255),
	`yearsOfExperience` int NOT NULL DEFAULT 0,
	`subjects` json NOT NULL,
	`educationStages` json NOT NULL,
	`grades` json NOT NULL,
	`teachingFormat` varchar(100),
	`hourlyRate` int,
	`availability` json NOT NULL,
	`verificationStatus` enum('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`submittedAt` timestamp,
	`reviewedAt` timestamp,
	`reviewedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teacher_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `teacher_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','student','parent','teacher','admin','super_admin','support') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `accountStatus` enum('active','suspended','deactivated') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_targetUserId_users_id_fk` FOREIGN KEY (`targetUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_studentId_users_id_fk` FOREIGN KEY (`studentId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_teacherId_teacher_profiles_id_fk` FOREIGN KEY (`teacherId`) REFERENCES `teacher_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learning_profiles` ADD CONSTRAINT `learning_profiles_studentUserId_users_id_fk` FOREIGN KEY (`studentUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parent_profiles` ADD CONSTRAINT `parent_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parent_student_relationships` ADD CONSTRAINT `parent_student_relationships_parentUserId_users_id_fk` FOREIGN KEY (`parentUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parent_student_relationships` ADD CONSTRAINT `parent_student_relationships_studentUserId_users_id_fk` FOREIGN KEY (`studentUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_favorites` ADD CONSTRAINT `student_favorites_studentUserId_users_id_fk` FOREIGN KEY (`studentUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `student_profiles` ADD CONSTRAINT `student_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teacher_availability` ADD CONSTRAINT `teacher_availability_teacherId_teacher_profiles_id_fk` FOREIGN KEY (`teacherId`) REFERENCES `teacher_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teacher_profiles` ADD CONSTRAINT `teacher_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teacher_profiles` ADD CONSTRAINT `teacher_profiles_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `bookings_teacher_time` ON `bookings` (`teacherId`,`startAt`,`endAt`,`status`);--> statement-breakpoint
CREATE INDEX `bookings_student_time` ON `bookings` (`studentId`,`startAt`,`endAt`,`status`);--> statement-breakpoint
CREATE INDEX `student_favorite_lookup` ON `student_favorites` (`studentUserId`,`favoriteType`);--> statement-breakpoint
CREATE INDEX `teacher_availability_lookup` ON `teacher_availability` (`teacherId`,`status`,`dayOfWeek`,`specificDate`);--> statement-breakpoint
CREATE INDEX `teacher_verification_idx` ON `teacher_profiles` (`verificationStatus`);--> statement-breakpoint
CREATE INDEX `users_marketplace_visibility` ON `users` (`role`,`accountStatus`);