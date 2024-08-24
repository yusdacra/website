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
      val entryIds = (1 to entryCount).reverse.drop(from).take(count)
      // actually get the entries
      val entries = entryIds
        .map((no) => // read the entries
          logger.info(s"reading entry at $no")
          no -> decode[Entry](os.read(config.entriesPath / no.toString)).getOrElse(
            Entry(
              author = "error",
              content = "woops, this is an error!",
              timestamp = 0
            )
          )
        )
        .toList
      Page(entries, hasNext = entries.last._1 > 1).pure[F]
    def write(config: Config, entry: Entry): F[Unit] =
      val entryNo = entriesSize(config) + 1
      val entryPath = config.entriesPath / entryNo.toString
      // write entry
      os.write.over(entryPath, entry.asJson.toString)
      // update entry count
      os.write.over(config.entryCountPath, entryNo.toString)
      ().pure[F]
