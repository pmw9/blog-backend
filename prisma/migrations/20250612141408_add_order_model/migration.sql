-- DropIndex
DROP INDEX "Reservation_date_time_key";

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "reservationId" INTEGER NOT NULL,
    "menuItem" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
