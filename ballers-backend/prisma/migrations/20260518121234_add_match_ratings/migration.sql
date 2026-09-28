-- CreateTable
CREATE TABLE "MatchRating" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "rater_id" TEXT NOT NULL,
    "rated_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatchRating_match_id_rater_id_rated_id_key" ON "MatchRating"("match_id", "rater_id", "rated_id");

-- AddForeignKey
ALTER TABLE "MatchRating" ADD CONSTRAINT "MatchRating_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchRating" ADD CONSTRAINT "MatchRating_rater_id_fkey" FOREIGN KEY ("rater_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchRating" ADD CONSTRAINT "MatchRating_rated_id_fkey" FOREIGN KEY ("rated_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
