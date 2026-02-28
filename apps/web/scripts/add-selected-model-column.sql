-- Add selectedModel column to users table
ALTER TABLE `users` 
ADD COLUMN `selectedModel` VARCHAR(50) DEFAULT 'mistral-large-2512' 
AFTER `mistralApiKey`;
