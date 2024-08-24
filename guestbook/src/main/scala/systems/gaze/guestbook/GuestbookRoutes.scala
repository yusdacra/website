package systems.gaze.guestbook

import io.circe.generic.auto._
import org.http4s.HttpRoutes
import org.http4s.dsl.Http4sDsl
import org.http4s.circe.CirceEntityEncoder.circeEntityEncoder
import org.http4s.UrlForm
import org.http4s.headers.Location
import cats.effect.IO
import cats.implicits.*
import org.http4s.server.middleware.Throttle
import scala.concurrent.duration.DurationInt
import cats.effect.unsafe.implicits.global
import scala.concurrent.duration.FiniteDuration
import org.http4s.Uri

class GuestbookRoutes(
    var guestbookConfig: Guestbook.Config,
    var websiteUri: Uri
):
  val dsl = new Http4sDsl[IO] {}
  import dsl.*

  def throttle(
      amount: Int,
      per: FiniteDuration
  )(routes: HttpRoutes[IO]): HttpRoutes[IO] =
    Throttle
      .httpRoutes[IO](amount, per)(routes)
      .unsafeRunSync()

  def routes(
      G: Guestbook[IO]
  ): HttpRoutes[IO] =
    val putEntry = HttpRoutes.of[IO] {
      case req @ POST -> Root =>
      for {
        entry <- req.as[UrlForm].map { form =>
          val author = form.getFirstOrElse("author", "error")
          val content = form.getFirstOrElse("content", "error")
          Guestbook
            .Entry(author, content, timestamp = System.currentTimeMillis / 1000)
        }
        result <- G.write(guestbookConfig, entry)
        resp <- SeeOther(Location(websiteUri / "guestbook"))
      } yield resp
    }
    object OffsetParam extends QueryParamDecoderMatcher[Int]("offset")
    object CountParam extends QueryParamDecoderMatcher[Int]("count")
    val getEntries = HttpRoutes.of[IO] {
      case GET -> Root :? OffsetParam(offset) +& CountParam(count) =>
      for {
        entries <- G.read(guestbookConfig, offset, count)
        resp <- Ok(entries)
      } yield resp
    }
    throttle(30, 2.seconds)(getEntries)
      <+> throttle(5, 10.seconds)(putEntry)
