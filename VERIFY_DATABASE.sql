-- Run this to check what enum values currently exist:
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'application_status'::regtype 
ORDER BY enumsortorder;

-- You should see:
-- bookmarked
-- applied
-- interviewing
-- no_match
-- accepted

-- If you see the OLD values (wishlist, interview, etc.), the migration didn't work.
-- If you see the NEW values above, then we need to restart your dev server.

