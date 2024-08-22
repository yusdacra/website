package systems.gaze.guestbook

import cats.Applicative
import cats.syntax.all.*
import io.circe.Decoder
import io.circe.generic.auto._, io.circe.syntax._, io.circe._, io.circe.parser._
import os.Path

trait Guestbook[F[_]]:
  def read(config: Guestbook.Config, from: Int, count: Int): F[Guestbook.Page]
  def write(config: Guestbook.Config, entry: Guestbook.Entry): F[Unit]

object Guestbook:
  private val logger = org.log4s.getLogger

  final case class Config(
    val entriesPath: Path,
    val entryCountPath: Path,
  )
  final case class Entry(
      val author: String,
      val content: String,
      val timestamp: Long
  )
  final case class Page(
    val entries: List[Tuple2[Int, Entry]],
    val hasNext: Boolean,
  )

  def impl[F[_]: Applicative]: Guestbook[F] = new Guestbook[F]:
    def entriesSize(config: Config): Int =
      os.read(config.entryCountPath).toInt
    def read(config: Config, from: Int, count: Int): F[Page] =
      val entryCount = entriesSize(config)
      // limit from to 1 cuz duh lol
      val startFrom = from.max(1)
      // limit count to however many entries there are
      val endAt = (startFrom + count - 1).min(entryCount).max(1)
      // if it wants us to start from after entries just return empty
      if startFrom > entryCount then
        return Page(entries = List.empty, hasNext = false).pure[F]
      logger.trace(s"want to read entries from $startFrom ($from) to $endAt ($from + $count)")
      // actually get the entries
      val entries = (startFrom to endAt)
        .map((no) => // read the entries
          val entryNo = entryCount - no + 1
          logger.trace(s"reading entry at $entryNo")
          entryNo -> decode[Entry](os.read(config.entriesPath / entryNo.toString)).getOrElse(
            Entry(
              author = "error",
              content = "woops, this is an error!",
              timestamp = 0
            )
          )
        )
        .toList
      Page(entries, hasNext = entryCount > endAt).pure[F]
    def write(config: Config, entry: Entry): F[Unit] =
      val entryNo = entriesSize(config) + 1
      val entryPath = config.entriesPath / entryNo.toString
      // write entry
      os.write.over(entryPath, entry.asJson.toString)
      // update entry count
      os.write.over(config.entryCountPath, entryNo.toString)
      ().pure[F]
