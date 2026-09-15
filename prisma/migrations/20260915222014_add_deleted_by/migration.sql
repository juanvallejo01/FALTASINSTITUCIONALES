-- AlterTable
ALTER TABLE "Campus" ADD COLUMN     "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "FollowUpCase" ADD COLUMN     "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "FollowUpContact" ADD COLUMN     "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "Institution" ADD COLUMN     "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "deletedBy" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedBy" TEXT;
