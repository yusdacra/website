package systems.gaze.guestbook

import cats.effect.IOApp
import org.http4s.Uri

object Main extends IOApp.Simple:
  val websiteUri =
    Uri
      .fromString(sys.env("GUESTBOOK_WEBSITE_URI"))
      .getOrElse(throw new Exception("write better uris lol"))
  val guestbookConfig = Guestbook.Config(
    entriesPath = os.pwd / "entries",
    entryCountPath = os.pwd / "entries_size"
  )
  // make the entries path if it doesnt exist
  os.makeDir.all(guestbookConfig.entriesPath)
  // make the entry count path if it doesnt exist
  if !os.exists(guestbookConfig.entryCountPath) then
    os.write(guestbookConfig.entryCountPath, 0.toString)
  val run = GuestbookServer.run(guestbookConfig, websiteUri)
