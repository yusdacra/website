package systems.gaze.guestbook

import com.comcast.ip4s.*
import fs2.io.net.Network
import org.http4s.ember.server.EmberServerBuilder
import org.http4s.implicits.*
import org.http4s.server.middleware.Logger
import cats.effect.IO
import org.http4s.Uri

object GuestbookServer:

  def run(
      guestbookConfig: Guestbook.Config,
      websiteUri: Uri,
  ): IO[Nothing] = {
    val guestbookAlg = Guestbook.impl[IO]

    // Combine Service Routes into an HttpApp.
    // Can also be done via a Router if you
    // want to extract segments not checked
    // in the underlying routes.
    val httpApp =
      (GuestbookRoutes(guestbookConfig, websiteUri).routes(guestbookAlg)).orNotFound

    // With Middlewares in place
    val finalHttpApp = Logger.httpApp(true, true)(httpApp)

    EmberServerBuilder
      .default[IO]
      .withHost(ipv4"0.0.0.0")
      .withPort(port"8080")
      .withHttpApp(finalHttpApp)
      .build
  }.useForever
