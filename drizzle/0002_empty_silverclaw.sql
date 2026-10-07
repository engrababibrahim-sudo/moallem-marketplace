ALTER TABLE `learning_profiles` MODIFY COLUMN `answers` json NOT NULL;--> statement-breakpoint
ALTER TABLE `student_profiles` MODIFY COLUMN `preferredSubjects` json NOT NULL;--> statement-breakpoint
ALTER TABLE `student_profiles` MODIFY COLUMN `preferredAvailability` json NOT NULL;--> statement-breakpoint
ALTER TABLE `teacher_profiles` MODIFY COLUMN `subjects` json NOT NULL;--> statement-breakpoint
ALTER TABLE `teacher_profiles` MODIFY COLUMN `educationStages` json NOT NULL;--> statement-breakpoint
ALTER TABLE `teacher_profiles` MODIFY COLUMN `grades` json NOT NULL;--> statement-breakpoint
ALTER TABLE `teacher_profiles` MODIFY COLUMN `availability` json NOT NULL;