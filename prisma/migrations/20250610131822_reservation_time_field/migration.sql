/*
  Warnings:

  - You are about to drop the column `timeslot` on the `Reservation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[date,time]` on the table `Reservation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `time` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Reservation_date_timeslot_key";

-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "timeslot",
ADD COLUMN     "time" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_date_time_key" ON "Reservation"("date", "time");
